<script setup lang="ts">
import { computed, ref } from 'vue';
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
import { getExploreListingLocation } from '../data/exploreListings';

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();
const selectedPlace = computed(() => getRideDestination(String(route.params.id)));
const curatedListing = computed(() => {
  const { name, category, note } = route.query;
  if (typeof name !== 'string' || typeof category !== 'string') return null;
  return {
    name,
    category,
    note: typeof note === 'string' ? note : '',
  };
});
const favoriteIds = ref<string[]>([]);
const imageFailed = ref(false);
const favoriteStorageKey = 'ride.saved-destination-ids';
const curatedFavoritesStorageKey = 'ride.saved-curated-destinations';
const curatedNearbyFood = computed(() =>
  getCuratedNearbyFood(curatedListing.value?.name ?? selectedPlace.value?.name ?? '')
);
const curatedListingLocation = computed(() => curatedListing.value
  ? getExploreListingLocation(curatedListing.value, curatedListing.value.category)
  : null);

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

try {
  const saved = localStorage.getItem(favoriteStorageKey);
  if (saved) {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
      favoriteIds.value = parsed;
    }
  }
} catch {
  showError('Saved places could not be loaded.');
}

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
  const next = isFavorite.value ? favoriteIds.value.filter((id) => id !== placeId) : [...favoriteIds.value, placeId];
  favoriteIds.value = next;
  try {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(next));
    if (curatedListing.value) {
      const rawCuratedFavorites = localStorage.getItem(curatedFavoritesStorageKey);
      const parsedCuratedFavorites: unknown = rawCuratedFavorites ? JSON.parse(rawCuratedFavorites) : {};
      const curatedFavorites = parsedCuratedFavorites && typeof parsedCuratedFavorites === 'object' && !Array.isArray(parsedCuratedFavorites)
        ? { ...parsedCuratedFavorites as Record<string, { name: string; category: string; note: string }> }
        : {};
      if (next.includes(placeId)) {
        curatedFavorites[placeId] = curatedListing.value;
      } else {
        delete curatedFavorites[placeId];
      }
      localStorage.setItem(curatedFavoritesStorageKey, JSON.stringify(curatedFavorites));
    }
    const placeName = selectedPlace.value?.name ?? curatedListing.value?.name ?? 'Place';
    showSuccess(`${placeName} ${next.includes(placeId) ? 'saved' : 'removed'}.`);
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

        <div class="dest-content" v-if="selectedPlace">
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

        <div class="dest-content" v-else-if="curatedListing">
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
              <p class="dest-description">
                This place is included in the RIDE guide. Verified address, description, and map coordinates are not available yet.
              </p>
              <div class="dest-tags">
                <span class="dest-tag">{{ curatedListing.category }}</span>
              </div>
              <p v-if="curatedListing.note" class="dest-about-note">{{ curatedListing.note }}</p>
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

        <div class="dest-content" v-else>
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
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.dest-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
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

.dest-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dest-greet-line {
  color: #3F8064;
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.dest-greet-title {
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.dest-greet-sub {
  color: #658078;
  font-size: 13px;
  margin: 0;
}

.dest-content {
  padding: 16px;
  max-width: 100%;
}

.dest-hero {
  position: relative;
  width: 100%;
  height: 220px;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #E8F4EC;
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
  color: #3F8064;
  font-size: 64px;
}

.dest-fav-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: white;
  border: 1px solid #DCE9DF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dest-section {
  margin-bottom: 18px;
}

.dest-info-card {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
}

.dest-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #F2F8F3;
}

.dest-info-row:last-child {
  border-bottom: none;
}

.dest-info-row ion-icon {
  color: #3F8064;
  font-size: 22px;
  margin-top: 2px;
}

.dest-info-label {
  color: #658078;
  font-size: 12px;
}

.dest-info-value {
  color: #174C40;
  font-size: 14px;
  margin: 2px 0 0 0;
}

.dest-subtitle {
  color: #174C40;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.dest-about-card {
  padding: 14px;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  background: #F8FBF8;
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
  background: #FFF7E6;
  color: #7A5818;
  font-size: 13px;
  line-height: 1.5;
}

.dest-description {
  color: #174C40;
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
  background: #E8F4EC;
  color: #3F8064;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.dest-section-title {
  color: #174C40;
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px 0;
  font-family: 'Poppins', sans-serif;
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
  color: #658078;
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
  padding: 0 8px;
  border-radius: 999px;
  background: #E8F4EC;
  color: #3F8064;
  font-size: 12px;
  font-weight: 700;
}

.dest-eats-list {
  display: grid;
  gap: 10px;
}

.dest-eat-card {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  background: #FFFFFF;
  color: inherit;
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
  outline: 3px solid rgba(63, 128, 100, 0.3);
  outline-offset: 2px;
}

.dest-eat-card:hover {
  border-color: #9FC5AC;
  background: #F8FBF8;
}

.dest-eat-card:active {
  transform: scale(0.99);
}

.dest-eat-icon {
  display: flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #E8F4EC;
  color: #3F8064;
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
  color: #174C40;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.dest-eat-info span {
  overflow: hidden;
  color: #658078;
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
  color: #3F8064;
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
  color: #7A9B8C;
  font-size: 18px;
}

.dest-eats-wrapper {
  margin-top: 4px;
}

.dest-eat-distance {
  display: block;
  color: #3F8064;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dest-eat-address {
  display: block;
  color: #658078;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dest-eat-directions {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #E8F4EC;
  color: #3F8064;
  font-size: 18px;
  text-decoration: none;
  flex-shrink: 0;
  margin-left: 8px;
}

.dest-eat-directions:hover {
  background: #D1E8DC;
}

.dest-eat-directions ion-icon {
  pointer-events: none;
}

.dest-actions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 12px 14px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  width: 100%;
}

.dest-action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #E8F4EC;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 24px;
  flex-shrink: 0;
}

.dest-action-text {
  flex: 1;
  min-width: 0;
}

.dest-action-text strong {
  color: #174C40;
  font-size: 14px;
  display: block;
}

.dest-action-text span {
  color: #658078;
  font-size: 12px;
}

.dest-action-item ion-icon:last-child {
  color: #658078;
  font-size: 18px;
}

.dest-empty {
  text-align: center;
  padding: 40px 20px;
}

.dest-empty ion-icon {
  font-size: 48px;
  color: #DCE9DF;
}

.dest-empty h2 {
  color: #174C40;
  margin: 12px 0 6px 0;
}

.dest-empty p {
  color: #658078;
  margin: 0 0 16px 0;
}

.dest-back-btn {
  background: #3F8064;
  color: white;
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
