<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  busOutline,
  carOutline,
  chevronDownOutline,
  locationOutline,
  alertCircleOutline,
  cloudOutline,
} from 'ionicons/icons';
import { useRoute } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getDistanceInKilometers } from '../data/calapan';
import { getRideDestination, getRideDestinations } from '../data/destinations';
import { getExploreCategoryListings, getExploreListingId, getExploreListingLocation } from '../data/exploreListings';
import { fetchCalapanWeather, describeWeatherCode, isRainyWeather } from '../data/weather';
import {
  fetchRouteReports, fetchQueueReports, type RouteReport, type QueueReport,
} from '../data/api';

interface CommutePlace {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  category?: string;
}

function buildExplorePlaces(): CommutePlace[] {
  const byId = new Map<string, CommutePlace>();
  for (const [category, listings] of Object.entries(getExploreCategoryListings())) {
    for (const listing of listings) {
      const id = getExploreListingId(listing.name, category);
      if (byId.has(id)) continue;
      const place = getRideDestination(id);
      const loc = getExploreListingLocation(listing, category, place);
      byId.set(id, {
        id,
        name: listing.name,
        address: loc.value,
        city: 'Calapan City',
        latitude: place?.latitude ?? null,
        longitude: place?.longitude ?? null,
        category,
      });
    }
  }
  for (const p of getRideDestinations()) {
    if (byId.has(p.id)) continue;
    byId.set(p.id, { id: p.id, name: p.name, address: p.address, city: p.city || 'Calapan City', latitude: p.latitude, longitude: p.longitude, category: p.category });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type TransportMode = 'tricycle' | 'natsco' | 'vodactco' | 'jeepney' | 'multicab';

interface FareRange {
  min: number;
  max: number;
}

interface TransportOption {
  id: TransportMode;
  name: string;
  icon: string;
  fare: FareRange;
  estimatedMinutes: number;
  convenience: number; // 1-10
  routeConditions: number; // 1-10
}

const route = useRoute();
const places = buildExplorePlaces();

const FARE_RANGES: Record<TransportMode, FareRange> = {
  natsco: { min: 14, max: 25 },
  vodactco: { min: 14, max: 25 },
  jeepney: { min: 10, max: 40 },
  multicab: { min: 20, max: 50 },
  tricycle: { min: 20, max: 200 },
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'natsco', name: 'NATSCO', icon: busOutline, fare: FARE_RANGES.natsco, estimatedMinutes: 45, convenience: 7, routeConditions: 8 },
  { id: 'vodactco', name: 'VODACTCO', icon: busOutline, fare: FARE_RANGES.vodactco, estimatedMinutes: 50, convenience: 7, routeConditions: 8 },
  { id: 'jeepney', name: 'Jeepney', icon: busOutline, fare: FARE_RANGES.jeepney, estimatedMinutes: 55, convenience: 6, routeConditions: 7 },
  { id: 'multicab', name: 'Multicab', icon: carOutline, fare: FARE_RANGES.multicab, estimatedMinutes: 40, convenience: 8, routeConditions: 7 },
  { id: 'tricycle', name: 'Tricycle', icon: carOutline, fare: FARE_RANGES.tricycle, estimatedMinutes: 35, convenience: 5, routeConditions: 6 },
];

const routeStops = typeof route.query.stops === 'string'
  ? [...new Set(route.query.stops.split(',').filter((id) => places.some((place) => place.id === id)))]
  : [];
const requestedOrigin = typeof route.query.from === 'string' ? route.query.from : routeStops[0] ?? '';
const requestedDestination = typeof route.query.to === 'string'
  ? route.query.to
  : routeStops.length > 1 ? routeStops[routeStops.length - 1] : '';
const selectedOriginId = ref(places.some((place) => place.id === requestedOrigin) ? requestedOrigin : '');
const initialDestination = places.find((place) => place.id === requestedDestination) ?? null;
const selectedDestination = ref<CommutePlace | null>(initialDestination);
const selectedOrigin = computed(() => places.find((place) => place.id === selectedOriginId.value) ?? null);
const destinationOptions = computed(() => places.filter((place) => place.id !== selectedOriginId.value));
const validRouteSelected = computed(() => Boolean(
  selectedOrigin.value && selectedDestination.value && selectedOriginId.value !== selectedDestination.value.id,
));
watch(selectedOriginId, (id) => {
  if (selectedDestination.value && selectedDestination.value.id === id) selectedDestination.value = null;
});

const weather = ref<{ temperatureC: number; weatherCode: number; rainChancePercent: number; description: string } | null>(null);
const weatherLoading = ref(false);
const weatherError = ref('');
const routeReports = ref<RouteReport[]>([]);
const queueReports = ref<QueueReport[]>([]);
const reportsLoading = ref(false);

async function loadWeather() {
  weatherLoading.value = true;
  weatherError.value = '';
  try {
    const conditions = await fetchCalapanWeather();
    weather.value = {
      temperatureC: conditions.temperatureC,
      weatherCode: conditions.weatherCode,
      rainChancePercent: conditions.rainChancePercent,
      description: describeWeatherCode(conditions.weatherCode),
    };
  } catch (error) {
    weatherError.value = error instanceof Error ? error.message : 'Weather information is temporarily unavailable.';
    weather.value = null;
  } finally {
    weatherLoading.value = false;
  }
}

async function loadReports() {
  reportsLoading.value = true;
  try {
    const [reportsResult, queuesResult] = await Promise.all([
      fetchRouteReports(),
      fetchQueueReports(),
    ]);
    routeReports.value = reportsResult;
    queueReports.value = queuesResult;
  } catch (error) {
    // Reports are optional; silently ignore errors
  } finally {
    reportsLoading.value = false;
  }
}

onMounted(() => {
  loadWeather();
  loadReports();
});

function formatFareRange(range: FareRange): string {
  return `₱${range.min}–₱${range.max}`;
}

function getCheapestOptions(): TransportOption[] {
  if (!selectedDestination.value) return [];
  const minFares = TRANSPORT_OPTIONS.map((opt: TransportOption) => opt.fare.min);
  const lowestMin = Math.min(...minFares);
  return TRANSPORT_OPTIONS.filter((opt: TransportOption) => opt.fare.min === lowestMin);
}

function calculateSmartScore(option: TransportOption): { score: number; factors: string[]; warnings: string[] } {
  const factors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Fare factor (30 points max)
  const avgFare = (option.fare.min + option.fare.max) / 2;
  const maxFare = Math.max(...TRANSPORT_OPTIONS.map((o) => (o.fare.min + o.fare.max) / 2));
  const fareScore = maxFare > 0 ? Math.round(30 * (1 - avgFare / maxFare)) : 30;
  score += fareScore - 30; // normalize: base 100, fare contributes 0-30
  if (fareScore > 20) factors.push('Low fare');
  else if (fareScore < 10) factors.push('Higher fare');

  // Time factor (25 points max)
  const maxMinutes = Math.max(...TRANSPORT_OPTIONS.map((o) => o.estimatedMinutes));
  const timeScore = maxMinutes > 0 ? Math.round(25 * (1 - option.estimatedMinutes / maxMinutes)) : 25;
  score += timeScore - 25;
  if (timeScore > 15) factors.push('Fast travel time');
  else if (timeScore < 10) factors.push('Longer travel time');

  // Convenience factor (20 points max)
  const convScore = Math.round(20 * option.convenience / 10);
  score += convScore - 20;
  if (convScore > 14) factors.push('Convenient boarding');
  else if (convScore < 10) factors.push('Less convenient stops');

  // Route conditions factor (15 points max)
  const condScore = Math.round(15 * option.routeConditions / 10);
  score += condScore - 15;
  if (condScore > 10) factors.push('Good route conditions');
  else if (condScore < 8) factors.push('Route may have delays');

  // Weather factor (10 points max)
  if (weather.value) {
    const isRainy = isRainyWeather({ weatherCode: weather.value.weatherCode, precipitationMm: weather.value.rainChancePercent > 0 ? weather.value.rainChancePercent / 100 : 0 });
    if (isRainy) {
      score -= 5;
      warnings.push('Rain expected — allow extra travel time');
    } else if (weather.value.rainChancePercent > 30) {
      score -= 2;
      warnings.push('Possible rain later — monitor conditions');
    } else {
      factors.push('Clear weather conditions');
    }
  } else {
    score -= 3;
    warnings.push('Weather data unavailable');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, factors, warnings };
}

function getSmartScore(option: TransportOption) {
  return calculateSmartScore(option);
}

const isCheapest = (option: TransportOption): boolean => {
  const cheapest = getCheapestOptions();
  return cheapest.some((opt) => opt.id === option.id);
};

const isRecommended = (option: TransportOption): boolean => {
  const best = getRecommendedOption();
  return best ? best.id === option.id : false;
};

const cheapestLabel = (): string => {
  const cheapest = getCheapestOptions();
  if (cheapest.length === 0) return '';
  if (cheapest.length === 1) return `${cheapest[0].name} has the lowest starting fare`;
  const names = cheapest.map((o) => o.name).join(', ');
  return `${names} are tied for the lowest starting fare`;
};

function getRecommendedOption(): TransportOption | null {
  if (!selectedDestination.value) return null;
  let best: TransportOption | null = null;
  let bestScore = -1;
  for (const option of TRANSPORT_OPTIONS) {
    const { score } = getSmartScore(option);
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best;
}

function reportsNearPlace(place: CommutePlace | null, radiusKm = 5): { route: RouteReport[]; queue: QueueReport[] } {
  if (!place || place.latitude == null || place.longitude == null) return { route: [], queue: [] };
  const center = { latitude: place.latitude, longitude: place.longitude };
  return {
    route: routeReports.value.filter((r) => getDistanceInKilometers(r.latitude, r.longitude, center) < radiusKm),
    queue: queueReports.value.filter((q) => getDistanceInKilometers(q.latitude, q.longitude, center) < radiusKm),
  };
}

const originConditions = computed(() => reportsNearPlace(selectedOrigin.value));
const destinationConditions = computed(() => reportsNearPlace(selectedDestination.value));
const routeConditionAlerts = computed(() => {
  if (!validRouteSelected.value) return [];
  const alerts: Array<{ key: string; scope: string; kind: 'route' | 'queue'; category: string; locationName: string; detail: string; status: string; tone: 'danger' | 'warning' | 'info' }> = [];
  const seen = new Set<string>();
  const pushRoute = (scope: string, r: RouteReport) => {
    const key = `r-${scope}-${r.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const tone = r.category === 'flood' || r.category === 'road_closure' ? 'danger' : r.category === 'traffic' || r.category === 'transport_delay' ? 'warning' : 'info';
    alerts.push({ key, scope, kind: 'route', category: r.category, locationName: r.locationName, detail: r.description, status: r.status, tone });
  };
  const pushQueue = (scope: string, q: QueueReport) => {
    const key = `q-${scope}-${q.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const tone = q.queueLevel === 'long' ? 'danger' : q.queueLevel === 'moderate' ? 'warning' : 'info';
    alerts.push({ key, scope, kind: 'queue', category: `Queue: ${q.queueLevel}`, locationName: q.locationName, detail: q.description || 'Expect possible delays.', status: 'reported', tone });
  };
  for (const r of originConditions.value.route) pushRoute('Starting point', r);
  for (const q of originConditions.value.queue) pushQueue('Starting point', q);
  for (const r of destinationConditions.value.route) pushRoute('Destination', r);
  for (const q of destinationConditions.value.queue) pushQueue('Destination', q);
  return alerts;
});

function reportCategoryLabel(category: string): string {
  return ({ flood: 'Baha / Flood', traffic: 'Traffic', road_closure: 'Road closure', transport_delay: 'Transport delay', other: 'Advisory' } as Record<string, string>)[category] || category.replace(/_/g, ' ');
}



</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="fare-page">
        <RideAppHeader
          eyebrow="Commute Comparison"
          title="Where do you want to go?"
          subtitle="Compare transport fares in Calapan City, Oriental Mindoro"
          show-back
        />

        <div class="fare-content">
          <!-- Weather banner -->
          <section v-if="weather" class="weather-banner" aria-label="Current weather">
            <span class="weather-banner-icon-wrap" aria-hidden="true"><ion-icon :icon="cloudOutline"></ion-icon></span>
            <div class="weather-banner-text">
              <strong class="weather-banner-temp">{{ Math.round(weather.temperatureC) }}°C</strong>
              <span class="weather-banner-desc">{{ weather.description }}</span>
            </div>
            <span v-if="weather.rainChancePercent > 0" class="weather-banner-rain">Rain {{ weather.rainChancePercent }}%</span>
          </section>
          <p v-else-if="weatherLoading" class="weather-banner weather-banner-loading" aria-live="polite">Loading weather…</p>

          <section class="fare-section" aria-label="Route selection">
            <p class="fare-endpoint-help fare-endpoint-help-top">Select where your trip begins, then choose a different destination.</p>
            <label class="fare-endpoint-label" for="fare-origin">Starting point</label>
            <div class="search-card home-search app-search fare-bar fare-select-bar">
              <ion-icon class="search-glyph" :icon="locationOutline" aria-hidden="true"></ion-icon>
              <select id="fare-origin" v-model="selectedOriginId" class="search-input fare-origin-select">
                <option value="" disabled>Choose a starting point</option>
                <option v-for="place in places" :key="place.id" :value="place.id">{{ place.name }}</option>
              </select>
              <ion-icon :icon="chevronDownOutline" class="fare-select-caret" aria-hidden="true"></ion-icon>
            </div>
            <div v-if="selectedOrigin && (originConditions.route.length || originConditions.queue.length)" class="place-conditions place-conditions-danger" role="status">
              <ion-icon :icon="alertCircleOutline" aria-hidden="true"></ion-icon>
              <div>
                <strong>May report sa starting point</strong>
                <p>{{ originConditions.route.map((r) => reportCategoryLabel(r.category)).concat(originConditions.queue.map((q) => `Queue: ${q.queueLevel}`)).slice(0, 3).join(' · ') }}. Tingnan ang detalye sa ibaba.</p>
              </div>
            </div>
            <p v-else-if="selectedOrigin && !reportsLoading && selectedOrigin.latitude != null" class="place-conditions place-conditions-ok" role="status">Walang nakatalang traffic o baha malapit sa starting point.</p>

            <label class="fare-endpoint-label" for="fare-destination">Destination</label>
            <div class="search-card home-search app-search fare-bar fare-select-bar">
              <ion-icon class="search-glyph" :icon="locationOutline" aria-hidden="true"></ion-icon>
              <select id="fare-destination" v-model="selectedDestination" class="search-input fare-origin-select" :disabled="!selectedOriginId">
                <option :value="null" disabled>{{ selectedOriginId ? 'Choose a destination' : 'Choose a starting point first' }}</option>
                <option v-for="place in destinationOptions" :key="place.id" :value="place">{{ place.name }}</option>
              </select>
              <ion-icon :icon="chevronDownOutline" class="fare-select-caret" aria-hidden="true"></ion-icon>
            </div>
            <div v-if="selectedDestination && (destinationConditions.route.length || destinationConditions.queue.length)" class="place-conditions place-conditions-danger" role="status">
              <ion-icon :icon="alertCircleOutline" aria-hidden="true"></ion-icon>
              <div>
                <strong>May report sa destination</strong>
                <p>{{ destinationConditions.route.map((r) => reportCategoryLabel(r.category)).concat(destinationConditions.queue.map((q) => `Queue: ${q.queueLevel}`)).slice(0, 3).join(' · ') }}. Tingnan ang detalye sa ibaba.</p>
              </div>
            </div>
            <p v-else-if="selectedDestination && validRouteSelected && !reportsLoading && selectedDestination.latitude != null" class="place-conditions place-conditions-ok" role="status">Walang nakatalang traffic o baha malapit sa destination.</p>
          </section>

          <section v-if="validRouteSelected && routeConditionAlerts.length" class="route-condition-alerts" aria-label="Traffic and flood reports">
            <h3 class="reports-title">Traffic / baha / abiso sa ruta</h3>
            <div class="reports-grid">
              <article v-for="alert in routeConditionAlerts" :key="alert.key" class="report-card" :class="[`tone-${alert.tone}`, alert.kind === 'queue' ? 'queue-report' : 'route-report']">
                <div class="report-category">{{ alert.kind === 'route' ? reportCategoryLabel(alert.category) : alert.category }}</div>
                <div class="report-info">
                  <strong>{{ alert.scope }} · {{ alert.locationName }}</strong>
                  <span>{{ alert.detail }}</span>
                </div>
                <span class="report-status">{{ alert.status }}</span>
              </article>
            </div>
          </section>

          <p v-if="selectedDestination && selectedOriginId === selectedDestination.id" class="fare-route-error" role="alert">
            Choose a different starting point and destination.
          </p>

          <section v-if="selectedDestination && validRouteSelected" class="fare-comparison-section">
            <div class="comparison-header">
              <div>
                <p class="kicker"><span class="kicker-line"></span> {{ selectedOrigin?.name }} to {{ selectedDestination.name }}</p>
                <h2 class="comparison-title">Transport options &amp; smart route scores</h2>
                <p class="comparison-sub">Swipe to compare options</p>
              </div>
            </div>

            <div class="fare-deck" role="list" aria-label="Transport options">
              <article
                v-for="option in TRANSPORT_OPTIONS"
                :key="option.id"
                class="fare-card"
                role="listitem"
                :class="{
                  'fare-card-cheapest': isCheapest(option),
                  'fare-card-recommended': isRecommended(option),
                }"
              >
                <div class="fare-card-header">
                  <div class="fare-card-icon">
                    <ion-icon :icon="option.icon"></ion-icon>
                  </div>
                  <div class="fare-card-title-wrap">
                    <h3 class="fare-card-name">{{ option.name }}</h3>
                    <span v-if="isCheapest(option)" class="cheapest-badge">Cheapest</span>
                    <span v-if="isRecommended(option)" class="recommended-badge">Recommended</span>
                  </div>
                </div>
                <div class="fare-card-body">
                  <div class="score-panel" :aria-label="`Smart score ${getSmartScore(option).score} out of 100`">
                    <div class="score-main">
                      <div class="score-circle" :style="{ '--score-pct': getSmartScore(option).score + '%' }">
                        <span class="score-value">{{ getSmartScore(option).score }}</span>
                      </div>
                      <div class="score-copy">
                        <span class="score-label">Smart Score</span>
                        <span class="score-hint">Higher is better · out of 100</span>
                      </div>
                    </div>
                    <div class="score-bar" aria-hidden="true"><span :style="{ width: getSmartScore(option).score + '%' }"></span></div>
                  </div>
                  <div class="fare-metrics">
                    <div class="fare-metric"><span>Fare</span><strong>{{ formatFareRange(option.fare) }}</strong><small>per person (est.)</small></div>
                    <div class="fare-metric"><span>Time</span><strong>{{ option.estimatedMinutes }} min</strong><small>estimated</small></div>
                  </div>
                  <div v-if="getSmartScore(option).factors.length" class="score-factors">
                    <span v-for="(factor, idx) in getSmartScore(option).factors" :key="idx" class="factor-tag">{{ factor }}</span>
                  </div>
                  <div v-if="getSmartScore(option).warnings.length" class="score-warnings">
                    <ion-icon :icon="alertCircleOutline" class="warning-icon"></ion-icon>
                    <span v-for="(warning, idx) in getSmartScore(option).warnings" :key="idx" class="warning-text">{{ warning }}</span>
                  </div>
                </div>
              </article>
            </div>

            <!-- Detailed route reports shown above when a valid route is selected -->

            <div class="cheapest-note">
              <ion-icon :icon="locationOutline" class="cheapest-note-icon"></ion-icon>
              <div class="cheapest-note-text">
                <strong>{{ cheapestLabel() }}</strong>
                <span>Actual fares depend on the route and distance.</span>
              </div>
            </div>

            <p class="fare-disclaimer">
              All fares are preliminary estimates, not confirmed fares for each destination. Actual fares depend on the passenger's starting point, route, distance, operator, and whether the trip is shared or special. Smart scores are estimates based on fare, time, convenience, route conditions, and weather. Confirm the route and fare with the driver or transport operator before traveling.
            </p>
          </section>

          <!-- Empty state -->
          <section v-if="!selectedDestination" class="empty-state">
            <div class="empty-icon">
              <ion-icon :icon="busOutline"></ion-icon>
            </div>
            <h2 class="empty-title">Choose your route</h2>
            <p class="empty-sub">Select a starting point and destination to compare available transport options.</p>
          </section>

          <div class="fare-spacer"></div>
        </div>

        <RideBottomNav active="home" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.fare-page {
  min-height: 100vh;
  background: var(--surface);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.fare-header {
  background: linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-soft) 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.fare-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  width: 100%;
}

.fare-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.fare-action-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 22px;
  cursor: pointer;
}

.fare-header-greet {
  max-width: 100%;
}

.fare-greet-line {
  color: var(--brand-accent);
  font-weight: 600;
  font-size: 13px;
  margin: 0 0 4px 0;
}

.fare-greet-title {
  margin: 0 0 6px 0;
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 600;
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  line-height: 1.15;
}

.fare-greet-sub {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.fare-content {
  padding: 16px max(16px, env(safe-area-inset-right)) 16px max(16px, env(safe-area-inset-left));
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: none;
  margin: 0;
  box-sizing: border-box;
}

.fare-section, .weather-banner {
  display: flex;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.fare-section {
  flex-direction: column;
  gap: 10px;
}

.fare-endpoint-label { margin: 2px 2px 0; color: var(--text-strong); font-size: 14px; font-weight: 700; }
.fare-endpoint-help { margin: 0 2px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.fare-endpoint-help-top { margin-bottom: 2px; }
.fare-bar, .search-card.fare-bar, .search-card.home-search.app-search.fare-bar, .fare-section .search-card { display: flex; width: 100%; max-width: none; min-width: 0; min-height: 60px; box-sizing: border-box; align-self: stretch; }
.fare-select-bar { position: relative; padding-right: 42px; }
.fare-origin-select { flex: 1 1 auto; width: 100%; min-width: 0; min-height: 38px; padding-right: 8px; background: transparent; border: 0; outline: none; appearance: none; -webkit-appearance: none; -moz-appearance: none; cursor: pointer; }
.fare-select-caret { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; color: var(--text-secondary); pointer-events: none; }
.fare-route-error { margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--danger-soft); color: var(--danger); font-size: 13px; }
.place-conditions { display: flex; align-items: flex-start; gap: 10px; margin: -2px 2px 2px; padding: 10px 12px; border-radius: 12px; font-size: 12.5px; line-height: 1.4; }
.place-conditions ion-icon { flex-shrink: 0; font-size: 18px; margin-top: 1px; }
.place-conditions strong { display: block; margin-bottom: 2px; font-size: 12.5px; }
.place-conditions p { margin: 0; }
.place-conditions-danger { background: color-mix(in srgb, var(--danger, #d64545) 10%, var(--surface-soft)); border: 1px solid color-mix(in srgb, var(--danger, #d64545) 22%, var(--border)); color: var(--text-strong); }
.place-conditions-danger ion-icon { color: var(--danger, #d64545); }
.place-conditions-ok { margin: -2px 2px 2px; color: var(--text-secondary); background: transparent; padding: 0 2px; }
.route-condition-alerts { width: 100%; }
.report-card.tone-danger { border-left-color: var(--danger, #d64545); }
.report-card.tone-warning { border-left-color: var(--warning, #d97706); }
.report-card.tone-info { border-left-color: var(--brand-accent); }
.report-card.tone-danger .report-category { color: var(--danger, #d64545); }
.report-card.tone-warning .report-category { color: var(--warning, #b45309); }
.report-card.tone-info .report-category { color: var(--brand-accent); }

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font: inherit;
  font-size: 15px;
  color: var(--text-primary);
  min-width: 0;
  background: transparent;
}
.search-input::placeholder { color: var(--text-muted); }

.search-clear {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-soft);
  border: none;
  color: var(--brand-accent);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.search-clear:hover {
  background: var(--brand-soft);
}

/* Search dropdown */
.search-dropdown {
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 14px 14px;
  background: var(--surface);
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-accent) 0.08, transparent);
}

.search-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--text-strong);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.search-option:hover {
  background: var(--surface-soft);
}

.search-option-info {
  flex: 1;
  min-width: 0;
}

.search-option-name {
  display: block;
  color: var(--text-strong);
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-option-sub {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.search-option-arrow {
  color: var(--text-secondary);
  font-size: 18px;
  flex-shrink: 0;
}

.search-no-results {
  padding: 16px 14px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

/* Weather banner */
.weather-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  padding: 12px 14px;
  background: linear-gradient(180deg, var(--surface), var(--surface-soft));
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}
.weather-banner-loading { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
.weather-banner-icon-wrap {
  display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex-shrink: 0;
  border-radius: 14px; background: var(--brand-soft); color: var(--brand-accent); font-size: 22px;
}
.weather-banner-text { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0; flex-wrap: wrap; }
.weather-banner-temp { color: var(--text-strong); font: 700 18px/1 var(--font-display); }
.weather-banner-desc { color: var(--text-secondary); font-size: 13px; }
.weather-banner-rain {
  margin-left: auto; padding: 4px 10px; border-radius: 999px; background: var(--warning-soft);
  color: var(--warning); font-size: 11px; font-weight: 700; white-space: nowrap;
}

/* Fare comparison section */
.fare-comparison-section {
  margin-top: 8px;
  width: 100%;
}

.comparison-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.comparison-header .kicker {
  color: var(--brand-accent);
  font-weight: 600;
  font-size: 13px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.kicker-line {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.comparison-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-body);
}
.comparison-sub { margin: 2px 0 0; color: var(--text-secondary); font-size: 12px; }

.fare-deck {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(280px, 86vw);
  gap: 14px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 4px 2px 14px;
  margin: 0 -2px;
  scroll-snap-type: x mandatory;
  scroll-padding: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.fare-deck::-webkit-scrollbar { display: none; }

.fare-card {
  background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--surface-soft) 55%, var(--surface)));
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--brand-accent) 0.06, transparent);
  display: flex;
  flex-direction: column;
  min-width: 0;
  scroll-snap-align: start;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.fare-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--brand-accent) 0.1, transparent);
}

.fare-card-cheapest {
  border-color: var(--brand-accent);
  background: var(--surface-soft);
}

.fare-card-recommended {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent-soft) 70%, var(--surface) 30%);
}

.fare-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 0 16px;
}

.fare-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 22px;
  flex-shrink: 0;
}

.fare-card-cheapest .fare-card-icon {
  background: var(--border);
}

.fare-card-recommended .fare-card-icon {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.fare-card-title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fare-card-name {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-body);
}

.cheapest-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--brand);
  color: var(--on-brand);
  font-size: 10px;
  font-weight: 700;
  margin-top: 2px;
}

.recommended-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--on-brand);
  font-size: 10px;
  font-weight: 700;
  margin-top: 2px;
}

.fare-card-body {
  padding: 14px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
}

.score-panel {
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 14%, var(--border));
  border-radius: 16px;
  background: color-mix(in srgb, var(--brand-soft) 42%, var(--surface));
}
.score-main { display: flex; align-items: center; gap: 12px; }
.score-circle {
  --score-pct: 0%;
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: conic-gradient(var(--brand-accent) var(--score-pct), color-mix(in srgb, var(--border) 70%, transparent) 0);
  flex-shrink: 0;
  position: relative;
}
.score-circle::before {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: inset 0 0 0 1px var(--border);
}
.score-value {
  position: relative;
  color: var(--brand-accent);
  font-size: 18px;
  font-weight: 800;
  font-family: var(--font-body);
  line-height: 1;
}
.score-copy { display: grid; gap: 2px; min-width: 0; }
.score-label { color: var(--text-strong); font-size: 13px; font-weight: 700; }
.score-hint { color: var(--text-secondary); font-size: 11px; line-height: 1.3; }
.score-bar { margin-top: 10px; height: 6px; border-radius: 999px; background: color-mix(in srgb, var(--border) 75%, var(--surface)); overflow: hidden; }
.score-bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand-accent), color-mix(in srgb, var(--brand-accent) 70%, var(--accent))); }

.fare-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fare-metric { display: grid; gap: 2px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); min-width: 0; }
.fare-metric span { color: var(--text-muted); font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.fare-metric strong { color: var(--text-strong); font-size: 14px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
.fare-metric small { color: var(--text-secondary); font-size: 11px; }

.score-factors {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.factor-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 10px;
  font-weight: 600;
}

.score-warnings {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.warning-icon {
  color: var(--warning);
  font-size: 14px;
  flex-shrink: 0;
}

.warning-text {
  color: var(--warning);
  font-size: 11px;
  font-weight: 600;
}



/* Cheapest note */
.cheapest-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-top: 12px;
}

.cheapest-note-icon {
  color: var(--brand-accent);
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.cheapest-note-text {
  flex: 1;
  min-width: 0;
}

.cheapest-note-text strong {
  display: block;
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.cheapest-note-text span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

/* Route reports section */
.reports-section {
  margin-top: 16px;
}

.reports-title {
  margin: 0 0 8px 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-body);
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.report-card {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
}

.report-card.route-report {
  border-left: 3px solid var(--danger);
}

.report-card.queue-report {
  border-left: 3px solid var(--accent);
}

.report-category {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.report-card.route-report .report-category {
  color: var(--danger);
}

.report-card.queue-report .report-category {
  color: var(--accent-strong);
}

.report-info {
  flex: 1;
  min-width: 0;
}

.report-info strong {
  display: block;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-info span {
  display: block;
  color: var(--text-secondary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.report-status {
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

/* Disclaimer */
.fare-disclaimer {
  margin: 16px 0 0 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: var(--surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-accent);
  font-size: 32px;
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-body);
}

.empty-sub {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.fare-spacer {
  height: 8px;
}

/* Responsive */
@media (min-width: 480px) {
  .fare-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .fare-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}

@media (min-width: 900px) {
  .fare-deck { grid-auto-columns: minmax(300px, 340px); padding-bottom: 16px; }
}

@media (max-width: 479px) {
  .fare-card-header { flex-direction: column; align-items: flex-start; }
  .fare-metrics { grid-template-columns: 1fr; }
}
</style>