<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  busOutline,
  calendarOutline,
  chevronForwardOutline,
  closeOutline,
  cloudOutline,
  heart,
  heartOutline,
  locationOutline,
  mapOutline,
  menuOutline,
  micOutline,
  moonOutline,
  navigateOutline,
  refreshOutline,
  searchOutline,
  sparklesOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideNotificationBell from '../components/RideNotificationBell.vue';
import RideProfileAvatar from '../components/RideProfileAvatar.vue';
import { getRideSession, type RideUser } from '../data/api';
import { getRideDestination, getRideDestinations, type RideDestination } from '../data/destinations';
import { getExploreCategoryListings, getExploreListingId, getExploreListingLocation } from '../data/exploreListings';
import { loadItinerary, SAVED_ITINERARY_KEY } from '../data/itinerary';
import { loadTrips, type TripRecord } from '../data/trips';
import { getDistanceInKilometers } from '../data/calapan';
import {
  CurrentLocationError,
  detectCurrentLocation,
  type CurrentLocation,
} from '../data/currentLocation';
import { getResolvedTheme, setThemeMode, type ThemeMode } from '../composables/theme';
import heroPhoto from '../assets/a39b75e5-1c3d-4b6f-901e-ef447cf68bf7.png';
import {
  describeWeatherCode,
  fetchCalapanWeather,
  getDemoCalapanWeather,
  type CalapanWeatherConditions,
} from '../data/weather';

const router = useRouter();
const places = getRideDestinations();
const savedPlaceIds = ref<string[]>([]);
const savedItinerary = ref<ReturnType<typeof loadItinerary>>(null);
const trips = ref<TripRecord[]>([]);
const searchQuery = ref('');
const menuOpen = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const weatherConditions = ref<CalapanWeatherConditions | null>(null);
const weatherLoading = ref(false);
const currentLocation = ref<CurrentLocation | null>(null);
const locationLoading = ref(false);
const locationError = ref('');
const failedImageIds = ref<string[]>([]);
let locationRequestId = 0;
let weatherRefreshInterval: number | undefined;

const resolvedTheme = computed(() => getResolvedTheme());

const homeTrip = computed(() => trips.value.find((t) => t.status === 'ongoing')
  ?? trips.value.filter((t) => t.status === 'upcoming').sort((a, b) => (a.itinerary.travelDate || '9999-12-31').localeCompare(b.itinerary.travelDate || '9999-12-31'))[0]);
const homeTripPlaces = computed(() => (homeTrip.value?.itinerary.stopIds ?? []).map((id) => places.find((p) => p.id === id)).filter((p): p is RideDestination => !!p));

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});

const user = computed<RideUser | null>(() => getRideSession()?.user ?? null);
const userName = computed(() => user.value?.name || '');

const headerGreeting = computed(() => {
  if (userName.value) return `${greeting.value}, ${userName.value}`;
  return greeting.value;
});

async function refreshWeather() {
  if (weatherLoading.value) return;
  weatherLoading.value = true;
  try {
    weatherConditions.value = await fetchCalapanWeather();
  } catch {
    weatherConditions.value = getDemoCalapanWeather();
  } finally {
    weatherLoading.value = false;
  }
}

const weatherLabel = computed(() => (weatherConditions.value ? describeWeatherCode(weatherConditions.value.weatherCode) : 'Partly cloudy'));
const weatherTemp = computed(() => (weatherConditions.value ? `${Math.round(weatherConditions.value.temperatureC)}°` : '29°'));

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
      const accuracyLabel = accuracy >= 1000
        ? `${(accuracy / 1000).toFixed(1)} km`
        : `${Math.round(accuracy)} m`;
      return `Accurate to about ${accuracyLabel}. Tap to update.`;
    }
    return 'Based on your device GPS. Tap to update.';
  }
  if (locationError.value) return locationError.value;
  return 'Allow location access so we can show where you are.';
});

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function locationErrorMessage(error: unknown): string {
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
    const location = await detectCurrentLocation(force);
    if (requestId !== locationRequestId) return;
    currentLocation.value = location;
  } catch (error) {
    if (requestId !== locationRequestId) return;
    currentLocation.value = null;
    locationError.value = locationErrorMessage(error);
  } finally {
    if (requestId === locationRequestId) locationLoading.value = false;
  }
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
  locationLabel: string;
  location: string;
  note?: string;
  address?: string;
}

const exploreListings: SearchResult[] = Object.entries(getExploreCategoryListings()).flatMap(([category, listings]) =>
  listings.map((listing) => {
    const id = getExploreListingId(listing.name, category);
    const place = getRideDestination(id);
    const loc = getExploreListingLocation(listing, category, place);
    return {
      id,
      name: listing.name,
      category,
      locationLabel: loc.label,
      location: loc.value,
      note: listing.note,
      address: listing.address,
    };
  }),
);

const searchResults = computed<SearchResult[]>(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return exploreListings
    .filter((item) => `${item.name} ${item.category} ${item.note ?? ''} ${item.location}`.toLowerCase().includes(q))
    .slice(0, 8);
});

function refreshSavedData() {
  try {
    const stored = localStorage.getItem('ride.saved-destination-ids');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) savedPlaceIds.value = parsed.filter((id: unknown) => typeof id === 'string' && places.some((p) => p.id === id));
      else savedPlaceIds.value = [];
    } else savedPlaceIds.value = [];
  } catch { savedPlaceIds.value = []; }
  try { savedItinerary.value = loadItinerary(SAVED_ITINERARY_KEY); } catch { savedItinerary.value = null; }
  try { trips.value = loadTrips(); } catch { trips.value = []; }
}

onMounted(() => {
  refreshSavedData();
  refreshWeather();
  void refreshLocation(false);
  weatherRefreshInterval = window.setInterval(refreshWeather, 15 * 60 * 1000);
});
onUnmounted(() => {
  locationRequestId += 1;
  if (weatherRefreshInterval) window.clearInterval(weatherRefreshInterval);
});
onIonViewWillEnter(refreshSavedData);

function placeImage(p: RideDestination) {
  if (failedImageIds.value.includes(p.id)) return p.imageFallback || '';
  return p.image || p.imageFallback || '';
}
function markImageFailed(p: RideDestination) { failedImageIds.value = [...failedImageIds.value, p.id]; }

type OpenStatus = 'open' | 'varies' | 'check';

function getOpenStatus(place: RideDestination): { status: OpenStatus; label: string } {
  const info = (place.openingInformation || '').toLowerCase();
  if (!info) return { status: 'check', label: 'Check hours' };
  if (/\bclosed\b/.test(info)) return { status: 'check', label: 'Closed' };
  if (/usually open|open daily|generally open|public plaza|daytime visit/.test(info)) {
    return { status: 'open', label: 'Usually open' };
  }
  if (/hours vary|hours may change/.test(info)) return { status: 'varies', label: 'Hours vary' };
  if (/access is coordinated|confirm.*access/.test(info)) return { status: 'check', label: 'Check access' };
  return { status: 'check', label: 'Check hours' };
}

function getDistanceLabel(place: RideDestination): string | null {
  const origin = currentLocation.value;
  if (!origin) return null;
  const km = getDistanceInKilometers(origin.latitude, origin.longitude, place);
  if (!Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m away`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km away`;
}

function openSearchResult(result: SearchResult) {
  searchQuery.value = '';
  const place = getRideDestination(result.id);
  router.push({
    name: 'DestinationDetails',
    params: { id: result.id },
    ...(place ? {} : { query: { name: result.name, category: result.category, ...(result.address ? { address: result.address } : {}), ...(result.note ? { note: result.note } : {}) } }),
  });
}
function openFirstSearchResult() { const first = searchResults.value[0]; if (first) openSearchResult(first); }
function openPlace(p: RideDestination) { searchQuery.value = ''; router.push({ name: 'DestinationDetails', params: { id: p.id } }); }
function toggleSaved(p: RideDestination) {
  const next = savedPlaceIds.value.includes(p.id)
    ? savedPlaceIds.value.filter((id) => id !== p.id)
    : [...savedPlaceIds.value, p.id];
  localStorage.setItem('ride.saved-destination-ids', JSON.stringify(next));
  savedPlaceIds.value = next;
}

function toggleThemeMode() {
  const next: ThemeMode = resolvedTheme.value === 'dark' ? 'light' : 'dark';
  setThemeMode(next);
}
function closeMenu() { menuOpen.value = false; }

function directionUrl(place: RideDestination): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
}



type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  start: () => void;
};
function startVoiceSearch() {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Recognition) { searchInput.value?.focus(); return; }
  try {
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (typeof transcript === 'string') searchQuery.value = transcript;
    };
    recognition.start();
  } catch {
    searchInput.value?.focus();
  }
}

const recommendedPlaceDetails = [
  { id: 'calapan-city-plaza', name: 'Calapan City Plaza', category: 'Parks & Recreation' },
  { id: 'calapan-nature-park', name: 'Bulusan Park', category: 'Adventure & Outdoor' },
  { id: 'harka-piloto-fish-sanctuary', name: 'Harka Piloto', category: 'Marine Sanctuary' },
  { id: 'jolly-waves-waterpark', name: 'Jolly Waves', category: 'Resorts & Swimming Pools' },
  { id: 'plaza-del-gobernador', name: 'Plaza del Gobernador', category: 'Parks & Recreation' },
  { id: 'mahal-na-pangalan-marine-park', name: 'Mahal na Pangalan Marine Park', category: 'Marine & Coastal Tourism' },
  { id: 'oriental-mindoro-heritage-museum', name: 'Oriental Mindoro Heritage Museum', category: 'Museums & Heritage' },
  { id: 'parang-beach-resort', name: 'Parang Beach', category: 'Beaches' },
  { id: 'silonay-mangrove-ecopark', name: 'Silonay Mangrove Eco-Park', category: 'Nature & Eco-Tourism' },
  { id: 'calapan-cathedral', name: 'Sto. Niño Cathedral', category: 'Churches & Religious Sites' },
] as const;

const recommended = computed(() => recommendedPlaceDetails.flatMap((details) => {
  const place = places.find((candidate) => candidate.id === details.id);
  if (!place) return [];
  const open = getOpenStatus(place);
  return [{
    place,
    name: details.name,
    category: details.category,
    description: place.description,
    location: getExploreListingLocation({ name: details.name, category: details.category }, details.category, place),
    openStatus: open.status,
    openLabel: open.label,
    distanceLabel: getDistanceLabel(place),
  }];
}));

const quickActions = [
  { label: 'Commute', icon: busOutline, to: { name: 'Commute' } },
  { label: 'Explore', icon: mapOutline, to: { name: 'Explore' } },
  { label: 'Weather', icon: cloudOutline, to: { name: 'Weather' } },
  { label: 'Near Me', icon: navigateOutline, to: { name: 'NearMe' } },
  { label: 'Surprise', icon: sparklesOutline, to: { name: 'SurpriseMe' } },
];

const menuLinks = [
  { label: 'Home', to: '/home' },
  { label: 'Explore', to: '/explore' },
  { label: 'Itinerary', to: '/itinerary' },
  { label: 'My Trips', to: '/trips' },
  { label: 'Saved', to: '/saved' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' },
];

function tripDateLabel() {
  const date = homeTrip.value?.itinerary.travelDate;
  if (!date) return 'Date not set';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="home-app">
        <header class="home-top">
          <button class="home-icon-btn" type="button" aria-label="Open menu" :aria-expanded="menuOpen" @click="toggleMenu">
            <ion-icon :icon="menuOpen ? closeOutline : menuOutline" aria-hidden="true"></ion-icon>
          </button>
          <div class="home-top-actions">
            <button class="home-icon-btn" type="button" :aria-label="resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleThemeMode">
              <ion-icon :icon="resolvedTheme === 'dark' ? sunnyOutline : moonOutline" aria-hidden="true"></ion-icon>
            </button>
            <RideNotificationBell button-class="home-icon-btn home-bell" badge-class="home-bell-badge" panel-class="home-notifications ride-notif-panel--home" />
            <router-link to="/profile" class="home-avatar" aria-label="Profile">
              <RideProfileAvatar />
            </router-link>
          </div>

          <nav v-if="menuOpen" class="home-menu-panel" aria-label="Main menu">
            <router-link v-for="link in menuLinks" :key="link.to" :to="link.to" @click="closeMenu">{{ link.label }}</router-link>
          </nav>
        </header>

        <section class="home-hero">
          <p class="home-eyebrow">{{ headerGreeting }}</p>
          <h1>Your Journey, <span>Intelligently</span> Planned.</h1>
          <p class="home-lede">Discover Calapan, plan the perfect day, and find your way — all in one place.</p>

          <button
            class="home-location"
            type="button"
            :class="{ 'is-error': !!locationError && !locationLoading }"
            :aria-busy="locationLoading"
            @click="refreshLocation(true)"
          >
            <span class="home-location-icon" aria-hidden="true">
              <ion-icon :icon="locationOutline"></ion-icon>
            </span>
            <span class="home-location-copy" aria-live="polite">
              <span class="home-location-label">Your current location</span>
              <strong>{{ locationHeadline }}</strong>
              <span class="home-location-detail">{{ locationDetail }}</span>
              <span v-if="currentLocation" class="home-location-attribution">Location data © OpenStreetMap contributors</span>
            </span>
            <span class="home-location-update" aria-hidden="true">
              <ion-icon :icon="refreshOutline" :class="{ spinning: locationLoading }"></ion-icon>
            </span>
          </button>

          <div class="home-hero-media">
            <img :src="heroPhoto" alt="Discover Calapan with RIDE" />
            <button class="home-weather-pill app-weather" type="button" @click="router.push('/weather')">
              <ion-icon :icon="cloudOutline" aria-hidden="true"></ion-icon>
              <span>{{ weatherTemp }} · {{ weatherLabel }}</span>
            </button>
          </div>
        </section>

        <section class="home-search-wrap">
          <form class="home-search app-search" @submit.prevent="openFirstSearchResult">
            <ion-icon class="search-glyph" :icon="searchOutline" aria-hidden="true"></ion-icon>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="search"
              placeholder="Where do you want to go?"
              aria-label="Search destination or place"
            />
            <button class="home-mic" type="button" aria-label="Search by voice" @click="startVoiceSearch">
              <ion-icon :icon="micOutline" aria-hidden="true"></ion-icon>
            </button>
          </form>
          <div v-if="searchQuery.trim()" class="home-search-results app-search-results">
            <button v-for="place in searchResults" :key="place.id" type="button" @click="openSearchResult(place)">
              <div class="search-result-info">
                <strong>{{ place.name }}</strong>
                <span>{{ place.locationLabel }}: {{ place.location }} · {{ place.category }}</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
            </button>
            <div v-if="searchResults.length === 0" class="search-no-results">
              <p>No results found</p>
            </div>
          </div>
        </section>

        <section class="home-section">
          <div class="home-section-head">
            <h2>Quick Actions</h2>
          </div>
          <div class="quick-grid">
            <router-link v-for="action in quickActions" :key="action.label" :to="action.to" class="quick-action app-quick-item">
              <span class="quick-icon"><ion-icon :icon="action.icon" aria-hidden="true"></ion-icon></span>
              <span>{{ action.label }}</span>
            </router-link>
          </div>
        </section>

        <section v-if="homeTrip && homeTripPlaces.length" class="home-section">
          <div class="home-section-head">
            <h2>Your Next Trip</h2>
            <router-link :to="{ name: 'TripSummary' }" class="home-seeall">Open</router-link>
          </div>
          <router-link :to="{ name: 'TripSummary' }" class="home-trip-card">
            <div class="home-trip-media">
              <img v-if="homeTripPlaces[0] && placeImage(homeTripPlaces[0])" :src="placeImage(homeTripPlaces[0])" :alt="homeTripPlaces[0].name" />
              <div v-else class="home-trip-fallback"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon></div>
            </div>
            <div class="home-trip-copy">
              <span class="home-trip-label">{{ homeTrip.status === 'ongoing' ? 'Ongoing' : 'Upcoming' }}</span>
              <strong>{{ homeTrip.itinerary.tripName || homeTripPlaces[0]?.name }}</strong>
              <span class="home-trip-meta">
                <ion-icon :icon="calendarOutline" aria-hidden="true"></ion-icon>
                {{ tripDateLabel() }}
              </span>
              <span class="home-trip-meta">
                <ion-icon :icon="busOutline" aria-hidden="true"></ion-icon>
                {{ homeTripPlaces.length }} stop{{ homeTripPlaces.length === 1 ? '' : 's' }}
              </span>
            </div>
            <span class="home-trip-arrow"><ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon></span>
          </router-link>
        </section>

        <section class="home-section home-discover">
          <div class="home-section-head">
            <div>
              <h2>Discover top places in Calapan City!</h2>
              <p class="home-section-note">Swipe to explore handpicked spots</p>
            </div>
            <router-link to="/explore" class="home-seeall">See all</router-link>
          </div>
          <div class="dest-deck" role="list" aria-label="Top places in Calapan City">
            <article v-for="item in recommended" :key="item.place.id" class="app-list-card dest-list-card" role="listitem">
              <button type="button" class="dest-list-image" :aria-label="`Open ${item.name}`" @click="openPlace(item.place)">
                <img v-if="placeImage(item.place)" :src="placeImage(item.place)" :alt="item.place.imageAlt || item.name" @error="markImageFailed(item.place)" />
                <div v-else class="dest-list-fallback"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon></div>
                <span class="dest-list-badge">{{ item.category }}</span>
              </button>
              <button
                type="button"
                class="dest-list-fav"
                data-instant-action
                :aria-label="`${savedPlaceIds.includes(item.place.id) ? 'Remove' : 'Save'} ${item.name}`"
                :aria-pressed="savedPlaceIds.includes(item.place.id)"
                :class="{ saved: savedPlaceIds.includes(item.place.id) }"
                @click.stop="toggleSaved(item.place)"
              >
                <ion-icon :icon="savedPlaceIds.includes(item.place.id) ? heart : heartOutline" aria-hidden="true"></ion-icon>
              </button>
              <div class="dest-list-body">
                <strong class="dest-list-title">{{ item.name }}</strong>
                <p class="dest-list-location">
                  <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                  <span>{{ item.location.label }}: {{ item.location.value }}</span>
                </p>
                <p class="dest-list-meta">
                  <span v-if="item.distanceLabel" class="dest-list-distance">
                    <ion-icon :icon="navigateOutline" aria-hidden="true"></ion-icon>
                    {{ item.distanceLabel }}
                  </span>
                  <span v-else class="dest-list-distance is-muted">Distance unavailable</span>
                  <span class="dest-list-status" :class="`is-${item.openStatus}`">
                    <span class="dest-list-status-dot" aria-hidden="true"></span>
                    {{ item.openLabel }}
                  </span>
                </p>
                <p class="dest-list-desc">{{ item.description }}</p>
                <div class="dest-list-actions">
                  <button type="button" class="dest-list-open" @click="openPlace(item.place)">
                    View Details <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
                  </button>
                  <a class="dest-list-open dest-list-dir" :href="directionUrl(item.place)" target="_blank" rel="noopener" aria-label="Directions">
                    <ion-icon :icon="navigateOutline" aria-hidden="true"></ion-icon> Direction
                  </a>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div class="home-spacer"></div>
      </div>

      <RideBottomNav active="home" />
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home-app {
  min-height: 100vh;
  width: 100%;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
  background: var(--bg);
}

/* ---------- Top bar ---------- */
.home-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 14px) 18px 4px;
  z-index: 20;
}

.home-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-bell {
  position: relative;
  overflow: visible;
  color: var(--brand-accent);
}
.home-icon-btn,
.home-bell { padding: 0; line-height: 0; box-sizing: border-box; }
.home-bell ion-icon,
:deep(.home-bell ion-icon),
:deep(.home-bell .ride-notif-glyph) {
  font-size: 26px;
  width: 26px;
  height: 26px;
  display: block;
  margin: 0 auto;
  flex: 0 0 auto;
}
:deep(.home-bell),
.home-bell {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 48px !important;
  min-width: 48px !important;
  height: 48px !important;
  padding: 0 !important;
  line-height: 0 !important;
  border: 1px solid var(--border) !important;
  border-radius: 50% !important;
  background: var(--surface) !important;
  box-shadow: var(--shadow-xs) !important;
  color: var(--brand-accent) !important;
}

.home-bell-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  display: grid;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  place-items: center;
  border: 2px solid var(--bg);
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.home-panel-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: transparent;
  cursor: default;
  z-index: 55;
}

.home-notifications {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 66px);
  right: 18px;
  display: flex;
  width: min(360px, calc(100vw - 36px));
  max-height: min(70vh, 480px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 60;
}

.home-notifications-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
}

.home-notifications-head p {
  margin: 0 0 2px;
  color: var(--brand-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-notifications-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.home-notifications-readall {
  flex-shrink: 0;
  padding: 6px 4px;
  border: 0;
  background: transparent;
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.home-notifications-list {
  overflow-y: auto;
}

.home-notification {
  position: relative;
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
}

.home-notification:last-child {
  border-bottom: 0;
}

.home-notification.unread {
  background: color-mix(in srgb, var(--brand-soft) 45%, var(--surface));
}

.home-notification-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-size: 18px;
}

.home-notification-icon.tone-watch {
  background: var(--warning-soft);
  color: var(--warning);
}

.home-notification-icon.tone-alert {
  background: var(--danger-soft);
  color: var(--danger);
}

.home-notification-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.home-notification-copy strong {
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
}

.home-notification-copy span {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.home-notification-copy time {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.home-notification-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--brand-accent);
}

.home-notifications-empty {
  margin: 0;
  padding: 22px 18px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

.home-notifications-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: var(--surface-soft);
}

.home-notifications-foot button {
  padding: 8px 6px;
  border: 0;
  background: transparent;
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.home-notifications-foot .home-notifications-clear {
  color: var(--text-secondary);
  font-weight: 600;
}

.home-notif-modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: color-mix(in srgb, var(--bg, #0b1410) 42%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 80;
}

.home-notif-modal-card {
  width: min(380px, 100%);
  padding: 18px 18px 16px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.home-notif-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.home-notif-modal-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background: var(--surface-muted);
  color: var(--brand-accent);
  font-size: 22px;
}

.home-notif-modal-icon.tone-alert {
  background: color-mix(in srgb, #d97706 14%, var(--surface-muted));
  color: #b45309;
}

.home-notif-modal-icon.tone-watch {
  background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface-muted));
}

.home-notif-modal-close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
}

.home-notif-modal-card h3 {
  margin: 0 0 6px;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.home-notif-modal-detail {
  margin: 0 0 10px;
  color: var(--text-secondary);
  font-size: 13.5px;
  line-height: 1.5;
}

.home-notif-modal-reminder {
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 18%, var(--border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--brand-accent) 8%, var(--surface-soft));
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.home-notif-modal-suggest {
  margin: 0 0 14px;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.45;
}

.home-notif-modal-suggest strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text-strong);
  font-size: 12.5px;
}

.home-notif-modal-suggest ul {
  margin: 0;
  padding-left: 18px;
}

.home-notif-modal-suggest li {
  margin: 2px 0;
}

.home-notif-modal-actions {
  display: flex;
  gap: 10px;
}

.home-notif-modal-primary,
.home-notif-modal-secondary {
  flex: 1;
  padding: 11px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.home-notif-modal-primary {
  border: 1px solid var(--brand-accent);
  background: var(--brand-accent);
  color: #fff;
}

.home-notif-modal-secondary {
  border: 1px solid var(--border);
  background: var(--surface-soft);
  color: var(--text-body);
}

.home-icon-btn,
.home-avatar {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  color: var(--text-primary);
  font-size: 21px;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.home-icon-btn:active,
.home-avatar:active {
  transform: scale(0.95);
}

.home-menu-panel {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 66px);
  left: 18px;
  display: flex;
  width: 212px;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 60;
}

.home-menu-panel a {
  padding: 10px 12px;
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.home-menu-panel a:hover,
.home-menu-panel a:active {
  background: var(--surface-soft);
}

/* ---------- Hero ---------- */
.home-hero {
  padding: 8px 20px 0;
}

.home-eyebrow {
  margin: 0 0 10px;
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-hero h1 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(34px, 9vw, 46px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.04;
}

.home-hero h1 span {
  color: var(--brand-accent);
  font-style: italic;
}

.home-lede {
  max-width: 36ch;
  margin: 12px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.55;
}

/* ---------- Current location ---------- */
.home-location {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.home-location:active {
  transform: scale(0.99);
}

.home-location.is-error {
  border-color: color-mix(in srgb, var(--danger) 45%, var(--border));
  background: color-mix(in srgb, var(--danger-soft) 55%, var(--surface));
}

.home-location-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 14px;
  background: var(--brand-soft);
  color: var(--brand-accent);
  font-size: 22px;
}

.home-location.is-error .home-location-icon {
  background: var(--danger-soft);
  color: var(--danger);
}

.home-location-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.home-location-label {
  color: var(--brand-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-location-copy strong {
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.home-location-detail {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.home-location.is-error .home-location-detail {
  color: var(--danger);
}

.home-location-attribution {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 9px;
  letter-spacing: 0.01em;
}

.home-location-update {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 17px;
}

.home-location-update .spinning {
  animation: home-location-spin 0.9s linear infinite;
}

@keyframes home-location-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-location-update .spinning {
    animation: none;
  }
}

.home-hero-media {
  position: relative;
  height: 190px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 26px;
  box-shadow: var(--shadow-md);
}

.home-hero-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-hero-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 42%, color-mix(in srgb, var(--bg) 78%, transparent) 100%);
  pointer-events: none;
}

.home-weather-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-glass);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.home-weather-pill ion-icon {
  color: var(--brand-accent);
  font-size: 16px;
}

/* ---------- Search ---------- */
.home-search-wrap {
  position: relative;
  margin: -34px 16px 0;
  z-index: 5;
}

.home-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: none;
  min-height: 60px;
  padding: 10px 10px 10px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.home-search .search-glyph {
  color: var(--text-secondary);
  font-size: 20px;
  flex-shrink: 0;
}

.home-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}

.home-search input::placeholder {
  color: var(--text-muted);
}

.home-mic {
  display: grid;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--brand);
  color: var(--on-brand);
  font-size: 19px;
  cursor: pointer;
}

.home-search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.home-search-results button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
}

.home-search-results button:last-child {
  border-bottom: 0;
}

.home-search-results button:active {
  background: var(--surface-soft);
}

.search-result-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.search-result-info strong {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-info span {
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-no-results {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
}

.search-no-results p {
  margin: 0;
  font-size: 13px;
}

/* ---------- Sections ---------- */
.home-section {
  padding: 0 20px;
  margin-top: 28px;
}

.home-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.home-section h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.home-section-note {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.home-seeall {
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

/* ---------- Recommended list ---------- */
.dest-deck {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin: 0 -20px;
  padding: 6px 20px 18px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 20px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.dest-deck::-webkit-scrollbar {
  display: none;
}

.dest-list-card {
  position: relative;
  display: flex;
  width: clamp(272px, 82vw, 324px);
  flex: 0 0 auto;
  flex-direction: column;
  align-self: stretch;
  overflow: hidden;
  scroll-snap-align: start;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.dest-list-card:active {
  transform: scale(0.99);
}

.dest-list-card:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 18%, var(--border));
  box-shadow: var(--shadow-md);
}

.dest-list-image {
  position: relative;
  width: 100%;
  height: 176px;
  flex-shrink: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: var(--surface-muted);
  cursor: pointer;
}

.dest-list-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(9, 26, 18, 0.34) 100%);
  pointer-events: none;
}

.dest-list-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.dest-list-card:hover .dest-list-image img {
  transform: scale(1.04);
}

.dest-list-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--brand-accent);
  font-size: 38px;
}

.dest-list-body {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 18px;
}

.dest-list-title {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  min-height: 2.4em;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.dest-list-location {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.dest-list-location ion-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--brand-accent);
  font-size: 15px;
}

.dest-list-location span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.dest-list-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin: 0;
}

.dest-list-distance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-strong);
  font-size: 12px;
  font-weight: 700;
}

.dest-list-distance ion-icon {
  color: var(--brand-accent);
  font-size: 14px;
}

.dest-list-distance.is-muted {
  color: var(--text-secondary);
  font-weight: 600;
}

.dest-list-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.dest-list-status-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--text-muted, #8b949e);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-muted, #8b949e) 14%, transparent);
}

.dest-list-status.is-open {
  color: var(--brand-accent);
}

.dest-list-status.is-open .dest-list-status-dot {
  background: var(--brand-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-accent) 16%, transparent);
}

.dest-list-status.is-varies .dest-list-status-dot {
  background: #b7791f;
  box-shadow: 0 0 0 3px color-mix(in srgb, #b7791f 16%, transparent);
}

.dest-list-location ion-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--brand-accent);
  font-size: 15px;
}

.dest-list-location span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.dest-list-location strong {
  color: var(--brand-accent);
  font-weight: 700;
}

.dest-list-desc {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  min-height: 4.35em;
  color: var(--text-secondary);
  font-size: 12.5px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.dest-list-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: inline-flex;
  max-width: calc(100% - 76px);
  overflow: hidden;
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  background: rgba(9, 26, 18, 0.44);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.dest-list-actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; width: 100%; }
.dest-list-open {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 5px;
  padding: 8px 13px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 14%, var(--border));
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
}
.dest-list-dir { margin-left: auto; background: var(--brand); border-color: var(--brand); color: var(--on-brand, #fff); }

.dest-list-open:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 24%, var(--border));
}

.dest-list-open:active {
  transform: scale(0.97);
}

.dest-list-open ion-icon {
  font-size: 14px;
}

.dest-list-fav {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface-glass);
  color: var(--text-primary);
  font-size: 19px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.dest-list-fav:active {
  transform: scale(0.92);
}

.dest-list-fav.saved {
  border-color: var(--brand);
  background: var(--brand);
  color: var(--on-brand);
}

/* ---------- Quick actions ---------- */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 4px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  color: var(--text-body);
  text-align: center;
  text-decoration: none;
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.quick-action:active {
  transform: scale(0.97);
}

.quick-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 21px;
}

.quick-action span:last-child {
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
}

/* ---------- Next trip ---------- */
.home-trip-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.home-trip-media {
  width: 78px;
  height: 78px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface-muted);
}

.home-trip-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-trip-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--brand-accent);
  font-size: 30px;
}

.home-trip-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.home-trip-label {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-trip-copy strong {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-trip-meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 12px;
}

.home-trip-meta ion-icon {
  color: var(--brand-accent);
  font-size: 14px;
}

.home-trip-arrow {
  display: grid;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 16px;
}

.home-spacer {
  height: 12px;
}

@media (min-width: 640px) {
  .home-top,
  .home-hero,
  .home-section {
    padding-left: 28px;
    padding-right: 28px;
  }

  .home-search-wrap {
    margin-left: 16px;
    margin-right: 16px;
  }

  .dest-deck {
    margin-left: -28px;
    margin-right: -28px;
    padding-left: 28px;
    padding-right: 28px;
    scroll-padding-inline: 28px;
  }

  .home-hero-media {
    height: 240px;
  }
}

@media (min-width: 720px) {
  .dest-list-card {
    width: 324px;
  }

  .dest-list-image {
    height: 190px;
  }
}
</style>
