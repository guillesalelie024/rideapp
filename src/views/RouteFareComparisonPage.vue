<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  busOutline,
  carOutline,
  chevronForwardOutline,
  locationOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getCalapanPlaces, type CalapanPlace } from '../data/calapan';

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
}

const route = useRoute();
const router = useRouter();
const places = getCalapanPlaces();

const FARE_RANGES: Record<TransportMode, FareRange> = {
  natsco: { min: 14, max: 25 },
  vodactco: { min: 14, max: 25 },
  jeepney: { min: 10, max: 40 },
  multicab: { min: 20, max: 50 },
  tricycle: { min: 20, max: 200 },
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'natsco', name: 'NATSCO', icon: busOutline, fare: FARE_RANGES.natsco },
  { id: 'vodactco', name: 'VODACTCO', icon: busOutline, fare: FARE_RANGES.vodactco },
  { id: 'jeepney', name: 'Jeepney', icon: busOutline, fare: FARE_RANGES.jeepney },
  { id: 'multicab', name: 'Multicab', icon: carOutline, fare: FARE_RANGES.multicab },
  { id: 'tricycle', name: 'Tricycle', icon: carOutline, fare: FARE_RANGES.tricycle },
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
const searchQuery = ref(initialDestination?.name ?? '');
const selectedDestination = ref<CalapanPlace | null>(initialDestination);
const selectedOrigin = computed(() => places.find((place) => place.id === selectedOriginId.value) ?? null);
const passengers = typeof route.query.passengers === 'string'
  ? Math.min(50, Math.max(1, Number(route.query.passengers) || 1))
  : 1;
const tripId = typeof route.query.tripId === 'string' ? route.query.tripId : '';
const stopsQuery = typeof route.query.stops === 'string' ? route.query.stops : routeStops.join(',');
const validRouteSelected = computed(() => Boolean(
  selectedOrigin.value && selectedDestination.value && selectedOriginId.value !== selectedDestination.value.id,
));
watch(searchQuery, (query) => {
  if (selectedDestination.value && query !== selectedDestination.value.name) {
    selectedDestination.value = null;
  }
});

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLocaleLowerCase();
  if (!q) return [];
  return places.filter((place) => place.name.toLocaleLowerCase().includes(q)).slice(0, 8);
});

function formatFareRange(range: FareRange): string {
  return `₱${range.min}–₱${range.max}`;
}

function getCheapestOptions(): TransportOption[] {
  if (!selectedDestination.value) return [];
  const minFares = TRANSPORT_OPTIONS.map((opt) => opt.fare.min);
  const lowestMin = Math.min(...minFares);
  return TRANSPORT_OPTIONS.filter((opt) => opt.fare.min === lowestMin);
}

function isCheapest(option: TransportOption): boolean {
  const cheapest = getCheapestOptions();
  return cheapest.some((opt) => opt.id === option.id);
}

function cheapestLabel(): string {
  const cheapest = getCheapestOptions();
  if (cheapest.length === 0) return '';
  if (cheapest.length === 1) return `${cheapest[0].name} has the lowest starting fare`;
  const names = cheapest.map((o) => o.name).join(', ');
  return `${names} are tied for the lowest starting fare`;
}

function selectDestination(dest: CalapanPlace) {
  selectedDestination.value = dest;
  searchQuery.value = dest.name;
}

function clearSearch() {
  searchQuery.value = '';
  selectedDestination.value = null;
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
          <section class="fare-section">
            <label class="fare-endpoint-label" for="fare-origin">Starting point</label>
            <div class="search-card">
              <div class="search-icon-wrap"><ion-icon :icon="locationOutline"></ion-icon></div>
              <select id="fare-origin" v-model="selectedOriginId" class="search-input fare-origin-select">
                <option value="">Choose a starting point</option>
                <option v-for="place in places" :key="place.id" :value="place.id">{{ place.name }}</option>
              </select>
            </div>
            <p class="fare-endpoint-help">Select where your trip begins, then choose a different destination.</p>
            <label class="fare-endpoint-label" for="fare-destination">Destination</label>
            <div class="search-card">
              <div class="search-icon-wrap">
                <ion-icon :icon="locationOutline"></ion-icon>
              </div>
              <input
                v-model="searchQuery"
                id="fare-destination"
                type="search"
                placeholder="Type a destination name…"
                class="search-input"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="search-clear"
                @click="clearSearch"
                aria-label="Clear search"
              >
                ×
              </button>
            </div>

            <div
              v-if="searchResults.length > 0 && searchQuery.trim() && searchQuery !== selectedDestination?.name"
              class="search-dropdown"
            >
              <button
                v-for="dest in searchResults"
                :key="dest.id"
                type="button"
                class="search-option"
                @click="selectDestination(dest)"
              >
                <div class="search-option-info">
                  <strong class="search-option-name">{{ dest.name }}</strong>
                  <span class="search-option-sub">{{ dest.address }}, {{ dest.city }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="search-option-arrow"></ion-icon>
              </button>
            </div>

            <div v-if="searchQuery.trim() && searchResults.length === 0" class="search-no-results">
              <p>No matching destination found.</p>
            </div>
          </section>

          <p v-if="selectedDestination && selectedOriginId === selectedDestination.id" class="fare-route-error" role="alert">
            Choose a different starting point and destination.
          </p>
          <section v-if="selectedDestination && validRouteSelected" class="fare-comparison-section">
            <div class="comparison-header">
              <div>
                <p class="kicker"><span class="kicker-line"></span> {{ selectedOrigin?.name }} to {{ selectedDestination.name }}</p>
                <h2 class="comparison-title">Transport options &amp; fare ranges</h2>
              </div>
            </div>

            <div class="fare-grid">
              <article
                v-for="option in TRANSPORT_OPTIONS"
                :key="option.id"
                class="fare-card"
                :class="{ 'fare-card-cheapest': isCheapest(option) }"
              >
                <div class="fare-card-header">
                  <div class="fare-card-icon">
                    <ion-icon :icon="option.icon"></ion-icon>
                  </div>
                  <div class="fare-card-title-wrap">
                    <h3 class="fare-card-name">{{ option.name }}</h3>
                    <span v-if="isCheapest(option)" class="cheapest-badge">Cheapest</span>
                  </div>
                </div>
                <div class="fare-card-body">
                  <p class="fare-card-range">{{ formatFareRange(option.fare) }}</p>
                  <p class="fare-card-per">per person (estimated)</p>
                </div>
                <button
                  type="button"
                  class="fare-card-btn"
                  @click="router.push({
                    name: 'RouteDetails',
                    query: {
                      mode: option.id,
                      from: selectedOriginId,
                      to: selectedDestination.id,
                      passengers: String(passengers),
                      stops: stopsQuery,
                      tripId: tripId || undefined,
                    },
                  })"
                >
                  View details
                  <ion-icon :icon="chevronForwardOutline"></ion-icon>
                </button>
              </article>
            </div>

            <div class="cheapest-note">
              <ion-icon :icon="locationOutline" class="cheapest-note-icon"></ion-icon>
              <div class="cheapest-note-text">
                <strong>{{ cheapestLabel() }}</strong>
                <span>Actual fares depend on the route and distance.</span>
              </div>
            </div>

            <p class="fare-disclaimer">
              All fares are preliminary estimates, not confirmed fares for each destination. Actual fares depend on the passenger's starting point, route, distance, operator, and whether the trip is shared or special. Confirm the route and fare with the driver or transport operator before traveling.
            </p>
          </section>

          <!-- Empty state -->
          <section v-if="!searchQuery.trim()" class="empty-state">
            <div class="empty-icon">
              <ion-icon :icon="busOutline"></ion-icon>
            </div>
            <h2 class="empty-title">Choose your route</h2>
            <p class="empty-sub">Select a starting point and search for a different destination to compare available fare references.</p>
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
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.fare-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
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
  background: white;
  border: 1px solid #DCE9DF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 22px;
  cursor: pointer;
}

.fare-header-greet {
  max-width: 100%;
}

.fare-greet-line {
  color: #3F8064;
  font-weight: 600;
  font-size: 13px;
  margin: 0 0 4px 0;
}

.fare-greet-title {
  margin: 0 0 6px 0;
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.fare-greet-sub {
  margin: 0;
  color: #658078;
  font-size: 14px;
}

.fare-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fare-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Search card */
.search-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 0 14px;
  height: 52px;
}

.fare-endpoint-label { margin: 4px 2px -6px; color: #174c40; font-size: 14px; font-weight: 700; }
.fare-endpoint-help { margin: -5px 2px 2px; color: #658078; font-size: 12px; line-height: 1.5; }
.fare-origin-select { width: 100%; height: 50px; padding-right: 8px; background: #fff; }
.fare-route-error { margin: 0; padding: 12px 14px; border-radius: 12px; background: #fdf0ef; color: #a11d1d; font-size: 13px; }

.search-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 20px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #174C40;
  min-width: 0;
}

.search-input::placeholder {
  color: #9fb3a8;
}

.search-clear {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F2F8F3;
  border: none;
  color: #3F8064;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.search-clear:hover {
  background: #E8F4EC;
}

/* Search dropdown */
.search-dropdown {
  border: 1px solid #DCE9DF;
  border-top: none;
  border-radius: 0 0 14px 14px;
  background: white;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(63, 128, 100, 0.08);
}

.search-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: #174C40;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.search-option:hover {
  background: #F2F8F3;
}

.search-option-info {
  flex: 1;
  min-width: 0;
}

.search-option-name {
  display: block;
  color: #174C40;
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-option-sub {
  display: block;
  color: #658078;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.search-option-arrow {
  color: #658078;
  font-size: 18px;
  flex-shrink: 0;
}

.search-no-results {
  padding: 16px 14px;
  color: #658078;
  font-size: 13px;
  text-align: center;
}

.fare-comparison-section {
  margin-top: 8px;
}

.comparison-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.comparison-header .kicker {
  color: #3F8064;
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
  margin: 0 0 4px 0;
  color: #174C40;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
}

.fare-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fare-card {
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(63, 128, 100, 0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fare-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(63, 128, 100, 0.08);
}

.fare-card-cheapest {
  border-color: #3F8064;
  background: #F0F7F2;
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
  background: #E8F4EC;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 22px;
  flex-shrink: 0;
}

.fare-card-cheapest .fare-card-icon {
  background: #D1E8DC;
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
  color: #174C40;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
}

.cheapest-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: #3F8064;
  color: white;
  font-size: 10px;
  font-weight: 700;
  margin-top: 2px;
}

.fare-card-body {
  padding: 10px 16px 14px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.fare-card-range {
  margin: 0 0 2px 0;
  color: #174C40;
  font-size: 20px;
  font-weight: 800;
  font-family: 'Poppins', sans-serif;
}

.fare-card-per {
  margin: 0;
  color: #658078;
  font-size: 12px;
}

.fare-card-btn {
  margin: 0 16px 16px 16px;
  border: none;
  background: transparent;
  color: #3F8064;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.fare-card-btn ion-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.fare-card-btn:hover {
  text-decoration: underline;
}

/* Cheapest note */
.cheapest-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #F0F7F2;
  border: 1px solid #D1E8DC;
  border-radius: 12px;
  margin-top: 12px;
}

.cheapest-note-icon {
  color: #3F8064;
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
  color: #174C40;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.cheapest-note-text span {
  display: block;
  color: #658078;
  font-size: 12px;
  line-height: 1.5;
}

/* Disclaimer */
.fare-disclaimer {
  margin: 16px 0 0 0;
  color: #658078;
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
  background: #F2F8F3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 32px;
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  color: #174C40;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
}

.empty-sub {
  margin: 0;
  color: #658078;
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
  .fare-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 479px) {
  .fare-grid {
    grid-template-columns: 1fr;
  }
}
</style>
