<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  addCircleOutline,
  alertCircleOutline,
  busOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  downloadOutline,
  locationOutline,
  starOutline,
  timeOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations } from '../data/destinations';
import { getItineraryStops, ITINERARY_DRAFT_KEY, saveItinerary } from '../data/itinerary';
import { DRAFT_TRIP_ID_KEY, getTrip, putTrip, type TripRecord } from '../data/trips';
import { fetchAccountTrips, getRideSession } from '../data/api';
import { fetchTripRatings, submitTripRating, type TripRating } from '../data/api';
import { showError, showSuccess } from '../composables/feedback';

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();
const trip = ref<TripRecord | null>(null);
const downloadingPdf = ref(false);
const ratingModalVisible = ref(false);
const ratingValue = ref(0);
const ratingReview = ref('');
const ratingSubmitted = ref(false);
const tripRatings = ref<TripRating[]>([]);
const ratingsLoading = ref(false);

const modeNames: Record<string, string> = {
  tricycle: 'Tricycle',
  natsco: 'NATSCO',
  vodactco: 'VODACTCO',
  jeepney: 'Jeepney',
  multicab: 'Multicab',
};
const statusLabels: Record<TripRecord['status'], string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const receiptLoading = ref(true);
let receiptRequest = 0;

function goToTrips() {
  void router.replace('/trips');
}

async function loadReceipt() {
  const requestId = ++receiptRequest;
  const id = decodeURIComponent(String(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id || '')).trim();
  receiptLoading.value = true;
  try {
    if (!id) {
      trip.value = null;
      return;
    }
    trip.value = getTrip(id);
    tripRatings.value = [];
    if (trip.value) {
      void loadTripRatings();
      return;
    }
    if (getRideSession()) {
      try {
        const remoteTrips = await fetchAccountTrips();
        if (requestId !== receiptRequest) return;
        const remoteTrip = remoteTrips.find((item) => item?.id === id) ?? null;
        if (remoteTrip) {
          try { putTrip(remoteTrip, false); } catch { /* keep receipt visible from remote data */ }
          if (requestId !== receiptRequest) return;
          trip.value = getTrip(id) ?? remoteTrip;
          void loadTripRatings();
          return;
        }
      } catch {
        // keep local fallback below
      }
      if (requestId !== receiptRequest) return;
      trip.value = getTrip(id);
      if (trip.value) {
        void loadTripRatings();
        return;
      }
    }
    trip.value = null;
  } catch {
    if (requestId !== receiptRequest) return;
    trip.value = null;
  } finally {
    if (requestId === receiptRequest) receiptLoading.value = false;
  }
}

void loadReceipt();
watch(() => route.params.id, () => { void loadReceipt(); });
onIonViewWillEnter(() => { void loadReceipt(); });

const tripPlaces = computed(() => trip.value ? getItineraryStops(trip.value.itinerary) : []);
const visitedPlaces = computed(() => tripPlaces.value.filter((place) => trip.value?.visitedStopIds.includes(place.id)));
const allStopsVisited = computed(() => tripPlaces.value.length > 0 && visitedPlaces.value.length === tripPlaces.value.length);
const actualExpenses = computed(() => Object.entries(trip.value?.actualExpenses ?? {})
  .filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount) && amount >= 0));
const actualTotal = computed(() => (actualExpenses.value.length
  ? actualExpenses.value.reduce((sum, [, amount]) => sum + amount, 0)
  : null));
const estimatedTotal = computed(() => {
  if (!trip.value) return null;
  const values = [...Object.values(trip.value.itinerary.budget), ...Object.values(trip.value.itinerary.estimatedCosts)]
    .filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount) && amount >= 0);
  return values.length ? values.reduce((sum, amount) => sum + amount, 0) : null;
});
const startPlace = computed(() => places.find((place) => place.id === trip.value?.selectedRoute?.fromId) ?? tripPlaces.value[0]);
const finalPlace = computed(() => places.find((place) => place.id === trip.value?.selectedRoute?.toId) ?? tripPlaces.value.at(-1));
const dateLabel = computed(() => {
  const date = trip.value?.itinerary.travelDate;
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date not recorded';
});
const durationLabel = computed(() => {
  const record = trip.value;
  if (!record) return 'Not recorded';
  const ms = typeof record.durationMs === 'number'
    ? record.durationMs
    : record.startedAt && record.completedAt
      ? Date.parse(record.completedAt) - Date.parse(record.startedAt)
      : null;
  if (ms === null || !Number.isFinite(ms) || ms < 0) return 'Not recorded';
  if (ms < 60000) return '<1 min';
  const totalMinutes = Math.floor(ms / 60000);
  return totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min` : `${totalMinutes} min`;
});
const transportLabel = computed(() => {
  const mode = trip.value?.selectedRoute?.mode;
  return mode ? modeNames[mode] ?? mode : 'Not recorded';
});
const statusLabel = computed(() => (trip.value ? statusLabels[trip.value.status] : ''));

function isVisited(id: string) {
  return trip.value?.visitedStopIds.includes(id) ?? false;
}

function formatPeso(amount: number) {
  return `₱${amount.toLocaleString()}`;
}

async function downloadTrip() {
  if (!trip.value || downloadingPdf.value) return;
  const needsPreviewWindow = typeof HTMLAnchorElement !== 'undefined'
    && !('download' in HTMLAnchorElement.prototype)
    && !('msSaveOrOpenBlob' in navigator);
  let previewWindow: Window | null = null;
  if (needsPreviewWindow) {
    previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      showError('Allow pop-ups for RIDE to open your trip PDF.');
      return;
    }
  }
  downloadingPdf.value = true;
  try {
    const { downloadTripPdf } = await import('../lib/tripPdf');
    await downloadTripPdf(trip.value, new Date(), previewWindow ?? undefined);
    showSuccess(previewWindow
      ? 'Trip PDF opened in a new tab. Use your browser controls to save it.'
      : 'Trip PDF downloaded.');
  } catch (error) {
    previewWindow?.close();
    showError(error instanceof Error
      ? `Trip PDF could not be downloaded: ${error.message}`
      : 'Trip PDF could not be downloaded.');
  } finally {
    downloadingPdf.value = false;
  }
}

function planAnother() {
  try {
    if (!trip.value) return;
    localStorage.removeItem(DRAFT_TRIP_ID_KEY);
    localStorage.removeItem(`${ITINERARY_DRAFT_KEY}.route`);
    saveItinerary(ITINERARY_DRAFT_KEY, { ...trip.value.itinerary, tripName: 'Calapan City Day Trip' });
    void router.push({ name: 'ItineraryPlanner' });
  } catch {
    showError('A new trip draft could not be created.');
  }
}

async function loadTripRatings() {
  if (!trip.value?.id) return;
  ratingsLoading.value = true;
  try {
    tripRatings.value = await fetchTripRatings(trip.value.id);
  } catch {
    // Ratings are optional; silently ignore errors
  } finally {
    ratingsLoading.value = false;
  }
}

async function submitRating() {
  if (!trip.value?.id || ratingValue.value < 1 || ratingValue.value > 5) return;
  try {
    await submitTripRating({
      tripId: trip.value.id,
      rating: ratingValue.value,
      review: ratingReview.value.trim() || undefined,
    });
    ratingSubmitted.value = true;
    ratingModalVisible.value = false;
    await loadTripRatings();
    showSuccess('Thank you for rating your trip!');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not submit your rating.');
  }
}

function selectRating(value: number) {
  ratingValue.value = value;
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="tc-page">
        <RideAppHeader
          eyebrow="My Journeys"
          title="Trip Completion"
          show-back
          back-to="/trips"
        >
        </RideAppHeader>

        <main class="tc-main">
          <section v-if="receiptLoading" class="tc-card tc-empty" aria-live="polite">
            <ion-icon class="tc-empty-icon" :icon="documentTextOutline"></ion-icon>
            <h2 class="tc-title-card">Loading receipt…</h2>
            <p class="tc-note">Getting your completed trip details.</p>
          </section>

          <template v-else-if="trip">
            <section class="tc-completion-banner" aria-label="Trip completion status">
              <span class="tc-check" aria-hidden="true">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </span>
              <div class="tc-completion-copy">
                <h2>Trip completed</h2>
                <p class="tc-completion-name">{{ trip.itinerary.tripName || 'Completed trip' }}</p>
                <p>{{ dateLabel }} · Saved to My Trips</p>
              </div>
            </section>

            <section class="tc-card">
              <div class="tc-card-head">
                <div>
                  <p class="tc-kicker">Route</p>
                  <h2 class="tc-title-card">Your trip</h2>
                </div>
                <span class="tc-pill">{{ statusLabel }}</span>
              </div>

              <div class="tc-route">
                <div class="tc-route-point">
                  <span class="tc-route-dot"></span>
                  <div>
                    <p class="tc-route-label">From</p>
                    <p class="tc-route-name">{{ startPlace?.name ?? 'Origin' }}</p>
                    <p class="tc-route-address">{{ startPlace?.address ?? 'Address not recorded' }}</p>
                  </div>
                </div>
                <div class="tc-route-line" aria-hidden="true"></div>
                <div class="tc-route-point">
                  <span class="tc-route-dot tc-route-dot-end"></span>
                  <div>
                    <p class="tc-route-label">To</p>
                    <p class="tc-route-name">{{ finalPlace?.name ?? 'Destination' }}</p>
                    <p class="tc-route-address">{{ finalPlace?.address ?? 'Address not recorded' }}</p>
                  </div>
                </div>
              </div>

              <div class="tc-facts">
                <div class="tc-fact">
                  <ion-icon :icon="busOutline"></ion-icon>
                  <div>
                    <span class="tc-fact-label">Transport</span>
                    <span class="tc-fact-value">{{ transportLabel }}</span>
                  </div>
                </div>
                <div class="tc-fact">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  <div>
                    <span class="tc-fact-label">Duration</span>
                    <span class="tc-fact-value">{{ durationLabel }}</span>
                  </div>
                </div>
                <div class="tc-fact">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  <div>
                    <span class="tc-fact-label">Stops visited</span>
                    <span class="tc-fact-value">{{ visitedPlaces.length }} of {{ tripPlaces.length }}</span>
                  </div>
                </div>
              </div>
            </section>

            <section class="tc-card">
              <div class="tc-card-head">
                <div>
                  <p class="tc-kicker">Stops</p>
                  <h2 class="tc-title-card">Places visited</h2>
                </div>
                <span class="tc-count">{{ visitedPlaces.length }} / {{ tripPlaces.length }}</span>
              </div>

              <p v-if="allStopsVisited" class="tc-hint">You visited every stop on this trip.</p>

              <ol v-if="tripPlaces.length" class="tc-stops">
                <li v-for="(place, index) in tripPlaces" :key="place.id" class="tc-stop">
                  <span class="tc-stop-number" :class="{ 'tc-stop-number-muted': !isVisited(place.id) }">{{ index + 1 }}</span>
                  <div class="tc-stop-info">
                    <p class="tc-stop-name">{{ place.name }}</p>
                    <p class="tc-stop-address">{{ place.address }}, {{ place.city }}</p>
                  </div>
                  <span class="tc-stop-status" :class="{ visited: isVisited(place.id) }">
                    <ion-icon :icon="isVisited(place.id) ? checkmarkCircleOutline : alertCircleOutline"></ion-icon>
                    {{ isVisited(place.id) ? 'Visited' : 'Not visited' }}
                  </span>
                </li>
              </ol>
              <p v-else class="tc-note">No stops were recorded for this trip.</p>
            </section>

            <section class="tc-card">
              <div class="tc-card-head">
                <div>
                  <p class="tc-kicker">Costs</p>
                  <h2 class="tc-title-card">What you spent</h2>
                </div>
                <span v-if="actualTotal !== null" class="tc-total">{{ formatPeso(actualTotal) }}</span>
              </div>

              <div v-if="actualExpenses.length" class="tc-expenses">
                <div v-for="[label, amount] in actualExpenses" :key="label" class="tc-expense-row">
                  <span class="tc-expense-label">{{ label }}</span>
                  <span class="tc-expense-amount">{{ formatPeso(amount) }}</span>
                </div>
              </div>
              <p v-else class="tc-note">No expenses were recorded for this trip.</p>

              <p v-if="estimatedTotal !== null" class="tc-estimate">
                Planned estimate: <strong>{{ formatPeso(estimatedTotal) }}</strong>
                <span v-if="actualTotal === null"> — no actual spending recorded</span>
              </p>
              <p v-if="trip.selectedRoute?.fareReference" class="tc-fare">
                Fare reference: {{ trip.selectedRoute.fareReference }}
              </p>
            </section>

            <section class="tc-actions">
              <div class="tc-actions-grid">
                <button
                  class="tc-btn tc-btn-outline"
                  type="button"
                  aria-label="Download trip as PDF"
                  :disabled="downloadingPdf"
                  :aria-busy="downloadingPdf"
                  @click="downloadTrip"
                >
                  <ion-icon :icon="downloadOutline"></ion-icon>
                  <span>{{ downloadingPdf ? 'Preparing...' : 'Download PDF' }}</span>
                </button>
                <button
                  class="tc-btn tc-btn-outline"
                  type="button"
                  aria-label="View full trip details"
                  @click="router.push({ name: 'TripSummary', query: { tripId: trip.id } })"
                >
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  <span>Trip Details</span>
                </button>
                <button
                  class="tc-btn tc-btn-outline"
                  type="button"
                  aria-label="Plan another trip"
                  @click="planAnother"
                >
                  <ion-icon :icon="addCircleOutline"></ion-icon>
                  <span>Plan Again</span>
                </button>
              </div>
            </section>
          </template>

          <section v-else class="tc-card tc-empty">
            <ion-icon class="tc-empty-icon" :icon="alertCircleOutline"></ion-icon>
            <h2 class="tc-title-card">Receipt not found</h2>
            <p class="tc-note">This completed trip may have been removed from this device.</p>
            <button class="tc-btn tc-btn-primary" type="button" @click="goToTrips">
              Go to My Trips
            </button>
          </section>
        </main>

        <div v-if="tripRatings.length > 0 && !ratingSubmitted" class="existing-ratings">
          <h3 class="ratings-title">Traveler Ratings</h3>
          <div class="ratings-list">
            <div
              v-for="rating in tripRatings"
              :key="rating.ratedAt"
              class="rating-item"
            >
              <div class="rating-item-header">
                <span class="rating-item-user">{{ rating.userName ?? 'A traveler' }}</span>
                <span class="rating-item-date">{{ new Date(rating.ratedAt).toLocaleDateString() }}</span>
              </div>
              <div class="rating-item-stars">
                <ion-icon
                  v-for="n in 5"
                  :key="n"
                  :icon="starOutline"
                  class="rating-item-star"
                  :class="{ 'rating-item-star-active': rating.rating >= n }"
                ></ion-icon>
              </div>
              <p v-if="rating.review" class="rating-item-review">{{ rating.review }}</p>
            </div>
          </div>
        </div>

        <RideBottomNav active="trips" />
      </div>
    </ion-content>

  <div v-if="ratingModalVisible || ratingSubmitted" class="rating-backdrop" @click.self="ratingModalVisible = false">
    <section class="rating-dialog" role="alertdialog" aria-modal="true" aria-labelledby="rating-title">
      <div v-if="!ratingSubmitted" class="rating-header">
        <ion-icon class="rating-icon" :icon="starOutline"></ion-icon>
        <h2 id="rating-title">Rate your trip</h2>
        <p class="rating-subtitle">How was your experience?</p>
      </div>
      <div v-else class="rating-header">
        <ion-icon class="rating-icon rating-icon-success" :icon="checkmarkCircleOutline"></ion-icon>
        <h2 id="rating-title">Thank you!</h2>
        <p class="rating-subtitle">Your rating has been submitted.</p>
      </div>

      <div v-if="!ratingSubmitted" class="rating-stars">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="rating-star"
          :class="{ 'rating-star-active': ratingValue >= n }"
          :aria-label="`${n} star${n !== 1 ? 's' : ''}`"
          @click="selectRating(n)"
        >
          <ion-icon :icon="starOutline"></ion-icon>
        </button>
      </div>

      <div v-if="!ratingSubmitted" class="rating-review">
        <label class="rating-label">Add a review (optional)</label>
        <textarea
          v-model="ratingReview"
          class="rating-textarea"
          placeholder="Share your thoughts about this trip..."
          rows="3"
        ></textarea>
      </div>

      <div class="rating-actions">
        <button v-if="!ratingSubmitted" class="rating-btn rating-btn-cancel" type="button" @click="ratingModalVisible = false">Skip</button>
        <button
          v-if="!ratingSubmitted"
          class="rating-btn rating-btn-submit"
          type="button"
          :disabled="ratingValue < 1"
          @click="submitRating"
        >
          {{ ratingSubmitted ? 'Submitted' : 'Submit Rating' }}
        </button>
        <button v-else class="rating-btn rating-btn-done" type="button" @click="ratingModalVisible = false">Done</button>
      </div>
    </section>
  </div>

  </ion-page>
</template>

<style scoped>
.tc-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--surface-soft) 0%, var(--bg) 40%);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.tc-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--brand-accent) 0.18, transparent);
  color: var(--brand-mid);
  font-size: 36px;
}

.tc-completion-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border: 1px solid var(--surface-soft);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 12px 32px -28px color-mix(in srgb, var(--brand-deep) 0.5, transparent);
}

.tc-completion-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.tc-completion-copy h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.tc-completion-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.tc-completion-copy .tc-completion-name {
  color: var(--brand-accent);
  font-weight: 600;
}

.tc-kicker {
  margin: 0;
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.tc-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px 20px 0;
}

.tc-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid var(--surface-soft);
  border-radius: 26px;
  background: var(--surface);
  box-shadow: 0 60px 70px -60px color-mix(in srgb, var(--brand-deep) 0.9, transparent);
}

.tc-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tc-title-card {
  margin: 4px 0 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
}

.tc-pill,
.tc-count {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 0.12, transparent);
  color: var(--brand-mid);
  font-size: 12px;
  font-weight: 600;
}

.tc-route {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0;
}

.tc-route-point {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.tc-route-dot {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 5px;
  border: 3px solid var(--brand-accent);
  border-radius: 50%;
  background: var(--surface);
}

.tc-route-dot-end {
  background: var(--brand);
}

.tc-route-line {
  width: 2px;
  height: 26px;
  margin-left: 6px;
  background: var(--border);
}

.tc-route-label {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tc-route-name {
  margin: 3px 0 0;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 600;
}

.tc-route-address {
  margin: 2px 0 0;
  color: var(--text-body);
  font-size: 13px;
}

.tc-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.tc-fact {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--brand-accent) 0.08, transparent);
}

.tc-fact ion-icon {
  flex: none;
  color: var(--brand-accent);
  font-size: 20px;
}

.tc-fact div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.tc-fact-label {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tc-fact-value {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-hint {
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--brand-accent) 0.08, transparent);
  color: var(--brand-mid);
  font-size: 13px;
}

.tc-stops {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tc-stop {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--surface-soft);
  border-radius: 18px;
}

.tc-stop-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%);
  color: var(--on-brand);
  font-weight: 700;
}

.tc-stop-number-muted {
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.tc-stop-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.tc-stop-name {
  margin: 0;
  color: var(--text-strong);
  font-weight: 600;
}

.tc-stop-address {
  margin: 0;
  color: var(--text-body);
  font-size: 13px;
}

.tc-stop-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(101, 128, 120, 0.12);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.tc-stop-status ion-icon {
  font-size: 14px;
}

.tc-stop-status.visited {
  background: color-mix(in srgb, var(--brand-accent) 0.14, transparent);
  color: var(--brand-mid);
}

.tc-total {
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 22px;
  font-weight: 700;
}

.tc-expenses {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tc-expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--surface-soft);
}

.tc-expense-row:last-child {
  border-bottom: none;
}

.tc-expense-label {
  color: var(--text-body);
  text-transform: capitalize;
}

.tc-expense-amount {
  color: var(--text-strong);
  font-weight: 600;
  white-space: nowrap;
}

.tc-estimate,
.tc-fare,
.tc-note {
  margin: 0;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.5;
}

.tc-estimate strong {
  color: var(--text-strong);
}

.tc-fare {
  padding-top: 12px;
  border-top: 1px solid var(--surface-soft);
}

.tc-actions {
  padding-bottom: 12px;
}

.tc-actions-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tc-actions-grid .tc-btn {
  flex: 1 1 auto;
  min-width: 0;
}

.tc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 22px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.tc-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.tc-btn-primary {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%);
  color: var(--on-brand);
  box-shadow: 0 22px 44px -28px rgba(47, 107, 79, 0.9);
}

.tc-btn-outline {
  flex-direction: column;
  min-width: 0;
  min-height: 82px;
  padding: 10px 6px;
  border-color: var(--border);
  background: var(--surface);
  color: var(--brand-mid);
  font-size: 12px;
  line-height: 1.25;
  text-align: center;
}

.tc-btn-outline ion-icon {
  flex: none;
  color: var(--brand-accent);
  font-size: 21px;
}

.tc-btn-outline span {
  white-space: normal;
}

.tc-empty {
  align-items: center;
  text-align: center;
}

.tc-empty-icon {
  color: var(--text-muted);
  font-size: 48px;
}

.tc-empty .tc-btn {
  align-self: stretch;
}

@media (max-width: 520px) {
  .tc-actions-grid {
    gap: 8px;
  }

  .tc-btn-outline {
    min-height: 76px;
    padding-inline: 4px;
    font-size: 11px;
  }

  .tc-completion-banner {
    gap: 12px;
    padding: 14px;
  }

  .tc-check {
    width: 52px;
    height: 52px;
    font-size: 30px;
  }

  .tc-stop {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .tc-stop-status {
    grid-column: 2;
    justify-self: start;
  }
}

@media (min-width: 640px) {
  .tc-main {
    padding-left: 32px;
    padding-right: 32px;
  }
}

/* Trip rating modal */
.rating-backdrop {
  position: fixed;
  z-index: 11000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: rgb(15, 35, 27, 0.5);
  backdrop-filter: blur(3px);
}

.rating-dialog {
  width: min(420px, 100%);
  max-height: calc(100dvh - 32px);
  padding: 24px;
  border: 1px solid var(--surface-soft);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: 0 30px 70px rgba(15, 35, 27, 0.25);
  text-align: center;
  display: grid;
  gap: 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.rating-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rating-icon {
  font-size: 48px;
  color: var(--brand-accent);
}

.rating-icon-success {
  color: var(--success);
}

.rating-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.rating-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.rating-star {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.rating-star ion-icon {
  font-size: 32px;
  color: var(--border);
  transition: color 0.2s ease;
}

.rating-star-active ion-icon {
  color: var(--brand-accent);
  transform: scale(1.1);
}

.rating-review {
  text-align: left;
}

.rating-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
}

.rating-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--text-primary);
  font: inherit;
  font-size: 14px;
  resize: vertical;
}

.rating-textarea::placeholder {
  color: var(--text-muted);
}

.rating-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.rating-btn {
  flex: 1;
  min-height: 44px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.rating-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rating-btn-cancel {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.rating-btn-submit {
  background: var(--brand);
  color: var(--on-brand);
}

.rating-btn-done {
  background: var(--brand);
  color: var(--on-brand);
}

.existing-ratings {
  margin-top: 24px;
  padding: 0 20px;
}

@media (min-width: 640px) {
  .existing-ratings {
    padding-left: 32px;
    padding-right: 32px;
  }
}

.ratings-title {
  margin: 0 0 12px 0;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-body);
}

.ratings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rating-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
}

.rating-item-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.rating-item-user {
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
}

.rating-item-date {
  color: var(--text-muted);
  font-size: 11px;
}

.rating-item-stars {
  display: flex;
  gap: 4px;
}

.rating-item-star {
  font-size: 16px;
  color: var(--border);
}

.rating-item-star-active {
  color: var(--brand-accent);
}

.rating-item-review {
  margin: 0;
  color: var(--text-body);
  font-size: 13px;
  line-height: 1.5;
}
</style>
