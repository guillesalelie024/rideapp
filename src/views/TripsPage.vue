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
  upcoming: '#059669',
  ongoing: '#2563eb',
  completed: '#658078',
  cancelled: '#a11d1d',
};
const STATUS_BG: Record<TripStatus, string> = {
  upcoming: '#F0F7F3',
  ongoing: '#EFF6FF',
  completed: '#F2F8F3',
  cancelled: '#FCEAEA',
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

function openTrip(trip: TripRecordData) {
  router.push({ name: 'TripSummary', query: { tripId: trip.id } });
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
        <RideAppHeader
          eyebrow="My Journeys"
          title="Trips"
          subtitle="Track, manage, and revisit all your planned adventures"
          show-back
        />

        <section class="trips-overview" aria-label="Trip overview">
          <div class="trips-hero-stats">
            <div class="trips-stat">
              <span class="trips-stat-value">{{ trips.length }}</span>
              <span class="trips-stat-label">Total</span>
            </div>
            <div class="trips-stat">
              <span class="trips-stat-value">{{ grouped.upcoming.length + grouped.ongoing.length }}</span>
              <span class="trips-stat-label">Active</span>
            </div>
          </div>
          <router-link to="/itinerary" class="trips-create-btn">
            <ion-icon :icon="calendarOutline" aria-hidden="true"></ion-icon>
            Create Itinerary
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
                  >
                    <div class="trip-card-media" @click="openTrip(trip)">
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
                        <h3 class="trip-card-title" @click="openTrip(trip)">
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
                          @click="router.push({ name: 'TripCompletion', params: { id: trip.id } })"
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
            <button type="button" :disabled="deletingTrip" @click="confirmDeleteTrip">
              {{ deletingTrip ? 'Deleting…' : 'Delete trip' }}
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
  background: rgba(18, 38, 29, 0.55);
}

.trip-delete-dialog {
  width: min(100%, 420px);
  padding: 26px;
  border: 1px solid #e6f0ea;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(10, 30, 20, 0.24);
}

.trip-delete-dialog h2 {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 21px;
}

.trip-delete-dialog p {
  margin: 12px 0 24px;
  color: #5b7566;
  line-height: 1.6;
}

.trip-delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.trip-delete-actions button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #d5e5db;
  border-radius: 999px;
  background: #fff;
  color: #315b47;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.trip-delete-actions button:last-child {
  border-color: #b42318;
  background: #b42318;
  color: #fff;
}

.trip-delete-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.trips-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbf9 0%, #ffffff 40%);
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.trips-header {
  background: radial-gradient(circle at top right, rgba(63, 128, 100, 0.12), transparent 55%),
    linear-gradient(145deg, #e8f4ec 0%, #f4faf6 100%);
  padding: calc(env(safe-area-inset-top) + 16px) 20px 32px 20px;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  position: relative;
  overflow: hidden;
}

.trips-header::after {
  content: '';
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(63, 128, 100, 0.18) 0%, transparent 70%);
  right: -60px;
  top: -40px;
  pointer-events: none;
}

.trips-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.trips-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.trips-brand :deep(.brand-mark) {
  width: 40px;
  height: 46px;
}

.trips-brand :deep(.brand-wordmark) {
  width: 82px;
}

.trips-profile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(63, 128, 100, 0.18);
  color: #3f8064;
  font-size: 28px;
  text-decoration: none;
  box-shadow: 0 12px 30px -18px rgba(23, 76, 64, 0.9);
  backdrop-filter: blur(8px);
}

.trips-hero {
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  z-index: 1;
}

.trips-hero-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trips-eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #3f8064;
}

.trips-title {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  font-size: clamp(28px, 6vw, 38px);
  font-weight: 700;
  color: #174c40;
  line-height: 1.05;
}

.trips-subtitle {
  margin: 0;
  font-size: 14px;
  color: #5b7566;
  max-width: 320px;
}

.trips-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: min(920px, calc(100% - 40px));
  margin: 20px auto 0;
  padding: 16px;
  border: 1px solid #e3eee6;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 32px -28px rgba(23, 76, 64, 0.5);
}

.trips-create-btn {
  display: inline-flex;
  justify-self: start;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 10px 20px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3f8064 0%, #2f6b4f 100%);
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 18px 40px -24px rgba(47, 107, 79, 0.9);
}

.trips-hero-stats {
  display: flex;
  gap: 12px;
}

.trips-stat {
  display: flex;
  min-width: 100px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  padding: 8px 14px;
  border: 1px solid #e3eee6;
  border-radius: 14px;
  background: #f7fbf8;
}

.trips-stat-value {
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #174c40;
}

.trips-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #658078;
}

.trips-main {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 20px 20px 0;
  max-width: 960px;
  margin: 0 auto;
}

.trips-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 48px 24px;
  border-radius: 24px;
  background: #ffffff;
  border: 1px solid #e6f0ea;
  box-shadow: 0 40px 60px -48px rgba(23, 76, 64, 0.9);
}

.trips-state-icon {
  font-size: 48px;
  color: #9fc5b3;
}

.trips-state-text {
  margin: 0;
  color: #5b7566;
  font-size: 14px;
}

.trips-state-error .trips-state-icon {
  color: #f5b700;
}

.trips-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
}

.trips-btn-primary {
  background: linear-gradient(135deg, #3f8064 0%, #2f6b4f 100%);
  color: #ffffff;
  box-shadow: 0 18px 40px -24px rgba(47, 107, 79, 0.9);
}

.trips-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.trips-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border: 1px solid #e3eee6;
  border-radius: 18px;
  background: #f5faf6;
}

.trips-filter {
  display: flex;
  min-width: 0;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #5b7566;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
}

.trips-filter:hover {
  background: #fff;
}

.trips-filter-active {
  border-color: #dce9df;
  background: #fff;
  color: #174c40;
  box-shadow: 0 2px 8px rgb(23 76 64 / 6%);
}

.trips-filter-count {
  display: inline-flex;
  min-width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: #e8f4ec;
  color: #3f8064;
  font-size: 11px;
  line-height: 1;
}

.trips-filter-ongoing .trips-filter-count {
  background: #eff6ff;
  color: #2563eb;
}

.trips-filter-cancelled .trips-filter-count {
  background: #fceaea;
  color: #a11d1d;
}

.trips-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trips-results-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.trips-results-heading h2 {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.trips-results-heading > span {
  color: #658078;
  font-size: 13px;
}

.trips-filter-empty {
  padding: 28px 20px;
  border: 1px dashed #cbded0;
  border-radius: 18px;
  background: #fff;
  text-align: center;
}

.trips-filter-empty h3 {
  margin: 0 0 6px;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 17px;
}

.trips-filter-empty p {
  margin: 0;
  color: #658078;
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
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #174c40;
}

.trips-section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(63, 128, 100, 0.12);
  color: #3f8064;
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
  background: #ffffff;
  border: 1px solid #e6f0ea;
  box-shadow: 0 60px 70px -60px rgba(23, 76, 64, 0.9);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.trip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 70px 80px -60px rgba(23, 76, 64, 0.95);
  border-color: rgba(63, 128, 100, 0.4);
}

.trip-card-ongoing {
  box-shadow: 0 60px 70px -58px rgba(37, 99, 235, 0.8);
}

.trip-card-cancelled {
  opacity: 0.8;
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
  background: radial-gradient(circle, rgba(63, 128, 100, 0.16) 0%, rgba(232, 244, 236, 0.9) 100%);
  color: #3f8064;
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
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #174c40;
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
  color: #5b7566;
  font-size: 13px;
}

.trip-info-row ion-icon {
  color: #3f8064;
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
  background: rgba(63, 128, 100, 0.08);
  color: #3f8064;
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
  border-top: 1px solid #eef5f0;
}

.trip-budget-label {
  font-size: 13px;
  color: #5b7566;
}

.trip-budget-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: #174c40;
}

.trip-card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.trip-card-actions-three {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.trip-card-actions-three .trip-action {
  justify-content: center;
  min-width: 0;
  padding: 9px 6px;
  gap: 5px;
  white-space: nowrap;
}

.trip-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
}

.trip-action-primary {
  background: linear-gradient(135deg, #3f8064 0%, #2f6b4f 100%);
  color: #ffffff;
  box-shadow: 0 18px 40px -26px rgba(47, 107, 79, 0.9);
}

.trip-action-secondary {
  background: rgba(63, 128, 100, 0.12);
  color: #3f8064;
}

.trip-action-outline {
  border-color: rgba(63, 128, 100, 0.4);
  color: #3f8064;
}

.trip-action-ghost {
  color: #5b7566;
}

.trip-action-cancel {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border-radius: 999px;
  padding: 9px 16px;
}

.trip-action-danger {
  flex: 0 0 auto;
  min-height: 40px;
  border: 1px solid rgba(180, 35, 24, 0.24);
  color: #b42318;
  background: #fff8f7;
  border-radius: 999px;
  padding: 9px 16px;
  white-space: nowrap;
}

.trip-action-danger:hover {
  border-color: rgba(180, 35, 24, 0.42);
  background: #ffefed;
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
  gap: 12px;
  padding: 56px 24px;
  border-radius: 28px;
  background: radial-gradient(circle, rgba(63, 128, 100, 0.12) 0%, rgba(255, 255, 255, 0.98) 70%);
  border: 1px solid #e6f0ea;
  box-shadow: 0 60px 70px -60px rgba(23, 76, 64, 0.9);
}

.trips-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(63, 128, 100, 0.14);
  color: #3f8064;
  font-size: 38px;
}

.trips-empty-title {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #174c40;
}

.trips-empty-text {
  margin: 0;
  color: #5b7566;
  font-size: 14px;
}

.trips-empty-btn {
  margin-top: 8px;
}

@media (min-width: 640px) {
  .trips-header {
    padding-left: 32px;
    padding-right: 32px;
  }

  .trips-main {
    padding-left: 32px;
    padding-right: 32px;
  }
}

@media (min-width: 1024px) {
  .trips-hero {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

@media (max-width: 520px) {
  .trips-overview {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    width: calc(100% - 32px);
    padding: 12px;
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

  .trips-hero-stats {
    gap: 8px;
  }

  .trips-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .trips-filter {
    justify-content: space-between;
    padding-inline: 12px;
  }

  .trips-results-heading h2 {
    font-size: 18px;
  }

  .trips-stat {
    min-width: 0;
    flex: 1;
  }
}
</style>
