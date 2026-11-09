<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  businessOutline,
  calendarOutline,
  chevronForwardOutline,
  compassOutline,
  heart,
  heartOutline,
  cafeOutline,
  leafOutline,
  locationOutline,
  mapOutline,
  navigateOutline,
  restaurantOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getDistanceInKilometers } from '../data/calapan';
import { getRideDestination, getRideDestinations, type RideDestination } from '../data/destinations';
import { getCuratedNearbyFood } from '../data/curatedNearbyPlaces';
import { completePlanningStep, ensureDraftTripId } from '../data/flowProgress';
import { showError, showSuccess } from '../composables/feedback';
import { getExploreListingId, getExploreListingLocation } from '../data/exploreListings';
import { loadSavedIds, toggleSavedPlace, SAVED_PLACES_UPDATED_EVENT } from '../data/savedPlaces';

const CALAPAN_CENTER = { latitude: 13.4147715, longitude: 121.1803193 };

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();
const selectedPlace = computed(() => getRideDestination(String(route.params.id)));
const curatedListing = computed(() => {
  const { name, category, note, address } = route.query;
  if (typeof name !== 'string' || typeof category !== 'string') return null;
  return {
    name,
    category,
    address: typeof address === 'string' ? address : '',
    note: typeof note === 'string' ? note : '',
  };
});
const favoriteIds = ref<string[]>([]);
const imageFailed = ref(false);
const curatedNearbyFood = computed(() =>
  getCuratedNearbyFood(curatedListing.value?.name ?? selectedPlace.value?.name ?? '')
);
const curatedListingLocation = computed(() => curatedListing.value
  ? getExploreListingLocation(curatedListing.value, curatedListing.value.category)
  : null);
const curatedListingAbout = computed(() => {
  const note = curatedListing.value?.note?.trim();
  const address = curatedListing.value?.address?.trim();
  if (note) return note;
  if (address) return 'No additional description available yet.';
  return '';
});

function estimateTravelMinutes(km: number): number {
  if (km <= 0.2) return 2;
  return Math.max(3, Math.round((km / 22) * 60 + 4));
}

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 100) * 10)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const distanceFromCenter = computed(() => {
  const place = selectedPlace.value;
  if (place) return getDistanceInKilometers(CALAPAN_CENTER.latitude, CALAPAN_CENTER.longitude, place);
  const listing = curatedListing.value;
  if (!listing) return null;
  const known = getRideDestination(getExploreListingId(listing.name, listing.category));
  if (known) return getDistanceInKilometers(CALAPAN_CENTER.latitude, CALAPAN_CENTER.longitude, known);
  return null;
});

const distanceLabel = computed(() => {
  const km = distanceFromCenter.value;
  if (km == null) return 'Distance not available (no verified map coordinates yet)';
  return `${formatDistanceKm(km)} · ~${estimateTravelMinutes(km)} min from Calapan City center`;
});

interface NearbyRestaurant {
  place: RideDestination;
  distanceKm: number;
}

const DEFAULT_RADIUS_KM = 1;
const EXPANDED_RADIUS_KM = 3;

const isFoodPlace = (place: RideDestination): boolean => {
  const category = place.category.toLocaleLowerCase();
  return (
    category.includes('restaurant')
    || category.includes('cafe')
    || category.includes('coffee')
    || category.includes('eatery')
  );
};

const nearbyEats = computed<NearbyRestaurant[]>(() => {
  const destination = selectedPlace.value;
  if (!destination) return [];

  const foodPlaces = places.filter(
    (place) => isFoodPlace(place) && place.id !== destination.id
  );

  const withDistances = foodPlaces.map((place) => ({
    place,
    distanceKm: getDistanceInKilometers(
      destination.latitude,
      destination.longitude,
      place as Pick<RideDestination, 'latitude' | 'longitude'>
    ),
  }));

  // Try 1 km radius first
  let nearby = withDistances.filter((item) => item.distanceKm <= DEFAULT_RADIUS_KM);

  // If no results within 1 km, expand to 3 km
  if (nearby.length === 0) {
    nearby = withDistances.filter((item) => item.distanceKm <= EXPANDED_RADIUS_KM);
  }

  return nearby
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 4);
});

const radiusLabel = computed(() => {
  if (nearbyEats.value.length === 0) return '';
  const usesExpandedRadius = nearbyEats.value.some((item) => item.distanceKm > DEFAULT_RADIUS_KM);
  return usesExpandedRadius ? `Within ${EXPANDED_RADIUS_KM} km` : `Within ${DEFAULT_RADIUS_KM} km`;
});

function eatDirectionsUrl(place: RideDestination): string {
  return `https://www.openstreetmap.org/directions?to=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`;
}

function refreshFavoriteState() {
  try { favoriteIds.value = loadSavedIds(); } catch { favoriteIds.value = []; }
}
refreshFavoriteState();
onMounted(() => { refreshFavoriteState(); window.addEventListener(SAVED_PLACES_UPDATED_EVENT, refreshFavoriteState); });
onUnmounted(() => { window.removeEventListener(SAVED_PLACES_UPDATED_EVENT, refreshFavoriteState); });

const favoritePlaceId = computed(() => selectedPlace.value?.id ?? (curatedListing.value ? String(route.params.id) : ''));
const isFavorite = computed(() => Boolean(favoritePlaceId.value && favoriteIds.value.includes(favoritePlaceId.value)));
const placeImage = computed(() => {
  if (!selectedPlace.value) return '';
  if (!imageFailed.value) return selectedPlace.value.image || selectedPlace.value.imageFallback || '';
  return selectedPlace.value.imageFallback || '';
});

const categoryIcon = computed(() => {
  const category = selectedPlace.value?.category ?? curatedListing.value?.category ?? '';
  if (category === 'Heritage' || /church|historic|museum|heritage/i.test(category)) return businessOutline;
  if (/cafe|coffee/i.test(category)) return cafeOutline;
  if (/restaurant|eatery/i.test(category)) return restaurantOutline;
  if (/hotel|event|market|shopping|souvenir/i.test(category)) return businessOutline;
  if (/beach|water|island|marine|swimming/i.test(category)) return waterOutline;
  return leafOutline;
});

function toggleFavorite() {
  const placeId = favoritePlaceId.value;
  if (!placeId) return;
  try {
    const listing = curatedListing.value;
    const result = toggleSavedPlace(placeId, listing ? { name: listing.name, category: listing.category, note: listing.note } : undefined);
    refreshFavoriteState();
    const placeName = selectedPlace.value?.name ?? listing?.name ?? 'Place';
    showSuccess(`${placeName} ${result.saved ? 'saved' : 'removed'}.`);
  } catch {
    showError('Could not update saved places.');
  }
}



function planTrip() {
  if (!selectedPlace.value) return;
  const flowId = ensureDraftTripId();
  completePlanningStep('explore', flowId);
  router.push({ name: 'ItineraryPlanner', query: { place: selectedPlace.value.id } });
}

function planCuratedTrip() {
  const listing = curatedListing.value;
  if (!listing) return;
  const flowId = ensureDraftTripId();
  completePlanningStep('explore', flowId);
  router.push({
    name: 'ItineraryPlanner',
    query: {
      curatedPlace: listing.name,
      curatedCategory: listing.category,
      ...(listing.note ? { curatedNote: listing.note } : {}),
    },
  });
}

function directionsUrl() {
  const place = selectedPlace.value;
  if (!place) return '#';
  return `https://www.openstreetmap.org/directions?to=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`;
}

function curatedMapSearchUrl() {
  const listing = curatedListing.value;
  if (!listing) return '#';
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${listing.name}, ${listing.category}, Calapan City, Oriental Mindoro`)}`;
}

</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="dest-app">
        <RideAppHeader
          eyebrow="Destination"
          :title="selectedPlace?.name || curatedListing?.name || 'Destination'"
          :subtitle="selectedPlace ? `${selectedPlace.city}, ${selectedPlace.province}` : curatedListing?.category || ''"
          show-back
        />

        <div class="dest-content desktop-content ride-content" v-if="selectedPlace">
          <section class="dest-hero">
            <img v-if="placeImage" :src="placeImage" :alt="selectedPlace.imageAlt || selectedPlace.name" @error="imageFailed = true" />
            <div v-else class="dest-hero-fallback">
              <ion-icon :icon="categoryIcon"></ion-icon>
            </div>
            <button class="dest-fav-btn" type="button" @click="toggleFavorite" :aria-pressed="isFavorite">
              <ion-icon :icon="isFavorite ? heart : heartOutline"></ion-icon>
            </button>
          </section>

          <section class="dest-section">
            <div class="dest-info-card">
              <div class="dest-info-row">
                <ion-icon :icon="locationOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">Address</span>
                  <p class="dest-info-value">{{ selectedPlace.address }}</p>
                </div>
              </div>
              <div class="dest-info-row">
                <ion-icon :icon="timeOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">Distance</span>
                  <p class="dest-info-value">{{ distanceLabel }}</p>
                </div>
              </div>
              <div class="dest-info-row">
                <ion-icon :icon="compassOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">Category</span>
                  <p class="dest-info-value">{{ selectedPlace.category }}</p>
                </div>
              </div>
            </div>
          </section>

            <section class="dest-section">
              <div class="dest-about-card">
                <h3 class="dest-subtitle">About</h3>
                <p class="dest-description">{{ selectedPlace.description }}</p>
                <div v-if="selectedPlace.tags?.length" class="dest-tags">
                  <span v-for="tag in selectedPlace.tags.slice(0,4)" :key="tag" class="dest-tag">{{ tag }}</span>
                </div>
              </div>
            </section>

            <section class="dest-section">
              <div v-if="curatedNearbyFood.length > 0" class="dest-eats-wrapper">
                <div class="dest-eats-heading">
                  <div>
                    <h2 class="dest-section-title">Restaurants &amp; Cafés Nearby</h2>
                    <p class="dest-eats-subtitle">Distances from your supplied guide; confirm before visiting</p>
                  </div>
                  <span class="dest-eats-count">{{ curatedNearbyFood.length }}</span>
                </div>
                <div class="dest-eats-list">
                  <article
                    v-for="food in curatedNearbyFood"
                    :key="`${food.kind}-${food.name}`"
                    class="dest-eat-card dest-curated-food-card"
                  >
                    <div class="dest-eat-icon">
                      <ion-icon :icon="food.kind === 'Cafe' ? cafeOutline : restaurantOutline"></ion-icon>
                    </div>
                    <div class="dest-eat-info">
                      <strong>{{ food.name }}</strong>
                      <span>{{ food.kind }}</span>
                      <span class="dest-eat-distance">{{ food.distance }}</span>
                    </div>
                  </article>
                </div>
              </div>

              <div v-else-if="!curatedListing && nearbyEats.length === 0" class="dest-empty">
                <ion-icon :icon="restaurantOutline"></ion-icon>
                <h2>No nearby restaurants found.</h2>
                <p>No verified restaurants or eateries were found near {{ selectedPlace?.name }} within 3 km.</p>
              </div>

              <div v-else-if="!curatedListing" class="dest-eats-wrapper">
                <div class="dest-eats-heading">
                  <div>
                    <h2 class="dest-section-title">Restaurants &amp; Cafés Nearby</h2>
                    <p class="dest-eats-subtitle">{{ radiusLabel }} from {{ selectedPlace?.name }}</p>
                  </div>
                  <span class="dest-eats-count">{{ nearbyEats.length }}</span>
                </div>
                <div class="dest-eats-list">
                  <div
                    v-for="item in nearbyEats"
                    :key="item.place.id"
                    class="dest-eat-card"
                  >
                    <button
                      class="dest-eat-open"
                      type="button"
                      @click="router.push({ name: 'DestinationDetails', params: { id: item.place.id } })"
                    >
                      <div class="dest-eat-icon">
                        <ion-icon
                          :icon="
                            item.place.category.toLowerCase().includes('cafe')
                            || item.place.category.toLowerCase().includes('coffee')
                              ? cafeOutline
                              : restaurantOutline
                          "
                        ></ion-icon>
                      </div>
                      <div class="dest-eat-info">
                        <strong>{{ item.place.name }}</strong>
                        <span class="dest-eat-distance">{{ item.distanceKm.toFixed(1) }} km away</span>
                        <span class="dest-eat-address">{{ item.place.address }}</span>
                      </div>
                    </button>
                    <a
                      :href="eatDirectionsUrl(item.place)"
                      target="_blank"
                      rel="noreferrer"
                      class="dest-eat-directions"
                      :aria-label="`Open directions for ${item.place.name}`"
                    >
                      <ion-icon :icon="navigateOutline"></ion-icon>
                    </a>
                  </div>
                </div>
              </div>
            </section>

          <section class="dest-section">
            <h2 class="dest-section-title">Plan Your Visit</h2>
            <div class="dest-actions-list">
              <a class="dest-action-item" :href="selectedPlace.osmUrl" target="_blank" rel="noreferrer">
                <div class="dest-action-icon"><ion-icon :icon="mapOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>View on Map</strong>
                  <span>See full location details</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </a>
              <a class="dest-action-item" :href="directionsUrl()" target="_blank" rel="noreferrer">
                <div class="dest-action-icon"><ion-icon :icon="navigateOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>Get Directions</strong>
                  <span>Find route to this location</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </a>
              <button class="dest-action-item" type="button" @click="planTrip">
                <div class="dest-action-icon"><ion-icon :icon="calendarOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>Plan a Trip</strong>
                  <span>Create itinerary with this destination</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <div class="dest-spacer"></div>
        </div>

        <div class="dest-content desktop-content ride-content" v-else-if="curatedListing">
          <section class="dest-hero">
            <div class="dest-hero-fallback">
              <ion-icon :icon="categoryIcon"></ion-icon>
            </div>
            <button class="dest-fav-btn" type="button" @click="toggleFavorite" :aria-pressed="isFavorite" :aria-label="isFavorite ? 'Remove from saved places' : 'Save to favorites'">
              <ion-icon :icon="isFavorite ? heart : heartOutline"></ion-icon>
            </button>
          </section>

          <section class="dest-section">
            <div class="dest-info-card">
              <div class="dest-info-row">
                <ion-icon :icon="locationOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">{{ curatedListingLocation?.label ?? 'Address' }}</span>
                  <p class="dest-info-value">{{ curatedListingLocation?.value ?? 'Address not verified' }}</p>
                </div>
              </div>
              <div class="dest-info-row">
                <ion-icon :icon="timeOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">Distance</span>
                  <p class="dest-info-value">{{ distanceLabel }}</p>
                </div>
              </div>
              <div class="dest-info-row">
                <ion-icon :icon="compassOutline"></ion-icon>
                <div>
                  <span class="dest-info-label">Category</span>
                  <p class="dest-info-value">{{ curatedListing.category }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="dest-section">
            <div class="dest-about-card">
              <h3 class="dest-subtitle">About</h3>
              <p v-if="curatedListingAbout" class="dest-description">{{ curatedListingAbout }}</p>
              <p v-else class="dest-description">
                This place is included in the RIDE guide. Verified address, description, and map coordinates are not available yet.
              </p>
              <div class="dest-tags">
                <span class="dest-tag">{{ curatedListing.category }}</span>
              </div>
            </div>
          </section>

          <section class="dest-section">
            <div v-if="curatedNearbyFood.length > 0" class="dest-eats-wrapper">
              <div class="dest-eats-heading">
                <div>
                  <h2 class="dest-section-title">Restaurants &amp; Cafés Nearby</h2>
                  <p class="dest-eats-subtitle">Distances from your supplied guide; confirm before visiting</p>
                </div>
                <span class="dest-eats-count">{{ curatedNearbyFood.length }}</span>
              </div>
              <div class="dest-eats-list">
                <article v-for="food in curatedNearbyFood" :key="`${food.kind}-${food.name}`" class="dest-eat-card dest-curated-food-card">
                  <div class="dest-eat-icon">
                    <ion-icon :icon="food.kind === 'Cafe' ? cafeOutline : restaurantOutline"></ion-icon>
                  </div>
                  <div class="dest-eat-info">
                    <strong>{{ food.name }}</strong>
                    <span>{{ food.kind }}</span>
                    <span class="dest-eat-distance">{{ food.distance }}</span>
                  </div>
                </article>
              </div>
            </div>
            <div v-else class="dest-empty">
              <ion-icon :icon="restaurantOutline"></ion-icon>
              <h2>No nearby listings available.</h2>
              <p>The supplied guide does not include restaurant or café recommendations for this place.</p>
            </div>
          </section>

          <section class="dest-section">
            <h2 class="dest-section-title">Plan Your Visit</h2>
            <div class="dest-actions-list">
              <a class="dest-action-item" :href="curatedMapSearchUrl()" target="_blank" rel="noreferrer">
                <div class="dest-action-icon"><ion-icon :icon="mapOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>View on Map</strong>
                  <span>Search for this place on OpenStreetMap</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </a>
              <a class="dest-action-item" :href="curatedMapSearchUrl()" target="_blank" rel="noreferrer">
                <div class="dest-action-icon"><ion-icon :icon="navigateOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>Get Directions</strong>
                  <span>Find a map listing before starting your route</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </a>
              <button class="dest-action-item" type="button" @click="planCuratedTrip">
                <div class="dest-action-icon"><ion-icon :icon="calendarOutline"></ion-icon></div>
                <div class="dest-action-text">
                  <strong>Plan a Trip</strong>
                  <span>Open your itinerary planner for this place</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <div class="dest-spacer"></div>
        </div>

        <div class="dest-content desktop-content ride-content" v-else>
          <section class="dest-empty">
            <ion-icon :icon="compassOutline"></ion-icon>
            <h2>Destination not found</h2>
            <p>This place isn't in the guide.</p>
            <button class="dest-back-btn" @click="router.push('/explore')">Back to Explore</button>
          </section>
        </div>

        <RideBottomNav active="explore" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.dest-app {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.dest-header {
  background: linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-soft) 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.dest-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dest-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.dest-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
}

.dest-brand :deep(.brand-wordmark) {
  width: 76px;
}

.dest-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dest-action-btn {
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

.dest-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dest-greet-line {
  color: var(--brand-accent);
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.dest-greet-title {
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: var(--font-body);
  line-height: 1.15;
}

.dest-greet-sub {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.dest-content {
  padding: 18px 18px 0;
  max-width: 100%;
}

.dest-hero {
  position: relative;
  width: 100%;
  height: 240px;
  border-radius: 26px;
  overflow: hidden;
  margin-bottom: 18px;
  background: var(--brand-soft);
  box-shadow: var(--shadow-md);
}

.dest-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dest-hero-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 64px;
}

.dest-fav-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-glass);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 23px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.dest-section {
  margin-bottom: 22px;
}

.dest-info-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: var(--shadow-xs);
}

.dest-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.dest-info-row:last-child {
  border-bottom: none;
}

.dest-info-row ion-icon {
  color: var(--brand-accent);
  font-size: 22px;
  margin-top: 2px;
}

.dest-info-label {
  color: var(--text-secondary);
  font-size: 12px;
}

.dest-info-value {
  color: var(--text-strong);
  font-size: 14px;
  margin: 2px 0 0 0;
}

.dest-subtitle {
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
  font-family: var(--font-display);
}

.dest-about-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface-soft);
}

.dest-about-card .dest-description:last-child {
  margin-bottom: 0;
}

.dest-about-card .dest-tags {
  margin: 12px 0 0;
}

.dest-about-note {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--warning-soft);
  color: var(--warning);
  font-size: 13px;
  line-height: 1.5;
}

.dest-description {
  color: var(--text-strong);
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 12px 0;
}

.dest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.dest-tag {
  background: var(--brand-soft);
  color: var(--brand);
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.dest-section-title {
  color: var(--text-strong);
  font-size: 21px;
  font-weight: 600;
  margin: 0 0 14px 0;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}

.dest-eats-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.dest-eats-heading .dest-section-title {
  margin-bottom: 3px;
}

.dest-eats-subtitle {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

.dest-eats-count {
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
}

.dest-eats-list {
  display: grid;
  gap: 12px;
}

.dest-eat-card {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  color: inherit;
  box-shadow: var(--shadow-xs);
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.dest-eat-open {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.dest-eat-card:focus-within {
  outline: 3px solid color-mix(in srgb, var(--brand-accent) 0.3, transparent);
  outline-offset: 2px;
}

.dest-eat-card:hover {
  border-color: var(--text-muted);
  background: var(--surface-soft);
}

.dest-eat-card:active {
  transform: scale(0.99);
}

.dest-eat-icon {
  display: flex;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 22px;
}

.dest-eat-info {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.dest-eat-info strong {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.dest-eat-info span {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dest-eat-info .dest-eat-hours {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  overflow: visible;
  color: var(--brand-accent);
  font-size: 11px;
  line-height: 1.4;
  text-overflow: clip;
  white-space: normal;
}

.dest-eat-hours ion-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  font-size: 13px;
}

.dest-eat-info .dest-eat-hours span {
  overflow: visible;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  text-overflow: clip;
  white-space: normal;
}

.dest-eat-arrow {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 18px;
}

.dest-eats-wrapper {
  margin-top: 4px;
}

.dest-eat-distance {
  display: block;
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dest-eat-address {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dest-eat-directions {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 18px;
  text-decoration: none;
  flex-shrink: 0;
  margin-left: 8px;
  transition: background var(--transition-fast);
}

.dest-eat-directions:hover {
  background: var(--border);
}

.dest-eat-directions ion-icon {
  pointer-events: none;
}

.dest-actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dest-action-disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.dest-curated-empty {
  padding-top: 20px;
  padding-bottom: 12px;
}

.dest-curated-empty ion-icon {
  font-size: 34px;
}

.dest-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 13px 15px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  width: 100%;
  box-shadow: var(--shadow-xs);
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.dest-action-item:active {
  transform: scale(0.99);
  background: var(--surface-soft);
}

.dest-action-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand);
  font-size: 23px;
  flex-shrink: 0;
}

.dest-action-text {
  flex: 1;
  min-width: 0;
}

.dest-action-text strong {
  color: var(--text-strong);
  font-size: 14px;
  display: block;
}

.dest-action-text span {
  color: var(--text-secondary);
  font-size: 12px;
}

.dest-action-item ion-icon:last-child {
  color: var(--text-secondary);
  font-size: 18px;
}

.dest-empty {
  text-align: center;
  padding: 40px 20px;
}

.dest-empty ion-icon {
  font-size: 48px;
  color: var(--border);
}

.dest-empty h2 {
  color: var(--text-strong);
  margin: 12px 0 6px 0;
}

.dest-empty p {
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.dest-back-btn {
  background: var(--brand);
  color: var(--on-brand);
  border: none;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dest-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .dest-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .dest-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
