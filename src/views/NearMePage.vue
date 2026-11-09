<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { IonIcon, IonPage, IonContent } from '@ionic/vue';
import {
  arrowForwardOutline,
  bagHandleOutline,
  businessOutline,
  cafeOutline,
  calendarOutline,
  chevronDownOutline,
  compassOutline,
  leafOutline,
  locationOutline,
  navigateOutline,
  restaurantOutline,
  refreshOutline,
  waterOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
import { getDistanceInKilometers } from '../data/calapan';
import { EXPLORE_CATEGORY_LISTINGS, getExploreListingId } from '../data/exploreListings';
import { getRideDestinations, type RideDestination } from '../data/destinations';
import { CurrentLocationError, detectCurrentLocation, loadCachedCurrentLocation, type CurrentLocation } from '../data/currentLocation';

type Coordinates = { latitude: number; longitude: number };
const categoryFilters = [
  'All Places',
  'Adventure & Outdoor Activities',
  'Beaches',
  'Cafés & Coffee Shops',
  'Churches & Religious Sites',
  'Events & Venues',
  'Farm Tourism',
  'Historical Sites',
  'Hotels & Accommodations',
  'Islands & Islets',
  'Marine Sanctuaries',
  'Museums & Heritage',
  'Nature & Eco-Tourism',
  'Parks & Recreation',
  'Public Markets',
  'Restaurants & Eateries',
  'Resorts',
  'Shopping Malls',
  'Souvenir Shops',
  'Swimming Pools',
  'Tourist Spots',
  'Waterparks',
] as const;
type CategoryFilter = (typeof categoryFilters)[number];
type NearbyPlace = { place: RideDestination; distanceKm: number };
type MapTile = { key: string; x: number; y: number; left: number; top: number };
type MapMarker = NearbyPlace & { left: number; top: number };

const router = useRouter();
const places = getRideDestinations();
const knownPlaceIds = new Set(places.map((place) => place.id));
const placeCategories = new Map<string, Set<Exclude<CategoryFilter, 'All Places'>>>();
Object.entries(EXPLORE_CATEGORY_LISTINGS).forEach(([category, listings]) => {
  if (!categoryFilters.includes(category as CategoryFilter)) return;
  listings.forEach((listing) => {
    const placeId = getExploreListingId(listing.name, category);
    if (!knownPlaceIds.has(placeId)) return;
    const categories = placeCategories.get(placeId) ?? new Set<Exclude<CategoryFilter, 'All Places'>>();
    categories.add(category as Exclude<CategoryFilter, 'All Places'>);
    placeCategories.set(placeId, categories);
  });
});
const mapHeight = 330;
const currentLocation = ref<CurrentLocation | null>(loadCachedCurrentLocation());
const position = computed<Coordinates | null>(() => currentLocation.value
  ? { latitude: currentLocation.value.latitude, longitude: currentLocation.value.longitude }
  : null);
const locationLoading = ref(false);
const locationError = ref('');
const selectedCategory = ref<CategoryFilter>('All Places');
const radiusKm = ref(10);
const mapElement = ref<HTMLElement | null>(null);
const mapWidth = ref(360);
const selectedPlaceId = ref('');
const failedTiles = ref<Record<string, boolean>>({});
let mapObserver: ResizeObserver | undefined;
let locationRequestId = 0;

const radiusOptions = [5, 10, 25] as const;

function categoriesFor(place: RideDestination): Exclude<CategoryFilter, 'All Places'>[] {
  const knownCategories = placeCategories.get(place.id);
  if (knownCategories?.size) return [...knownCategories];

  const text = `${place.name} ${place.category} ${(place.tags ?? []).join(' ')}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  if (/coffee|cafe|cafeteria/.test(text)) return ['Cafés & Coffee Shops'];
  if (/restaurant|eatery|food|dining|kainan/.test(text)) return ['Restaurants & Eateries'];
  if (/church|chapel|cathedral|parish|religious/.test(text)) return ['Churches & Religious Sites'];
  if (/museum|heritage|mangyan/.test(text)) return ['Museums & Heritage'];
  if (/histor|ruins|old city hall/.test(text)) return ['Historical Sites'];
  if (/hotel|inn|transient|accommodation|rental/.test(text)) return ['Hotels & Accommodations'];
  if (/mall|shopping/.test(text)) return ['Shopping Malls'];
  if (/souvenir|native delicacies/.test(text)) return ['Souvenir Shops'];
  if (/waterpark|water park|slides/.test(text)) return ['Waterparks'];
  if (/pool|swimming/.test(text)) return ['Swimming Pools'];
  if (/resort/.test(text)) return ['Resorts'];
  if (/island|islet/.test(text)) return ['Islands & Islets'];
  if (/sanctuary|marine|fish sanctuary/.test(text)) return ['Marine Sanctuaries'];
  if (/farm|plantation|orchard|agri/.test(text)) return ['Farm Tourism'];
  if (/beach|coast/.test(text)) return ['Beaches'];
  if (/park|plaza|recreation/.test(text)) return ['Parks & Recreation'];
  if (/nature|eco|mangrove|forest|falls|waterfall|trail|cave/.test(text)) return ['Nature & Eco-Tourism'];
  return ['Tourist Spots'];
}

function categoryFor(place: RideDestination): Exclude<CategoryFilter, 'All Places'> {
  return selectedCategory.value === 'All Places' ? categoriesFor(place)[0] : selectedCategory.value;
}

const nearbyPlaces = computed<NearbyPlace[]>(() => {
  const origin = position.value;
  if (!origin) return [];
  return places
    .map((place) => ({ place, distanceKm: getDistanceInKilometers(origin.latitude, origin.longitude, place) }))
    .filter((item) => item.distanceKm <= radiusKm.value)
    .filter((item) => selectedCategory.value === 'All Places' || categoriesFor(item.place).includes(selectedCategory.value))
    .sort((a, b) => a.distanceKm - b.distanceKm);
});

const selectedPlace = computed(() => nearbyPlaces.value.find((item) => item.place.id === selectedPlaceId.value) ?? nearbyPlaces.value[0]);
const mapOrigin = computed(() => position.value);
const mapZoom = ref(14);

function worldPoint(latitude: number, longitude: number) {
  const scale = 256 * (2 ** mapZoom.value);
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale,
  };
}

function tileUrl(x: number, y: number) {
  const count = 2 ** mapZoom.value;
  const wrappedX = ((x % count) + count) % count;
  return `https://tile.openstreetmap.org/${mapZoom.value}/${wrappedX}/${y}.png`;
}

const mapTiles = computed<MapTile[]>(() => {
  if (!mapOrigin.value) return [];
  const center = worldPoint(mapOrigin.value.latitude, mapOrigin.value.longitude);
  const minX = Math.floor((center.x - mapWidth.value / 2) / 256) - 1;
  const maxX = Math.floor((center.x + mapWidth.value / 2) / 256) + 1;
  const minY = Math.floor((center.y - mapHeight / 2) / 256) - 1;
  const maxY = Math.floor((center.y + mapHeight / 2) / 256) + 1;
  const tiles: MapTile[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      if (y < 0 || y >= 2 ** mapZoom.value) continue;
      tiles.push({
        key: `${x}:${y}`,
        x,
        y,
        left: x * 256 - center.x + mapWidth.value / 2,
        top: y * 256 - center.y + mapHeight / 2,
      });
    }
  }
  return tiles;
});

const mapMarkers = computed<MapMarker[]>(() => {
  if (!mapOrigin.value) return [];
  const center = worldPoint(mapOrigin.value.latitude, mapOrigin.value.longitude);
  return nearbyPlaces.value
    .map((item) => {
      const point = worldPoint(item.place.latitude, item.place.longitude);
      return { ...item, left: point.x - center.x + mapWidth.value / 2, top: point.y - center.y + mapHeight / 2 };
    })
    .filter((item) => item.left > 12 && item.left < mapWidth.value - 12 && item.top > 14 && item.top < mapHeight - 18)
    .slice(0, 30);
});

const distanceCaption = computed(() => position.value
  ? `Approximate straight-line distance from ${currentLocation.value?.label ?? 'your location'}`
  : 'Share your location to see nearby places on the map');

const locationHeadline = computed(() => {
  if (locationLoading.value) return 'Finding your location…';
  if (currentLocation.value) return currentLocation.value.label;
  if (locationError.value) return 'Location unavailable';
  return 'Tap to share your location';
});

const locationDetail = computed(() => {
  if (locationLoading.value) return 'Using your device GPS';
  if (currentLocation.value) {
    const accuracy = currentLocation.value.accuracyMeters;
    if (accuracy !== null && accuracy > 0) {
      const accuracyLabel = accuracy >= 1000 ? `${(accuracy / 1000).toFixed(1)} km` : `${Math.round(accuracy)} m`;
      return `Accurate to about ${accuracyLabel}. Tap to update.`;
    }
    return 'Based on your device GPS. Tap to update.';
  }
  if (locationError.value) return locationError.value;
  return 'Allow location access so we can show nearby places.';
});

function locationErrorMessage(error: unknown) {
  if (error instanceof CurrentLocationError) {
    if (error.code === 'denied') return 'Location access is off. Allow it in your browser or device settings, then tap to try again.';
    if (error.code === 'timeout') return 'Location took too long to load. Tap to try again.';
    if (error.code === 'unsupported') return 'Location is not available on this device.';
  }
  return 'Your location could not be determined. Tap to try again.';
}

async function refreshLocation(force = true) {
  if (locationLoading.value) return;
  const requestId = ++locationRequestId;
  locationLoading.value = true;
  locationError.value = '';
  try {
    currentLocation.value = await detectCurrentLocation(force);
  } catch (error) {
    if (requestId === locationRequestId) {
      currentLocation.value = null;
      locationError.value = locationErrorMessage(error);
    }
  } finally {
    if (requestId === locationRequestId) locationLoading.value = false;
  }
}

function setRadius(radius: number) {
  radiusKm.value = radius;
}

function openPlace(place: RideDestination) {
  router.push({ name: 'DestinationDetails', params: { id: place.id } });
}

function directionsUrl(place: RideDestination) {
  const origin = position.value ? `&origin=${position.value.latitude},${position.value.longitude}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}${origin}&travelmode=transit`;
}

function distanceLabel(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function formatRadius(radius: number) {
  return `Within ${radius} km`;
}

function categoryIcon(category: string) {
  if (category === 'All Places' || category === 'Tourist Spots' || category === 'Adventure & Outdoor Activities') return compassOutline;
  if (category === 'Cafés & Coffee Shops') return cafeOutline;
  if (category === 'Restaurants & Eateries') return restaurantOutline;
  if (category === 'Souvenir Shops' || category === 'Shopping Malls' || category === 'Public Markets') return bagHandleOutline;
  if (category === 'Events & Venues' || category === 'Churches & Religious Sites' || category === 'Historical Sites' || category === 'Museums & Heritage' || category === 'Hotels & Accommodations' || category === 'Resorts' || category === 'Farm Tourism') return category === 'Events & Venues' ? calendarOutline : businessOutline;
  if (category === 'Beaches' || category === 'Islands & Islets' || category === 'Marine Sanctuaries' || category === 'Swimming Pools' || category === 'Waterparks') return waterOutline;
  if (category === 'Nature & Eco-Tourism' || category === 'Parks & Recreation') return leafOutline;
  return locationOutline;
}

function selectMarker(place: RideDestination) {
  selectedPlaceId.value = place.id;
}

function onTileError(key: string) {
  failedTiles.value = { ...failedTiles.value, [key]: true };
}

watch(nearbyPlaces, (items) => {
  if (!items.some((item) => item.place.id === selectedPlaceId.value)) selectedPlaceId.value = items[0]?.place.id ?? '';
}, { immediate: true });

onMounted(() => {
  void refreshLocation(false);
  if (!mapElement.value) return;
  mapWidth.value = mapElement.value.clientWidth || 360;
  if (typeof ResizeObserver !== 'undefined') {
    mapObserver = new ResizeObserver((entries) => {
      mapWidth.value = entries[0]?.contentRect.width || 360;
    });
    mapObserver.observe(mapElement.value);
  }
});

onBeforeUnmount(() => {
  locationRequestId += 1;
  mapObserver?.disconnect();
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="near-page">
        <RideAppHeader
          eyebrow="Near Me"
          title="Places around you"
          subtitle="Discover nearby places and find your way there."
          show-back
        />

        <main class="near-content">
          <button
            class="home-location"
            type="button"
            :class="{ 'is-error': !!locationError && !locationLoading }"
            :aria-busy="locationLoading"
            @click="refreshLocation(true)"
          >
            <span class="home-location-icon" aria-hidden="true"><ion-icon :icon="locationOutline"></ion-icon></span>
            <span class="home-location-copy" aria-live="polite">
              <span class="home-location-label">Your current location</span>
              <strong>{{ locationHeadline }}</strong>
              <span class="home-location-detail">{{ locationDetail }}</span>
              <span v-if="currentLocation" class="home-location-attribution">Location data © OpenStreetMap contributors</span>
            </span>
            <span class="home-location-update" aria-hidden="true"><ion-icon :icon="refreshOutline" :class="{ spinning: locationLoading }"></ion-icon></span>
          </button>

          <section class="map-section" aria-labelledby="map-heading">
            <div class="section-heading map-heading">
              <div>
                <p class="section-kicker">EXPLORE THE AREA</p>
                <h2 id="map-heading">Nearby on the map</h2>
                <p class="section-note">{{ distanceCaption }}</p>
              </div>
              <span class="map-count"><span class="count-pulse"></span>{{ currentLocation ? `${nearbyPlaces.length} places` : 'Location needed' }}</span>
            </div>

            <div ref="mapElement" class="near-map" role="region" aria-label="OpenStreetMap map of nearby places">
              <div class="map-tiles" aria-hidden="true">
                <template v-for="tile in mapTiles" :key="tile.key">
                  <img
                    v-if="!failedTiles[tile.key]"
                    class="map-tile"
                    :src="tileUrl(tile.x, tile.y)"
                    alt=""
                    draggable="false"
                    :style="{ left: `${tile.left}px`, top: `${tile.top}px` }"
                    @error="onTileError(tile.key)"
                  />
                </template>
              </div>
              <div class="map-vignette" aria-hidden="true"></div>
              <span v-if="currentLocation" class="map-preview-badge"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon><span>{{ currentLocation.label }}</span></span>
              <div v-else class="map-location-empty" role="status">
                <span class="map-location-empty-icon"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon></span>
                <strong>{{ locationLoading ? 'Finding your location…' : 'Share your location to explore nearby' }}</strong>
                <span>{{ locationLoading ? 'The map and places will update together.' : 'The map and destination list will use the same location.' }}</span>
              </div>
              <button
                v-for="(marker, index) in mapMarkers"
                :key="marker.place.id"
                class="map-marker"
                :class="{ 'marker-selected': marker.place.id === selectedPlace?.place.id }"
                :style="{ left: `${marker.left}px`, top: `${marker.top}px`, '--marker-index': index }"
                type="button"
                :aria-label="`${marker.place.name}, ${distanceLabel(marker.distanceKm)} away`"
                :title="marker.place.name"
                @click="selectMarker(marker.place)"
              ><span>{{ index + 1 }}</span></button>
              <div v-if="currentLocation" class="user-pin user-pin-known" :style="{ left: `${mapWidth / 2}px`, top: `${mapHeight / 2}px` }" :aria-label="`Map centered on ${currentLocation.label}`">
                <span></span>
              </div>
              <div v-if="currentLocation" class="map-zoom-control" aria-label="Map zoom controls">
                <button type="button" aria-label="Zoom in" :disabled="mapZoom >= 17" @click="mapZoom = Math.min(17, mapZoom + 1)">+</button>
                <button type="button" aria-label="Zoom out" :disabled="mapZoom <= 12" @click="mapZoom = Math.max(12, mapZoom - 1)">−</button>
              </div>
              <div v-if="selectedPlace" class="map-place-card">
                <span class="map-place-number">{{ (mapMarkers.findIndex((marker) => marker.place.id === selectedPlace.place.id) + 1) || '•' }}</span>
                <div class="map-place-copy">
                  <strong>{{ selectedPlace.place.name }}</strong>
                  <span>{{ categoryFor(selectedPlace.place) }} <i></i> {{ distanceLabel(selectedPlace.distanceKm) }}{{ position ? ' away' : ' from center' }}</span>
                </div>
                <button type="button" aria-label="View selected place" @click="openPlace(selectedPlace.place)"><ion-icon :icon="arrowForwardOutline" aria-hidden="true"></ion-icon></button>
              </div>
              <div class="map-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
            </div>
          </section>

          <section class="places-section" aria-labelledby="places-heading">
            <div class="section-heading places-heading">
              <div>
                <p class="section-kicker">CURATED FOR YOU</p>
                <h2 id="places-heading">Places to explore</h2>
                <p class="section-note">{{ currentLocation ? `Sorted nearest first, from ${currentLocation.label}.` : 'Share your location to load places nearby.' }}</p>
              </div>
              <label class="radius-select">
                <span class="sr-only">Search radius</span>
                <select :value="radiusKm" @change="setRadius(Number(($event.target as HTMLSelectElement).value))">
                  <option v-for="radius in radiusOptions" :key="radius" :value="radius">{{ formatRadius(radius) }}</option>
                </select>
                <ion-icon :icon="chevronDownOutline" aria-hidden="true"></ion-icon>
              </label>
            </div>

            <div class="category-row" role="group" aria-label="Filter places by category">
              <button
                v-for="category in categoryFilters"
                :key="category"
                class="category-chip"
                :class="{ 'chip-active': selectedCategory === category }"
                type="button"
                :aria-pressed="selectedCategory === category"
                @click="selectedCategory = category"
              >
                <ion-icon v-if="category !== 'All Places'" :icon="categoryIcon(category)" aria-hidden="true"></ion-icon>{{ category }}
              </button>
            </div>

            <div v-if="nearbyPlaces.length" class="place-list">
              <article v-for="(item, index) in nearbyPlaces" :key="item.place.id" class="place-card" :style="{ '--card-index': Math.min(index, 8) }">
                <button class="place-image-button" type="button" :aria-label="`View ${item.place.name}`" @click="openPlace(item.place)">
                  <img v-if="item.place.image || item.place.imageFallback" :src="item.place.image || item.place.imageFallback" :alt="item.place.imageAlt || item.place.name" loading="lazy">
                  <span v-else class="place-image-fallback"><ion-icon :icon="categoryIcon(categoryFor(item.place))" aria-hidden="true"></ion-icon></span>
                  <span class="image-category">{{ categoryFor(item.place) }}</span>
                </button>
                <div class="place-copy">
                  <div class="place-title-row"><h3>{{ item.place.name }}</h3><span class="place-distance">{{ distanceLabel(item.distanceKm) }}<small>{{ position ? 'away' : 'from center' }}</small></span></div>
                  <p class="place-address"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon><span>{{ item.place.address }}</span></p>
                  <p v-if="item.place.description" class="place-about">{{ item.place.description }}</p>
                  <div class="place-card-actions">
                    <button type="button" class="details-link" @click="openPlace(item.place)">Explore</button>
                    <a :href="directionsUrl(item.place)" target="_blank" rel="noreferrer" class="directions-link"><ion-icon :icon="navigateOutline" aria-hidden="true"></ion-icon> Directions</a>
                  </div>
                </div>
              </article>
            </div>

            <div v-else-if="!currentLocation" class="empty-state">
              <span class="empty-icon"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon></span>
              <h3>{{ locationLoading ? 'Finding places near you' : 'Your location is needed' }}</h3>
              <p>{{ locationLoading ? 'The map and list will update when your location is ready.' : 'Share your current location above to see only places near you.' }}</p>
              <button v-if="!locationLoading" type="button" @click="refreshLocation(true)">Try location again</button>
            </div>
            <div v-else class="empty-state">
              <span class="empty-icon"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon></span>
              <h3>{{ selectedCategory === 'All Places' ? 'No places in this search yet' : `No ${selectedCategory.toLocaleLowerCase()} nearby` }}</h3>
              <p>No places in this category were found within {{ radiusKm }} km. Expand your search radius or choose All Places.</p>
              <button type="button" @click="radiusKm = 25; selectedCategory = 'All Places'">Expand search</button>
            </div>
          </section>
        </main>
        <RideBottomNav active="explore" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.near-page { min-height: 100vh; padding-bottom: calc(112px + env(safe-area-inset-bottom)); background: var(--bg); }
.near-content { display: grid; width: 100%; max-width: 100%; min-width: 0; grid-template-columns: minmax(0, 1fr); gap: 14px; padding: 18px 16px 30px; }
.home-location { display: flex; width: 100%; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: 20px; background: var(--surface); box-shadow: var(--shadow-sm); color: var(--text-primary); font: inherit; text-align: left; cursor: pointer; transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast); }
.home-location:active { transform: scale(.99); }
.home-location.is-error { border-color: color-mix(in srgb, var(--danger) 45%, var(--border)); background: color-mix(in srgb, var(--danger-soft) 55%, var(--surface)); }
.home-location-icon { display: grid; width: 44px; height: 44px; flex: 0 0 auto; place-items: center; border-radius: 14px; background: var(--brand-soft); color: var(--brand-accent); font-size: 22px; }
.home-location.is-error .home-location-icon { background: var(--danger-soft); color: var(--danger); }
.home-location-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.home-location-label { color: var(--brand-accent); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.home-location-copy strong { color: var(--text-strong); font-size: 15px; font-weight: 700; line-height: 1.3; }
.home-location-detail { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
.home-location.is-error .home-location-detail { color: var(--danger); }
.home-location-attribution { margin-top: 2px; color: var(--text-muted); font-size: 9px; letter-spacing: .01em; }
.home-location-update { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--surface-soft); color: var(--text-secondary); font-size: 17px; }
.home-location-update .spinning { animation: home-location-spin .9s linear infinite; }
@keyframes home-location-spin { to { transform: rotate(360deg); } }
.section-kicker { display: flex; align-items: center; gap: 8px; margin: 0 0 5px; color: var(--brand-accent); font-size: 9px; font-weight: 800; letter-spacing: .15em; }
.count-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-accent) 13%, transparent); }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-kicker { margin-bottom: 5px; color: var(--brand-accent); font-size: 9px; }
.section-heading h2 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: clamp(22px, 5vw, 28px); font-weight: 600; letter-spacing: -.025em; line-height: 1.15; }
.section-note { margin: 5px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.45; }
.map-count { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 8px; margin-bottom: 3px; padding: 8px 11px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text-body); font-size: 11px; font-weight: 700; }
.count-pulse { width: 6px; height: 6px; background: var(--brand-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-accent) 13%, transparent); }
.near-map { position: relative; height: 330px; overflow: hidden; isolation: isolate; border: 1px solid color-mix(in srgb, var(--brand-accent) 19%, var(--border)); border-radius: 23px; background-color: #e7e9df; background-image: linear-gradient(135deg, #e6ebdf, #d8e6de 52%, #e5e8de); box-shadow: 0 12px 28px rgb(23 76 64 / 10%); }
.map-tiles { position: absolute; inset: 0; overflow: hidden; }
.map-tile { position: absolute; width: 256px; height: 256px; max-width: none; user-select: none; }
.map-vignette { position: absolute; z-index: 1; inset: 0; background: linear-gradient(180deg, rgb(255 255 255 / 5%), transparent 40%, rgb(29 56 45 / 7%)); pointer-events: none; }
.map-preview-badge { position: absolute; z-index: 3; top: 13px; left: 13px; display: flex; max-width: calc(100% - 75px); align-items: center; gap: 6px; padding: 8px 11px; border: 1px solid rgb(255 255 255 / 75%); border-radius: 999px; background: rgb(255 255 255 / 91%); box-shadow: 0 3px 10px rgb(21 49 39 / 12%); color: #315c4e; font-size: 9px; font-weight: 800; letter-spacing: .04em; backdrop-filter: blur(8px); }
.map-preview-badge ion-icon { font-size: 13px; }
.map-preview-badge span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.map-location-empty { position: absolute; z-index: 3; top: 50%; left: 50%; display: grid; width: min(310px, calc(100% - 36px)); justify-items: center; gap: 7px; padding: 20px; border: 1px solid rgb(255 255 255 / 78%); border-radius: 20px; background: rgb(255 255 255 / 93%); box-shadow: 0 8px 24px rgb(24 50 39 / 15%); text-align: center; transform: translate(-50%, -50%); backdrop-filter: blur(14px); }
.map-location-empty-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 13px; background: #edf3ec; color: #33644f; font-size: 19px; }
.map-location-empty strong { color: #203d33; font-size: 13px; }
.map-location-empty > span:last-child { color: #718178; font-size: 10px; line-height: 1.45; }
.map-marker { position: absolute; z-index: 4; display: grid; width: 29px; height: 35px; place-items: center; padding: 0; border: 0; background: transparent; color: #fff; cursor: pointer; filter: drop-shadow(0 3px 3px rgb(22 50 39 / 30%)); transform: translate(-50%, -90%); transition: z-index .2s ease, transform .2s ease; }
.map-marker::before { position: absolute; inset: 1px 2px 6px; border: 2px solid #fff; border-radius: 50% 50% 50% 5px; background: #397c66; content: ''; transform: rotate(-45deg); }
.map-marker span { position: relative; z-index: 1; margin-top: -4px; font-size: 10px; font-weight: 800; }
.map-marker:hover,.map-marker.marker-selected { z-index: 8; transform: translate(-50%, -100%) scale(1.18); }
.map-marker.marker-selected::before { background: #bd9350; }
.user-pin { position: absolute; z-index: 3; display: grid; width: 20px; height: 20px; place-items: center; border: 3px solid #fff; border-radius: 50%; background: #3c8bd9; box-shadow: 0 0 0 8px rgb(60 139 217 / 20%), 0 3px 9px rgb(20 45 67 / 35%); transform: translate(-50%, -50%); }
.user-pin span { width: 5px; height: 5px; border-radius: 50%; background: #fff; }
.map-zoom-control { position: absolute; z-index: 4; top: 13px; right: 13px; display: grid; width: 34px; overflow: hidden; border: 1px solid rgb(255 255 255 / 80%); border-radius: 10px; background: rgb(255 255 255 / 94%); box-shadow: 0 3px 10px rgb(21 49 39 / 12%); color: #3e554b; text-align: center; }
.map-zoom-control span { display: grid; height: 31px; place-items: center; font-size: 20px; line-height: 1; }
.map-zoom-control span + span { border-top: 1px solid #e9ece7; font-size: 23px; }
.map-place-card { position: absolute; z-index: 5; right: 13px; bottom: 31px; left: 13px; display: flex; align-items: center; gap: 11px; padding: 11px 12px; border: 1px solid rgb(255 255 255 / 78%); border-radius: 15px; background: rgb(255 255 255 / 94%); box-shadow: 0 8px 24px rgb(24 50 39 / 18%); backdrop-filter: blur(14px); }
.map-place-number { display: grid; width: 32px; height: 32px; flex: 0 0 auto; place-items: center; border-radius: 11px; background: #edf3ec; color: #33644f; font-size: 12px; font-weight: 800; }
.map-place-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.map-place-copy strong { overflow: hidden; color: #203d33; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.map-place-copy span { display: flex; align-items: center; gap: 6px; color: #718178; font-size: 10px; }
.map-place-copy i { width: 3px; height: 3px; border-radius: 50%; background: #a0aea5; }
.map-place-card > button { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border: 0; border-radius: 50%; background: #24584a; color: white; cursor: pointer; }
.map-attribution { position: absolute; z-index: 4; right: 5px; bottom: 5px; padding: 2px 5px; border-radius: 4px; background: rgb(255 255 255 / 81%); font: 9px/1.2 Arial,sans-serif; }
.map-attribution a { color: #40584b; text-decoration: none; }
.places-heading { margin-bottom: 12px; }
.radius-select { position: relative; display: flex; flex: 0 0 auto; align-items: center; margin-bottom: 2px; }
.radius-select select { min-height: 38px; max-width: 135px; appearance: none; padding: 0 30px 0 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-strong); cursor: pointer; font-size: 11px; font-weight: 700; }
.radius-select ion-icon { position: absolute; right: 10px; color: var(--text-secondary); pointer-events: none; }
.category-row { display: flex; gap: 8px; margin: 0 -2px 16px; padding: 2px 2px 5px; overflow-x: auto; scrollbar-width: none; }
.category-row::-webkit-scrollbar { display: none; }
.category-chip { display: inline-flex; min-height: 37px; flex: 0 0 auto; align-items: center; gap: 6px; padding: 0 13px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--text-body); cursor: pointer; font-size: 11px; font-weight: 650; transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease; }
.category-chip ion-icon { font-size: 15px; }
.category-chip:hover { transform: translateY(-1px); }
.category-chip.chip-active { border-color: #285b4c; background: #285b4c; box-shadow: 0 4px 10px rgb(40 91 76 / 18%); color: #fff; }
.places-section { min-width: 0; }
.place-list { display: grid; width: 100%; min-width: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; gap: 13px; }
.place-card { display: flex; width: 100%; min-height: 158px; min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 4px 16px rgb(23 76 64 / 5%); animation: card-in .35s both; animation-delay: calc(var(--card-index) * 25ms); transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.place-card:hover { border-color: color-mix(in srgb, var(--brand-accent) 32%, var(--border)); box-shadow: 0 9px 24px rgb(23 76 64 / 9%); transform: translateY(-2px); }
.place-image-button { position: relative; width: 118px; height: 100%; min-height: 0; flex: 0 0 auto; overflow: hidden; padding: 0; border: 0; background: var(--brand-soft); cursor: pointer; }
.place-image-button img,.place-image-fallback { width: 100%; height: 100%; object-fit: cover; }
.place-image-fallback { display: grid; place-items: center; color: var(--brand-accent); font-size: 29px; }
.place-image-button::after { position: absolute; inset: 45% 0 0; background: linear-gradient(transparent, rgb(13 33 26 / 35%)); content: ''; pointer-events: none; }
.image-category { position: absolute; z-index: 1; bottom: 9px; left: 8px; max-width: calc(100% - 16px); overflow: hidden; padding: 5px 8px; border: 1px solid rgb(255 255 255 / 28%); border-radius: 999px; background: rgb(16 40 31 / 45%); color: #fff; font-size: 9px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; backdrop-filter: blur(8px); }
.place-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; justify-content: center; padding: 12px 13px; }
.place-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 9px; }
.place-title-row h3 { display: -webkit-box; min-width: 0; overflow: hidden; margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 15px; font-weight: 600; letter-spacing: -.01em; line-height: 1.25; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.place-distance { display: flex; flex: 0 0 auto; flex-direction: column; align-items: flex-end; color: var(--brand-accent); font-size: 12px; font-weight: 800; }
.place-distance small { margin-top: 2px; color: var(--text-secondary); font-size: 9px; font-weight: 500; }
.place-address { display: flex; align-items: flex-start; gap: 5px; margin: 8px 0 4px; color: var(--text-body); font-size: 11px; line-height: 1.45; }
.place-address span { min-width: 0; overflow-wrap: anywhere; }
.place-address ion-icon { flex: 0 0 auto; margin-top: 1px; color: var(--brand-accent); font-size: 13px; }
.place-about { display: -webkit-box; overflow: hidden; margin: 0 0 10px; color: var(--text-secondary); font-size: 10.5px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.place-card-actions { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: auto; }
.details-link,.directions-link { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; gap: 5px; cursor: pointer; font-size: 11px; font-weight: 700; text-decoration: none; white-space: nowrap; transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast); }
.details-link { padding: 0 14px; border: 1px solid color-mix(in srgb, var(--brand-accent) 22%, var(--border)); border-radius: 999px; background: linear-gradient(135deg, color-mix(in srgb, var(--brand-accent) 12%, var(--surface)), var(--surface)); color: var(--brand-accent); box-shadow: 0 4px 10px -8px color-mix(in srgb, var(--brand-accent) 45%, transparent); }
.details-link:hover { border-color: color-mix(in srgb, var(--brand-accent) 38%, var(--border)); background: color-mix(in srgb, var(--brand-accent) 16%, var(--surface)); }
.details-link:active,.directions-link:active { transform: scale(.98); }
.directions-link { padding: 0 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text-body); }
.directions-link ion-icon { font-size: 14px; }
.empty-state { display: grid; justify-items: center; padding: 36px 20px; border: 1px dashed var(--border-strong); border-radius: 20px; background: var(--surface-soft); text-align: center; }
.empty-icon { display: grid; width: 48px; height: 48px; place-items: center; border-radius: 16px; background: var(--brand-soft); color: var(--brand-accent); font-size: 22px; }
.empty-state h3 { margin: 13px 0 5px; color: var(--text-strong); font-family: var(--font-display); font-size: 18px; }
.empty-state p { max-width: 300px; margin: 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.empty-state button { min-height: 38px; margin-top: 15px; padding: 0 13px; border: 0; border-radius: 11px; background: var(--brand); color: var(--on-brand); cursor: pointer; font-size: 11px; font-weight: 700; }
.sr-only { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0 0 0 0) !important; white-space: nowrap !important; }
@keyframes card-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 700px) {
  .near-content { gap: 23px; }
  .place-list { grid-template-columns: 1fr; }
  .place-card { min-height: 154px; }
  .place-image-button { width: 112px; }
}
@media (max-width: 560px) {
  .places-heading { align-items: stretch; flex-direction: column; gap: 8px; }
  .radius-select { width: 100%; }
  .radius-select select { width: 100%; max-width: none; min-height: 44px; padding-right: 34px; font-size: 14px; }
  .radius-select ion-icon { font-size: 16px; }
}
@media (max-width: 390px) {
  .near-map { height: 300px; }
  .map-place-card { right: 9px; bottom: 29px; left: 9px; }
  .place-card { min-height: 150px; }
  .place-image-button { width: 96px; }
  .place-copy { padding: 10px; }
  .place-title-row h3 { font-size: 14px; }
  .directions-link { padding: 0 7px; }
}
@media (prefers-reduced-motion: reduce) {
  .place-card { animation: none; }
  .place-card,.category-chip,.map-marker { transition: none; }
  .home-location-update .spinning { animation: none; }
}
</style>
