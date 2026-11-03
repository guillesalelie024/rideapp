<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { busOutline, carOutline, checkmarkCircleOutline, compassOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { completePlanningStep } from '../data/flowProgress';
import { CALAPAN_CITY, getCalapanPlaces } from '../data/calapan';
import { ITINERARY_DRAFT_KEY, loadItinerary, SAVED_ITINERARY_KEY } from '../data/itinerary';
import { updateTrip } from '../data/trips';
import { showError, showSuccess } from '../composables/feedback';

type Mode = 'tricycle' | 'natsco' | 'vodactco' | 'jeepney' | 'multicab';
const modes: Record<Mode, { name: string; icon: string }> = {
  tricycle: { name: 'Tricycle (Tric)', icon: carOutline },
  natsco: { name: 'NATSCO · Naujan Transportation Service Cooperative', icon: busOutline },
  vodactco: { name: 'VODACTCO · Victoria Operators Drivers and Commuters Transport Cooperative', icon: busOutline },
  jeepney: { name: 'Jeepney (PUJ)', icon: busOutline },
  multicab: { name: 'Multicab', icon: carOutline },
};
const route = useRoute();
const router = useRouter();
const places = getCalapanPlaces();
const safeQuery = (value: unknown) => typeof value === 'string' ? value : '';
const flowTripId = computed(() => safeQuery(route.query.tripId) || undefined);
const fromId = safeQuery(route.query.from);
const toId = safeQuery(route.query.to);
const fromPlace = computed(() => places.find((place) => place.id === fromId));
const toPlace = computed(() => places.find((place) => place.id === toId));
const fromName = computed(() => fromPlace.value?.name ?? (fromId && !places.some((place) => place.id === fromId) ? fromId.slice(0, 100) : 'Starting point unavailable'));
const toName = computed(() => toPlace.value?.name ?? 'Destination unavailable');
const modeId = safeQuery(route.query.mode) as Mode;
const mode = computed(() => modes[modeId]);
const supported = computed(() => modeId === 'tricycle' && Boolean(fromPlace.value && toPlace.value && fromId !== toId));
const fareReference = computed(() => modeId === 'tricycle' ? '₱15 minimum for the first 2 km; add ₱1 per additional kilometer.' : 'Fare information unavailable for this trip.');
const routeInfo = computed(() => modeId === 'natsco'
  ? 'NATSCO is documented on the Calapan City–Naujan corridor. Its boarding and drop-off points for this selected trip are not verified.'
  : modeId === 'vodactco'
    ? 'VODACTCO is documented separately on the Calapan City–Victoria corridor. Its boarding and drop-off points for this selected trip are not verified.'
    : safeQuery(route.query.routeInfo) || 'Route instructions and boarding points are not available in the verified local guide.');
const mapUrl = computed(() => fromPlace.value && toPlace.value
  ? `https://www.google.com/maps/dir/?api=1&origin=${fromPlace.value.latitude},${fromPlace.value.longitude}&destination=${toPlace.value.latitude},${toPlace.value.longitude}&travelmode=transit`
  : '');
const itineraryStops = safeQuery(route.query.stops).split(',').filter((id) => places.some((place) => place.id === id));
const passengers = Math.min(50, Math.max(1, Number(route.query.passengers) || 1));
const saved = ref(false);
const detailQuery = computed(() => ({ from: fromId, to: toId, mode: modeId, passengers: String(passengers), stops: itineraryStops.join(','), tripId: flowTripId.value }));
const compareRoute = computed(() => router.resolve({
  name: 'Commute',
  query: { ...detailQuery.value, detail: modeId },
}).fullPath);

function chooseRoute() {
  if (!supported.value) return;
  try {
    const selection = {
      mode: modeId,
      fromId,
      toId,
      fareReference: fareReference.value,
      travelTime: 'Unavailable',
      selectedAt: new Date().toISOString(),
    };
    localStorage.setItem('ride.selected-route', JSON.stringify(selection));
    const tripId = safeQuery(route.query.tripId);
    if (tripId) updateTrip(tripId, (trip) => ({ ...trip, selectedRoute: selection }));
    for (const key of [ITINERARY_DRAFT_KEY, SAVED_ITINERARY_KEY]) {
      const itinerary = loadItinerary(key);
      if (itinerary && (!itineraryStops.length || itinerary.stopIds.some((id) => itineraryStops.includes(id)))) {
        localStorage.setItem(`${key}.route`, JSON.stringify(selection));
      }
    }
    saved.value = true;
    showSuccess('Selected route saved with your itinerary on this device.');
  } catch {
    showError('This route could not be saved. Check browser storage and try again.');
  }
}

function continueToTrip() {
  if (supported.value && saved.value) {
    completePlanningStep('compare', flowTripId.value);
  }
  void router.push({ name: 'TripSummary', query: { tripId: flowTripId.value } });
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="explore-page">
        <RideAppHeader
          eyebrow="Route details"
          title="Review your route"
          subtitle="Check the selected transport and endpoints before continuing."
          show-back
          :back-to="compareRoute"
        />
        <section class="explore-content page-width route-details-page">
          <section v-if="mode" class="route-detail-layout" aria-labelledby="selected-route-title">
            <section class="route-detail-card route-trip-card" aria-label="Selected trip">
              <div class="route-trip-heading">
                <span class="route-mode-icon"><ion-icon :icon="mode.icon" aria-hidden="true"></ion-icon></span>
                <div>
                  <p class="route-step-label">Selected transport</p>
                  <h2 id="selected-route-title">{{ mode.name }}</h2>
                </div>
              </div>
              <div class="route-endpoints">
                <div class="route-endpoint">
                  <span class="route-endpoint-marker" aria-hidden="true"></span>
                  <div><small>STARTING POINT</small><strong>{{ fromName }}</strong><span>{{ fromPlace ? `${fromPlace.address}, ${fromPlace.city}` : 'Starting point unavailable' }}</span></div>
                </div>
                <div class="route-endpoint route-endpoint-destination">
                  <span class="route-endpoint-marker" aria-hidden="true"></span>
                  <div><small>DESTINATION</small><strong>{{ toName }}</strong><span>{{ toPlace ? `${toPlace.address}, ${toPlace.city}` : CALAPAN_CITY }}</span></div>
                </div>
              </div>
            </section>

            <section
              class="route-detail-card route-status-card"
              :class="supported ? 'route-status-supported' : 'route-status-unavailable'"
              aria-live="polite"
            >
              <p class="route-step-label">Route and fare status</p>
              <template v-if="supported">
                <h3>Fare reference available</h3>
                <p class="route-fare-amount">{{ fareReference }}</p>
                <p class="route-detail-help">This is a published reference, not a quote for your specific trip. The exact fare depends on distance and current operator rates.</p>
                <details class="route-fare-source">
                  <summary>About this fare reference</summary>
                  <p>The reference is ₱15 minimum for the first 2 km plus ₱1 per additional kilometer, as reported by PIA from Calapan City Ordinance No. 110 (2022). Confirm the current posted fare matrix with the driver.</p>
                  <a href="https://pia.gov.ph/news/p15-minimum-na-pasahe-sa-mga-tricycle-sa-lungsod-ng-calapan-ipatutupad-na/" target="_blank" rel="noreferrer">Read the PIA report</a>
                </details>
              </template>


              <template v-else>
                <h3>Route not verified for this trip</h3>
                <p class="route-detail-help">{{ routeInfo }}</p>
                <p class="route-detail-help">RIDE can’t confirm this transport’s stops or fare for the selected endpoints. It won’t be saved as your selected transport.</p>
              </template>
            </section>

            <section v-if="mapUrl" class="route-detail-card route-map-card">
              <div class="route-map-copy">
                <span class="route-map-icon"><ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon></span>
                <div>
                  <h3>Need directions?</h3>
                  <p>Open these endpoints in Google Maps. Check the suggested route with the operator before traveling.</p>
                </div>
              </div>
              <a class="button-secondary route-map-link" :href="mapUrl" target="_blank" rel="noreferrer">Open Google Maps</a>
            </section>

            <section class="route-next-step" aria-label="Next step">
              <div>
                <h3>What would you like to do?</h3>
                <p v-if="supported && saved">This transport is saved with your trip.</p>
                <p v-else-if="supported">You can save this fare reference or continue without selecting transport.</p>
                <p v-else>Go back to choose another option, or continue planning without a selected transport.</p>
              </div>
              <div class="route-detail-actions">
                <button v-if="supported" class="button-primary" type="button" :disabled="saved" @click="chooseRoute">
                  <ion-icon v-if="saved" :icon="checkmarkCircleOutline" aria-hidden="true"></ion-icon>
                  {{ saved ? 'Added to trip' : 'Add transport to trip' }}
                </button>
                <button class="button-secondary" type="button" @click="continueToTrip">
                  {{ supported && saved ? 'Continue to trip summary' : 'Continue without transport' }}
                </button>
              </div>
            </section>
          </section>
          <section v-else class="route-detail-card route-invalid-card" role="alert">
            <h2>Route option unavailable</h2>
            <p>The selected transportation mode or destination could not be verified. Go back and choose a valid route.</p>
            <button class="button-secondary" type="button" @click="router.push(compareRoute)">Back to fare options</button>
          </section>
        </section>
        <RideBottomNav active="trips" />
      </main>
    </ion-content>
  </ion-page>
</template>
