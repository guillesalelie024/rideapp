<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  addCircleOutline,
  alertCircleOutline,
  busOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  downloadOutline,
  locationOutline,
  timeOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations } from '../data/destinations';
import { getItineraryStops, ITINERARY_DRAFT_KEY, saveItinerary } from '../data/itinerary';
import { DRAFT_TRIP_ID_KEY, getTrip, type TripRecord } from '../data/trips';
import { showError, showSuccess } from '../composables/feedback';

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();
const trip = ref<TripRecord | null>(null);
const downloadingPdf = ref(false);

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

try {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  trip.value = getTrip(String(id || ''));
} catch {
  showError('The completed trip could not be loaded from this device.');
}

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
          <template v-if="trip">
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
            <button class="tc-btn tc-btn-primary" type="button" @click="router.push('/trips')">
              Go to My Trips
            </button>
          </section>
        </main>

        <RideBottomNav active="trips" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.tc-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbf9 0%, #ffffff 40%);
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.tc-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(63, 128, 100, 0.18);
  color: #2f6b4f;
  font-size: 36px;
}

.tc-completion-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border: 1px solid #e3eee6;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 32px -28px rgba(23, 76, 64, 0.5);
}

.tc-completion-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.tc-completion-copy h2 {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
}

.tc-completion-copy p {
  margin: 0;
  color: #658078;
  font-size: 13px;
}

.tc-completion-copy .tc-completion-name {
  color: #3f8064;
  font-weight: 600;
}

.tc-kicker {
  margin: 0;
  color: #3f8064;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.tc-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 880px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.tc-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid #e6f0ea;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 60px 70px -60px rgba(23, 76, 64, 0.9);
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
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
}

.tc-pill,
.tc-count {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(63, 128, 100, 0.12);
  color: #2f6b4f;
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
  border: 3px solid #3f8064;
  border-radius: 50%;
  background: #ffffff;
}

.tc-route-dot-end {
  background: #3f8064;
}

.tc-route-line {
  width: 2px;
  height: 26px;
  margin-left: 6px;
  background: #d8e9df;
}

.tc-route-label {
  margin: 0;
  color: #658078;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tc-route-name {
  margin: 3px 0 0;
  color: #174c40;
  font-size: 16px;
  font-weight: 600;
}

.tc-route-address {
  margin: 2px 0 0;
  color: #5b7566;
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
  background: rgba(63, 128, 100, 0.08);
}

.tc-fact ion-icon {
  flex: none;
  color: #3f8064;
  font-size: 20px;
}

.tc-fact div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.tc-fact-label {
  color: #658078;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tc-fact-value {
  overflow: hidden;
  color: #174c40;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tc-hint {
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(63, 128, 100, 0.08);
  color: #2f6b4f;
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
  border: 1px solid #eef5f0;
  border-radius: 18px;
}

.tc-stop-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3f8064 0%, #2f6b4f 100%);
  color: #ffffff;
  font-weight: 700;
}

.tc-stop-number-muted {
  background: #eef5f0;
  color: #658078;
}

.tc-stop-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.tc-stop-name {
  margin: 0;
  color: #174c40;
  font-weight: 600;
}

.tc-stop-address {
  margin: 0;
  color: #5b7566;
  font-size: 13px;
}

.tc-stop-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(101, 128, 120, 0.12);
  color: #658078;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.tc-stop-status ion-icon {
  font-size: 14px;
}

.tc-stop-status.visited {
  background: rgba(63, 128, 100, 0.14);
  color: #2f6b4f;
}

.tc-total {
  color: #174c40;
  font-family: 'Poppins', sans-serif;
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
  border-bottom: 1px solid #f0f7f3;
}

.tc-expense-row:last-child {
  border-bottom: none;
}

.tc-expense-label {
  color: #5b7566;
  text-transform: capitalize;
}

.tc-expense-amount {
  color: #174c40;
  font-weight: 600;
  white-space: nowrap;
}

.tc-estimate,
.tc-fare,
.tc-note {
  margin: 0;
  color: #5b7566;
  font-size: 13px;
  line-height: 1.5;
}

.tc-estimate strong {
  color: #174c40;
}

.tc-fare {
  padding-top: 12px;
  border-top: 1px solid #f0f7f3;
}

.tc-actions {
  padding-bottom: 12px;
}

.tc-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
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
  background: linear-gradient(135deg, #3f8064 0%, #2f6b4f 100%);
  color: #ffffff;
  box-shadow: 0 22px 44px -28px rgba(47, 107, 79, 0.9);
}

.tc-btn-outline {
  flex-direction: column;
  min-width: 0;
  min-height: 82px;
  padding: 10px 6px;
  border-color: #d8e9df;
  background: #ffffff;
  color: #2f6b4f;
  font-size: 12px;
  line-height: 1.25;
  text-align: center;
}

.tc-btn-outline ion-icon {
  flex: none;
  color: #3f8064;
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
  color: #9fc5b3;
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
</style>
