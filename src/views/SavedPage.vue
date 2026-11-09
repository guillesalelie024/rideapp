<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue';
import { IonContent, IonIcon, IonPage, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, onIonViewWillEnter } from '@ionic/vue';
import { addOutline, albumsOutline, bookmarkOutline, calendarOutline, chevronDownOutline, closeOutline, createOutline, funnelOutline, heart, listOutline, locationOutline, mapOutline, navigateOutline, searchOutline, star, trashOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestination } from '../data/destinations';
import { detectCurrentLocation, loadCachedCurrentLocation, type CurrentLocation } from '../data/currentLocation';
import { ITINERARY_DRAFT_KEY, loadItinerary, saveItinerary, createEmptyItinerary, type Itinerary } from '../data/itinerary';

import { getRideSession } from '../data/api';
import { showError, showSuccess } from '../composables/feedback';
import { SAVED_PLACES_UPDATED_EVENT, type SavedCollectionRecord, type SavedPlaceView, createCollection, directionsForSaved, ensurePlaceForItinerary, getAllSavedViews, haversineKm, loadCollectionPlaces, loadCollections, removeCollection, syncSavedFromAccount, togglePlaceInCollection, toggleSavedPlace, updateCollectionName } from '../data/savedPlaces';

type ViewMode = 'list' | 'map'; type SortMode = 'recent' | 'az' | 'rating' | 'nearest';
type MapTile = { key: string; left: number; top: number; url: string };
type MapMarker = { place: SavedPlaceView & { latitude: number; longitude: number }; left: number; top: number; number: number };
const router = useRouter();
const loading = ref(true); const loadError = ref(''); const viewMode = ref<ViewMode>('list'); const search = ref(''); const selectedCategory = ref('All'); const selectedCollectionId = ref(''); const sortMode = ref<SortMode>('recent');
const places = ref<SavedPlaceView[]>([]); const collections = ref<SavedCollectionRecord[]>([]); const collectionPlaces = ref<Record<string, string[]>>({});
const currentLocation = ref<CurrentLocation | null>(loadCachedCurrentLocation()); const locationBusy = ref(false); const locationDenied = ref(false); const locationError = ref('');
const removeConfirm = ref<SavedPlaceView | null>(null); const collectionFormOpen = ref(false); const collectionFormMode = ref<'create' | 'rename'>('create'); const collectionFormName = ref(''); const collectionEditingId = ref('');
const assignOpen = ref(false); const assignPlaceId = ref('');
const failedImages = ref<Record<string, boolean>>({}); const mapEl = ref<HTMLElement | null>(null); const mapWidth = ref(360); const mapHeight = 320; const mapZoom = ref(14); const selectedMapId = ref(''); let mapObserver: ResizeObserver | undefined;
const sortOptions: Array<{ value: SortMode; label: string }> = [{ value: 'recent', label: 'Recently Saved' }, { value: 'az', label: 'Alphabetical (A–Z)' }, { value: 'rating', label: 'Highest Rated' }, { value: 'nearest', label: 'Nearest to Me' }];
function normalizeCategory(category: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('beach') || c.includes('island') || c.includes('marine')) return 'Beaches';
  if (c.includes('adventure') || c.includes('outdoor') || c.includes('waterpark') || c.includes('swim')) return 'Adventure';
  if (c.includes('nature') || c.includes('park') || c.includes('eco') || c.includes('farm') || c.includes('sanctuar')) return 'Nature';
  if (c.includes('restaurant') || c.includes('eatery') || c.includes('food')) return 'Restaurants';
  if (c.includes('cafe') || c.includes('coffee')) return 'Cafés';
  if (c.includes('hotel') || c.includes('accommodation') || c.includes('resort')) return 'Hotels';
  if (c.includes('histor') || c.includes('heritage') || c.includes('museum') || c.includes('church') || c.includes('religious') || c.includes('cultural')) return 'Historical Sites';
  return 'Other';
}
const categoryFilters = computed(() => { const set = new Set(places.value.map((p) => normalizeCategory(p.category))); const preferred = ['Beaches', 'Adventure', 'Nature', 'Restaurants', 'Cafés', 'Hotels', 'Historical Sites', 'Other']; return ['All', ...preferred.filter((c) => set.has(c))]; });
const locationHeadline = computed(() => {
  if (locationBusy.value) return 'Finding your location…';
  if (currentLocation.value) return currentLocation.value.label;
  if (locationError.value || locationDenied.value) return 'Location unavailable';
  return 'Tap to share your location';
});
const locationDetail = computed(() => {
  if (locationBusy.value) return 'Using your device GPS';
  if (currentLocation.value) {
    const accuracy = currentLocation.value.accuracyMeters;
    if (accuracy !== null && accuracy > 0) {
      const accuracyLabel = accuracy >= 1000 ? `${(accuracy / 1000).toFixed(1)} km` : `${Math.round(accuracy)} m`;
      return `Accurate to about ${accuracyLabel}. Tap to update.`;
    }
    return 'Based on your device GPS. Tap to update.';
  }
  if (locationError.value) return locationError.value;
  return 'Allow location access to sort by distance and show where you are.';
});
function distanceKm(place: SavedPlaceView): number | null { if (!currentLocation.value || typeof place.latitude !== 'number' || typeof place.longitude !== 'number') return null; return haversineKm({ latitude: currentLocation.value.latitude, longitude: currentLocation.value.longitude }, { latitude: place.latitude, longitude: place.longitude }); }
function distanceLabel(place: SavedPlaceView): string { const km = distanceKm(place); if (km == null) return ''; return km < 1 ? Math.round(km * 1000) + ' m away' : km.toFixed(km < 10 ? 1 : 0) + ' km away'; }
const filteredPlaces = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = places.value.filter((place) => {
    if (selectedCollectionId.value && !(collectionPlaces.value[selectedCollectionId.value] ?? []).includes(place.id)) return false;
    if (selectedCategory.value !== 'All' && normalizeCategory(place.category) !== selectedCategory.value) return false;
    if (!q) return true;
    const collectionNames = collections.value.filter((c) => (collectionPlaces.value[c.id] ?? []).includes(place.id)).map((c) => c.name).join(' ');
    return `${place.name} ${place.address} ${place.category} ${collectionNames}`.toLowerCase().includes(q);
  });
  const sorted = [...list];
  if (sortMode.value === 'az') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode.value === 'rating') sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name));
  else if (sortMode.value === 'nearest') sorted.sort((a, b) => (distanceKm(a) ?? Number.POSITIVE_INFINITY) - (distanceKm(b) ?? Number.POSITIVE_INFINITY) || a.name.localeCompare(b.name));
  else sorted.sort((a, b) => Date.parse(b.savedAt || '') - Date.parse(a.savedAt || ''));
  return sorted;
});
const mapPlaces = computed(() => filteredPlaces.value.filter((p): p is SavedPlaceView & { latitude: number; longitude: number } => typeof p.latitude === 'number' && typeof p.longitude === 'number' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)));
const selectedMapPlace = computed(() => mapPlaces.value.find((p) => p.id === selectedMapId.value) ?? mapPlaces.value[0] ?? null);
function worldPoint(lat: number, lon: number) { const scale = 256 * (2 ** mapZoom.value); const sin = Math.sin((lat * Math.PI) / 180); return { x: ((lon + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale }; }
function tileUrl(x: number, y: number) { const count = 2 ** mapZoom.value; const wx = ((x % count) + count) % count; return `https://tile.openstreetmap.org/${mapZoom.value}/${wx}/${y}.png`; }
const mapTiles = computed<MapTile[]>(() => {
  const centerPlace = selectedMapPlace.value ?? (currentLocation.value ? { latitude: currentLocation.value.latitude, longitude: currentLocation.value.longitude } : null);
  if (!centerPlace) return [];
  const center = worldPoint(centerPlace.latitude, centerPlace.longitude); const minX = Math.floor((center.x - mapWidth.value / 2) / 256) - 1, maxX = Math.floor((center.x + mapWidth.value / 2) / 256) + 1, minY = Math.floor((center.y - mapHeight / 2) / 256) - 1, maxY = Math.floor((center.y + mapHeight / 2) / 256) + 1;
  const tiles: MapTile[] = []; for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) { if (y < 0 || y >= 2 ** mapZoom.value) continue; tiles.push({ key: `${mapZoom.value}:${x}:${y}`, left: x * 256 - center.x + mapWidth.value / 2, top: y * 256 - center.y + mapHeight / 2, url: tileUrl(x, y) }); } return tiles;
});
const mapMarkers = computed<MapMarker[]>(() => {
  const centerPlace = selectedMapPlace.value ?? (currentLocation.value ? { latitude: currentLocation.value.latitude, longitude: currentLocation.value.longitude } : null);
  if (!centerPlace) return [];
  const center = worldPoint(centerPlace.latitude, centerPlace.longitude);
  return mapPlaces.value.map((place, i) => { const p = worldPoint(place.latitude, place.longitude); return { place, left: p.x - center.x + mapWidth.value / 2, top: p.y - center.y + mapHeight / 2, number: i + 1 }; }).filter((m) => m.left > 8 && m.left < mapWidth.value - 8 && m.top > 8 && m.top < mapHeight - 8);
});
const userPin = computed(() => {
  if (!currentLocation.value) return null;
  const centerPlace = selectedMapPlace.value ?? { latitude: currentLocation.value.latitude, longitude: currentLocation.value.longitude };
  const center = worldPoint(centerPlace.latitude, centerPlace.longitude); const p = worldPoint(currentLocation.value.latitude, currentLocation.value.longitude);
  return { left: p.x - center.x + mapWidth.value / 2, top: p.y - center.y + mapHeight / 2 };
});
function collectionCover(col: SavedCollectionRecord): SavedPlaceView | undefined { return places.value.find((p) => p.id === col.coverPlaceId) ?? getAllSavedViews().find((p) => p.id === col.coverPlaceId); }
async function refreshAll(syncRemote = false) {
  loading.value = true; loadError.value = '';
  try { if (syncRemote && getRideSession()) await syncSavedFromAccount(); places.value = getAllSavedViews(); collections.value = loadCollections(); collectionPlaces.value = loadCollectionPlaces(); }
  catch (e) { loadError.value = e instanceof Error ? e.message : 'Saved places could not be loaded.'; }
  finally { loading.value = false; }
}
async function refreshLocation(force = true) {
  if (locationBusy.value) return; locationBusy.value = true; locationDenied.value = false; locationError.value = '';
  try { currentLocation.value = await detectCurrentLocation(force); }
  catch (e) {
    locationDenied.value = true;
    locationError.value = e instanceof Error ? e.message : 'Location permission is needed for distance and nearest sorting.';
    if (force) showError(locationError.value);
  }
  finally { locationBusy.value = false; }
}
function openPlace(place: SavedPlaceView) {
  const destination = getRideDestination(place.id);
  router.push(destination ? { name: 'DestinationDetails', params: { id: place.id } } : { name: 'DestinationDetails', params: { id: place.id }, query: { name: place.name, category: place.category, ...(place.note ? { note: place.note } : {}) } });
}
function requestRemove(place: SavedPlaceView) { removeConfirm.value = place; }
function confirmRemove() { const place = removeConfirm.value; if (!place) return; try { toggleSavedPlace(place.id); showSuccess(`${place.name} removed from saved places.`); } catch { showError('Could not update saved places.'); } removeConfirm.value = null; void refreshAll(false); }
function openCreateCollection() { collectionFormMode.value = 'create'; collectionFormName.value = ''; collectionEditingId.value = ''; collectionFormOpen.value = true; }
function openRenameCollection(c: SavedCollectionRecord) { collectionFormMode.value = 'rename'; collectionFormName.value = c.name; collectionEditingId.value = c.id; collectionFormOpen.value = true; }
async function submitCollectionForm() { try { if (collectionFormMode.value === 'rename') await updateCollectionName(collectionEditingId.value, collectionFormName.value); else await createCollection(collectionFormName.value); showSuccess(collectionFormMode.value === 'rename' ? 'Collection updated.' : 'Collection created.'); collectionFormOpen.value = false; await refreshAll(false); } catch (e) { showError(e instanceof Error ? e.message : 'Collection could not be saved.'); } }
async function deleteCollectionAsk(c: SavedCollectionRecord) { if (!window.confirm(`Delete "${c.name}"? Saved places will remain in your favorites.`)) return; try { await removeCollection(c.id); if (selectedCollectionId.value === c.id) selectedCollectionId.value = ''; showSuccess('Collection deleted.'); await refreshAll(false); } catch { showError('Collection could not be deleted.'); } }
function openAssign(placeId: string) { assignPlaceId.value = placeId; assignOpen.value = true; }
function placeInCollection(collectionId: string, placeId: string) { return (collectionPlaces.value[collectionId] ?? []).includes(placeId); }
async function assignToggle(collectionId: string) { try { await togglePlaceInCollection(collectionId, assignPlaceId.value); await refreshAll(false); } catch { showError('Collection could not be updated.'); } }
function openItinerary(place: SavedPlaceView) {
  const { stopId, curated } = ensurePlaceForItinerary(place);
  try {
    const draft = loadItinerary(ITINERARY_DRAFT_KEY) ?? createEmptyItinerary();
    if (!draft.stopIds.includes(stopId)) addStopToItinerary(draft, stopId, curated);
    saveItinerary(ITINERARY_DRAFT_KEY, draft);
    void router.push({ name: 'ItineraryPlanner' });
  } catch (e) {
    showError(e instanceof Error ? e.message : 'Could not open itinerary.');
  }
}
function addStopToItinerary(it: Itinerary, stopId: string, curated?: { name: string; category: string; note?: string }) { if (it.stopIds.includes(stopId)) return false; it.stopIds = [...it.stopIds, stopId]; if (curated) { it.curatedStops ??= {}; it.curatedStops[stopId] = curated; } return true; }
function clearFilters() { search.value = ''; selectedCategory.value = 'All'; selectedCollectionId.value = ''; sortMode.value = 'recent'; }
function onImageError(id: string) { failedImages.value = { ...failedImages.value, [id]: true }; }
function onPlacesUpdated() { void refreshAll(false); }
watch(sortMode, (v) => { if (v === 'nearest' && !currentLocation.value) void refreshLocation(true); });
watch(mapPlaces, (list) => { if (!list.some((p) => p.id === selectedMapId.value)) selectedMapId.value = list[0]?.id ?? ''; }, { immediate: true });
function attachMapObserver() {
  if (!mapEl.value || typeof ResizeObserver === 'undefined') return;
  mapObserver?.disconnect();
  mapObserver = new ResizeObserver((e) => { mapWidth.value = Math.max(280, e[0]?.contentRect.width || mapEl.value?.clientWidth || 360); });
  mapObserver.observe(mapEl.value);
  mapWidth.value = Math.max(280, mapEl.value.clientWidth || 360);
}
watch(viewMode, async (mode) => { if (mode === 'map') { await nextTick(); attachMapObserver(); if (!currentLocation.value) void refreshLocation(false); } });
onMounted(() => { void refreshAll(true); void refreshLocation(false); window.addEventListener(SAVED_PLACES_UPDATED_EVENT, onPlacesUpdated); });
onIonViewWillEnter(() => { void refreshAll(!!getRideSession()); });
onBeforeUnmount(() => { mapObserver?.disconnect(); window.removeEventListener(SAVED_PLACES_UPDATED_EVENT, onPlacesUpdated); });
</script>

<template>
  <ion-page><ion-content :fullscreen="true"><div class="sv-app">
    <RideAppHeader eyebrow="Saved Places" title="Saved Places" subtitle="Your favorite destinations, collections, and trip ideas in one place." show-back />
    <div class="sv-content desktop-content ride-content">
      <section class="sv-toolbar home-search-style" aria-label="Search and view options">
        <form class="sv-search home-search app-search" @submit.prevent><ion-icon class="search-glyph" :icon="searchOutline" aria-hidden="true"></ion-icon><input v-model="search" type="search" placeholder="Search by name, location, category, or collection" aria-label="Search saved destinations" /></form>
        <div class="sv-toolbar-row">
          <label class="sv-select"><ion-icon :icon="funnelOutline" aria-hidden="true"></ion-icon><select v-model="sortMode" aria-label="Sort saved places"><option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select><ion-icon :icon="chevronDownOutline" class="sv-select-caret" aria-hidden="true"></ion-icon></label>
          <div class="sv-view-toggle" role="group" aria-label="View mode"><button type="button" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><ion-icon :icon="listOutline"></ion-icon><span>List</span></button><button type="button" :class="{ active: viewMode === 'map' }" @click="viewMode = 'map'"><ion-icon :icon="mapOutline"></ion-icon><span>Map</span></button></div>
        </div>
      </section>
      <section class="sv-filters" aria-label="Category filters"><div class="sv-chip-row"><button v-for="cat in categoryFilters" :key="cat" type="button" class="sv-chip" :class="{ active: selectedCategory === cat }" @click="selectedCategory = cat">{{ cat }}</button></div><button v-if="search || selectedCategory !== 'All' || selectedCollectionId || sortMode !== 'recent'" type="button" class="sv-clear" @click="clearFilters"><ion-icon :icon="closeOutline"></ion-icon> Clear filters</button></section>
      <section class="sv-section" aria-labelledby="collections-heading">
        <div class="sv-section-head"><div><p class="sv-kicker">My Collections</p><h2 id="collections-heading">Organize your favorites</h2></div><button type="button" class="sv-primary-btn sv-small-btn" @click="openCreateCollection"><ion-icon :icon="addOutline"></ion-icon> Create Collection</button></div>
        <div v-if="collections.length" class="sv-collections">
          <article v-for="col in collections" :key="col.id" class="sv-collection" :class="{ active: selectedCollectionId === col.id }">
            <button type="button" class="sv-collection-main" @click="selectedCollectionId = selectedCollectionId === col.id ? '' : col.id"><span class="sv-collection-cover"><img v-if="collectionCover(col) && (collectionCover(col)?.image || collectionCover(col)?.imageFallback) && !failedImages['c-'+col.id]" :src="collectionCover(col)?.image || collectionCover(col)?.imageFallback" :alt="col.name" @error="onImageError('c-'+col.id)" /><ion-icon v-else :icon="albumsOutline" aria-hidden="true"></ion-icon></span><span class="sv-collection-copy"><strong>{{ col.name }}</strong><span>{{ collectionPlaces[col.id]?.length ?? col.count ?? 0 }} saved place{{ (collectionPlaces[col.id]?.length ?? col.count ?? 0) === 1 ? '' : 's' }}</span></span></button>
            <div class="sv-collection-actions"><button type="button" aria-label="Rename collection" @click="openRenameCollection(col)"><ion-icon :icon="createOutline"></ion-icon></button><button type="button" aria-label="Delete collection" @click="deleteCollectionAsk(col)"><ion-icon :icon="trashOutline"></ion-icon></button></div>
          </article>
        </div>
        <div v-else class="sv-empty-card"><ion-icon :icon="albumsOutline"></ion-icon><h3>No Collections Yet!</h3><p>Create your own collections to organize your favorite destinations.</p><button type="button" class="sv-primary-btn" @click="openCreateCollection">Create Collection</button></div>
      </section>
      <section v-if="viewMode === 'map'" class="sv-section" aria-labelledby="map-heading">
        <div class="sv-section-head sv-map-head"><div><p class="sv-kicker">Map View</p><h2 id="map-heading">Saved destinations on the map</h2></div></div>
        <button type="button" class="sv-location" :class="{ 'is-error': !!locationError || locationDenied }" :disabled="locationBusy" :aria-busy="locationBusy" @click="refreshLocation(true)">
          <span class="sv-location-icon" aria-hidden="true"><ion-icon :icon="locationOutline"></ion-icon></span>
          <span class="sv-location-copy" aria-live="polite">
            <span class="sv-location-label">Your location</span>
            <strong>{{ locationHeadline }}</strong>
            <span class="sv-location-detail">{{ locationDetail }}</span>
          </span>
          <span class="sv-location-update" aria-hidden="true">{{ locationBusy ? 'Updating…' : 'Update' }}</span>
        </button>
        <p v-if="!mapPlaces.length" class="sv-note">No saved destinations with verified coordinates match your filters. Destinations without coordinates are shown in List View.</p>
        <div ref="mapEl" class="sv-map" role="region" aria-label="Map of saved destinations">
          <div class="sv-map-tiles" aria-hidden="true"><img v-for="tile in mapTiles" :key="tile.key" :src="tile.url" alt="" :style="{ left: tile.left + 'px', top: tile.top + 'px' }" loading="lazy" /></div>
          <button v-for="marker in mapMarkers" :key="marker.place.id" type="button" class="sv-marker" :class="{ active: selectedMapId === marker.place.id }" :style="{ left: marker.left + 'px', top: marker.top + 'px' }" :aria-label="marker.place.name" @click="selectedMapId = marker.place.id">{{ marker.number }}</button>
          <div v-if="userPin" class="sv-user-pin" :style="{ left: userPin.left + 'px', top: userPin.top + 'px' }" aria-hidden="true"></div>
          <article v-if="selectedMapPlace" class="sv-map-card">
            <img v-if="(selectedMapPlace.image || selectedMapPlace.imageFallback) && !failedImages[selectedMapPlace.id]" :src="selectedMapPlace.image || selectedMapPlace.imageFallback" :alt="selectedMapPlace.name" @error="onImageError(selectedMapPlace.id)" />
            <div class="sv-map-card-copy"><strong>{{ selectedMapPlace.name }}</strong><span>{{ selectedMapPlace.category }} • {{ selectedMapPlace.address }}</span><div class="sv-inline-actions"><button type="button" @click="openPlace(selectedMapPlace)">View Details</button><a :href="directionsForSaved(selectedMapPlace)" target="_blank" rel="noopener">Get Directions</a></div></div>
          </article>
          <div v-else class="sv-map-empty">Save destinations with verified location data to see them here.</div>
        </div>
        <p class="sv-attrib">Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</p>
      </section>
      <section class="sv-section" aria-labelledby="saved-heading">
        <div class="sv-section-head"><div><p class="sv-kicker">Saved Destinations</p><h2 id="saved-heading">{{ filteredPlaces.length }} place{{ filteredPlaces.length === 1 ? '' : 's' }}</h2></div></div>
        <div v-if="loading" class="sv-deck" aria-hidden="true"><article v-for="n in 4" :key="n" class="sv-card sv-skeleton"><div class="sv-skel-img"></div><div class="sv-skel-line"></div><div class="sv-skel-line short"></div></article></div>
        <div v-else-if="loadError" class="sv-empty-card"><h3>Could not load saved places</h3><p>{{ loadError }}</p><button type="button" class="sv-primary-btn" @click="refreshAll(true)">Retry</button></div>
        <div v-else-if="!places.length" class="sv-empty-card"><ion-icon :icon="bookmarkOutline"></ion-icon><h3>No Saved Places Yet!</h3><p>Start saving your favorite destinations and plan your next adventure with RIDE.</p><button type="button" class="sv-primary-btn" @click="router.push('/explore')">Explore Destinations</button></div>
        <div v-else-if="!filteredPlaces.length" class="sv-empty-card"><h3>No matching destinations</h3><p>Try a different search, category, collection, or sort option.</p><button type="button" class="sv-primary-btn" @click="clearFilters">Clear filters</button></div>
        <div v-else class="sv-deck-wrap">
          <div class="sv-deck" role="list" aria-label="Saved destinations">
            <article v-for="place in filteredPlaces" :key="place.id" class="sv-card" role="listitem">
              <button type="button" class="sv-card-image" @click="openPlace(place)">
                <img v-if="(place.image || place.imageFallback) && !failedImages[place.id]" :src="place.image || place.imageFallback" :alt="place.name" loading="lazy" decoding="async" @error="onImageError(place.id)" />
                <div v-else class="sv-img-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                <span class="sv-badge">{{ place.category }}</span>
              </button>
              <button type="button" class="sv-heart" aria-label="Remove from saved places" @click="requestRemove(place)"><ion-icon :icon="heart"></ion-icon></button>
              <div class="sv-card-body">
                <div class="sv-card-top"><h3>{{ place.name }}</h3><span v-if="place.rating" class="sv-rating"><ion-icon :icon="star"></ion-icon>{{ place.rating.toFixed(1) }}<small v-if="place.reviewCount">({{ place.reviewCount }})</small></span></div>
                <p class="sv-address"><ion-icon :icon="locationOutline"></ion-icon><span>{{ place.address }}</span></p>
                <p v-if="distanceLabel(place)" class="sv-distance"><ion-icon :icon="navigateOutline"></ion-icon>{{ distanceLabel(place) }}</p>
                <p v-else-if="sortMode === 'nearest' && !currentLocation" class="sv-distance muted">Location permission needed for distance</p>
                <div class="sv-card-actions">
                  <button type="button" class="sv-action primary" @click="openPlace(place)">View Details</button>
                  <button type="button" class="sv-action" @click="openItinerary(place)"><ion-icon :icon="calendarOutline"></ion-icon>Itinerary</button>
                  <a class="sv-action" :href="directionsForSaved(place)" target="_blank" rel="noopener"><ion-icon :icon="navigateOutline"></ion-icon>Directions</a>
                  <button type="button" class="sv-action" @click="openAssign(place.id)"><ion-icon :icon="albumsOutline"></ion-icon>Collections</button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
    <div v-if="removeConfirm" class="sv-backdrop" @click.self="removeConfirm = null"><div class="sv-dialog" role="alertdialog" aria-modal="true" aria-labelledby="remove-title"><h3 id="remove-title">Remove saved place?</h3><p>Remove <strong>{{ removeConfirm.name }}</strong> from your saved places? It will also be removed from collections.</p><div class="sv-dialog-actions"><button type="button" class="sv-secondary-btn" @click="removeConfirm = null">Cancel</button><button type="button" class="sv-danger-btn" @click="confirmRemove">Remove</button></div></div></div>
    <ion-modal :is-open="collectionFormOpen" @didDismiss="collectionFormOpen = false"><ion-header><ion-toolbar><ion-title>{{ collectionFormMode === 'rename' ? 'Rename Collection' : 'New Collection' }}</ion-title><ion-buttons slot="end"><ion-button @click="collectionFormOpen = false">Close</ion-button></ion-buttons></ion-toolbar></ion-header><ion-content class="ion-padding"><label class="sv-field"><span>Collection name</span><input v-model="collectionFormName" type="text" maxlength="80" placeholder="e.g. Beach Getaways" /></label><button type="button" class="sv-primary-btn sv-full" @click="submitCollectionForm">{{ collectionFormMode === 'rename' ? 'Save Changes' : 'Create Collection' }}</button></ion-content></ion-modal>
    <ion-modal :is-open="assignOpen" @didDismiss="assignOpen = false"><ion-header><ion-toolbar><ion-title>Add to Collections</ion-title><ion-buttons slot="end"><ion-button @click="assignOpen = false">Done</ion-button></ion-buttons></ion-toolbar></ion-header><ion-content class="ion-padding"><p v-if="!collections.length" class="sv-note">Create a collection first to organize this place.</p><button v-for="col in collections" :key="col.id" type="button" class="sv-pick-row" @click="assignToggle(col.id)"><span><strong>{{ col.name }}</strong><small>{{ collectionPlaces[col.id]?.length ?? 0 }} places</small></span><span class="sv-pick-check" :class="{ active: placeInCollection(col.id, assignPlaceId) }">{{ placeInCollection(col.id, assignPlaceId) ? 'Added' : 'Add' }}</span></button><button type="button" class="sv-secondary-btn sv-full" @click="openCreateCollection(); assignOpen = false">Create New Collection</button></ion-content></ion-modal>

    <RideBottomNav active="saved" />
  </div></ion-content></ion-page>
</template>

<style scoped>
.sv-app { min-height: 100%; padding-bottom: calc(108px + env(safe-area-inset-bottom)); background: var(--bg); color: var(--text-primary); }
.sv-content.desktop-content, .sv-content.ride-content, .sv-content { display: grid; gap: 16px; width: 100%; max-width: none; margin: 0; padding: 16px max(16px, env(safe-area-inset-right)) 16px max(16px, env(safe-area-inset-left)); box-sizing: border-box; }
.sv-toolbar, .sv-section { display: grid; gap: 12px; }
.sv-map-head { margin-bottom: 0; }
.sv-location { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border: 1px solid var(--border); border-radius: 20px; background: linear-gradient(180deg, var(--surface), var(--surface-soft)); box-shadow: var(--shadow-sm); color: var(--text-primary); text-align: left; cursor: pointer; transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
.sv-location:active { transform: scale(.995); }
.sv-location.is-error { border-color: color-mix(in srgb, var(--danger) 24%, var(--border)); }
.sv-location:disabled { cursor: progress; opacity: .92; }
.sv-location-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 14px; background: var(--brand-soft); color: var(--brand-deep); font-size: 20px; flex: 0 0 auto; }
.sv-location.is-error .sv-location-icon { background: color-mix(in srgb, var(--danger) 12%, var(--surface)); color: var(--danger); }
.sv-location-copy { display: grid; gap: 2px; min-width: 0; flex: 1; }
.sv-location-label { color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.sv-location-copy strong { color: var(--text-strong); font: 600 16px/1.25 var(--font-display); overflow-wrap: anywhere; }
.sv-location-detail { color: var(--text-secondary); font-size: 12px; line-height: 1.35; }
.sv-location-update { padding: 8px 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface); color: var(--brand-deep); font-size: 12px; font-weight: 700; white-space: nowrap; }
.sv-search.home-search, .sv-select, .sv-field input { display:flex; align-items:center; gap:12px; width:100%; max-width:none; min-height: 60px; padding: 10px 18px 10px 20px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-md); color: var(--text-primary); transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.sv-search.home-search:focus-within { border-color: var(--brand-accent); box-shadow: var(--shadow-lg); }
.sv-search.home-search .search-glyph { color: var(--text-secondary); font-size: 20px; flex-shrink: 0; }
.sv-search.home-search input { flex:1; min-width:0; border:0; background:transparent; color: var(--text-primary); font-size: 15px; outline:none; }
.sv-search.home-search input::placeholder { color: var(--text-muted); }
.sv-select select, .sv-field input { flex:1; min-width:0; border:0; background:transparent; color: var(--text-primary); font: inherit; outline:none; }
.sv-select, .sv-field input { gap:10px; min-height:48px; padding: 0 14px; border-radius:16px; box-shadow: var(--shadow-sm); }
.sv-toolbar-row { display:flex; gap:10px; align-items:stretch; flex-wrap: wrap; }
.sv-select { position:relative; flex:1 1 220px; }
.sv-select-caret { position:absolute; right:12px; pointer-events:none; color: var(--text-secondary); }
.sv-view-toggle { display:flex; padding:4px; border:1px solid var(--border); border-radius:16px; background: var(--surface-soft); }
.sv-view-toggle button { display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:0 12px; border:0; border-radius:12px; background:transparent; color: var(--text-secondary); font: 600 13px/1 var(--font-body); }
.sv-view-toggle button.active { background: var(--surface); color: var(--brand); box-shadow: var(--shadow-xs); }
.sv-filters { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
.sv-chip-row { display:flex; gap:8px; overflow:auto; padding-bottom:2px; scrollbar-width:none; max-width:100%; }
.sv-chip { flex:0 0 auto; min-height:38px; padding:0 14px; border:1px solid var(--border); border-radius:999px; background: var(--surface); color: var(--text-body); font: 600 13px/1 var(--font-body); }
.sv-chip.active { border-color: color-mix(in srgb, var(--brand) 30%, var(--border)); background: var(--brand-soft); color: var(--brand-deep); }
.sv-clear, .sv-secondary-btn, .sv-primary-btn, .sv-danger-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:42px; padding:0 14px; border-radius:14px; font: 700 13px/1 var(--font-body); cursor:pointer; }
.sv-clear, .sv-secondary-btn { border:1px solid var(--border); background: var(--surface); color: var(--text-body); }
.sv-primary-btn { border:0; background: var(--brand); color: var(--on-brand); box-shadow: var(--shadow-sm); }
.sv-danger-btn { border:0; background: var(--danger); color: #fff; }
.sv-small-btn { min-height:38px; padding:0 12px; font-size:12px; }
.sv-full { width:100%; margin-top:14px; }
.sv-section-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; }
.sv-kicker { margin:0 0 4px; color: var(--brand-accent); font: 800 10px/1 var(--font-body); letter-spacing:.14em; text-transform:uppercase; }
.sv-section-head h2 { margin:0; color: var(--text-strong); font: 600 22px/1.15 var(--font-display); }
.sv-collections { display:grid; gap:10px; }
.sv-collection { display:flex; align-items:center; gap:10px; padding:10px; border:1px solid var(--border); border-radius:18px; background: var(--surface); box-shadow: var(--shadow-xs); }
.sv-collection.active { border-color: color-mix(in srgb, var(--brand) 35%, var(--border)); background: color-mix(in srgb, var(--brand-soft) 55%, var(--surface)); }
.sv-collection-main { display:flex; align-items:center; gap:12px; flex:1; min-width:0; border:0; padding:0; background:transparent; color:inherit; text-align:left; cursor:pointer; }
.sv-collection-cover { display:grid; place-items:center; width:54px; height:54px; flex:none; overflow:hidden; border-radius:14px; background: var(--brand-soft); color: var(--brand); font-size:24px; }
.sv-collection-cover img { width:100%; height:100%; object-fit:cover; }
.sv-collection-copy { display:grid; gap:3px; min-width:0; }
.sv-collection-copy strong { color: var(--text-strong); font-size:14px; }
.sv-collection-copy span { color: var(--text-secondary); font-size:12px; }
.sv-collection-actions { display:flex; gap:6px; }
.sv-collection-actions button { display:grid; place-items:center; width:36px; height:36px; border:1px solid var(--border); border-radius:12px; background: var(--surface-soft); color: var(--text-body); cursor:pointer; }
.sv-deck-wrap { margin: 0 -16px; }
.sv-deck { display:flex; gap:14px; overflow-x:auto; padding: 4px 16px 14px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling: touch; }
.sv-deck::-webkit-scrollbar { height: 8px; }
.sv-deck::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--border-strong) 80%, transparent); border-radius: 999px; }
.sv-card { position:relative; flex: 0 0 min(84vw, 330px); scroll-snap-align:start; overflow:hidden; border:1px solid var(--border); border-radius:22px; background: var(--surface); box-shadow: var(--shadow-sm); }
.sv-card-image { position:relative; display:block; width:100%; padding:0; border:0; background: var(--surface-muted); height: 184px; cursor:pointer; }
.sv-card-image img, .sv-img-fallback { display:block; width:100%; height:100%; object-fit:cover; }
.sv-img-fallback { display:grid; place-items:center; color: var(--brand-accent); font-size:34px; background: var(--brand-soft); }
.sv-badge { position:absolute; left:12px; bottom:12px; padding:6px 10px; border-radius:999px; background: rgba(18,61,44,.72); color:#fff; font: 700 11px/1 var(--font-body); max-width: calc(100% - 24px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sv-heart { position:absolute; top:12px; right:12px; z-index:2; display:grid; place-items:center; width:40px; height:40px; border:0; border-radius:999px; background: rgba(255,255,255,.92); color: #d94b4b; box-shadow: var(--shadow-sm); cursor:pointer; }
html.dark .sv-heart { background: rgba(24,51,39,.92); }
.sv-card-body { display:grid; gap:8px; padding:14px; }
.sv-card-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
.sv-card-top h3 { margin:0; color: var(--text-strong); font: 600 18px/1.2 var(--font-display); }
.sv-rating { display:inline-flex; align-items:center; gap:4px; color: var(--accent-strong); font: 700 12px/1 var(--font-body); white-space:nowrap; }
.sv-rating small { color: var(--text-secondary); font-weight:600; }
.sv-address, .sv-distance { display:flex; align-items:flex-start; gap:6px; margin:0; color: var(--text-secondary); font-size:13px; line-height:1.45; }
.sv-address span { min-width: 0; }
.sv-address ion-icon, .sv-distance ion-icon { flex:none; margin-top:2px; color: var(--brand-accent); }
.sv-distance.muted { color: var(--text-muted); }
.sv-card-actions { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:8px; margin-top:6px; }
.sv-action { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-width:0; min-height:40px; padding:0 10px; border:1px solid var(--border); border-radius:12px; background: var(--surface-soft); color: var(--text-body); font: 700 12px/1.1 var(--font-body); text-decoration:none; cursor:pointer; text-align:center; }
.sv-action ion-icon { flex: none; font-size: 15px; }
.sv-action.primary { border-color: transparent; background: var(--brand-soft); color: var(--brand-deep); }
.sv-empty-card { display:grid; justify-items:center; gap:8px; padding:28px 18px; border:1px dashed var(--border-strong); border-radius:22px; background: var(--surface); text-align:center; }
.sv-empty-card > ion-icon { font-size:42px; color: var(--brand-accent); }
.sv-empty-card h3 { margin:0; color: var(--text-strong); font: 600 22px/1.2 var(--font-display); }
.sv-empty-card p, .sv-note { margin:0; color: var(--text-secondary); font-size:14px; line-height:1.5; }
.sv-map { position:relative; height:320px; overflow:hidden; border:1px solid var(--border); border-radius:22px; background: var(--surface-muted); box-shadow: var(--shadow-sm); }
.sv-map-tiles img { position:absolute; width:256px; height:256px; max-width:none; }
.sv-marker { position:absolute; transform: translate(-50%, -100%); min-width:30px; height:30px; padding:0 8px; border:2px solid #fff; border-radius:999px; background: var(--brand); color:#fff; font: 800 12px/1 var(--font-body); box-shadow: var(--shadow-sm); cursor:pointer; }
.sv-marker.active { background: var(--accent-strong); z-index:2; }
.sv-user-pin { position:absolute; transform: translate(-50%, -50%); width:14px; height:14px; border:3px solid #fff; border-radius:50%; background:#2563eb; box-shadow:0 0 0 8px rgba(37,99,235,.18); pointer-events:none; }
.sv-map-card { position:absolute; left:10px; right:10px; bottom:10px; display:flex; gap:10px; padding:10px; border:1px solid rgba(255,255,255,.35); border-radius:18px; background: rgba(255,255,255,.92); backdrop-filter: blur(12px); color:#172b22; }
html.dark .sv-map-card { background: rgba(24,51,39,.92); color: var(--text-primary); border-color: var(--border); }
.sv-map-card img { width:72px; height:72px; flex:none; object-fit:cover; border-radius:12px; }
.sv-map-card-copy { display:grid; gap:4px; min-width:0; }
.sv-map-card-copy strong { font-size:14px; } .sv-map-card-copy span { font-size:12px; opacity:.86; }
.sv-inline-actions { display:flex; gap:8px; flex-wrap:wrap; }
.sv-inline-actions button, .sv-inline-actions a { padding:6px 10px; border:1px solid var(--border); border-radius:10px; background: var(--surface); color: var(--text-body); font: 700 11px/1 var(--font-body); text-decoration:none; cursor:pointer; }
.sv-map-empty { position:absolute; inset:0; display:grid; place-items:center; padding:24px; color: var(--text-secondary); text-align:center; }
.sv-attrib { margin:8px 2px 0; color: var(--text-muted); font-size:11px; } .sv-attrib a { color: inherit; }
.sv-backdrop { position:fixed; inset:0; z-index:50; display:grid; place-items:center; padding: max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom)); overflow-y:auto; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; background: rgba(12,42,29,.45); }
.sv-dialog { width:min(420px,100%); max-height: calc(100dvh - 40px); overflow-y:auto; overscroll-behavior:contain; padding:20px; border-radius:22px; background: var(--surface); box-shadow: var(--shadow-lg); color: var(--text-primary); }
.sv-dialog h3 { margin:0 0 8px; color: var(--text-strong); font: 600 22px/1.2 var(--font-display); } .sv-dialog p { margin:0; color: var(--text-secondary); line-height:1.5; } .sv-dialog-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:16px; }
.sv-field { display:grid; gap:8px; } .sv-field span { color: var(--text-secondary); font: 700 12px/1 var(--font-body); } .sv-field-inline { margin:8px 0 0 12px; }
.sv-pick-row { display:flex; width:100%; align-items:center; justify-content:space-between; gap:12px; padding:14px 0; border:0; border-bottom:1px solid var(--border); background:transparent; color:inherit; text-align:left; cursor:pointer; }
.sv-pick-row span { display:grid; gap:3px; } .sv-pick-row small { color: var(--text-secondary); }
.sv-pick-check { padding:6px 10px; border-radius:999px; background: var(--surface-soft); color: var(--text-secondary); font: 700 11px/1 var(--font-body); } .sv-pick-check.active { background: var(--brand-soft); color: var(--brand-deep); }

.sv-skeleton { padding-bottom:14px; } .sv-skel-img, .sv-skel-line { border-radius:12px; background: linear-gradient(90deg, var(--surface-soft), var(--surface-muted), var(--surface-soft)); background-size: 200% 100%; animation: sv-shimmer 1.4s infinite; } .sv-skel-img { height:184px; border-radius:0; } .sv-skel-line { height:14px; margin:14px 14px 0; } .sv-skel-line.short { width:55%; }
@keyframes sv-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (min-width: 700px) { .sv-collections { grid-template-columns: repeat(2, minmax(0,1fr)); } .sv-card { flex-basis: 320px; } }
@media (min-width: 1024px) { .sv-content.desktop-content, .sv-content.ride-content, .sv-content { width: 100%; max-width: none; margin: 0; padding: 20px max(28px, env(safe-area-inset-right)) 24px max(28px, env(safe-area-inset-left)); } .sv-collections { grid-template-columns: repeat(4, minmax(0,1fr)); } .sv-map { height: 460px; } .sv-deck-wrap { margin: 0 calc(-1 * max(28px, env(safe-area-inset-right))) 0 calc(-1 * max(28px, env(safe-area-inset-left))); } .sv-deck { padding-left: max(28px, env(safe-area-inset-left)); padding-right: max(28px, env(safe-area-inset-right)); gap: 18px; } .sv-card { flex-basis: 360px; } .sv-card-image { height: 200px; } }
@media (min-width: 1440px) { .sv-card { flex-basis: 380px; } .sv-collections { grid-template-columns: repeat(5, minmax(0,1fr)); } }
</style>
