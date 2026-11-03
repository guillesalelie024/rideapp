<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { busOutline, calendarOutline, chevronDownOutline, chevronUpOutline, closeOutline, locationOutline, saveOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getItineraryStops, getUntrackedItineraryStops, ITINERARY_DRAFT_KEY, loadItinerary, saveItinerary, SAVED_ITINERARY_KEY, type Itinerary, type ItineraryStopView } from '../data/itinerary';
import { DRAFT_TRIP_ID_KEY, duplicateTripAsUpcoming, getTrip, saveSavedTrip, SAVED_TRIP_ID_KEY, updateTrip } from '../data/trips';
import { showError, showSuccess } from '../composables/feedback';

type SelectedRoute = { mode: string; fromId: string; toId: string; fareReference: string; travelTime: string };
const router = useRouter();
const route = useRoute();
const itinerary = ref<Itinerary>({ tripName: 'My Trip', travelDate: '', travelerCount: 1, stopIds: [], arrivalTimes: {}, budget: { transportation: undefined, food: undefined, activities: undefined, other: undefined }, estimatedCosts: {} });
const routeSelection = ref<SelectedRoute | null>(null);
const tripRecordId = ref('');
const tripStatus = ref('');
const editing = ref(false);
const isSavedTrip = ref(false);

function readRouteFor(key: string): SelectedRoute | null {
  try {
    const raw = localStorage.getItem(`${key}.route`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const p = parsed as any;
    if (typeof p.mode !== 'string' || typeof p.fromId !== 'string' || typeof p.toId !== 'string' || typeof p.fareReference !== 'string' || typeof p.travelTime !== 'string') return null;
    return { mode: p.mode, fromId: p.fromId, toId: p.toId, fareReference: p.fareReference, travelTime: p.travelTime };
  } catch { return null; }
}

try {
  const requestedTripId = typeof route.query.tripId === 'string' ? route.query.tripId : '';
  const requestedTrip = requestedTripId ? getTrip(requestedTripId) : null;
  const saved = loadItinerary(SAVED_ITINERARY_KEY);
  const draft = loadItinerary(ITINERARY_DRAFT_KEY);
  isSavedTrip.value = Boolean(saved && saved.stopIds.length);
  itinerary.value = requestedTrip?.itinerary ?? (route.query.source === 'saved' ? (saved ?? draft ?? itinerary.value) : (draft ?? saved ?? itinerary.value));
  tripRecordId.value = requestedTrip?.id ?? '';
  tripStatus.value = requestedTrip?.status ?? '';
  routeSelection.value = requestedTrip?.selectedRoute ?? readRouteFor(SAVED_ITINERARY_KEY) ?? readRouteFor(ITINERARY_DRAFT_KEY);
} catch {
  showError('Could not load trip data.');
}

const tripPlaces = computed(() => getItineraryStops(itinerary.value));

function placeImage(place: ItineraryStopView) { return place.image || place.imageFallback || ''; }
function changeOrder(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= itinerary.value.stopIds.length) return;
  const next = [...itinerary.value.stopIds];
  [next[index], next[target]] = [next[target], next[index]];
  itinerary.value.stopIds = next;
}
function removeStop(id: string) {
  itinerary.value.stopIds = itinerary.value.stopIds.filter((stopId) => stopId !== id);
  delete itinerary.value.arrivalTimes[id];
  delete itinerary.value.estimatedCosts[id];
  showSuccess('Stop removed.');
}
function saveTrip() {
  if (!itinerary.value.stopIds.length) { showError('Add at least one stop.'); return; }
  try {
    saveItinerary(SAVED_ITINERARY_KEY, itinerary.value);
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    const record = saveSavedTrip(itinerary.value, routeSelection.value ?? undefined, tripRecordId.value || undefined);
    tripRecordId.value = record.id;
    tripStatus.value = record.status;
    localStorage.setItem(DRAFT_TRIP_ID_KEY, record.id);
    localStorage.setItem(SAVED_TRIP_ID_KEY, record.id);
    if (routeSelection.value) localStorage.setItem(`${SAVED_ITINERARY_KEY}.route`, JSON.stringify(routeSelection.value));
    isSavedTrip.value = true;
    showSuccess('Trip saved.');
  } catch { showError('Could not save trip.'); }
}
function editItinerary() {
  try {
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    if (tripRecordId.value) localStorage.setItem(DRAFT_TRIP_ID_KEY, tripRecordId.value);
    router.push({ name: 'ItineraryPlanner' });
  } catch { showError('Could not open editor.'); }
}
function changeTransportation() {
  const untracked = getUntrackedItineraryStops(itinerary.value);
  if (untracked.length) {
    showError(`Route planning needs verified destination details. Remove: ${untracked.map((stop) => stop.name).join(', ')}.`);
    return;
  }
  const stops = itinerary.value.stopIds;
  router.push({ name: 'Commute', query: { stops: stops.join(','), tripId: tripRecordId.value || undefined } });
}
function startTrip() {
  if (!itinerary.value.stopIds.length) { showError('Add at least one stop.'); return; }
  const untracked = getUntrackedItineraryStops(itinerary.value);
  if (untracked.length) {
    showError(`Live trip tracking needs verified destination details. Remove: ${untracked.map((stop) => stop.name).join(', ')}.`);
    return;
  }
  try {
    const existing = tripRecordId.value ? getTrip(tripRecordId.value) : null;
    if (existing?.status === 'ongoing') {
      router.push({ name: 'RideLive', query: { tripId: existing.id } });
      return;
    }
    const record = saveSavedTrip(itinerary.value, routeSelection.value ?? undefined, tripRecordId.value || undefined);
    const now = new Date().toISOString();
    const started = updateTrip(record.id, (current) => ({ ...current, status: 'ongoing', startedAt: current.startedAt ?? now }));
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    localStorage.setItem(DRAFT_TRIP_ID_KEY, started.id);
    tripRecordId.value = started.id;
    tripStatus.value = started.status;
    isSavedTrip.value = true;
    router.push({ name: 'RideLive', query: { tripId: started.id } });
  } catch { showError('Could not start trip.'); }
}

function openLive() {
  const existing = tripRecordId.value ? getTrip(tripRecordId.value) : null;
  if (existing?.status === 'ongoing') {
    router.push({ name: 'RideLive', query: { tripId: existing.id } });
  } else {
    showError('This trip is not currently active.');
  }
}

function startTripAgain() {
  const existing = tripRecordId.value ? getTrip(tripRecordId.value) : null;
  if (!existing) { showError('Trip not found.'); return; }
  if (existing.status !== 'completed') { showError('Only completed trips can be restarted.'); return; }
  try {
    // Duplicate the completed trip as a new upcoming trip (separate record, not reactivating the original)
    const duplicated = duplicateTripAsUpcoming(existing);
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    localStorage.setItem(DRAFT_TRIP_ID_KEY, duplicated.id);
    tripRecordId.value = duplicated.id;
    tripStatus.value = duplicated.status;
    isSavedTrip.value = true;
    showSuccess('Trip duplicated. Review the details below, then start your new trip.');
    // Stay on the same TripSummary page showing the new upcoming trip for review
  } catch { showError('Could not create a new trip from this trip.'); }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="ts-app">
        <RideAppHeader
          eyebrow="Trip Summary"
          :title="itinerary.tripName || 'My Trip'"
          show-back
        >
        </RideAppHeader>

        <div class="ts-content" v-if="tripPlaces.length">
          <section class="ts-trip-info-box" aria-label="Trip details">
            <div class="ts-header-info-row">
              <span class="ts-header-info-label">Trip Name</span>
              <span class="ts-header-info-value">{{ itinerary.tripName || 'My Trip' }}</span>
            </div>
            <div class="ts-header-info-row">
              <span class="ts-header-info-label">Travel Date</span>
              <span class="ts-header-info-value">{{ itinerary.travelDate ? new Date(itinerary.travelDate + 'T00:00:00').toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' }) : 'Not set' }}</span>
            </div>
            <div class="ts-header-info-row">
              <span class="ts-header-info-label">Travelers</span>
              <span class="ts-header-info-value">{{ itinerary.travelerCount }}</span>
            </div>
          </section>

          <section class="ts-section">
            <div class="ts-section-header">
              <h2 class="ts-section-title">Stops</h2>
              <button class="ts-edit-btn" type="button" @click="editing = !editing">{{ editing ? 'Done' : 'Edit' }}</button>
            </div>
            <div class="ts-timeline">
              <div v-for="(place, index) in tripPlaces" :key="place.id" class="ts-timeline-item">
                <div class="ts-timeline-rail">
                  <div class="ts-timeline-dot">{{ index + 1 }}</div>
                  <div v-if="index < tripPlaces.length - 1" class="ts-timeline-line"></div>
                </div>
                <div class="ts-timeline-card">
                  <div class="ts-timeline-card-body">
                    <div class="ts-timeline-card-header">
                      <div class="ts-stop-img-wrap">
                        <img v-if="placeImage(place)" :src="placeImage(place)" :alt="place.name" />
                        <div v-else class="ts-stop-img-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                      </div>
                      <div class="ts-stop-info">
                        <strong>{{ place.name }}</strong>
                        <p>{{ place.city }}, {{ place.province }}</p>
                      </div>
                      <div v-if="editing" class="ts-stop-edit-actions">
                        <button class="ts-mini-btn" @click="changeOrder(index, -1)" :disabled="index === 0"><ion-icon :icon="chevronUpOutline"></ion-icon></button>
                        <button class="ts-mini-btn" @click="changeOrder(index, 1)" :disabled="index === tripPlaces.length - 1"><ion-icon :icon="chevronDownOutline"></ion-icon></button>
                        <button class="ts-mini-btn ts-mini-remove" @click="removeStop(place.id)"><ion-icon :icon="closeOutline"></ion-icon></button>
                      </div>
                    </div>
                    <div v-if="itinerary.stopNotes && itinerary.stopNotes[place.id]" class="ts-stop-note">
                      <p class="ts-stop-note-label">My plan</p>
                      <p class="ts-stop-note-text">{{ itinerary.stopNotes[place.id] }}</p>
                    </div>
                    <div v-else-if="place.description" class="ts-stop-note">
                      <p class="ts-stop-note-label">Why visit</p>
                      <p class="ts-stop-note-text">{{ place.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="ts-section">
            <h2 class="ts-section-title">Actions</h2>
            <div class="ts-actions-list">
              <button class="ts-action-item" type="button" @click="changeTransportation">
                <div class="ts-action-icon"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>Route &amp; Fares</strong>
                  <span>Compare transportation options</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button class="ts-action-item" type="button" @click="editItinerary">
                <div class="ts-action-icon"><ion-icon :icon="calendarOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>Edit Itinerary</strong>
                  <span>Modify stops and details</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button class="ts-action-item" type="button" @click="saveTrip">
                <div class="ts-action-icon"><ion-icon :icon="saveOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>{{ isSavedTrip ? 'Update Trip' : 'Save Trip' }}</strong>
                  <span>Save to your trips</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button v-if="tripStatus === 'upcoming'" class="ts-action-item ts-action-primary" type="button" @click="startTrip">
                <div class="ts-action-icon ts-action-icon-white"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>Start Trip</strong>
                  <span>Begin your journey</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button v-else-if="tripStatus === 'ongoing'" class="ts-action-item ts-action-primary" type="button" @click="openLive">
                <div class="ts-action-icon ts-action-icon-white"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>Open Live</strong>
                  <span>Continue your active trip</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button v-else-if="tripStatus === 'completed'" class="ts-action-item ts-action-primary" type="button" @click="router.push({ name: 'TripCompletion', params: { id: tripRecordId } })">
                <div class="ts-action-icon ts-action-icon-white"><ion-icon :icon="saveOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>View Receipt</strong>
                  <span>See completed trip summary</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
              <button v-if="tripStatus === 'completed'" class="ts-action-item" type="button" @click="startTripAgain">
                <div class="ts-action-icon"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="ts-action-text">
                  <strong>Start a Trip Again</strong>
                  <span>Use this route for a new trip</span>
                </div>
                <ion-icon :icon="chevronUpOutline" style="transform: rotate(90deg)"></ion-icon>
              </button>
            </div>
          </section>

          <div class="ts-spacer"></div>
        </div>

        <div class="ts-content" v-else>
          <section class="ts-empty">
            <ion-icon :icon="locationOutline"></ion-icon>
            <h3>No stops in this trip</h3>
            <p>Add destinations to plan your route</p>
            <button class="ts-plan-btn" @click="router.push('/itinerary')">Plan Itinerary</button>
          </section>
        </div>

        <RideBottomNav active="trips" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.ts-app { min-height: 100vh; background: #ffffff; padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
.ts-trip-info-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; padding: 14px 16px; border: 1px solid #DCE9DF; border-radius: 16px; background: #F9FBFA; box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03); }
.ts-header-info-row { display: flex; align-items: center; justify-content: space-between; }
.ts-header-info-label { color: #658078; font-size: 12px; }
.ts-header-info-value { color: #174C40; font-size: 13px; font-weight: 600; }
.ts-content { padding: 16px; max-width: 100%; }
.ts-section { margin-bottom: 18px; }
.ts-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ts-section-title { color: #174C40; font-size: 17px; font-weight: 700; margin: 0; font-family: 'Poppins', sans-serif; }
.ts-edit-btn { background: none; border: none; color: #3F8064; font-weight: 600; font-size: 13px; cursor: pointer; }
.ts-timeline { display: flex; flex-direction: column; }
.ts-timeline-item { display: flex; gap: 12px; }
.ts-timeline-rail { display: flex; flex-direction: column; align-items: center; width: 32px; flex-shrink: 0; }
.ts-timeline-dot { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #3F8064 0%, #2d5f4a 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; z-index: 1; }
.ts-timeline-line { width: 2px; flex: 1; background: linear-gradient(to bottom, #3F8064 0%, #DCE9DF 100%); margin: 4px 0; min-height: 24px; }
.ts-timeline-card { flex: 1; background: white; border: 1px solid #DCE9DF; border-radius: 14px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03); }
.ts-timeline-card-body { display: flex; flex-direction: column; }
.ts-timeline-card-header { display: flex; align-items: center; gap: 10px; padding: 10px; }
.ts-stop-img-wrap { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #E8F4EC; }
.ts-stop-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.ts-stop-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 24px; }
.ts-stop-info { flex: 1; min-width: 0; }
.ts-stop-info strong { color: #174C40; font-size: 14px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ts-stop-info p { color: #658078; font-size: 12px; margin: 2px 0 0 0; }
.ts-stop-note { border-top: 1px solid #F2F8F3; padding: 8px 10px 10px 10px; background: #F9FBFA; }
.ts-stop-note-label { color: #3F8064; font-size: 11px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.3px; }
.ts-stop-note-text { color: #174C40; font-size: 12px; margin: 0; line-height: 1.5; }
.ts-stop-edit-actions { display: flex; gap: 4px; }
.ts-mini-btn { width: 28px; height: 28px; border-radius: 8px; background: white; border: 1px solid #DCE9DF; display: flex; align-items: center; justify-content: center; color: #3F8064; cursor: pointer; padding: 0; }
.ts-mini-btn:disabled { opacity: 0.4; }
.ts-mini-remove { color: #DC2626; }
.ts-actions-list { display: flex; flex-direction: column; gap: 10px; }
.ts-action-item { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #DCE9DF; border-radius: 14px; padding: 12px 14px; text-align: left; cursor: pointer; font: inherit; width: 100%; }
.ts-action-icon { width: 44px; height: 44px; border-radius: 12px; background: #E8F4EC; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 24px; flex-shrink: 0; }
.ts-action-icon-white { background: rgba(255,255,255,0.2); color: white; }
.ts-action-text { flex: 1; min-width: 0; }
.ts-action-text strong { color: #174C40; font-size: 14px; display: block; }
.ts-action-text span { color: #658078; font-size: 12px; }
.ts-action-item ion-icon:last-child { color: #658078; font-size: 18px; }
.ts-action-primary { background: #3F8064; border-color: #3F8064; }
.ts-action-primary .ts-action-text strong { color: white; }
.ts-action-primary .ts-action-text span { color: rgba(255,255,255,0.9); }
.ts-action-primary ion-icon:last-child { color: white; }
.ts-empty { text-align: center; padding: 40px 20px; color: #658078; }
.ts-empty ion-icon { font-size: 48px; color: #DCE9DF; }
.ts-empty h3 { color: #174C40; margin: 12px 0 4px 0; }
.ts-empty p { margin: 0 0 16px 0; }
.ts-plan-btn { background: #3F8064; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.ts-spacer { height: 8px; }
@media (min-width: 480px) { .ts-content { padding-left: 18px; padding-right: 18px; } .ts-header { padding-left: 18px; padding-right: 18px; } }
</style>
