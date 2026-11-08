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
  const option = transportationModes.find((item) => item.id === mode);
  if (!option) return;
  const verifiedStops = itinerary.value.stopIds.filter((id) => places.some((place) => place.id === id));
  selectedRoute.value = {
    mode: option.id,
    fromId: verifiedStops[0] ?? '',
    toId: verifiedStops.at(-1) ?? '',
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
    showSuccess('Your itinerary has been saved to My Trips on this device.', 'Itinerary Saved');
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
  if (selectedRoute.value) {
    const verifiedStops = itinerary.value.stopIds.filter((id) => places.some((place) => place.id === id));
    const nextRoute = {
      ...selectedRoute.value,
      fromId: verifiedStops[0] ?? '',
      toId: verifiedStops.at(-1) ?? '',
    };
    if (nextRoute.fromId !== selectedRoute.value.fromId || nextRoute.toId !== selectedRoute.value.toId) {
      selectedRoute.value = nextRoute;
      try {
        localStorage.setItem(`${ITINERARY_DRAFT_KEY}.route`, JSON.stringify(nextRoute));
      } catch {
        showError('Transportation choice could not be updated.');
      }
    }
  }
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

        <div class="plan-content desktop-content ride-content">
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
  background: var(--bg);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.plan-header {
  background: linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-soft) 100%);
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
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--brand-accent) 0.06, transparent);
}

.plan-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-greet-line {
  color: var(--brand-accent);
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.plan-greet-title {
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: var(--font-body);
  line-height: 1.15;
}

.plan-greet-sub {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.plan-content {
  padding: 18px 18px 0;
  max-width: 100%;
}

.plan-section {
  margin-bottom: 22px;
}

.plan-focus-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-soft);
}

.plan-focus-label {
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.plan-focus-card strong {
  color: var(--text-strong);
  font-size: 16px;
}

.plan-focus-card > span:not(.plan-focus-label) {
  color: var(--text-secondary);
  font-size: 13px;
}

.plan-focus-card p {
  margin: 4px 0 0;
  color: var(--text-secondary);
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
  color: var(--text-strong);
  font-size: 21px;
  font-weight: 600;
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}

.plan-count {
  color: var(--text-secondary);
  font-size: 13px;
}

.plan-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.plan-stop-picker-hint {
  margin: 0 0 10px;
  color: var(--text-secondary);
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
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

.plan-category-group > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  color: var(--text-strong);
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
  color: var(--brand-accent);
  font-size: 18px;
}

.plan-category-group[open] > summary::after {
  content: '−';
}

.plan-category-count {
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 11px;
  font-weight: 600;
}

.plan-place-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  cursor: pointer;
}

.plan-place-option input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  margin: 1px 0 0;
  accent-color: var(--brand);
}

.plan-place-option-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.plan-place-option-copy strong {
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.plan-place-option-copy small {
  color: var(--warning);
  font-size: 11px;
  line-height: 1.4;
}

.plan-unverified-note {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--warning-soft);
  color: var(--warning);
  font-size: 12px;
  line-height: 1.5;
}

.plan-select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 13px;
  color: var(--text-strong);
  background: var(--surface);
}

.plan-add-btn {
  width: 100%;
  padding: 11px 16px;
  background: var(--brand);
  color: var(--on-brand);
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
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

.plan-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 14px;
  color: var(--text-strong);
  background: var(--surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.plan-input:focus,
.plan-select:focus {
  outline: none;
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-accent) 18%, transparent);
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
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  color: var(--on-brand);
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
  background: linear-gradient(to bottom, var(--brand) 0%, var(--border) 100%);
  margin: 4px 0;
  min-height: 24px;
}

.plan-timeline-card {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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
  color: var(--text-strong);
  font-size: 14px;
  display: block;
  word-break: break-word;
}

.plan-timeline-info p {
  color: var(--text-secondary);
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
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  cursor: pointer;
  padding: 0;
}

.plan-timeline-btn:disabled {
  opacity: 0.4;
}

.plan-timeline-remove {
  color: var(--danger);
}

.plan-timeline-note {
  border-top: 1px solid var(--border);
  padding: 10px 12px 12px 12px;
  background: var(--surface-soft);
}

.plan-note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.plan-note-label {
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.plan-note-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-strong);
  background: var(--surface);
  font-family: inherit;
  resize: none;
}

.plan-note-save-inline {
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid transparent;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.plan-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}

.plan-empty ion-icon {
  font-size: 40px;
  color: var(--border);
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
  padding: 13px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
  min-height: 50px;
}

.plan-btn-route {
  background: var(--surface);
  color: var(--brand);
  border: 1.5px solid var(--brand-accent);
}

.plan-btn-save {
  background: var(--brand);
  color: var(--on-brand);
  box-shadow: var(--shadow-sm);
}

.plan-big-btn:disabled {
  opacity: 0.5;
}

.plan-saved-note {
  text-align: center;
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 600;
  margin: 10px 0 0 0;
}

.plan-selected-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

.plan-transport-icon { display: grid; width: 44px; height: 44px; flex: 0 0 auto; place-items: center; border-radius: 14px; background: var(--brand-soft); color: var(--brand); font-size: 22px; }
.plan-route-copy { display: grid; min-width: 0; flex: 1; gap: 4px; }
.plan-route-copy .plan-note-label { margin: 0; }
.plan-route-copy strong { color: var(--text-strong); text-transform: capitalize; }
.plan-route-copy > span { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.plan-route-copy > span ion-icon { transform: rotate(270deg); }
.plan-transport-picker { display: grid; width: min(100%, 320px); min-width: 0; flex: 0 1 320px; gap: 6px; }
.plan-transport-picker .plan-select { width: 100%; min-width: 0; margin: 0; }
.plan-route-change { flex: 0 0 auto; }
.plan-route-change:disabled { cursor: not-allowed; opacity: 0.5; }

.plan-btn-live { margin-top: 10px; background: var(--brand-deep); color: var(--on-brand); }

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
