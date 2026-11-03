<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  chevronForwardOutline,
  cloudOutline,
  leafOutline,
  partlySunnyOutline,
  rainyOutline,
  refreshOutline,
  sunnyOutline,
  warningOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestination } from '../data/destinations';
import { EXPLORE_CATEGORY_LISTINGS, getExploreListingId, type ExploreListing } from '../data/exploreListings';
import {
  describeWeatherCode,
  fetchCalapanWeather,
  getDemoCalapanWeather,
  isRainyWeather,
  type CalapanWeatherConditions,
} from '../data/weather';

const router = useRouter();
const conditions = ref<CalapanWeatherConditions | null>(null);
const loading = ref(false);
const error = ref('');
const isDemo = ref(false);
const failedSuggestionImages = ref<string[]>([]);

const RAINY_CATEGORIES = [
  'Museums & Heritage',
  'Cafés & Coffee Shops',
  'Restaurants & Eateries',
  'Shopping Malls',
  'Public Markets',
  'Churches & Religious Sites',
];
const SUNNY_CATEGORIES = [
  'Beaches',
  'Islands & Islets',
  'Nature & Eco-Tourism',
  'Parks & Recreation',
  'Resorts',
  'Swimming Pools',
  'Waterparks',
  'Adventure & Outdoor Activities',
  'Marine Sanctuaries',
  'Farm Tourism',
  'Tourist Spots',
];

interface WeatherSuggestion {
  id: string;
  name: string;
  category: string;
  note?: string;
  image: string;
}

function pickExploreSuggestions(categories: string[], limit: number): WeatherSuggestion[] {
  const seenIds = new Set<string>();
  const picked: WeatherSuggestion[] = [];
  const queues = categories.map((category) => ({
    category,
    listings: [...(EXPLORE_CATEGORY_LISTINGS[category] ?? [])] as ExploreListing[],
  }));

  while (picked.length < limit && queues.some((queue) => queue.listings.length > 0)) {
    for (const queue of queues) {
      if (picked.length >= limit) break;
      while (queue.listings.length > 0) {
        const listing = queue.listings.shift() as ExploreListing;
        const id = getExploreListingId(listing.name, queue.category);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const destination = getRideDestination(id);
        picked.push({
          id,
          name: listing.name,
          category: queue.category,
          note: listing.note,
          image: destination?.image || destination?.imageFallback || '',
        });
        break;
      }
    }
  }

  return picked;
}

function suggestionImage(suggestion: WeatherSuggestion): string {
  return failedSuggestionImages.value.includes(suggestion.id) ? '' : suggestion.image;
}

function markSuggestionImageFailed(suggestion: WeatherSuggestion) {
  if (!failedSuggestionImages.value.includes(suggestion.id)) {
    failedSuggestionImages.value = [...failedSuggestionImages.value, suggestion.id];
  }
}

function openSuggestion(suggestion: WeatherSuggestion) {
  void router.push({
    name: 'DestinationDetails',
    params: { id: suggestion.id },
    query: {
      name: suggestion.name,
      category: suggestion.category,
      ...(suggestion.note ? { note: suggestion.note } : {}),
    },
  });
}

const weatherIcon = computed(() => {
  const code = conditions.value?.weatherCode;
  if (code === undefined) return cloudOutline;
  if ([0, 1].includes(code)) return sunnyOutline;
  if (code === 2) return partlySunnyOutline;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return rainyOutline;
  return cloudOutline;
});

const updatedLabel = computed(() => {
  const time = conditions.value?.observedAt;
  if (!time) return 'Not available';
  const parsed = new Date(time);
  return Number.isNaN(parsed.getTime()) ? time : parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
});

const rainLabel = computed(() => {
  const value = conditions.value?.rainChancePercent;
  return typeof value === 'number' ? `${Math.round(value)}%` : 'Not available';
});

const windLabel = computed(() => {
  const value = conditions.value?.windSpeedKmh;
  return typeof value === 'number' ? `${Math.round(value)} km/h` : 'Not available';
});

const humidityLabel = computed(() => {
  const value = conditions.value?.humidityPercent;
  return typeof value === 'number' ? `${Math.round(value)}%` : 'Not available';
});

const isRaining = computed(() => (conditions.value ? isRainyWeather(conditions.value) : false));

const alerts = computed(() => {
  if (!conditions.value) return [];
  const items: Array<{ title: string; detail: string; tone: 'watch' | 'info' }> = [];
  if (isRaining.value) {
    items.push({
      title: 'Rain may affect travel',
      detail: 'Bring a light rain jacket, protect your bags, and allow extra time for transfers.',
      tone: 'watch',
    });
  } else if (conditions.value.rainChancePercent >= 60) {
    items.push({
      title: 'Rain is possible later',
      detail: 'Skies look dry right now, but keep a compact umbrella nearby and check again before heading out.',
      tone: 'info',
    });
  } else if (conditions.value.rainChancePercent >= 30) {
    items.push({
      title: 'A passing shower is possible',
      detail: 'Keep a compact umbrella nearby and check conditions before heading out.',
      tone: 'info',
    });
  }
  if (conditions.value.windSpeedKmh >= 25) {
    items.push({
      title: 'Breezy conditions',
      detail: 'Secure loose items and check coastal advisories if traveling by water.',
      tone: 'watch',
    });
  }
  items.push({
    title: 'Check official advisories',
    detail: 'Review PAGASA advisories before long trips for official updates.',
    tone: 'info',
  });
  return items;
});

const weatherSuggestions = computed(() => {
  if (isRaining.value) {
    return {
      title: 'It’s rainy - stay indoors',
      subtitle: 'Recommended places to visit when it’s raining',
      places: pickExploreSuggestions(RAINY_CATEGORIES, 4),
    };
  }
  return {
    title: 'Good weather - go outdoors',
    subtitle: 'Recommended places to visit when it’s sunny',
    places: pickExploreSuggestions(SUNNY_CATEGORIES, 4),
  };
});

async function refreshWeather() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    conditions.value = await fetchCalapanWeather();
    isDemo.value = false;
  } catch (caught) {
    conditions.value = getDemoCalapanWeather();
    isDemo.value = true;
    error.value = caught instanceof Error ? caught.message : 'Live weather is unavailable right now.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => { void refreshWeather(); });
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="wx-app">
        <RideAppHeader
          eyebrow="Weather &amp; Travel Alerts"
          title="Stay informed before you ride"
          subtitle="Plan around current conditions in Calapan City"
          show-back
        >
          <template #actions>
              <button class="wx-action-btn" type="button" :disabled="loading" @click="refreshWeather" aria-label="Refresh">
                <ion-icon :icon="refreshOutline" :class="{ 'spin': loading }"></ion-icon>
              </button>
          </template>
        </RideAppHeader>

        <div class="wx-content">
          <section class="wx-current-card">
            <div class="wx-current-header">
              <div class="wx-location">
                <ion-icon :icon="cloudOutline"></ion-icon>
                <span>Calapan City, Oriental Mindoro</span>
              </div>
              <span class="wx-status" :class="{ 'wx-status-demo': isDemo }">{{ isDemo ? 'Sample Data' : 'Live' }}</span>
            </div>
            <div class="wx-current-main">
              <div class="wx-temp-block">
                <ion-icon :icon="weatherIcon" class="wx-big-icon"></ion-icon>
                <div>
                  <strong class="wx-temp">{{ conditions ? Math.round(conditions.temperatureC) : '29' }}°C</strong>
                  <p class="wx-condition">{{ conditions ? describeWeatherCode(conditions.weatherCode) : 'Partly cloudy' }}</p>
                </div>
              </div>
              <p class="wx-updated-time">Last updated {{ updatedLabel }}</p>
            </div>
            <p v-if="isDemo" class="wx-demo-notice">Showing sample data{{ error ? ' • ' + error : '' }}</p>
          </section>

          <section class="wx-section">
            <h2 class="wx-section-title">Weather Details</h2>
            <div class="wx-details-grid">
              <div class="wx-detail-item">
                <span class="wx-detail-label">Feels Like</span>
                <strong class="wx-detail-value">{{ conditions ? Math.round(conditions.apparentTemperatureC) : 31 }}°C</strong>
              </div>
              <div class="wx-detail-item">
                <span class="wx-detail-label">Rain Chance</span>
                <strong class="wx-detail-value">{{ rainLabel }}</strong>
              </div>
              <div class="wx-detail-item">
                <span class="wx-detail-label">Humidity</span>
                <strong class="wx-detail-value">{{ humidityLabel }}</strong>
              </div>
              <div class="wx-detail-item">
                <span class="wx-detail-label">Wind Speed</span>
                <strong class="wx-detail-value">{{ windLabel }}</strong>
              </div>
            </div>
          </section>

          <section class="wx-section">
            <div class="wx-section-header">
              <div>
                <h2 class="wx-section-title">{{ weatherSuggestions.title }}</h2>
                <p class="wx-suggestion-sub">{{ weatherSuggestions.subtitle }}</p>
              </div>
            </div>
            <div class="wx-suggestion-list">
              <button v-for="suggestion in weatherSuggestions.places" :key="suggestion.id" class="wx-suggestion-card" type="button" @click="openSuggestion(suggestion)">
                <img v-if="suggestionImage(suggestion)" :src="suggestionImage(suggestion)" :alt="suggestion.name" @error="markSuggestionImageFailed(suggestion)" />
                <div v-else class="wx-suggestion-fallback"><ion-icon :icon="leafOutline"></ion-icon></div>
                <div class="wx-suggestion-info">
                  <strong>{{ suggestion.name }}</strong>
                  <span>{{ suggestion.category }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="wx-section">
            <div class="wx-section-header">
              <h2 class="wx-section-title">Travel Alerts</h2>
              <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer" class="wx-pagasa-link">
                PAGASA <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </a>
            </div>
            <div v-if="alerts.length" class="wx-alerts-list">
              <article v-for="alert in alerts" :key="alert.title" class="wx-alert-card" :class="`wx-alert-${alert.tone}`">
                <div class="wx-alert-icon">
                  <ion-icon :icon="warningOutline"></ion-icon>
                </div>
                <div class="wx-alert-content">
                  <strong>{{ alert.title }}</strong>
                  <p>{{ alert.detail }}</p>
                </div>
              </article>
            </div>
            <div v-else class="wx-alerts-list">
              <article class="wx-alert-card wx-alert-info">
                <div class="wx-alert-icon">
                  <ion-icon :icon="cloudOutline"></ion-icon>
                </div>
                <div class="wx-alert-content">
                  <strong>No active alerts</strong>
                  <p>Conditions look good for travel right now.</p>
                </div>
              </article>
            </div>
            <p class="wx-disclaimer">This page shows weather info for planning purposes. Always check official PAGASA advisories for severe weather warnings.</p>
          </section>

          <div class="wx-spacer"></div>
        </div>

        <RideBottomNav active="home" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.wx-app {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.wx-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.wx-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.wx-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.wx-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.wx-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
  flex-shrink: 0;
}

.wx-brand :deep(.brand-wordmark) {
  width: 76px;
  height: auto;
  flex-shrink: 0;
}

.wx-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wx-action-btn {
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
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06);
}

.wx-action-btn:disabled {
  opacity: 0.7;
}

.wx-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wx-greet-line {
  color: #3F8064;
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.wx-greet-title {
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.wx-greet-sub {
  color: #658078;
  font-size: 13px;
  margin: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.wx-content {
  padding: 16px;
  max-width: 100%;
}

.wx-current-card {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
  margin-bottom: 18px;
}

.wx-current-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(90deg, #F2F8F3 0%, #ffffff 100%);
  border-bottom: 1px solid #F2F8F3;
}

.wx-location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #174C40;
  font-size: 13px;
  font-weight: 500;
}

.wx-location ion-icon {
  color: #3F8064;
  font-size: 18px;
}

.wx-status {
  background: #E8F4EC;
  color: #3F8064;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.wx-status-demo {
  background: #FFF4E6;
  color: #B45309;
}

.wx-current-main {
  padding: 16px 14px;
}

.wx-temp-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}

.wx-big-icon {
  font-size: 56px;
  color: #3F8064;
  flex-shrink: 0;
}

.wx-temp {
  color: #174C40;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  font-family: 'Poppins', sans-serif;
}

.wx-condition {
  color: #174C40;
  font-size: 16px;
  font-weight: 500;
  margin: 4px 0 0 0;
}

.wx-updated-time {
  color: #658078;
  font-size: 12px;
  margin: 0;
}

.wx-demo-notice {
  padding: 0 14px 14px 14px;
  margin: 0;
  color: #B45309;
  font-size: 12px;
}

.wx-section {
  margin-bottom: 18px;
}

.wx-section-title {
  color: #174C40;
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px 0;
  font-family: 'Poppins', sans-serif;
}

.wx-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.wx-section-header .wx-section-title {
  margin: 0;
}

.wx-suggestion-sub {
  color: #658078;
  font-size: 12px;
  margin: 4px 0 0 0;
}

.wx-suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wx-suggestion-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  font: inherit;
  width: 100%;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
}

.wx-suggestion-card img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.wx-suggestion-fallback {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #E8F4EC;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 26px;
  flex-shrink: 0;
}

.wx-suggestion-info {
  flex: 1;
  min-width: 0;
}

.wx-suggestion-info strong {
  color: #174C40;
  font-size: 14px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wx-suggestion-info span {
  color: #658078;
  font-size: 12px;
}

.wx-suggestion-card ion-icon:last-child {
  color: #658078;
  font-size: 18px;
}

.wx-pagasa-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #3F8064;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.wx-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.wx-detail-item {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
}

.wx-detail-label {
  color: #658078;
  font-size: 12px;
}

.wx-detail-value {
  color: #174C40;
  font-size: 18px;
  font-weight: 600;
}

.wx-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wx-alert-card {
  display: flex;
  gap: 12px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
}

.wx-alert-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.wx-alert-content {
  flex: 1;
  min-width: 0;
}

.wx-alert-content strong {
  color: #174C40;
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}

.wx-alert-content p {
  color: #658078;
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
}

.wx-alert-watch .wx-alert-icon {
  background: #FEF3C7;
  color: #D97706;
}

.wx-alert-info .wx-alert-icon {
  background: #E8F4EC;
  color: #3F8064;
}

.wx-disclaimer {
  color: #658078;
  font-size: 11px;
  margin: 12px 0 0 0;
  line-height: 1.5;
}

.wx-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .wx-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .wx-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
