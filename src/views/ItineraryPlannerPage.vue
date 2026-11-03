<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  busOutline,
  chevronDownOutline,
  chevronUpOutline,
  closeOutline,
  locationOutline,
  saveOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations } from '../data/destinations';
import { getExploreCategoryListings, getExploreListingId, type ExploreListing } from '../data/exploreListings';
import {
  createEmptyItinerary,
  getItineraryStops,
  ITINERARY_DRAFT_KEY,
  loadItinerary,
  saveItinerary,
  SAVED_ITINERARY_KEY,
  type Itinerary,
} from '../data/itinerary';
import { DRAFT_TRIP_ID_KEY, saveUpcomingTrip, SAVED_TRIP_ID_KEY, updateTrip } from '../data/trips';
import {
  BUDGET_PREFERENCES,
  createEmptyTravelPreferences,
  loadTravelPreferences,
} from '../data/profile';
import { showError, showSuccess } from '../composables/feedback';

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();
const travelPreferences = ref(createEmptyTravelPreferences());
const itinerary = ref<Itinerary>(createEmptyItinerary());
const curatedPlanFocus = computed(() => {
  const place = route.query.curatedPlace;
  const category = route.query.curatedCategory;
  const note = route.query.curatedNote;
  if (typeof place !== 'string' || typeof category !== 'string') return null;
  return {
    place,
    category,
    note: typeof note === 'string' ? note : '',
  };
});
type SelectedRoute = { mode: string; fromId: string; toId: string; fareReference: string; travelTime: string };
const selectedRoute = ref<SelectedRoute | null>(null);
const transportPickerOpen = ref(false);
const savedSuccessfully = ref(false);
let draftStorageErrorShown = false;
const transportationModes = [
  { id: 'natsco', label: 'NATSCO' },
  { id: 'vodactco', label: 'VODACTCO' },
  { id: 'jeepney', label: 'Jeepney' },
  { id: 'multicab', label: 'Multicab' },
  { id: 'tricycle', label: 'Tricycle' },
] as const;

function readSelectedRoute(): SelectedRoute | null {
  try {
    const raw = localStorage.getItem(`${ITINERARY_DRAFT_KEY}.route`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null
      || !('mode' in parsed) || typeof parsed.mode !== 'string'
      || !('fromId' in parsed) || typeof parsed.fromId !== 'string'
      || !('toId' in parsed) || typeof parsed.toId !== 'string'
      || !('fareReference' in parsed) || typeof parsed.fareReference !== 'string'
      || !('travelTime' in parsed) || typeof parsed.travelTime !== 'string') return null;
    return { mode: parsed.mode, fromId: parsed.fromId, toId: parsed.toId, fareReference: parsed.fareReference, travelTime: parsed.travelTime };
  } catch {
    showError('Saved transport choice could not be read.');
    return null;
  }
}

function loadPlannerDraft(): Itinerary {
  const draft = loadItinerary(ITINERARY_DRAFT_KEY) ?? createEmptyItinerary();
  if (draft.tripName === 'Calapan City Day Trip' && draft.travelerCount === 1) {
    draft.tripName = '';
    draft.travelerCount = 0;
  }
  return draft;
}

try {
  itinerary.value = loadPlannerDraft();
  selectedRoute.value = readSelectedRoute();
} catch {
  showError('Draft could not be loaded.');
}
onIonViewWillEnter(() => {
  try { itinerary.value = loadPlannerDraft(); }
  catch { showError('Draft could not be loaded.'); }
  selectedRoute.value = readSelectedRoute();
  savedSuccessfully.value = false;
  try {
    travelPreferences.value = loadTravelPreferences();
  } catch {
    travelPreferences.value = createEmptyTravelPreferences();
  }
});

const categorizedListings = computed(() => Object.entries(getExploreCategoryListings()).map(([category, listings]) => ({
  category,
  listings: listings.map((listing) => ({
    ...listing,
    category,
    id: getExploreListingId(listing.name, category),
  })),
})));
const itineraryPlaces = computed(() => getItineraryStops(itinerary.value));
const hasUnverifiedStops = computed(() => itineraryPlaces.value.some((place) => !place.destination));
const selectedRouteFrom = computed(() => places.find((place) => place.id === selectedRoute.value?.fromId));
const selectedRouteTo = computed(() => places.find((place) => place.id === selectedRoute.value?.toId));
const selectedRouteLabel = computed(() => ({
  tricycle: 'Tricycle',
  natsco: 'NATSCO',
  vodactco: 'VODACTCO',
  jeepney: 'Jeepney',
  multicab: 'Multicab',
}[selectedRoute.value?.mode ?? ''] ?? selectedRoute.value?.mode ?? ''));

function persistDraft() {
  try {
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    draftStorageErrorShown = false;
  } catch {
    if (!draftStorageErrorShown) showError('Could not save draft.');
    draftStorageErrorShown = true;
  }
}

function updateTravelerCount(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  itinerary.value.travelerCount = value === '' ? 0 : Number(value);
}

function hasValidTravelerCount(): boolean {
  if (Number.isInteger(itinerary.value.travelerCount)
    && itinerary.value.travelerCount >= 1 && itinerary.value.travelerCount <= 50) return true;
  showError('Enter the number of travelers (1–50).');
  return false;
}

function selectTransportation(mode: string) {
  if (hasUnverifiedStops.value) {
    showError('Transportation routes are unavailable while the itinerary includes places without verified route details.');
    transportPickerOpen.value = false;
    return;
  }
  const option = transportationModes.find((item) => item.id === mode);
  if (!option) return;
  selectedRoute.value = {
    mode: option.id,
    fromId: itinerary.value.stopIds[0] ?? '',
    toId: itinerary.value.stopIds.at(-1) ?? '',
    fareReference: 'Confirm fare with the operator',
    travelTime: 'Varies by route',
  };
  transportPickerOpen.value = false;
  savedSuccessfully.value = false;
  try {
    localStorage.setItem(`${ITINERARY_DRAFT_KEY}.route`, JSON.stringify(selectedRoute.value));
  } catch {
    showError('Transportation choice could not be saved.');
  }
}

function addPlace(placeId: string) {
  if (!places.some((place) => place.id === placeId) || itinerary.value.stopIds.includes(placeId)) return;
  itinerary.value.stopIds.push(placeId);
  if (!itinerary.value.stopNotes) itinerary.value.stopNotes = {};
  showSuccess(`${places.find((p) => p.id === placeId)?.name} added.`);
  savedSuccessfully.value = false;
  persistDraft();
}

function toggleExploreStop(listing: ExploreListing, category: string) {
  const placeId = getExploreListingId(listing.name, category);
  if (itinerary.value.stopIds.includes(placeId)) {
    removePlace(placeId);
    return;
  }

  if (!places.some((place) => place.id === placeId)) {
    itinerary.value.curatedStops ??= {};
    itinerary.value.curatedStops[placeId] = {
      name: listing.name,
      category,
      ...(listing.note ? { note: listing.note } : {}),
    };
    selectedRoute.value = null;
    localStorage.removeItem(`${ITINERARY_DRAFT_KEY}.route`);
    localStorage.removeItem(`${SAVED_ITINERARY_KEY}.route`);
  }
  itinerary.value.stopIds.push(placeId);
  savedSuccessfully.value = false;
  persistDraft();
}

function removePlace(placeId: string) {
  itinerary.value.stopIds = itinerary.value.stopIds.filter((id) => id !== placeId);
  delete itinerary.value.arrivalTimes[placeId];
  delete itinerary.value.estimatedCosts[placeId];
  if (itinerary.value.stopNotes) delete itinerary.value.stopNotes[placeId];
  if (itinerary.value.curatedStops) delete itinerary.value.curatedStops[placeId];
  persistDraft();
}

function movePlace(index: number, offset: -1 | 1) {
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= itinerary.value.stopIds.length) return;
  const stopIds = [...itinerary.value.stopIds];
  [stopIds[index], stopIds[targetIndex]] = [stopIds[targetIndex], stopIds[index]];
  itinerary.value.stopIds = stopIds;
  persistDraft();
}

function saveTrip() {
  if (itinerary.value.stopIds.length === 0) {
    showError('Add at least one destination.');
    return;
  }
  if (!hasValidTravelerCount()) return;
  try {
    saveItinerary(SAVED_ITINERARY_KEY, itinerary.value);
    persistDraft();
    const savedRecord = saveUpcomingTrip(itinerary.value, selectedRoute.value ?? undefined, localStorage.getItem(DRAFT_TRIP_ID_KEY) ?? undefined);
    localStorage.setItem(DRAFT_TRIP_ID_KEY, savedRecord.id);
    localStorage.setItem(SAVED_TRIP_ID_KEY, savedRecord.id);
    if (selectedRoute.value) localStorage.setItem(`${SAVED_ITINERARY_KEY}.route`, JSON.stringify(selectedRoute.value));
    savedSuccessfully.value = true;
    showSuccess('Itinerary saved to Trips.');
  } catch {
    showError('Could not save itinerary.');
  }
}

function startLiveTrip() {
  if (!itinerary.value.stopIds.length) {
    showError('Add at least one destination before starting live tracking.');
    return;
  }
  if (!hasValidTravelerCount()) return;
  if (hasUnverifiedStops.value) {
    showError('Live trip tracking needs verified destination details. Remove unverified places first.');
    return;
  }
  try {
    saveItinerary(SAVED_ITINERARY_KEY, itinerary.value);
    saveItinerary(ITINERARY_DRAFT_KEY, itinerary.value);
    const record = saveUpcomingTrip(itinerary.value, selectedRoute.value ?? undefined, localStorage.getItem(DRAFT_TRIP_ID_KEY) ?? undefined);
    const started = updateTrip(record.id, (current) => ({
      ...current,
      status: 'ongoing',
      startedAt: current.startedAt ?? new Date().toISOString(),
    }));
    localStorage.setItem(DRAFT_TRIP_ID_KEY, started.id);
    localStorage.setItem(SAVED_TRIP_ID_KEY, started.id);
    if (selectedRoute.value) {
      localStorage.setItem(`${ITINERARY_DRAFT_KEY}.route`, JSON.stringify(selectedRoute.value));
      localStorage.setItem(`${SAVED_ITINERARY_KEY}.route`, JSON.stringify(selectedRoute.value));
    }
    void router.push({ name: 'RideLive', query: { tripId: started.id } });
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Live trip could not be started.');
  }
}

function planRoute() {
  if (itinerary.value.stopIds.length === 0) {
    showError('Add at least one stop.');
    return;
  }
  if (hasUnverifiedStops.value) {
    showError('Route planning needs verified destination details. Remove unverified places first.');
    return;
  }
  persistDraft();
  router.push({ name: 'Commute', query: { stops: itinerary.value.stopIds.join(',') } });
}

watch(() => route.query.place, (queryPlace) => {
  if (typeof queryPlace === 'string') addPlace(queryPlace);
}, { immediate: true });

watch(itinerary, () => {
  savedSuccessfully.value = false;
  persistDraft();
}, { deep: true });

const budgetLabel = computed(() => BUDGET_PREFERENCES.find((b) => b.id === travelPreferences.value.budget)?.label);
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="plan-app">
        <RideAppHeader
          eyebrow="Itinerary"
          title="Plan Your Trip"
          subtitle="Add stops and plan your route"
          show-back
        />

        <div class="plan-content">
          <section v-if="curatedPlanFocus" class="plan-section">
            <div class="plan-focus-card">
              <span class="plan-focus-label">Planning around</span>
              <strong>{{ curatedPlanFocus.place }}</strong>
              <span>{{ curatedPlanFocus.category }}</span>
              <p v-if="curatedPlanFocus.note">{{ curatedPlanFocus.note }}</p>
              <p>Verified route details are not available yet. Add verified destinations below to build a routable itinerary.</p>
            </div>
          </section>

          <section class="plan-section">
            <div class="plan-section-header">
              <h2 class="plan-section-title">Trip Details</h2>
            </div>
            <div class="plan-card">
              <div class="plan-input-group">
                <label class="plan-label">Trip Name</label>
                <input v-model="itinerary.tripName" class="plan-input" placeholder="Enter trip name" />
              </div>
              <div class="plan-row">
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Travel Date</label>
                  <input v-model="itinerary.travelDate" type="date" class="plan-input" />
                </div>
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Travelers</label>
                  <input
                    :value="itinerary.travelerCount || ''"
                    type="number"
                    min="1"
                    max="50"
                    class="plan-input"
                    placeholder="Enter number of travelers"
                    aria-label="Number of travelers"
                    @input="updateTravelerCount"
                  />
                </div>
              </div>
            </div>
          </section>

          <section class="plan-section">
            <div class="plan-section-header">
              <h2 class="plan-section-title">Mode of Transportation</h2>
            </div>
            <div class="plan-selected-route">
              <span class="plan-transport-icon" aria-hidden="true">
                <ion-icon :icon="busOutline"></ion-icon>
              </span>
              <div v-if="selectedRoute && !transportPickerOpen" class="plan-route-copy">
                <p class="plan-note-label">Selected transportation</p>
                <strong>{{ selectedRouteLabel }}</strong>
                <span v-if="selectedRouteFrom || selectedRouteTo">
                  {{ selectedRouteFrom?.name ?? 'Starting point' }}
                  <ion-icon :icon="chevronDownOutline" aria-hidden="true"></ion-icon>
                  {{ selectedRouteTo?.name ?? 'Destination' }}
                </span>
                <span>{{ selectedRoute.fareReference }} · {{ selectedRoute.travelTime }}</span>
              </div>
              <div v-else-if="!transportPickerOpen" class="plan-route-copy">
                <p class="plan-note-label">No mode selected</p>
                <strong>Choose how you’ll get around</strong>
                <span>Choose a transportation mode from the list.</span>
              </div>
              <label v-else class="plan-transport-picker">
                <span class="plan-note-label">Choose a mode</span>
                <select
                  class="plan-select"
                  :value="selectedRoute?.mode ?? ''"
                  @change="selectTransportation(($event.target as HTMLSelectElement).value)"
                >
                  <option value="" disabled>Select transportation</option>
                  <option v-for="mode in transportationModes" :key="mode.id" :value="mode.id">
                    {{ mode.label }}
                  </option>
                </select>
              </label>
              <button
                class="plan-note-save-inline plan-route-change"
                type="button"
                :disabled="(!transportPickerOpen && itineraryPlaces.length === 0) || hasUnverifiedStops"
                @click="transportPickerOpen = !transportPickerOpen"
              >
                {{ transportPickerOpen ? 'Cancel' : selectedRoute ? 'Change' : 'Choose' }}
              </button>
            </div>
          </section>

          <section class="plan-section">
            <div class="plan-section-header">
              <h2 class="plan-section-title">Estimated Budget</h2>
              <span v-if="budgetLabel" class="plan-count">{{ budgetLabel }}</span>
            </div>
            <div class="plan-card">
              <div class="plan-row">
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Transportation (₱)</label>
                  <input v-model.number="itinerary.budget.transportation" type="number" min="0" class="plan-input" placeholder="0" />
                </div>
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Food (₱)</label>
                  <input v-model.number="itinerary.budget.food" type="number" min="0" class="plan-input" placeholder="0" />
                </div>
              </div>
              <div class="plan-row">
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Activities (₱)</label>
                  <input v-model.number="itinerary.budget.activities" type="number" min="0" class="plan-input" placeholder="0" />
                </div>
                <div class="plan-input-group plan-half">
                  <label class="plan-label">Other (₱)</label>
                  <input v-model.number="itinerary.budget.other" type="number" min="0" class="plan-input" placeholder="0" />
                </div>
              </div>
            </div>
          </section>

          <section class="plan-section">
            <div class="plan-section-header">
              <h2 class="plan-section-title">Stops</h2>
              <span class="plan-count">{{ itineraryPlaces.length }} stop{{ itineraryPlaces.length === 1 ? '' : 's' }}</span>
            </div>
            <p class="plan-stop-picker-hint">Choose places by category. You can select verified destinations and curated Explore listings.</p>
            <div class="plan-category-picker">
              <details v-for="group in categorizedListings" :key="group.category" class="plan-category-group">
                <summary>
                  <span>{{ group.category }}</span>
                  <span class="plan-category-count">{{ group.listings.length }}</span>
                </summary>
                <label
                  v-for="listing in group.listings"
                  :key="listing.id"
                  class="plan-place-option"
                >
                  <input
                    type="checkbox"
                    :checked="itinerary.stopIds.includes(listing.id)"
                    :aria-label="`Select ${listing.name}`"
                    @change="toggleExploreStop(listing, group.category)"
                  />
                  <span class="plan-place-option-copy">
                    <strong>{{ listing.name }}</strong>
                    <small v-if="listing.note">{{ listing.note }}</small>
                  </span>
                </label>
              </details>
            </div>

            <div v-if="itineraryPlaces.length" class="plan-timeline">
              <div v-for="(place, index) in itineraryPlaces" :key="place.id" class="plan-timeline-item">
                <div class="plan-timeline-rail">
                  <div class="plan-timeline-dot">{{ index + 1 }}</div>
                  <div v-if="index < itineraryPlaces.length - 1" class="plan-timeline-line"></div>
                </div>
                <div class="plan-timeline-card">
                  <div class="plan-timeline-card-header">
                    <div class="plan-timeline-info">
                      <strong>{{ place.name }}</strong>
                      <p v-if="place.destination">{{ place.city }}, {{ place.province }}</p>
                      <p v-else>{{ place.category }} · Location details not verified</p>
                    </div>
                    <div class="plan-timeline-actions">
                      <button class="plan-timeline-btn" type="button" @click="movePlace(index, -1)" :disabled="index === 0" :aria-label="`Move ${place.name} earlier`">
                        <ion-icon :icon="chevronUpOutline"></ion-icon>
                      </button>
                      <button class="plan-timeline-btn" type="button" @click="movePlace(index, 1)" :disabled="index === itineraryPlaces.length - 1" :aria-label="`Move ${place.name} later`">
                        <ion-icon :icon="chevronDownOutline"></ion-icon>
                      </button>
                      <button class="plan-timeline-btn plan-timeline-remove" type="button" @click="removePlace(place.id)" :aria-label="`Remove ${place.name}`">
                        <ion-icon :icon="closeOutline"></ion-icon>
                      </button>
                    </div>
                  </div>
                  <div class="plan-timeline-note">
                    <div class="plan-note-header">
                      <label class="plan-note-label">My plan for this stop</label>
                      <button class="plan-note-save-inline" type="button" @click="persistDraft(); showSuccess('Note saved.');">Save</button>
                    </div>
                    <textarea v-model="(itinerary.stopNotes as any)[place.id]" class="plan-note-input" rows="2" placeholder="e.g., Kakain ako dito, mag-picture, etc." @input="savedSuccessfully = false"></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="plan-empty">
              <ion-icon :icon="locationOutline"></ion-icon>
              <p>No stops added yet</p>
            </div>
          </section>

          <section class="plan-section">
            <div class="plan-actions-row">
              <button class="plan-big-btn plan-btn-route" type="button" @click="planRoute" :disabled="itineraryPlaces.length === 0 || hasUnverifiedStops">
                <ion-icon :icon="busOutline"></ion-icon>
                <span>Plan Route &amp; Fares</span>
              </button>
              <button class="plan-big-btn plan-btn-save" type="button" @click="saveTrip" :disabled="itineraryPlaces.length === 0">
                <ion-icon :icon="saveOutline"></ion-icon>
                <span>{{ savedSuccessfully ? 'Saved' : 'Save Itinerary' }}</span>
              </button>
            </div>
            <p v-if="hasUnverifiedStops" class="plan-unverified-note">
              Save your selected places, but route fares and live tracking require verified destination details.
            </p>
            <p v-if="savedSuccessfully" class="plan-saved-note">Saved! View in Trips.</p>
            <button v-if="savedSuccessfully && !hasUnverifiedStops" class="plan-big-btn plan-btn-live" type="button" @click="startLiveTrip">
              <ion-icon :icon="busOutline"></ion-icon>
              <span>Start Live when you board</span>
            </button>
          </section>

          <div class="plan-spacer"></div>
        </div>

        <RideBottomNav active="trips" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.plan-app {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.plan-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.plan-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.plan-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.plan-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
}

.plan-brand :deep(.brand-wordmark) {
  width: 76px;
}

.plan-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-action-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: white;
  border: 1px solid #DCE9DF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06);
}

.plan-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-greet-line {
  color: #3F8064;
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.plan-greet-title {
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.plan-greet-sub {
  color: #658078;
  font-size: 13px;
  margin: 0;
}

.plan-content {
  padding: 16px;
  max-width: 100%;
}

.plan-section {
  margin-bottom: 18px;
}

.plan-focus-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  background: #F2F8F3;
}

.plan-focus-label {
  color: #3F8064;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-focus-card strong {
  color: #174C40;
  font-size: 16px;
}

.plan-focus-card > span:not(.plan-focus-label) {
  color: #658078;
  font-size: 13px;
}

.plan-focus-card p {
  margin: 4px 0 0;
  color: #658078;
  font-size: 13px;
  line-height: 1.5;
}

.plan-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.plan-section-title {
  color: #174C40;
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
}

.plan-count {
  color: #658078;
  font-size: 13px;
}

.plan-card {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
}

.plan-stop-picker-hint {
  margin: 0 0 10px;
  color: #658078;
  font-size: 13px;
  line-height: 1.5;
}

.plan-category-picker {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.plan-category-group {
  overflow: hidden;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  background: #FFFFFF;
}

.plan-category-group > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  color: #174C40;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}

.plan-category-group > summary::-webkit-details-marker {
  display: none;
}

.plan-category-group > summary::after {
  content: '+';
  color: #3F8064;
  font-size: 18px;
}

.plan-category-group[open] > summary::after {
  content: '−';
}

.plan-category-count {
  margin-left: auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #E8F4EC;
  color: #3F8064;
  font-size: 11px;
}

.plan-place-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  border-top: 1px solid #EEF4EF;
  cursor: pointer;
}

.plan-place-option input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin: 1px 0 0;
  accent-color: #3F8064;
}

.plan-place-option-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.plan-place-option-copy strong {
  color: #174C40;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.plan-place-option-copy small {
  color: #7A5818;
  font-size: 11px;
  line-height: 1.4;
}

.plan-unverified-note {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #FFF7E6;
  color: #7A5818;
  font-size: 12px;
  line-height: 1.5;
}

.plan-select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #DCE9DF;
  border-radius: 12px;
  font-size: 13px;
  color: #174C40;
  background: white;
}

.plan-add-btn {
  width: 100%;
  padding: 11px 16px;
  background: #3F8064;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.plan-add-btn:disabled {
  opacity: 0.5;
}

.plan-input-group {
  margin-bottom: 12px;
}

.plan-input-group:last-of-type {
  margin-bottom: 0;
}

.plan-label {
  display: block;
  color: #174C40;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.plan-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #DCE9DF;
  border-radius: 12px;
  font-size: 14px;
  color: #174C40;
}

.plan-row {
  display: flex;
  gap: 10px;
}

.plan-half {
  flex: 1;
  margin-bottom: 0;
}

.plan-timeline {
  display: flex;
  flex-direction: column;
}

.plan-timeline-item {
  display: flex;
  gap: 12px;
}

.plan-timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32px;
  flex-shrink: 0;
}

.plan-timeline-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3F8064 0%, #2d5f4a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  z-index: 1;
}

.plan-timeline-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, #3F8064 0%, #DCE9DF 100%);
  margin: 4px 0;
  min-height: 24px;
}

.plan-timeline-card {
  flex: 1;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
}

.plan-timeline-card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
}

.plan-timeline-info {
  flex: 1;
  min-width: 0;
}

.plan-timeline-info strong {
  color: #174C40;
  font-size: 14px;
  display: block;
  word-break: break-word;
}

.plan-timeline-info p {
  color: #658078;
  font-size: 12px;
  margin: 2px 0 0 0;
}

.plan-timeline-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.plan-timeline-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: white;
  border: 1px solid #DCE9DF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  cursor: pointer;
  padding: 0;
}

.plan-timeline-btn:disabled {
  opacity: 0.4;
}

.plan-timeline-remove {
  color: #DC2626;
}

.plan-timeline-note {
  border-top: 1px solid #F2F8F3;
  padding: 8px 12px 12px 12px;
  background: #F9FBFA;
}

.plan-note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.plan-note-label {
  color: #3F8064;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.plan-note-input {
  width: 100%;
  border: 1px solid #DCE9DF;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
  color: #174C40;
  font-family: inherit;
  resize: none;
}

.plan-note-save-inline {
  background: white;
  color: #3F8064;
  border: 1px solid #DCE9DF;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.plan-empty {
  text-align: center;
  padding: 24px;
  color: #658078;
}

.plan-empty ion-icon {
  font-size: 40px;
  color: #DCE9DF;
}

.plan-actions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-big-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  min-height: 48px;
}

.plan-btn-route {
  background: white;
  color: #3F8064;
  border: 1.5px solid #3F8064;
}

.plan-btn-save {
  background: #3F8064;
  color: white;
}

.plan-big-btn:disabled {
  opacity: 0.5;
}

.plan-saved-note {
  text-align: center;
  color: #3F8064;
  font-size: 13px;
  font-weight: 600;
  margin: 10px 0 0 0;
}

.plan-selected-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  background: #F7FBF8;
}

.plan-transport-icon { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: #E8F4EC; color: #3F8064; font-size: 22px; }
.plan-route-copy { display: grid; min-width: 0; flex: 1; gap: 4px; }
.plan-route-copy .plan-note-label { margin: 0; }
.plan-route-copy strong { color: #174C40; text-transform: capitalize; }
.plan-route-copy > span { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; color: #658078; font-size: 12px; line-height: 1.5; }
.plan-route-copy > span ion-icon { transform: rotate(270deg); }
.plan-transport-picker { display: grid; width: min(100%, 320px); min-width: 0; flex: 0 1 320px; gap: 6px; }
.plan-transport-picker .plan-select { width: 100%; min-width: 0; margin: 0; }
.plan-route-change { flex: 0 0 auto; }
.plan-route-change:disabled { cursor: not-allowed; opacity: 0.5; }

.plan-btn-live { margin-top: 10px; background: #174C40; color: white; }

.plan-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .plan-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .plan-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
