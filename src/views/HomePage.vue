<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  bookmarkOutline,
  busOutline,
  chevronForwardOutline,
  cloudOutline,
  compassOutline,
  locationOutline,
  searchOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestination, getRideDestinations, type RideDestination } from '../data/destinations';
import { getExploreCategoryListings, getExploreListingId, getExploreListingLocation } from '../data/exploreListings';
import { loadItinerary, SAVED_ITINERARY_KEY } from '../data/itinerary';
import { loadTrips, type TripRecord } from '../data/trips';
import {
  describeWeatherCode,
  fetchCalapanWeather,
  getDemoCalapanWeather,
  isRainyWeather,
  type CalapanWeatherConditions,
} from '../data/weather';

const router = useRouter();
const places = getRideDestinations();
const savedPlaceIds = ref<string[]>([]);
const savedItinerary = ref<ReturnType<typeof loadItinerary>>(null);
const trips = ref<TripRecord[]>([]);
const searchQuery = ref('');
const weatherConditions = ref<CalapanWeatherConditions | null>(null);
const weatherError = ref('');
const weatherLoading = ref(false);
const weatherIsDemo = ref(false);
const failedImageIds = ref<string[]>([]);
let weatherRefreshInterval: number | undefined;

const homeTrip = computed(() => trips.value.find((t) => t.status === 'ongoing') ?? trips.value.filter((t) => t.status === 'upcoming').sort((a,b)=> (a.itinerary.travelDate||'9999-12-31').localeCompare(b.itinerary.travelDate||'9999-12-31'))[0]);
const homeTripPlaces = computed(() => (homeTrip.value?.itinerary.stopIds ?? []).map((id)=>places.find((p)=>p.id===id)).filter((p): p is RideDestination => !!p));

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
});

async function refreshWeather() {
  if (weatherLoading.value) return;
  weatherLoading.value = true;
  weatherError.value = '';
  try { weatherConditions.value = await fetchCalapanWeather(); weatherIsDemo.value = false; }
  catch(e){ weatherConditions.value = getDemoCalapanWeather(); weatherIsDemo.value = true; weatherError.value = e instanceof Error ? e.message : 'unavailable'; }
  finally { weatherLoading.value = false; }
}

const weatherIsRainy = computed(() => (weatherConditions.value ? isRainyWeather(weatherConditions.value) : false));
const weatherBadge = computed(() => (weatherIsRainy.value ? 'Rain Shield ON' : 'Clear Skies'));
const weatherHint = computed(() => (weatherIsRainy.value ? 'Stay safe, stay dry' : 'Great weather to head out'));

interface SearchResult {
  id: string;
  name: string;
  category: string;
  locationLabel: string;
  location: string;
  note?: string;
}

const exploreListings: SearchResult[] = Object.entries(getExploreCategoryListings()).flatMap(([category, listings]) =>
  listings.map((listing) => {
    const id = getExploreListingId(listing.name, category);
    const place = getRideDestination(id);
    const location = getExploreListingLocation(listing, category, place);
    return {
      id,
      name: listing.name,
      category,
      locationLabel: location.label,
      location: location.value,
      note: listing.note,
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
      if (Array.isArray(parsed)) savedPlaceIds.value = parsed.filter((id:any)=>typeof id==='string' && places.some((p)=>p.id===id));
      else savedPlaceIds.value = [];
    } else savedPlaceIds.value = [];
  } catch { savedPlaceIds.value = []; }
  try { savedItinerary.value = loadItinerary(SAVED_ITINERARY_KEY); } catch { savedItinerary.value = null; }
  try { trips.value = loadTrips(); } catch { trips.value = []; }
}

onMounted(()=>{ refreshSavedData(); refreshWeather(); weatherRefreshInterval = window.setInterval(refreshWeather,15*60*1000); });
onUnmounted(()=>{ if (weatherRefreshInterval) window.clearInterval(weatherRefreshInterval); });
onIonViewWillEnter(refreshSavedData);

function placeImage(p: RideDestination){ if (failedImageIds.value.includes(p.id)) return p.imageFallback||''; return p.image||p.imageFallback||''; }
function markImageFailed(p: RideDestination){ failedImageIds.value = [...failedImageIds.value, p.id]; }
function openPlace(p: RideDestination){ searchQuery.value=''; router.push({name:'DestinationDetails', params:{id:p.id}}); }
function openSearchResult(result: SearchResult){
  searchQuery.value = '';
  const place = getRideDestination(result.id);
  router.push({
    name: 'DestinationDetails',
    params: { id: result.id },
    ...(place ? {} : { query: { name: result.name, category: result.category, ...(result.note ? { note: result.note } : {}) } }),
  });
}
function openFirstSearchResult(){ const first = searchResults.value[0]; if (first) openSearchResult(first); }
function openSurprise(){ if (places.length) router.push({name:'SurpriseMe', query:{place:places[Math.floor(Math.random()*places.length)].id}}); else router.push({name:'Explore'}); }
function toggleSaved(p: RideDestination){ const next = savedPlaceIds.value.includes(p.id)? savedPlaceIds.value.filter(id=>id!==p.id):[...savedPlaceIds.value,p.id]; localStorage.setItem('ride.saved-destination-ids',JSON.stringify(next)); savedPlaceIds.value=next; }

const recommendedPlaceDetails = [
  { id: 'calapan-city-plaza', name: 'Calapan City Plaza', category: 'Parks & Recreation' },
  { id: 'calapan-nature-park', name: 'Bulusan Park', category: 'Adventure & Outdoor' },
  { id: 'harka-piloto-fish-sanctuary', name: 'Harka Piloto', category: 'Marine Sanctuary' },
  { id: 'jolly-waves-waterpark', name: 'Jolly Waves', category: 'Resorts & Swimming Pools' },
  { id: 'mahal-na-pangalan-marine-park', name: 'Mahal na Pangalan Marine Park', category: 'Marine & Coastal Tourism' },
  { id: 'oriental-mindoro-heritage-museum', name: 'Oriental Mindoro Heritage Museum', category: 'Museums & Heritage' },
  { id: 'parang-beach-resort', name: 'Parang Beach', category: 'Beaches' },
  { id: 'plaza-del-gobernador', name: 'Plaza del Gobernador', category: 'Parks & Recreation' },
  { id: 'silonay-mangrove-ecopark', name: 'Silonay Mangrove Eco-Park', category: 'Nature & Eco-Tourism' },
  { id: 'calapan-cathedral', name: 'Sto. Niño Cathedral', category: 'Churches & Religious Sites' },
] as const;
const recommended = computed(() => recommendedPlaceDetails.flatMap((details) => {
  const place = places.find((candidate) => candidate.id === details.id);
  return place ? [{ place, name: details.name, category: details.category }] : [];
}));
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="app-home">
        <RideAppHeader
          :eyebrow="`${greeting} 👋`"
          title="Where do you want to go?"
          subtitle="Discover. Plan. Ride. Arrive."
        />

        <div class="app-content">
          <!-- Search -->
          <section class="app-search-section">
            <form class="app-search" @submit.prevent="openFirstSearchResult">
              <ion-icon :icon="searchOutline"></ion-icon>
              <input v-model="searchQuery" type="search" placeholder="Search destination or place..." />
              <button v-if="searchQuery" type="button" @click="searchQuery=''">×</button>
            </form>
            <div v-if="searchQuery.trim()" class="app-search-results">
              <button v-for="place in searchResults" :key="place.id" type="button" @click="openSearchResult(place)">
                <div class="search-result-info">
                  <strong>{{ place.name }}</strong>
                  <span>{{ place.locationLabel }}: {{ place.location }} · {{ place.category }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <div v-if="searchResults.length===0" class="search-no-results">
                <p>No results found</p>
              </div>
            </div>
          </section>

          <!-- Weather Card -->
          <section class="app-card app-weather" @click="router.push('/weather')">
            <div class="weather-icon">
              <ion-icon :icon="cloudOutline"></ion-icon>
            </div>
            <div class="weather-info">
              <div class="weather-temp">
                <strong>{{ weatherConditions ? Math.round(weatherConditions.temperatureC) + '°C' : '29°C' }}</strong>
                <span class="weather-badge">{{ weatherBadge }}</span>
              </div>
              <p>{{ weatherConditions ? describeWeatherCode(weatherConditions.weatherCode) : 'Partly cloudy' }}</p>
              <small>{{ weatherHint }} • Tap for details</small>
            </div>
            <ion-icon :icon="chevronForwardOutline" class="weather-arrow"></ion-icon>
          </section>

          <!-- Quick Actions -->
          <section class="app-section">
            <h2 class="app-section-title">Quick Actions</h2>
            <div class="app-quick-grid">
              <router-link to="/commute" class="app-quick-item">
                <div class="quick-icon"><ion-icon :icon="busOutline"></ion-icon></div>
                <span>Commute</span>
              </router-link>
              <router-link to="/explore" class="app-quick-item">
                <div class="quick-icon"><ion-icon :icon="compassOutline"></ion-icon></div>
                <span>Explore</span>
              </router-link>
              <router-link to="/near-me" class="app-quick-item">
                <div class="quick-icon"><ion-icon :icon="locationOutline"></ion-icon></div>
                <span>Near Me</span>
              </router-link>
              <button type="button" @click="openSurprise" class="app-quick-item">
                <div class="quick-icon"><ion-icon :icon="sparklesOutline"></ion-icon></div>
                <span>Surprise</span>
              </button>
            </div>
          </section>

          <!-- Next Trip -->
          <section class="app-section">
            <h2 class="app-section-title">Your Next Trip</h2>
            <div v-if="homeTrip && homeTripPlaces.length" class="app-trip-card-new">
              <div class="trip-card-header">
                <div class="trip-cover">
                  <img v-if="homeTripPlaces[0] && placeImage(homeTripPlaces[0])" :src="placeImage(homeTripPlaces[0])" :alt="homeTripPlaces[0].name" />
                  <div v-else class="trip-cover-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                </div>
                <div class="trip-header-info">
                  <span class="trip-label">Upcoming</span>
                  <strong class="trip-name">{{ homeTrip.itinerary.tripName || homeTripPlaces[0]?.name }}</strong>
                  <p class="trip-meta">{{ homeTrip.itinerary.travelDate ? new Date(homeTrip.itinerary.travelDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set' }} • {{ homeTripPlaces.length }} stop{{ homeTripPlaces.length > 1 ? 's' : '' }}</p>
                </div>
              </div>
              <router-link :to="{ name: 'TripSummary' }" class="trip-cta">Continue Planning<ion-icon :icon="chevronForwardOutline"></ion-icon></router-link>
            </div>
            <div v-else class="app-card app-empty-card">
              <p>You haven't planned a trip yet</p>
              <router-link to="/explore" class="app-btn app-btn-primary">Plan a Trip</router-link>
            </div>
          </section>

          <!-- Recommended -->
          <section class="app-section">
            <div class="app-section-header">
              <h2 class="app-section-title">Recommended for You</h2>
              <router-link to="/explore" class="app-link">See All</router-link>
            </div>
            <div class="app-list">
              <article v-for="item in recommended" :key="item.place.id" class="app-list-card">
                <button type="button" class="list-image" @click="openPlace(item.place)">
                  <img v-if="placeImage(item.place)" :src="placeImage(item.place)" :alt="item.place.imageAlt || item.name" @error="markImageFailed(item.place)" />
                  <div v-else class="list-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                </button>
                <div class="list-body" @click="openPlace(item.place)">
                  <div class="list-main">
                    <strong class="list-title">{{ item.name }}</strong>
                    <p class="list-location">
                      <strong>{{ getExploreListingLocation({ name: item.name, category: item.category }, item.category, item.place).label }}:</strong>
                      {{ getExploreListingLocation({ name: item.name, category: item.category }, item.category, item.place).value }}
                    </p>
                    <span class="list-badge">{{ item.category }}</span>
                  </div>
                </div>
                <button type="button" class="list-fav" @click.stop="toggleSaved(item.place)" :aria-pressed="savedPlaceIds.includes(item.place.id)">
                  <ion-icon :icon="bookmarkOutline"></ion-icon>
                </button>
              </article>
            </div>
          </section>



          <div class="app-spacer"></div>
        </div>

        <RideBottomNav active="home" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.app-home {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.app-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.app-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  width: 100%;
}

.app-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.app-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.app-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
  flex-shrink: 0;
}

.app-brand :deep(.brand-wordmark) {
  width: 76px;
  height: auto;
  flex-shrink: 0;
}

.app-profile-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: white;
  border: 1px solid #DCE9DF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  text-decoration: none;
  font-size: 26px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06);
}

.app-greeting {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.greet-line {
  color: #3F8064;
  font-weight: 600;
  margin: 0;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.wave {
  display: inline-block;
}

.greet-title {
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.app-tagline {
  color: #658078;
  font-size: 13px;
  margin: 0;
}

.app-content {
  padding: 14px 16px 0 16px;
  max-width: 100%;
}

.app-search-section {
  position: relative;
  margin-bottom: 12px;
}

.app-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.06);
  width: 100%;
}

.app-search ion-icon {
  color: #658078;
  font-size: 20px;
  flex-shrink: 0;
}

.app-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
  min-width: 0;
}

.app-search button {
  background: #E8F4EC;
  border: none;
  color: #3F8064;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-search-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}

.app-search-results button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: none;
  background: white;
  text-align: left;
  border-bottom: 1px solid #F2F8F3;
  cursor: pointer;
}

.app-search-results button:last-child {
  border-bottom: none;
}

.app-search-results button:active {
  background: #F2F8F3;
}

.search-result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.search-result-info strong {
  color: #174C40;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-info span {
  color: #658078;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-no-results {
  padding: 14px;
  text-align: center;
  color: #658078;
}

.app-card {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
  overflow: hidden;
}

.app-weather {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(90deg, #E8F4EC 0%, #F2F8F3 100%);
  cursor: pointer;
  margin-bottom: 18px;
}

.weather-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(63, 128, 100, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 26px;
  flex-shrink: 0;
}

.weather-info {
  flex: 1;
  min-width: 0;
}

.weather-temp {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.weather-temp strong {
  color: #174C40;
  font-size: 18px;
}

.weather-badge {
  background: rgba(63, 128, 100, 0.2);
  color: #3F8064;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.weather-info p {
  color: #174C40;
  font-weight: 500;
  margin: 0 0 2px 0;
  font-size: 13px;
}

.weather-info small {
  color: #658078;
  font-size: 11px;
}

.weather-arrow {
  color: #658078;
  flex-shrink: 0;
  font-size: 18px;
}

.app-section {
  margin-bottom: 20px;
}

.app-section-title {
  color: #174C40;
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px 0;
  font-family: 'Poppins', sans-serif;
}

.app-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.app-section-header .app-section-title {
  margin: 0;
}

.app-link {
  color: #3F8064;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
}

.app-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.app-quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 10px 4px;
  text-decoration: none;
  color: #174C40;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
  min-width: 0;
}

.app-quick-item:active {
  background: #F2F8F3;
  transform: scale(0.98);
}

.quick-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #E8F4EC;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 24px;
  flex-shrink: 0;
}

.app-trip-card-new {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
}

.trip-card-header {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.trip-cover {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  background: #E8F4EC;
  flex-shrink: 0;
}

.trip-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trip-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 32px;
}

.trip-header-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
}

.trip-label {
  align-self: flex-start;
  background: #E8F4EC;
  color: #3F8064;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.trip-name {
  color: #174C40;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trip-meta {
  color: #658078;
  font-size: 12px;
  margin: 0;
}

.trip-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(90deg, #F2F8F3 0%, #ffffff 100%);
  color: #3F8064;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border-top: 1px solid #F2F8F3;
}

.trip-cta:active {
  background: #F2F8F3;
}

.app-btn {
  display: block;
  width: 100%;
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
}

.app-btn-primary {
  background: #3F8064;
  color: white;
}

.app-btn-primary:active {
  background: #346952;
}

.app-btn-outline {
  background: white;
  color: #3F8064;
  border: 1px solid #3F8064;
}

.app-btn-outline:active {
  background: #F2F8F3;
}

.app-empty-card {
  padding: 16px;
  text-align: center;
}

.app-empty-card p {
  color: #658078;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-list-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
  padding: 10px;
}

.list-image {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  border: none;
  background: #E8F4EC;
  padding: 0;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
}

.list-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 30px;
}

.list-body {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.list-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.list-title {
  color: #174C40;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-location {
  color: #658078;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.list-location strong {
  color: #3F8064;
  font-weight: 600;
}

.list-badge {
  display: inline-flex;
  align-self: flex-start;
  background: #E8F4EC;
  color: #3F8064;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
}

.list-fav {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.app-info-card {
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  text-decoration: none;
  color: #174C40;
  border-bottom: 1px solid #F2F8F3;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row:active {
  background: #F2F8F3;
}

.info-row span {
  font-size: 14px;
}

.info-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-right strong {
  color: #3F8064;
}

.info-right ion-icon {
  color: #658078;
  font-size: 16px;
}

.app-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .app-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .app-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
