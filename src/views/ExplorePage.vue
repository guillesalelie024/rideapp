<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  bagHandleOutline,
  businessOutline,
  cafeOutline,
  calendarOutline,
  cardOutline,
  compassOutline,
  heart,
  heartOutline,
  leafOutline,
  locationOutline,
  medkitOutline,
  navigateOutline,
  restaurantOutline,
  schoolOutline,
  searchOutline,
  sparklesOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getDistanceInKilometers } from '../data/calapan';
import { detectCurrentLocation, loadCachedCurrentLocation, type CurrentLocation } from '../data/currentLocation';
import { getRideDestination, getRideDestinations } from '../data/destinations';
import { EXPLORE_CATEGORY_LISTINGS, getExploreListingId, getExploreListingLocation, type ExploreListing } from '../data/exploreListings';

const categoryOptions = [
  { name: 'All Places', icon: compassOutline },
  { name: 'Adventure & Outdoor Activities', icon: compassOutline },
  { name: 'ATM Machines', icon: cardOutline },
  { name: 'Beaches', icon: waterOutline },
  { name: 'Cafés & Coffee Shops', icon: cafeOutline },
  { name: 'Churches & Religious Sites', icon: businessOutline },
  { name: 'Events & Venues', icon: calendarOutline },
  { name: 'Farm Tourism', icon: leafOutline },
  { name: 'Historical Sites', icon: businessOutline },
  { name: 'Hotels & Accommodations', icon: businessOutline },
  { name: 'Islands & Islets', icon: waterOutline },
  { name: 'Marine Sanctuaries', icon: waterOutline },
  { name: 'Museums & Heritage', icon: businessOutline },
  { name: 'Nature & Eco-Tourism', icon: leafOutline },
  { name: 'Parks & Recreation', icon: leafOutline },
  { name: 'Pharmacies', icon: medkitOutline },
  { name: 'Colleges & Universities', icon: schoolOutline },
  { name: 'Private Elementary School', icon: schoolOutline },
  { name: 'Private High School', icon: schoolOutline },
  { name: 'Public Elementary School', icon: schoolOutline },
  { name: 'Public High School', icon: schoolOutline },
  { name: 'Public Markets', icon: businessOutline },
  { name: 'Restaurants & Eateries', icon: restaurantOutline },
  { name: 'Resorts', icon: businessOutline },
  { name: 'Shopping Malls', icon: businessOutline },
  { name: 'Souvenir Shops', icon: bagHandleOutline },
  { name: 'Swimming Pools', icon: waterOutline },
  { name: 'Tourist Spots', icon: compassOutline },
  { name: 'Waterparks', icon: waterOutline },
] as const;
type CategoryFilter = (typeof categoryOptions)[number]['name'];
type CategoryListing = ExploreListing & { category?: string };

type AllPlaceListing = CategoryListing & { category: string };

const router = useRouter();
const allPlaceListings: AllPlaceListing[] = categoryOptions.flatMap(({ name }) => {
  if (name === 'All Places') return [];
  return (EXPLORE_CATEGORY_LISTINGS[name] ?? []).map((listing) => ({ ...listing, category: name }));
});
const surprisePlaces = getRideDestinations();
const surprisePlaceById = new Map(surprisePlaces.map((place) => [place.id, place]));
const selectedCategory = ref<CategoryFilter>('All Places');
const searchQuery = ref('');
const statusMessage = ref('');
const failedListingImages = ref<string[]>([]);
const favoriteIds = ref<string[]>([]);
const curatedFavorites = ref<Record<string, { name: string; category: string; note: string }>>({});
const currentLocation = ref<CurrentLocation | null>(loadCachedCurrentLocation());
const geocodedCoords = ref<Record<string, { latitude: number; longitude: number }>>({});
const geocodeInFlight = new Set<string>();
const favoriteStorageKey = 'ride.saved-destination-ids';
const curatedFavoritesStorageKey = 'ride.saved-curated-destinations';
const geocodeCacheKey = 'ride.explore-geocode-v1';

function refreshSavedData() {
  try {
    const raw = localStorage.getItem(favoriteStorageKey);
    favoriteIds.value = raw ? JSON.parse(raw).filter((id: unknown) => typeof id === 'string') : [];
  } catch {
    favoriteIds.value = [];
  }
  try {
    const raw = localStorage.getItem(curatedFavoritesStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    curatedFavorites.value = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    curatedFavorites.value = {};
  }
  try {
    const raw = localStorage.getItem(geocodeCacheKey);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      geocodedCoords.value = Object.fromEntries(
        Object.entries(parsed).filter(([, v]: [string, unknown]) => {
          const c = v as { latitude?: unknown; longitude?: unknown } | null;
          return !!c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude);
        }) as [string, { latitude: number; longitude: number }][],
      );
    }
  } catch {
    geocodedCoords.value = {};
  }
}

onMounted(() => {
  refreshSavedData();
  void detectCurrentLocation(false)
    .then((loc) => {
      currentLocation.value = loc;
    })
    .catch(() => undefined);
  window.addEventListener('focus', refreshSavedData);
});

onUnmounted(() => {
  window.removeEventListener('focus', refreshSavedData);
});
const filteredAllPlaces = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return allPlaceListings.filter((place) => {
    if (!query) return true;
    return `${place.name} ${place.category} ${place.note ?? ''}`.toLocaleLowerCase().includes(query);
  });
});

const filteredCategoryListings = computed(() => {
  if (selectedCategory.value === 'All Places') return [];
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return (EXPLORE_CATEGORY_LISTINGS[selectedCategory.value] ?? []).filter((listing) =>
    `${listing.name} ${listing.note ?? ''}`.toLocaleLowerCase().includes(query)
  );
});

function selectCategory(category: CategoryFilter) {
  selectedCategory.value = category;
  statusMessage.value = '';
}

function listingCategory(listing: CategoryListing): string {
  return listing.category ?? selectedCategory.value;
}

function listingId(listing: CategoryListing): string {
  return getExploreListingId(listing.name, listingCategory(listing));
}

function getListingDestination(listing: CategoryListing) {
  const id = listingId(listing);
  return surprisePlaceById.get(id) ?? getRideDestination(id);
}

function listingImage(listing: CategoryListing) {
  const place = getListingDestination(listing);
  const imageKey = listing.image ?? place?.id;
  if (imageKey && failedListingImages.value.includes(imageKey)) return '';
  return listing.image || place?.image || place?.imageFallback || '';
}

function listingLocation(listing: CategoryListing) {
  return getExploreListingLocation(listing, listingCategory(listing), getListingDestination(listing));
}

function listingAbout(listing: CategoryListing): string {
  const place = getListingDestination(listing);
  if (place?.description) return place.description;
  if (listing.note) return listing.note;
  if (listing.address) return `Listed ${ (listing.category ?? selectedCategory.value).toLowerCase() } in Calapan City.`;
  const category = (listing.category ?? selectedCategory.value).toLowerCase();
  return `A ${category} destination in Calapan City.`;
}

function listingCoords(listing: CategoryListing): { latitude: number; longitude: number } | null {
  const place = getListingDestination(listing);
  if (place) return { latitude: place.latitude, longitude: place.longitude };
  return geocodedCoords.value[listingId(listing)] ?? null;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 100) * 10)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function estimateTravelMinutes(km: number): number {
  if (km <= 0.2) return 2;
  const minutes = (km / 22) * 60 + 4;
  return Math.max(3, Math.round(minutes));
}

const distanceCache = computed(() => {
  const origin = currentLocation.value;
  const cache = new Map<string, { km: string; minutes: string }>();
  if (!origin) return cache;
  const listings = selectedCategory.value === 'All Places' ? filteredAllPlaces.value : filteredCategoryListings.value;
  for (const listing of listings) {
    const coords = listingCoords(listing);
    if (!coords) continue;
    const id = listingId(listing);
    if (cache.has(id)) continue;
    const km = getDistanceInKilometers(origin.latitude, origin.longitude, coords);
    cache.set(id, {
      km: formatDistance(km),
      minutes: `${estimateTravelMinutes(km)} min`,
    });
  }
  return cache;
});

function fallbackDistance(listing: CategoryListing): { km: string; minutes: string } {
  const id = listingId(listing);
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const kmNum = 0.4 + (h % 96) / 10;
  return { km: formatDistance(kmNum), minutes: `${estimateTravelMinutes(kmNum)} min` };
}

function listingDistance(listing: CategoryListing): { km: string; minutes: string } {
  return distanceCache.value.get(listingId(listing)) ?? fallbackDistance(listing);
}

function saveGeocodeCache() {
  try { localStorage.setItem(geocodeCacheKey, JSON.stringify(geocodedCoords.value)); } catch { /* ignore */ }
}

async function geocodeListing(listing: CategoryListing) {
  const id = listingId(listing);
  if (listingCoords(listing) || geocodeInFlight.has(id)) return;
  geocodeInFlight.add(id);
  try {
    const location = listingLocation(listing).value;
    const query = location && !/verify exact address/i.test(location)
      ? `${listing.name}, ${location}`
      : `${listing.name}, Calapan City, Oriental Mindoro, Philippines`;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ph&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const body = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const lat = Number(body?.[0]?.lat);
    const lon = Number(body?.[0]?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      geocodedCoords.value = { ...geocodedCoords.value, [id]: { latitude: lat, longitude: lon } };
      saveGeocodeCache();
    }
  } catch { /* ignore geocode errors */ } finally {
    geocodeInFlight.delete(id);
  }
}

let geocodeTimer: number | undefined;
watch([currentLocation, selectedCategory, filteredAllPlaces, filteredCategoryListings], () => {
  if (!currentLocation.value) return;
  window.clearTimeout(geocodeTimer);
  geocodeTimer = window.setTimeout(() => {
    const listings = (selectedCategory.value === 'All Places' ? filteredAllPlaces.value : filteredCategoryListings.value).slice(0, 12);
    listings.forEach((listing) => { void geocodeListing(listing); });
  }, 150);
}, { immediate: true });

function isListingSaved(listing: CategoryListing): boolean {
  return favoriteIds.value.includes(listingId(listing));
}

function toggleListingSaved(listing: CategoryListing) {
  const category = listingCategory(listing);
  const knownPlace = getListingDestination(listing);
  const id = listingId(listing);
  const next = favoriteIds.value.includes(id)
    ? favoriteIds.value.filter((x) => x !== id)
    : [...favoriteIds.value, id];
  favoriteIds.value = next;
  try { localStorage.setItem(favoriteStorageKey, JSON.stringify(next)); } catch { /* ignore storage errors */ }
  if (!knownPlace) {
    const curated = { ...curatedFavorites.value };
    if (next.includes(id)) curated[id] = { name: listing.name, category, note: listing.note ?? '' };
    else delete curated[id];
    curatedFavorites.value = curated;
    try { localStorage.setItem(curatedFavoritesStorageKey, JSON.stringify(curated)); } catch { /* ignore storage errors */ }
  }
}

function markListingImageFailed(listing: CategoryListing) {
  const place = getListingDestination(listing);
  const imageKey = listing.image ?? place?.id;
  if (imageKey && !failedListingImages.value.includes(imageKey)) {
    failedListingImages.value = [...failedListingImages.value, imageKey];
  }
}

function openListing(listing: CategoryListing) {
  const category = listingCategory(listing);
  const id = listingId(listing);

  void router.push({
    name: 'DestinationDetails',
    params: { id },
    query: {
      name: listing.name,
      category,
      ...(listing.address ? { address: listing.address } : {}),
      ...(listing.note ? { note: listing.note } : {}),
    },
  });
}

function findNearbyPlaces() {
  void router.push({ name: 'NearMe' });
}

function listingDirectionUrl(listing: CategoryListing): string {
  const coords = listingCoords(listing);
  if (coords) return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}&travelmode=driving`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.name}, Calapan City, Oriental Mindoro`)}`;
}

function surpriseMe() {
  void router.push({ name: 'SurpriseMe' });
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="exp-app">
        <RideAppHeader
          eyebrow="Explore"
          title="Discover places to visit"
          subtitle="Find destinations and plan your next ride"
          show-back
        />

        <div class="exp-content desktop-content ride-content">
          <section class="exp-search-section home-search-style">
            <form class="exp-search home-search app-search" @submit.prevent>
              <ion-icon class="search-glyph" :icon="searchOutline" aria-hidden="true"></ion-icon>
              <input v-model="searchQuery" type="search" placeholder="Search destinations, attractions..." aria-label="Search destinations" />
            </form>
            <div class="exp-quick-actions">
              <button class="exp-quick-btn" type="button" @click="findNearbyPlaces">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span>Near Me</span>
              </button>
              <button class="exp-quick-btn" type="button" @click="surpriseMe">
                <ion-icon :icon="sparklesOutline"></ion-icon>
                <span>Surprise Me</span>
              </button>
            </div>
            <p v-if="statusMessage" class="exp-status">{{ statusMessage }}</p>
          </section>

          <section class="exp-section" aria-labelledby="explore-categories-heading">
            <div class="exp-section-header">
              <div>
                <h2 id="explore-categories-heading" class="exp-section-title">Categories</h2>
                <p class="exp-section-sub">Browse places around Calapan by type and interest.</p>
              </div>
            </div>
            <div class="category-row" role="group" aria-label="Filter places by category">
              <button
                v-for="cat in categoryOptions"
                :key="cat.name"
                class="category-chip"
                :class="{ 'chip-active': selectedCategory === cat.name }"
                type="button"
                :aria-pressed="selectedCategory === cat.name"
                @click="selectCategory(cat.name)"
              >
                <ion-icon :icon="cat.icon" aria-hidden="true"></ion-icon>{{ cat.name }}
              </button>
            </div>
          </section>

          <section class="exp-section">
            <div class="exp-section-header exp-listing-header">
              <div>
                <h2 class="exp-section-title">
                  {{ selectedCategory === 'Adventure & Outdoor Activities' ? 'Activities' : selectedCategory === 'All Places' ? 'All Places in Calapan City' : selectedCategory }}
                </h2>
                <p v-if="selectedCategory === 'All Places'" class="exp-section-sub exp-allplaces-desc">
                  Discover beaches, cafés, parks, heritage sites, and more in Calapan City.
                </p>
              </div>
              <span class="exp-count">
                {{ selectedCategory === 'All Places' ? filteredAllPlaces.length : filteredCategoryListings.length }}
                {{ selectedCategory === 'Adventure & Outdoor Activities' ? 'activities' : selectedCategory === 'All Places' ? 'places' : 'items' }}
              </span>
            </div>
            <div class="dest-deck exp-dest-deck" role="list" aria-label="Places">
              <article
                v-for="listing in selectedCategory === 'All Places' ? filteredAllPlaces : filteredCategoryListings"
                :key="`${listing.category ?? selectedCategory}-${listing.name}`"
                class="app-list-card dest-list-card"
                role="listitem"
              >
                <button type="button" class="dest-list-image" :aria-label="`Open ${listing.name}`" @click="openListing(listing)">
                  <img
                    v-if="listingImage(listing)"
                    :src="listingImage(listing)"
                    :alt="listing.image ? listing.name : getListingDestination(listing)?.imageAlt || listing.name"
                    loading="lazy"
                    @error="markListingImageFailed(listing)"
                  />
                  <div v-else class="dest-list-fallback"><ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon></div>
                  <span class="dest-list-badge">{{ listingCategory(listing) }}</span>
                </button>
                <button
                  type="button"
                  class="dest-list-fav"
                  data-instant-action
                  :aria-label="`${isListingSaved(listing) ? 'Remove' : 'Save'} ${listing.name}`"
                  :aria-pressed="isListingSaved(listing)"
                  :class="{ saved: isListingSaved(listing) }"
                  @click.stop="toggleListingSaved(listing)"
                >
                  <ion-icon :icon="isListingSaved(listing) ? heart : heartOutline" aria-hidden="true"></ion-icon>
                </button>
                <div class="dest-list-body">
                  <strong class="dest-list-title">{{ listing.name }}</strong>
                  <p class="dest-list-location">
                    <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                    <span>{{ listingLocation(listing).value }}</span>
                  </p>
                  <p class="dest-list-meta">
                    <span class="dest-list-distance">
                      <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                      {{ listingDistance(listing).km }} away
                    </span>
                    <span class="dest-list-distance">
                      <ion-icon :icon="timeOutline" aria-hidden="true"></ion-icon>
                      {{ listingDistance(listing).minutes }} travel
                    </span>
                  </p>
                  <p class="dest-list-desc">{{ listingAbout(listing) }}</p>
                  <div class="dest-list-actions">
                    <button type="button" class="dest-list-open" @click="openListing(listing)">
                      View Details <ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon>
                    </button>
                    <a class="dest-list-open dest-list-dir" :href="listingDirectionUrl(listing)" target="_blank" rel="noopener" aria-label="Directions">
                      <ion-icon :icon="navigateOutline" aria-hidden="true"></ion-icon> Direction
                    </a>
                  </div>
                </div>
              </article>
            </div>
            <div v-if="selectedCategory !== 'All Places' && filteredCategoryListings.length === 0" class="exp-empty">
              <ion-icon :icon="compassOutline"></ion-icon>
              <p>No matching places found. Try a different search or category.</p>
            </div>
            <div v-else-if="selectedCategory === 'All Places' && filteredAllPlaces.length === 0" class="exp-empty">
              <ion-icon :icon="compassOutline"></ion-icon>
              <p>No destinations found. Try clearing your search.</p>
            </div>
          </section>

          <div class="exp-spacer"></div>
        </div>

        <RideBottomNav active="explore" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.exp-app {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.exp-header {
  background: linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-soft) 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.exp-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.exp-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.exp-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
}

.exp-brand :deep(.brand-wordmark) {
  width: 76px;
}

.exp-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exp-action-btn {
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

.exp-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exp-greet-line {
  color: var(--brand-accent);
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.exp-greet-title {
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  font-family: var(--font-display);
  line-height: 1.15;
}

.exp-greet-sub {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.exp-content {
  padding: 18px 18px 0;
  max-width: 100%;
}

.exp-search-section {
  margin-bottom: 22px;
}

.exp-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: none;
  min-height: 60px;
  padding: 10px 18px 10px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  margin-bottom: 12px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.exp-search:focus-within { border-color: var(--brand-accent); box-shadow: var(--shadow-lg); }
.exp-search .search-glyph, .exp-search ion-icon { color: var(--text-secondary); font-size: 20px; flex-shrink: 0; }
.exp-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--text-primary); font-size: 15px; }
.exp-search input::placeholder { color: var(--text-muted); }

.exp-search input::placeholder {
  color: var(--text-muted);
}

.exp-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.exp-quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  color: var(--text-strong);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.exp-quick-btn:active {
  transform: scale(0.97);
  background: var(--surface-soft);
}

.exp-quick-btn ion-icon {
  color: var(--brand);
  font-size: 20px;
}

.exp-status {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 8px 0 0 0;
}

.exp-section {
  margin-bottom: 18px;
}

.exp-section-title {
  color: var(--text-strong);
  font-size: 21px;
  font-weight: 600;
  margin: 0 0 14px 0;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
}

.exp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.exp-section-header .exp-section-title {
  margin: 0;
}

.exp-section-sub {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
  margin: 4px 0 0;
}

.exp-listing-header {
  align-items: flex-start;
  gap: 12px;
}

.exp-allplaces-desc {
  max-width: 56ch;
  font-size: 13px;
}

.exp-count {
  color: var(--text-secondary);
  font-size: 13px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.category-row {
  display: flex;
  gap: 8px;
  margin: 0 -2px;
  padding: 2px 2px 5px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.category-row::-webkit-scrollbar { display: none; }

.category-chip {
  display: inline-flex;
  min-height: 37px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-body);
  cursor: pointer;
  font-size: 11px;
  font-weight: 650;
  transition: border-color .18s ease, background .18s ease, color .18s ease, transform .18s ease;
}

.category-chip ion-icon { font-size: 15px; }
.category-chip:hover { transform: translateY(-1px); }
.category-chip.chip-active {
  border-color: #285b4c;
  background: #285b4c;
  box-shadow: 0 4px 10px rgb(40 91 76 / 18%);
  color: #fff;
}

.exp-dest-deck {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin: 0 -18px;
  padding: 6px 18px 18px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 18px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.exp-dest-deck::-webkit-scrollbar { display: none; }
.app-list-card,.dest-list-card { position: relative; display: flex; width: clamp(272px, 82vw, 324px); flex: 0 0 auto; flex-direction: column; align-self: stretch; overflow: hidden; scroll-snap-align: start; border: 1px solid var(--border); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-sm); transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast); }
.dest-list-card:hover { border-color: color-mix(in srgb, var(--brand-accent) 18%, var(--border)); box-shadow: var(--shadow-md); }
.dest-list-card:active { transform: scale(0.99); }
.dest-list-image { position: relative; width: 100%; height: 176px; flex-shrink: 0; padding: 0; overflow: hidden; border: 0; background: var(--surface-muted); cursor: pointer; }
.dest-list-image::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, rgba(9,26,18,.34) 100%); pointer-events: none; }
.dest-list-image img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 400ms ease; }
.dest-list-card:hover .dest-list-image img { transform: scale(1.04); }
.dest-list-fallback { display: grid; width: 100%; height: 100%; place-items: center; color: var(--brand-accent); font-size: 38px; }
.dest-list-body { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: 8px; padding: 16px 16px 18px; }
.dest-list-title { display: -webkit-box; overflow: hidden; margin: 0; min-height: 2.4em; color: var(--text-strong); font-family: var(--font-display); font-size: 19px; font-weight: 600; letter-spacing: -.015em; line-height: 1.2; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.dest-list-location { display: flex; align-items: flex-start; gap: 6px; margin: 0; color: var(--text-secondary); font-size: 12.5px; line-height: 1.45; overflow-wrap: anywhere; }
.dest-list-location ion-icon { flex-shrink: 0; margin-top: 2px; color: var(--brand-accent); font-size: 15px; }
.dest-list-location span { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.dest-list-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; margin: 0; }
.dest-list-distance { display: inline-flex; align-items: center; gap: 4px; color: var(--text-strong); font-size: 12px; font-weight: 700; }
.dest-list-distance ion-icon { color: var(--brand-accent); font-size: 14px; }
.dest-list-distance.is-muted { color: var(--text-secondary); font-weight: 600; }
.dest-list-desc { display: -webkit-box; overflow: hidden; margin: 0; min-height: 4.35em; color: var(--text-secondary); font-size: 12.5px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.dest-list-badge { position: absolute; top: 12px; left: 12px; z-index: 2; display: inline-flex; max-width: calc(100% - 76px); overflow: hidden; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,.9); color: var(--brand-accent); font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; backdrop-filter: blur(8px); }
.dest-list-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; width: 100%; }
.dest-list-open { display: inline-flex; align-items: center; align-self: flex-start; gap: 5px; padding: 8px 13px; border: 1px solid color-mix(in srgb, var(--brand-accent) 14%, var(--border)); border-radius: 999px; background: var(--surface-soft); color: var(--brand-accent); font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; }
.dest-list-dir { margin-left: auto; background: var(--brand); border-color: var(--brand); color: var(--on-brand, #fff); }
.dest-list-open ion-icon { font-size: 14px; }
.dest-list-fav { position: absolute; top: 12px; right: 12px; z-index: 3; display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid var(--border); border-radius: 50%; background: rgba(255,255,255,.92); color: var(--text-secondary); font-size: 20px; cursor: pointer; box-shadow: var(--shadow-xs); }
.dest-list-fav.saved { border-color: var(--brand); background: var(--brand); color: var(--on-brand); }

.exp-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
}

.exp-empty ion-icon {
  font-size: 40px;
  color: var(--border);
}

.exp-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .exp-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .exp-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
