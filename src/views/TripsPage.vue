<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  busOutline,
  calendarOutline,
  chevronForwardOutline,
  locationOutline,
  saveOutline,
  trashOutline,
  cloudOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { type ItineraryStopView, getItineraryStops, getUntrackedItineraryStops } from '../data/itinerary';
import {
  type TripStatus,
  type TripRecord as TripRecordData,
  loadTrips,
  updateTrip,
  duplicateTripAsUpcoming,
  deleteTripRecord,
  getPendingTripSyncCount,
  retryPendingTripSync,
} from '../data/trips';
import { showError, showSuccess } from '../composables/feedback';

const router = useRouter();
const trips = ref<TripRecordData[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const pendingSyncCount = ref(0);
const retryingSync = ref(false);
const pendingDeleteTrip = ref<TripRecordData | null>(null);
const deletingTrip = ref(false);
const deleteCancelButton = ref<HTMLButtonElement | null>(null);

const STATUS_ORDER: TripStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];
const STATUS_LABEL: Record<TripStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_COLOR: Record<TripStatus, string> = {
  upcoming: 'var(--brand, #123D2C)',
  ongoing: 'var(--brand, #123D2C)',
  completed: 'var(--text-secondary)',
  cancelled: 'var(--danger)',
};
const STATUS_BG: Record<TripStatus, string> = {
  upcoming: 'var(--brand-soft, #E7EDDF)',
  ongoing: '#D6EACC',
  completed: 'var(--surface-soft)',
  cancelled: 'var(--danger-soft)',
};
type TripFilter = 'all' | TripStatus;
const selectedStatus = ref<TripFilter>('all');
const STATUS_FILTERS: { id: TripFilter; label: string }[] = [
  { id: 'all', label: 'All Trips' },
  ...STATUS_ORDER.map((id) => ({ id, label: STATUS_LABEL[id] })),
];

interface TripWithPlaces extends TripRecordData {
  stopPlaces: ItineraryStopView[];
}

function placeImage(p: ItineraryStopView) {
  return p.image || p.imageFallback || '';
}

function enrichTrip(raw: TripRecordData): TripWithPlaces {
  const stopPlaces = getItineraryStops(raw.itinerary);
  return { ...raw, stopPlaces };
}

const enriched = computed(() => trips.value.map(enrichTrip));

const grouped = computed(() => {
  const groups: Record<TripStatus, TripWithPlaces[]> = {
    upcoming: [],
    ongoing: [],
    completed: [],
    cancelled: [],
  };
  for (const trip of enriched.value) {
    groups[trip.status].push(trip);
  }
  for (const status of STATUS_ORDER) {
    groups[status].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
  return groups;
});

const visibleTrips = computed(() => selectedStatus.value === 'all'
  ? STATUS_ORDER.flatMap((status) => grouped.value[status])
  : grouped.value[selectedStatus.value]);

function statusCount(status: TripFilter) {
  return status === 'all' ? trips.value.length : grouped.value[status].length;
}

function dateLabel(trip: TripWithPlaces): string {
  if (!trip.itinerary.travelDate) return 'Date not set';
  try {
    return new Date(trip.itinerary.travelDate + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Date not set';
  }
}

function hasBudget(trip: TripWithPlaces): boolean {
  const b = trip.itinerary.budget;
  return Boolean(b && Object.values(b).some((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0));
}

function tripBudget(trip: TripWithPlaces): string {
  const values = Object.values(trip.itinerary.budget)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  return values.length ? values.reduce((a, b) => a + b, 0).toLocaleString() : '';
}

async function openTrip(trip: TripRecordData) {
  try {
    await router.push({ name: 'TripSummary', query: { tripId: trip.id } });
  } catch (err) {
    if (err && typeof err === 'object' && 'type' in err) return;
    showError('Could not open trip details.');
  }
}

async function openReceipt(trip: TripRecordData) {
  if (!trip?.id) {
    showError('Receipt not available for this trip.');
    return;
  }
  try {
    await router.push(`/trip-completion/${encodeURIComponent(trip.id)}`);
  } catch (err) {
    if (err && typeof err === 'object' && 'type' in err) return;
    showError('Could not open trip receipt.');
  }
}

function openLive(trip: TripRecordData) {
  router.push({ name: 'RideLive', query: { tripId: trip.id } });
}

async function startTrip(trip: TripRecordData) {
  const untracked = getUntrackedItineraryStops(trip.itinerary);
  if (untracked.length) {
    showError(`Live tracking needs verified place details. Remove: ${untracked.map((stop) => stop.name).join(', ')}.`);
    return;
  }
  try {
    updateTrip(trip.id, (record) => ({ ...record, status: 'ongoing', startedAt: record.startedAt ?? new Date().toISOString() }));
    showSuccess('Trip started!');
    fetchTrips();
    router.push({ name: 'RideLive', query: { tripId: trip.id } });
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Could not start trip.');
  }
}

async function cancelTrip(trip: TripRecordData) {
  try {
    updateTrip(trip.id, (record) => ({ ...record, status: 'cancelled' }));
    showSuccess('Trip cancelled.');
    fetchTrips();
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Could not cancel trip.');
  }
}

async function startTripAgain(trip: TripRecordData) {
  try {
    const duplicate = duplicateTripAsUpcoming(trip);
    showSuccess('New trip created. Review it below, then start your journey.');
    fetchTrips();
    router.push({ name: 'TripSummary', query: { tripId: duplicate.id } });
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Could not create a new trip.');
  }
}

async function requestDeleteTrip(trip: TripRecordData) {
  pendingDeleteTrip.value = trip;
  await nextTick();
  deleteCancelButton.value?.focus();
}

function cancelDeleteTrip() {
  if (!deletingTrip.value) pendingDeleteTrip.value = null;
}

async function confirmDeleteTrip() {
  const trip = pendingDeleteTrip.value;
  if (!trip || deletingTrip.value) return;
  deletingTrip.value = true;
  try {
    await deleteTripRecord(trip.id);
    showSuccess('Trip removed.');
    pendingDeleteTrip.value = null;
    fetchTrips();
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Could not delete trip.');
  } finally {
    deletingTrip.value = false;
  }
}

async function fetchTrips() {
  loading.value = true;
  error.value = null;
  try {
    trips.value = loadTrips();
    pendingSyncCount.value = getPendingTripSyncCount();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not load trips.';
    trips.value = [];
  } finally {
    loading.value = false;
  }
}

async function retryTripSync() {
  if (retryingSync.value) return;
  retryingSync.value = true;
  try {
    await retryPendingTripSync();
    pendingSyncCount.value = getPendingTripSyncCount();
    showSuccess('Your trips are synced to your account.');
  } catch (e) {
    pendingSyncCount.value = getPendingTripSyncCount();
    showError(e instanceof Error ? e.message : 'Trips could not be synced. Try again when you are online.');
  } finally {
    retryingSync.value = false;
  }
}

function refreshPendingSyncCount() {
  try {
    pendingSyncCount.value = getPendingTripSyncCount();
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Pending trip sync status could not be loaded.');
  }
}

function handleDeleteKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && pendingDeleteTrip.value) cancelDeleteTrip();
}

onMounted(() => {
  window.addEventListener('ride:trip-sync-updated', refreshPendingSyncCount);
  window.addEventListener('keydown', handleDeleteKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('ride:trip-sync-updated', refreshPendingSyncCount);
  window.removeEventListener('keydown', handleDeleteKeydown);
});
onIonViewWillEnter(fetchTrips);
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="trips-page">
        <div class="trips-shell desktop-content ride-content">
          <RideAppHeader
            eyebrow="My Journeys"
            title="Trips"
            subtitle="Track, manage, and revisit all your planned adventures"
            show-back
            class="trips-app-header"
          />

          <section class="trips-overview" aria-label="Trip actions">
            <div class="trips-overview-icon" aria-hidden="true">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <div class="trips-overview-copy">
              <p class="trips-overview-kicker">Plan a trip</p>
              <h2 class="trips-overview-title">Ready for your next journey?</h2>
              <p class="trips-overview-text">Build a new itinerary and keep your adventures organized in one place.</p>
            </div>
            <router-link to="/itinerary" class="trips-create-btn">
              <ion-icon :icon="calendarOutline" aria-hidden="true"></ion-icon>
              <span>Create Itinerary</span>
            </router-link>
          </section>

        <section v-if="pendingSyncCount" class="trips-sync-notice" role="status">
          <div>
            <strong>{{ pendingSyncCount }} trip{{ pendingSyncCount === 1 ? '' : 's' }} waiting to sync</strong>
            <p>Your trips are saved on this device. Sign in and connect to the internet to sync them to your account.</p>
          </div>
          <button type="button" :disabled="retryingSync" @click="retryTripSync">
            {{ retryingSync ? 'Syncing…' : 'Retry sync' }}
          </button>
        </section>

        <main class="trips-main">
          <div v-if="loading" class="trips-state">
            <ion-icon :icon="cloudOutline" class="trips-state-icon"></ion-icon>
            <p class="trips-state-text">Loading your trips...</p>
          </div>
          <div v-else-if="error" class="trips-state trips-state-error">
            <ion-icon :icon="trashOutline" class="trips-state-icon"></ion-icon>
            <p class="trips-state-text">{{ error }}</p>
            <button class="trips-btn trips-btn-primary" type="button" @click="fetchTrips">Try Again</button>
          </div>

          <div v-else-if="trips.length" class="trips-container">
            <nav class="trips-filters" aria-label="Filter trips by status">
              <button
                v-for="filter in STATUS_FILTERS"
                :key="filter.id"
                class="trips-filter"
                :class="[`trips-filter-${filter.id}`, { 'trips-filter-active': selectedStatus === filter.id }]"
                type="button"
                :aria-pressed="selectedStatus === filter.id"
                @click="selectedStatus = filter.id"
              >
                <span>{{ filter.label }}</span>
                <span class="trips-filter-count">{{ statusCount(filter.id) }}</span>
              </button>
            </nav>

            <section class="trips-results" aria-live="polite">
              <div class="trips-results-heading">
                <h2>{{ selectedStatus === 'all' ? 'All trips' : STATUS_LABEL[selectedStatus] }}</h2>
                <span>{{ visibleTrips.length }} {{ visibleTrips.length === 1 ? 'trip' : 'trips' }}</span>
              </div>
              <div v-if="visibleTrips.length" class="trips-grid">
                  <article
                    v-for="trip in visibleTrips"
                    :key="trip.id"
                    class="trip-card"
                    :class="{
                      'trip-card-ongoing': trip.status === 'ongoing',
                      'trip-card-cancelled': trip.status === 'cancelled'
                    }"
                    tabindex="0"
                    role="button"
                    :aria-label="`Open ${trip.itinerary.tripName || 'trip'} details`"
                    @click="openTrip(trip)"
                    @keydown.enter.prevent="openTrip(trip)"
                    @keydown.space.prevent="openTrip(trip)"
                  >
                    <div class="trip-card-media">
                      <img
                        v-if="trip.stopPlaces.length && placeImage(trip.stopPlaces[0])"
                        :src="placeImage(trip.stopPlaces[0])"
                        :alt="trip.itinerary.tripName || 'Trip destination'"
                      />
                      <div v-else class="trip-card-placeholder">
                        <ion-icon :icon="locationOutline"></ion-icon>
                      </div>
                      <div class="trip-card-overlay">
                        <span
                          class="trip-status-chip"
                          :style="{ background: STATUS_BG[trip.status], color: STATUS_COLOR[trip.status] }"
                        >{{ STATUS_LABEL[trip.status] }}</span>
                      </div>
                    </div>
                    <div class="trip-card-content">
                      <div class="trip-card-header">
                        <h3 class="trip-card-title">
                          {{ trip.itinerary.tripName || trip.stopPlaces[0]?.name || 'Untitled Trip' }}
                        </h3>
                      </div>
                      <div class="trip-card-info">
                        <div class="trip-info-row">
                          <ion-icon :icon="calendarOutline" aria-hidden="true"></ion-icon>
                          <span>{{ dateLabel(trip) }}</span>
                        </div>
                        <div class="trip-info-row">
                          <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                          <span>{{ trip.stopPlaces.length }} {{ trip.stopPlaces.length === 1 ? 'stop' : 'stops' }}</span>
                        </div>
                        <div v-if="trip.selectedRoute" class="trip-info-row">
                          <ion-icon :icon="busOutline" aria-hidden="true"></ion-icon>
                          <span class="trip-route-text">{{ trip.selectedRoute.mode }}</span>
                        </div>
                      </div>
                      <div v-if="trip.stopPlaces.length >= 2" class="trip-route-preview">
                        <span>{{ trip.stopPlaces[0]?.city || trip.stopPlaces[0]?.name }}</span>
                        <ion-icon :icon="chevronForwardOutline"></ion-icon>
                        <span>{{ trip.stopPlaces.at(-1)?.city || trip.stopPlaces.at(-1)?.name }}</span>
                      </div>
                      <div v-if="hasBudget(trip)" class="trip-budget">
                        <span class="trip-budget-label">Est. Budget</span>
                        <span class="trip-budget-value">₱{{ tripBudget(trip) }}</span>
                      </div>
                      <div
                        class="trip-card-actions"
                        :class="{ 'trip-card-actions-three': trip.status === 'ongoing' || trip.status === 'completed' }"
                        @click.stop
                      >
                        <button
                          v-if="trip.status === 'ongoing'"
                          type="button"
                          class="trip-action trip-action-primary"
                          @click="openLive(trip)"
                        >
                          <ion-icon :icon="busOutline"></ion-icon>
                          Continue Trip
                        </button>
                        <button
                          v-else-if="trip.status === 'upcoming'"
                          type="button"
                          class="trip-action trip-action-primary"
                          @click="startTrip(trip)"
                        >
                          <ion-icon :icon="busOutline"></ion-icon>
                          Start Trip
                        </button>
                        <button
                          v-else-if="trip.status === 'completed'"
                          type="button"
                          class="trip-action trip-action-secondary"
                          @click="startTripAgain(trip)"
                        >
                          <ion-icon :icon="saveOutline"></ion-icon>
                          Plan Again
                        </button>
                        <button
                          v-if="trip.status === 'upcoming'"
                          type="button"
                          class="trip-action trip-action-ghost trip-action-cancel"
                          @click="cancelTrip(trip)"
                        >
                          Cancel
                        </button>
                        <button
                          v-if="trip.status === 'completed'"
                          type="button"
                          class="trip-action trip-action-outline"
                          @click="openReceipt(trip)"
                        >
                          View Receipt
                        </button>
                        <button
                          v-else
                          type="button"
                          class="trip-action trip-action-outline"
                          @click="openTrip(trip)"
                        >
                          Details
                        </button>
                        <button
                          v-if="trip.status === 'ongoing' || trip.status === 'completed' || trip.status === 'cancelled'"
                          type="button"
                          class="trip-action trip-action-ghost trip-action-danger"
                          :aria-label="`Delete ${trip.itinerary.tripName || 'trip'}`"
                          @click="requestDeleteTrip(trip)"
                        >
                          <ion-icon :icon="trashOutline"></ion-icon>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
              </div>
              <div v-else class="trips-filter-empty">
                <h3 v-if="selectedStatus === 'all'">No trips found</h3>
                <h3 v-else>No {{ STATUS_LABEL[selectedStatus].toLowerCase() }} trips</h3>
                <p>Trips with this status will appear here.</p>
              </div>
            </section>
          </div>

          <div v-else class="trips-empty">
            <div class="trips-empty-icon">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <h2 class="trips-empty-title">No trips yet</h2>
            <p class="trips-empty-text">Start exploring destinations and plan your first adventure</p>
            <router-link to="/explore" class="trips-btn trips-btn-primary trips-empty-btn">
              Plan Your First Trip
            </router-link>
          </div>
        </main>
        </div>

        <RideBottomNav active="trips" />
      </div>

      <div v-if="pendingDeleteTrip" class="trip-delete-backdrop" @click.self="cancelDeleteTrip">
        <section
          class="trip-delete-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="trip-delete-title"
          aria-describedby="trip-delete-message"
        >
          <h2 id="trip-delete-title">Delete trip?</h2>
          <p id="trip-delete-message">
            Are you sure you want to delete
            <strong>{{ pendingDeleteTrip.itinerary.tripName || 'this trip' }}</strong>?
            This action cannot be undone.
          </p>
          <div v-if="deletingTrip" class="trip-delete-modal-progress" role="progressbar" aria-label="Deleting trip" aria-valuetext="Deleting in progress">
            <span class="trip-delete-modal-progress-track">
              <span class="trip-delete-modal-progress-indicator"></span>
            </span>
          </div>
          <div class="trip-delete-actions">
            <button
              ref="deleteCancelButton"
              class="trip-delete-cancel"
              type="button"
              :disabled="deletingTrip"
              @click="cancelDeleteTrip"
            >
              Keep trip
            </button>
            <button
              type="button"
              class="trip-delete-confirm"
              :class="{ 'is-loading': deletingTrip }"
              :disabled="deletingTrip"
              :aria-busy="deletingTrip"
              @click="confirmDeleteTrip"
            >
              <span>{{ deletingTrip ? 'Deleting…' : 'Delete trip' }}</span>
            </button>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.trip-delete-backdrop {
  position: fixed;
  z-index: 10010;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--brand-deep, #123) 28%, rgba(0,0,0,.45));
  backdrop-filter: blur(6px);
}

.trip-delete-dialog {
  width: min(100%, 420px);
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--surface-soft) 45%, var(--surface)));
  box-shadow: 0 24px 70px rgba(10, 30, 20, 0.22);
}

.trip-delete-dialog h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -.015em;
}

.trip-delete-dialog p {
  margin: 10px 0 22px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.55;
}

.trip-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.trip-delete-actions button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.trip-delete-confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 138px;
  border-color: color-mix(in srgb, var(--danger) 70%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, #fff 10%, var(--danger)), var(--danger));
  color: var(--on-brand);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--danger) 22%, transparent);
}
.trip-delete-confirm.is-loading {
  padding-right: 14px;
}

.trip-delete-progress {
  display: inline-flex;
  width: 54px;
  height: 8px;
  flex-shrink: 0;
}
.trip-delete-progress-track {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.22);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.18), 0 0 0 1px rgba(255,255,255,.06), 0 2px 8px rgba(255,255,255,.18);
}
.trip-delete-modal-progress { margin: -2px 0 16px; }
.trip-delete-modal-progress-track,
.trip-delete-progress-track {
  position: relative;
  display: block;
  width: 100%;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-soft) 70%, var(--danger-soft, #fceceb));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent), 0 0 0 1px rgba(255,255,255,.45), 0 4px 14px rgba(255,255,255,.55);
}
.trip-delete-progress-track { height: 8px; }
.trip-delete-modal-progress-indicator,
.trip-delete-progress-indicator {
  position: absolute;
  inset: 0 auto 0 0;
  display: block;
  width: 38%;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, #fff 65%, var(--danger, #C0483C)), #fff 45%, color-mix(in srgb, #fff 70%, var(--danger, #C0483C)));
  box-shadow: 0 0 10px rgba(255,255,255,.75), 0 0 18px rgba(255,255,255,.45), 0 2px 8px rgba(255,255,255,.35);
  animation: trip-delete-progress 1s ease-in-out infinite;
}
@keyframes trip-delete-progress {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(280%); }
}
@media (prefers-reduced-motion: reduce) {
  .trip-delete-modal-progress-indicator, .trip-delete-progress-indicator { width: 55%; transform: none; animation: none; }
}

.trip-delete-actions button:disabled {
  cursor: wait;
}
.trip-delete-actions button:disabled:not(.trip-delete-confirm) {
  opacity: 0.6;
}
.trip-delete-confirm:disabled {
  opacity: 1;
}

.trips-page {
  min-height: 100vh;
  background:
    radial-gradient(120% 70% at 100% 0%, color-mix(in srgb, var(--brand-accent) 10%, transparent), transparent 55%),
    radial-gradient(80% 50% at 0% 0%, color-mix(in srgb, var(--brand) 8%, transparent), transparent 50%),
    var(--bg);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.trips-shell.desktop-content,
.trips-shell.ride-content,
.trips-shell {
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 max(16px, env(safe-area-inset-right)) 16px max(16px, env(safe-area-inset-left));
  box-sizing: border-box;
}

.trips-app-header.ride-app-header,
.trips-app-header {
  margin: 0 calc(-1 * max(16px, env(safe-area-inset-right))) 0 calc(-1 * max(16px, env(safe-area-inset-left)));
  width: calc(100% + max(16px, env(safe-area-inset-right)) + max(16px, env(safe-area-inset-left)));
  max-width: none;
  padding-right: max(8px, env(safe-area-inset-right));
  padding-left: max(16px, env(safe-area-inset-left));
  box-sizing: border-box;
}

.trips-overview {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 12%, var(--border));
  border-radius: 24px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--surface) 92%, var(--brand-soft)), var(--surface));
  box-shadow: 0 14px 34px -24px color-mix(in srgb, var(--brand-deep) 0.45, transparent);
  box-sizing: border-box;
}
.trips-overview-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 16px;
  background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface));
  color: var(--brand-accent);
  font-size: 22px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-accent) 10%, transparent);
}
.trips-overview-copy { display: grid; gap: 3px; min-width: 0; flex: 1; }
.trips-overview-kicker { margin: 0; color: var(--brand-accent); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.trips-overview-title { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
.trips-overview-text { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }

.trips-create-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid, var(--brand-accent)) 100%);
  color: var(--on-brand);
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--brand) 70%, transparent);
  transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
}
.trips-create-btn ion-icon { font-size: 18px; }
.trips-create-btn:hover { filter: brightness(1.02); box-shadow: 0 18px 34px -18px color-mix(in srgb, var(--brand) 75%, transparent); }
.trips-create-btn:active { transform: scale(.98); }

.trips-sync-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--warning, #b7791f) 22%, var(--border));
  border-radius: 18px;
  background: color-mix(in srgb, var(--warning-soft, #fff7e6) 55%, var(--surface));
}
.trips-sync-notice strong { display: block; color: var(--text-strong); font-size: 13px; }
.trips-sync-notice p { margin: 3px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
.trips-sync-notice button {
  flex-shrink: 0;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--brand-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.trips-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
}

.trips-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 42px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--surface-soft) 55%, var(--surface)));
  border: 1px solid var(--border);
  box-shadow: 0 18px 44px -34px color-mix(in srgb, var(--brand-deep) 0.35, transparent);
}

.trips-state-icon {
  font-size: 40px;
  color: var(--brand-accent);
  opacity: .9;
}

.trips-state-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.45;
}

.trips-state-error .trips-state-icon {
  color: var(--danger, #b42318);
  opacity: 1;
}

.trips-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  min-height: 42px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
}

.trips-btn-primary {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid, var(--brand-accent)) 100%);
  color: var(--on-brand);
  box-shadow: 0 12px 26px -18px color-mix(in srgb, var(--brand) 65%, transparent);
}

.trips-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trips-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.trips-filter {
  display: inline-flex;
  min-width: 0;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px -10px color-mix(in srgb, var(--brand-deep) 0.2, transparent);
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.trips-filter:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 18%, var(--border));
  background: color-mix(in srgb, var(--surface-soft) 55%, var(--surface));
  color: var(--text-primary);
}

.trips-filter-active {
  border-color: color-mix(in srgb, var(--brand-accent) 28%, var(--border));
  background: linear-gradient(135deg, color-mix(in srgb, var(--brand-soft) 75%, var(--surface)), var(--surface));
  color: var(--text-strong);
  box-shadow: 0 8px 18px -12px color-mix(in srgb, var(--brand) 0.35, transparent);
}
.trips-filter:active { transform: scale(.98); }

.trips-filter-count {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 55%, var(--surface));
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
.trips-filter-active .trips-filter-count {
  background: color-mix(in srgb, var(--brand-accent) 14%, var(--surface));
  color: var(--brand-accent);
}

.trips-results {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.trips-results-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}

.trips-results-heading h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -.015em;
}

.trips-results-heading > span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.trips-filter-empty {
  padding: 28px 20px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  background: var(--surface);
  text-align: center;
}

.trips-filter-empty h3 {
  margin: 0 0 6px;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 17px;
}

.trips-filter-empty p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.trips-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trips-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trips-section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.trips-section-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
}

.trips-section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 0.12, transparent);
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 600;
}

.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.trip-card {
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 60px 70px -60px color-mix(in srgb, var(--brand-deep) 0.9, transparent);
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.trip-card:hover,
.trip-card.trip-card-ongoing:hover,
.trip-card.trip-card-cancelled:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--mint-green, #8FD0A8) 42%, var(--border));
  box-shadow: 0 18px 36px -20px rgba(143, 208, 168, 0.55), 0 0 0 1px rgba(143, 208, 168, 0.18);
}

.trip-card-ongoing {
  border-color: color-mix(in srgb, var(--brand-accent, #4F7A57) 22%, var(--border));
  box-shadow: 0 14px 34px -26px color-mix(in srgb, var(--brand, #123D2C) 0.28, transparent);
}

.trip-card-cancelled {
  opacity: 0.82;
}

.trip-card.trip-card-ongoing:active,
.trip-card.trip-card-ongoing:focus,
.trip-card.trip-card-ongoing:focus-within,
.trip-card.trip-card-cancelled:active,
.trip-card.trip-card-cancelled:focus,
.trip-card.trip-card-cancelled:focus-within,
.trip-card:active,
.trip-card:focus,
.trip-card:focus-within {
  transform: translateY(0);
  border-color: #b7ddb9;
  background-color: #e6f4e7;
  background: linear-gradient(180deg, #edf8ee 0%, #e4f3e5 100%) !important;
  box-shadow: 0 0 0 3px rgba(183, 221, 185, 0.35), 0 10px 24px -20px rgba(79, 122, 87, 0.22);
  outline: none;
  -webkit-tap-highlight-color: rgba(183, 221, 185, 0.35);
}

.trip-card-media {
  position: relative;
  width: 100%;
  height: 190px;
  cursor: pointer;
}

.trip-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trip-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 16%, transparent) 0%, var(--surface-muted) 100%);
  color: var(--brand-accent);
  font-size: 42px;
}

.trip-card-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
}

.trip-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.trip-card-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 22px 22px 22px;
}

.trip-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.trip-card-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-strong);
  cursor: pointer;
}

.trip-card-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.trip-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-body);
  font-size: 13px;
}

.trip-info-row ion-icon {
  color: var(--brand-accent);
  font-size: 18px;
}

.trip-route-text {
  text-transform: capitalize;
}

.trip-route-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 0.08, transparent);
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 500;
}

.trip-route-preview ion-icon {
  font-size: 16px;
}

.trip-budget {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--surface-soft);
}

.trip-budget-label {
  font-size: 13px;
  color: var(--text-body);
}

.trip-budget-value {
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--text-strong);
}

.trip-card-actions,
.trip-card-actions-three {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  align-items: stretch;
}

.trip-action,
.trip-card-actions-three .trip-action,
.trip-action-cancel,
.trip-action-danger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 42px;
  border-radius: 999px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.1;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-primary);
  box-shadow: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform .14s ease, box-shadow .14s ease, background-color .14s ease, border-color .14s ease, filter .14s ease, color .14s ease;
}
.trip-action ion-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
.trip-action:active { transform: scale(.985); }

.trip-action-primary {
  grid-column: 1 / -1;
  border-color: color-mix(in srgb, var(--brand, #123D2C) 80%, transparent);
  background: linear-gradient(135deg, var(--brand, #123D2C) 0%, var(--brand-mid, #245C43) 100%);
  color: var(--on-brand, #F5F5EC);
  box-shadow: 0 10px 22px -16px color-mix(in srgb, var(--brand, #123D2C) 70%, transparent);
}
.trip-action-primary:hover { filter: brightness(1.03); }

.trip-action-secondary {
  grid-column: 1 / -1;
  border-color: color-mix(in srgb, var(--brand-accent, #4F7A57) 35%, var(--border));
  background: color-mix(in srgb, var(--brand-soft, #E7EDDF) 75%, var(--surface));
  color: var(--brand, #123D2C);
}
.trip-action-secondary:hover {
  background: color-mix(in srgb, var(--brand-soft, #E7EDDF) 92%, var(--surface));
  border-color: color-mix(in srgb, var(--brand-accent, #4F7A57) 48%, var(--border));
}

.trip-action-outline {
  border-color: color-mix(in srgb, var(--brand-accent, #4F7A57) 30%, var(--border));
  background: var(--surface);
  color: var(--brand-accent, #4F7A57);
}
.trip-action-outline:hover {
  background: color-mix(in srgb, var(--brand-soft-2, #F0F3E8) 55%, var(--surface));
}

.trip-action-ghost {
  border-color: var(--border);
  background: color-mix(in srgb, var(--surface-soft, #F0F2E8) 55%, var(--surface));
  color: var(--text-secondary, #5C7263);
}

.trip-action-cancel,
.trip-action-danger,
.trip-action.trip-action-ghost.trip-action-cancel,
.trip-action.trip-action-ghost.trip-action-danger {
  border-color: color-mix(in srgb, var(--danger, #C0483C) 28%, var(--border));
  background: color-mix(in srgb, var(--danger-soft, #FBEBE9) 75%, var(--surface));
  color: var(--danger, #C0483C);
}
.trip-action-cancel:hover,
.trip-action-danger:hover,
.trip-action.trip-action-ghost.trip-action-cancel:hover,
.trip-action.trip-action-ghost.trip-action-danger:hover {
  border-color: color-mix(in srgb, var(--danger, #C0483C) 42%, var(--border));
  background: var(--danger-soft, #FBEBE9);
}

.trip-action-danger:focus-visible {
  outline: 3px solid rgba(180, 35, 24, 0.3);
  outline-offset: 2px;
}

.trips-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 44px 22px;
  border-radius: 24px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--brand-soft) 35%, var(--surface)), var(--surface));
  border: 1px solid color-mix(in srgb, var(--brand-accent) 14%, var(--border));
  box-shadow: 0 18px 44px -34px color-mix(in srgb, var(--brand-deep) 0.3, transparent);
}

.trips-empty-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface));
  color: var(--brand-accent);
  font-size: 30px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-accent) 10%, transparent);
}

.trips-empty-title {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -.015em;
  color: var(--text-strong);
}

.trips-empty-text {
  margin: 0;
  max-width: 34ch;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.trips-empty-btn {
  margin-top: 8px;
}



@media (max-width: 520px) {
  .trips-overview {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px;
    text-align: left;
  }

  .trips-overview-icon {
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 14px;
  }

  .trips-overview-copy {
    gap: 4px;
  }

  .trips-overview-title {
    font-size: 17px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .trips-overview-text {
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .trips-create-btn {
    width: 100%;
    justify-content: center;
  }

  .trips-sync-notice {
    display: grid;
    width: calc(100% - 32px);
  }

  .trips-sync-notice button {
    width: 100%;
  }

  .trips-filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .trips-filter {
    justify-content: space-between;
    padding-inline: 12px;
    white-space: normal;
  }

  .trips-results-heading h2 {
    font-size: 18px;
  }

  .trips-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 720px) {
  .trip-card-actions,
  .trip-card-actions-three {
    gap: 10px;
  }
}

.trip-status-chip { backdrop-filter: blur(8px); box-shadow: 0 6px 16px -10px rgba(0,0,0,.25); }
.trip-route-preview { border: 1px solid color-mix(in srgb, var(--border) 70%, transparent); }
</style>

