<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { Position as CapacitorPosition } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { busOutline, checkmarkCircleOutline, compassOutline, documentTextOutline, locationOutline, navigateOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import LiveRouteProgress from '../components/LiveRouteProgress.vue';
import TripStopProgress from '../components/TripStopProgress.vue';
import { loadAlertSettings } from '../data/alertSettings';
import { getRideDestinations } from '../data/destinations';
import { createEmptyItinerary, getUntrackedItineraryStops, ITINERARY_DRAFT_KEY, loadItinerary, SAVED_ITINERARY_KEY, type Itinerary } from '../data/itinerary';
import { getTrip, loadTrips, saveSavedTrip, updateTrip, SAVED_TRIP_ID_KEY } from '../data/trips';
import { beginLoadingOperation } from '../composables/loadingProgress';
import { showError, showSuccess } from '../composables/feedback';

type Mode = 'tricycle' | 'natsco' | 'vodactco' | 'jeepney' | 'multicab';
type RouteSelection = { mode: Mode; fromId: string; toId: string; fareReference: string; travelTime: string };
type Coordinates = { latitude: number; longitude: number; accuracy: number };
type LocationUpdate = { coords: Coordinates };
const route = useRoute();
const router = useRouter();
const previewMode = route.query.demo === '1';
const requestedTripId = typeof route.query.tripId === 'string' ? route.query.tripId : '';
const progressKey = previewMode ? 'ride.live-preview-progress' : requestedTripId ? `ride.live-progress.${requestedTripId}` : 'ride.live-progress';
const places = getRideDestinations();
const modes: Record<Mode, string> = {
  tricycle: 'Tricycle (Tric)',
  natsco: 'NATSCO  -  Naujan Transportation Service Cooperative',
  vodactco: 'VODACTCO  -  Victoria Operators Drivers and Commuters Transport Cooperative',
  jeepney: 'Jeepney (PUJ)',
  multicab: 'Multicab',
};
const itinerary = ref<Itinerary>(createEmptyItinerary());
const activeTripId = ref('');
const routeSelection = ref<RouteSelection | null>(null);
const currentLocation = ref<Coordinates | null>(null);
const locationStatus = ref('Location has not been shared. Enable it to show your current position while this page is open.');
const locationError = ref('');
const nativeRuntime = Capacitor.isNativePlatform();
const alertSettings = ref(loadAlertSettings());
const arrivalModalVisible = ref(false);
const isLiveTracking = computed(() => watchId.value !== null);
const gpsSupported = nativeRuntime
  ? Capacitor.isPluginAvailable('Geolocation')
  : typeof navigator !== 'undefined' && 'geolocation' in navigator;
const notificationsSupported = nativeRuntime
  ? Capacitor.isPluginAvailable('LocalNotifications')
  : typeof Notification !== 'undefined';
const visitedIds = ref<string[]>([]);
const tripEnded = ref(false);
const watchId = ref<string | number | null>(null);
let lastAlertedId = '';
let arrivalPromptedForId = '';
let locationSession = 0;
let locationStartPending = false;
let alertDispatchPending = false;
let alertFailureShown = false;
const sourceKey = route.query.source === 'saved' ? SAVED_ITINERARY_KEY : ITINERARY_DRAFT_KEY;

function readRoute(): RouteSelection | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`${sourceKey}.route`) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null || !('mode' in parsed) || typeof parsed.mode !== 'string'
      || !Object.hasOwn(modes, parsed.mode) || !('fromId' in parsed) || typeof parsed.fromId !== 'string'
      || !('toId' in parsed) || typeof parsed.toId !== 'string' || !('fareReference' in parsed) || typeof parsed.fareReference !== 'string'
      || !('travelTime' in parsed) || typeof parsed.travelTime !== 'string') return null;
    return { mode: parsed.mode as Mode, fromId: parsed.fromId, toId: parsed.toId, fareReference: parsed.fareReference, travelTime: parsed.travelTime };
  } catch { return null; }
}
try {
  const activeTrip = requestedTripId ? getTrip(requestedTripId) : null;
  itinerary.value = activeTrip?.itinerary ?? loadItinerary(sourceKey) ?? createEmptyItinerary();
  activeTripId.value = activeTrip?.id ?? localStorage.getItem(SAVED_TRIP_ID_KEY) ?? '';
  routeSelection.value = activeTrip?.selectedRoute
    ? { ...activeTrip.selectedRoute, mode: activeTrip.selectedRoute.mode as Mode }
    : readRoute();
  if (previewMode) {
    itinerary.value = { ...createEmptyItinerary(), tripName: 'RIDE Live Sample Preview', stopIds: ['calapan-cathedral', 'calapan-city-plaza'] };
    routeSelection.value = null;
    visitedIds.value = [];
    tripEnded.value = false;
  } else {
    const progress = JSON.parse(localStorage.getItem(progressKey) ?? 'null') as { stopIds?: unknown; visitedIds?: unknown; ended?: unknown } | null;
    if (progress?.stopIds && Array.isArray(progress.stopIds) && progress.stopIds.join(',') === itinerary.value.stopIds.join(',')) {
      visitedIds.value = Array.isArray(progress.visitedIds)
        ? [...new Set(progress.visitedIds.filter((id): id is string => typeof id === 'string' && itinerary.value.stopIds.includes(id)))]
        : [];
      tripEnded.value = progress.ended === true;
    } else {
      visitedIds.value = activeTrip?.visitedStopIds ?? [];
      localStorage.setItem(progressKey, JSON.stringify({ stopIds: itinerary.value.stopIds, visitedIds: visitedIds.value, ended: false }));
    }
  }
} catch { /* Show the empty-trip fallback if local storage is unavailable. */ }

const tripPlaces = computed(() => itinerary.value.stopIds.map((id) => places.find((place) => place.id === id)).filter((place) => place !== undefined));
const untrackedStops = computed(() => getUntrackedItineraryStops(itinerary.value));
const selectedDestination = computed(() => tripPlaces.value.find((place) => !visitedIds.value.includes(place.id)));
const currentStopNumber = computed(() => selectedDestination.value ? tripPlaces.value.findIndex((place) => place.id === selectedDestination.value?.id) + 1 : tripPlaces.value.length);
const remainingStops = computed(() => tripPlaces.value.filter((place) => !visitedIds.value.includes(place.id)));
const distanceKm = computed(() => {
  const location = currentLocation.value;
  const destination = selectedDestination.value;
  if (!location || !destination) return null;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(destination.latitude - location.latitude);
  const dLon = rad(destination.longitude - location.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(location.latitude)) * Math.cos(rad(destination.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
});

const estimatedArrival = computed(() => {
  const distance = distanceKm.value;
  if (!distance || !currentLocation.value || !selectedDestination.value) return null;
  // Use route selection travel time as a rough basis, or assume 30 km/h average city speed
  const routeTime = routeSelection.value?.travelTime;
  let averageSpeedKmh = 30; // typical city speed
  if (routeTime) {
    const match = routeTime.match(/(\d+)\s*min/);
    if (match) {
      // Estimate speed from route: we don't know route distance, so use a heuristic
      averageSpeedKmh = 25; // conservative city average with stops
    }
  }
  const hours = distance / averageSpeedKmh;
  const minutes = Math.max(1, Math.round(hours * 60));
  return { minutes, distance };
});
const mapUrl = computed(() => {
  if (!selectedDestination.value) return '';
  const destination = `${selectedDestination.value.latitude},${selectedDestination.value.longitude}`;
  const origin = currentLocation.value ? `${currentLocation.value.latitude},${currentLocation.value.longitude}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}&travelmode=transit`;
});
const mapEmbedUrl = computed(() => {
  if (currentLocation.value) {
    const position = `${currentLocation.value.latitude.toFixed(4)},${currentLocation.value.longitude.toFixed(4)}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(position)}&z=17&output=embed`;
  }
  const destination = selectedDestination.value;
  if (!destination) return '';
  const target = `${destination.latitude},${destination.longitude}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(target)}&z=15&output=embed`;
});
watch(() => selectedDestination.value?.id, (destinationId, previousId) => {
  if (destinationId && previousId && destinationId !== previousId) {
    lastAlertedId = '';
    arrivalPromptedForId = '';
    alertFailureShown = false;
    arrivalModalVisible.value = false;
  }
});

function persistProgress() {
  try { localStorage.setItem(progressKey, JSON.stringify({ stopIds: itinerary.value.stopIds, visitedIds: visitedIds.value, ended: tripEnded.value })); }
  catch { locationError.value = 'Trip progress could not be saved on this device.'; }
}
function notificationId(placeId: string) {
  let hash = 0;
  for (const character of placeId) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0;
  return 1 + (hash % 2_147_483_646);
}

async function sendDestinationAlert(destination: (typeof places)[number]) {
  if (lastAlertedId === destination.id || alertDispatchPending) return;
  alertDispatchPending = true;
  const distanceLabel = alertSettings.value.distance >= 1000
    ? `${alertSettings.value.distance / 1000} km`
    : `${alertSettings.value.distance} m`;
  try {
    if (!notificationsSupported) throw new Error('Notifications are not supported on this device.');
    if (nativeRuntime) {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        throw new Error('Notifications are blocked. Allow them in your device settings, then try again.');
      }
      await LocalNotifications.schedule({
        notifications: [{
          id: notificationId(destination.id),
          title: 'Get off soon',
          body: `${destination.name} is within ${distanceLabel}. Get ready for your stop.`,
          foreground: true,
          isExactNotification: false,
        }],
      });
    } else {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        throw new Error('Notifications are blocked for this site. Allow them in your browser site settings.');
      }
      if (!window.isSecureContext) {
        throw new Error('Notifications need HTTPS or localhost. Open RIDE from its secure website.');
      }
      new Notification('Get off soon', { body: `${destination.name} is within ${distanceLabel}. Get ready for your stop.` });
    }
    lastAlertedId = destination.id;
  } catch (error) {
    if (!alertFailureShown) {
      alertFailureShown = true;
      showError(error instanceof Error
        ? error.message
        : 'Get-off alert could not be shown. Check notification permission in Settings.');
    }
  } finally {
    alertDispatchPending = false;
  }
}

function onPosition(position: LocationUpdate | CapacitorPosition) {
  currentLocation.value = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
  locationStatus.value = 'Current position updates while RIDE Live is open.';
  locationError.value = '';
  const destination = selectedDestination.value;
  if (!previewMode && !tripEnded.value && destination && distanceKm.value !== null
    && (distanceKm.value * 1000) + position.coords.accuracy <= 100 && arrivalPromptedForId !== destination.id) {
    arrivalPromptedForId = destination.id;
    arrivalModalVisible.value = true;
  }
  if (alertSettings.value.enabled && destination && distanceKm.value !== null
    && distanceKm.value * 1000 <= alertSettings.value.distance && lastAlertedId !== destination.id) {
    void sendDestinationAlert(destination);
  }
}

function onLocationError(error: unknown) {
  const details = typeof error === 'object' && error !== null
    ? error as { code?: unknown; message?: unknown }
    : {};
  const errorCode = details.code;
  const errorMessage = typeof details.message === 'string' ? details.message : '';
  const permissionWasDenied = errorCode === 1
    || errorCode === 'OS-PLUG-GLOC-0003'
    || errorMessage.toLowerCase().includes('permission request was denied');
  currentLocation.value = null;
  locationStatus.value = permissionWasDenied ? 'Location permission was denied.' : 'GPS position is unavailable.';
  locationError.value = 'You can still open the destination in a map for directions.';
  stopLocation();
}

async function startLocation(): Promise<boolean> {
  if (untrackedStops.value.length) {
    locationError.value = `Live tracking needs verified place details. Remove ${untrackedStops.value.map((stop) => stop.name).join(', ')} in the itinerary planner first.`;
    return false;
  }
  if (tripEnded.value && visitedIds.value.length < tripPlaces.value.length) {
    tripEnded.value = false;
    persistProgress();
  }
  if (!gpsSupported) {
    locationStatus.value = nativeRuntime ? 'Native GPS is unavailable in this build.' : 'GPS is not supported in this browser.';
        locationError.value = 'Use the map link for directions instead.';
    return false;
  }
  if (watchId.value !== null) return true;
  if (locationStartPending) return false;

  locationStartPending = true;
  const session = ++locationSession;
  const finishLoading = beginLoadingOperation();
  locationStatus.value = 'Requesting location permission…';
  try {
    if (nativeRuntime) {
      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions({ permissions: ['location'] });
      }
      if (permission.location !== 'granted') {
        onLocationError({ code: 'OS-PLUG-GLOC-0003', message: 'Location permission request was denied.' });
        return false;
      }

      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000, interval: 5000 },
        (position, error) => {
          if (session !== locationSession) return;
          if (error) { onLocationError(error); return; }
          if (position) onPosition(position);
        },
      );
      if (session !== locationSession) {
        await Geolocation.clearWatch({ id });
        return false;
      }
      watchId.value = id;
      locationStatus.value = 'Location updates are active while RIDE Live is open.';
    } else {
      if (!navigator.geolocation) {
        locationStatus.value = 'GPS is not supported in this browser.';
    locationError.value = 'Use the map link for directions instead.';
        return false;
      }
      watchId.value = navigator.geolocation.watchPosition(
        onPosition,
        onLocationError,
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
      );
      locationStatus.value = 'Location updates are active while this page is open.';
    }
    return true;
  } catch (error) {
    onLocationError(error);
    return false;
  } finally {
    locationStartPending = false;
    finishLoading();
  }
}

function stopLocation() {
  locationSession += 1;
  const id = watchId.value;
  watchId.value = null;
  if (typeof id === 'string') void Geolocation.clearWatch({ id }).catch(() => undefined);
  else if (id !== null && typeof navigator !== 'undefined' && navigator.geolocation) navigator.geolocation.clearWatch(id);
}
function confirmArrived(placeId: string) {
  if (selectedDestination.value?.id !== placeId || visitedIds.value.includes(placeId)) return;
  arrivalModalVisible.value = true;
}

function confirmArrival() {
  const destination = selectedDestination.value;
  if (!destination || previewMode) return;
  arrivalModalVisible.value = false;
  markVisited(destination.id);
  if (visitedIds.value.length === tripPlaces.value.length) {
    completeTrip();
    return;
  }
  showSuccess(`${destination.name} marked as visited. Continue to your next stop.`);
}

function markVisited(placeId: string) {
  if (!visitedIds.value.includes(placeId)) visitedIds.value = [...visitedIds.value, placeId];
  if (lastAlertedId === placeId) lastAlertedId = '';
  persistProgress();
  if (activeTripId.value) {
    try { updateTrip(activeTripId.value, (record) => ({ ...record, visitedStopIds: [...new Set([...record.visitedStopIds, placeId])] })); }
    catch { locationError.value = 'Stop progress could not be added to the trip record.'; }
  }
}
function openReceipt() {
  const completedFallback = loadTrips().find((trip) => trip.status === 'completed');
  const id = activeTripId.value || completedFallback?.id || '';
  if (!id) {
    showError('No trip receipt is available yet.');
    return;
  }
  void router.push({ name: 'TripCompletion', params: { id } });
}
function completeTrip() {
  if (untrackedStops.value.length) {
    showError(`This trip includes places without verified map details. Remove ${untrackedStops.value.map((stop) => stop.name).join(', ')} before completing it.`);
    return;
  }
  if (tripPlaces.value.length && visitedIds.value.length < tripPlaces.value.length) {
    showError('Confirm each destination with “I’m here” before completing the trip.');
    return;
  }
  tripEnded.value = true;
  stopLocation();
  persistProgress();
  if (!previewMode) {
    try {
      const record = saveSavedTrip(itinerary.value, routeSelection.value ?? undefined, activeTripId.value || undefined);
      const completedAt = new Date();
      const completed = updateTrip(record.id, (current) => ({
        ...current,
        status: 'completed',
        completedAt: completedAt.toISOString(),
        ...(current.startedAt ? { durationMs: Math.max(0, completedAt.getTime() - new Date(current.startedAt).getTime()) } : {}),
        visitedStopIds: [...new Set([...current.visitedStopIds, ...visitedIds.value])],
      }));
      activeTripId.value = completed.id;
      void router.push({ name: 'TripCompletion', params: { id: completed.id } });
    } catch { locationError.value = 'Trip marked complete on this page, but its receipt could not be saved.'; }
  }
}
onIonViewWillEnter(() => {
  alertSettings.value = loadAlertSettings();
  alertFailureShown = false;
  if (alertSettings.value.enabled && !previewMode && !tripEnded.value && selectedDestination.value && watchId.value === null) {
    void startLocation();
  }
});
onBeforeUnmount(stopLocation);
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="ride-live-shell">
        <RideAppHeader
          :eyebrow="`Live Trip${previewMode ? ' - Preview' : ''}`"
          :title="itinerary.tripName || 'Your Trip'"
          show-back
        />

        <section class="ride-live-content">
          <p v-if="previewMode" class="ride-live-preview-note">Sample preview using destinations in the RIDE guide. This is not an active trip, and location, route, and timing are not simulated.</p>
          <p v-if="untrackedStops.length" class="explore-status" role="alert">
            This trip includes places without verified map details: {{ untrackedStops.map((stop) => stop.name).join(', ') }}.
            <router-link to="/itinerary">Remove them in the itinerary planner</router-link> to use live tracking.
          </p>
          <section class="ride-live-overview" aria-label="Trip progress">
            <div class="ride-live-overview-copy">
              <p class="ride-live-overview-title">Trip progress</p>
              <p>
                {{ tripPlaces.length }} {{ tripPlaces.length === 1 ? 'stop' : 'stops' }}
                <span aria-hidden="true">·</span>
                {{ visitedIds.length }} visited
                <template v-if="itinerary.travelDate">
                  <span aria-hidden="true">·</span>
                  {{ new Date(`${itinerary.travelDate}T00:00:00`).toLocaleDateString() }}
                </template>
              </p>
            </div>
            <div class="ride-live-hero-stats">
              <div class="ride-live-stat">
                <span class="ride-live-stat-value">{{ Math.min(currentStopNumber, tripPlaces.length) }}</span>
                <span class="ride-live-stat-label">Next Stop</span>
              </div>
              <div class="ride-live-stat">
                <span class="ride-live-stat-value">{{ remainingStops.length }}</span>
                <span class="ride-live-stat-label">Remaining</span>
              </div>
            </div>
          </section>

          <template v-if="tripPlaces.length">
            <section class="live-card live-map-section" aria-labelledby="live-map-title">
              <div class="live-section-heading">
                <div>
                  <p class="live-card-kicker">Location</p>
                  <h2 id="live-map-title" class="live-section-title">{{ currentLocation ? 'Your live location' : 'Trip map' }}</h2>
                </div>
                <span class="live-section-badge" :class="{ 'live-section-badge-on': isLiveTracking }">{{ isLiveTracking ? 'Tracking' : 'Location off' }}</span>
              </div>
              <div class="live-map-card" aria-label="Live trip map">
                <iframe v-if="mapEmbedUrl && currentLocation" :key="mapEmbedUrl" :src="mapEmbedUrl" title="Map showing your current location and destination" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                <div v-else class="live-map-placeholder">
                  <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                  <strong>{{ gpsSupported ? 'Start live tracking to show your location' : 'GPS is unavailable on this device' }}</strong>
                  <span>The map updates while RIDE Live is open.</span>
                </div>
              </div>
              <div class="live-location-strip">
                <div>
                  <span>Current location</span>
                  <strong>{{ currentLocation ? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}` : 'Not shared' }}</strong>
                  <small>{{ currentLocation ? `GPS accuracy: ${Math.round(currentLocation.accuracy)} m` : locationStatus }}</small>
                </div>
                <div>
                  <span>Distance to {{ selectedDestination?.name ?? 'stop' }}</span>
                  <strong>{{ distanceKm !== null ? `${distanceKm.toFixed(2)} km straight-line` : 'Unavailable' }}</strong>
                  <small>Straight-line estimate. Road distance is not available in RIDE.</small>
                </div>
                <div v-if="estimatedArrival && currentLocation">
                  <span>Estimated arrival</span>
                  <strong>in about {{ estimatedArrival.minutes }} min</strong>
                  <small>Based on straight-line distance and typical city speed.</small>
                </div>
              </div>
            </section>

            <section class="live-card live-focus-card" aria-labelledby="live-destination-title">
              <div class="live-focus-head">
                <div class="live-focus-copy">
                  <p class="live-card-kicker">{{ previewMode ? `Preview  -  ${tripPlaces.length} stops` : tripEnded ? 'Trip completed' : `Next stop  -  ${currentStopNumber} of ${tripPlaces.length}` }}</p>
                  <h2 id="live-destination-title" class="live-card-title">{{ selectedDestination?.name ?? 'All stops visited' }}</h2>
                  <p v-if="selectedDestination" class="live-place-address">
                    <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                    <span>{{ selectedDestination.address }}, {{ selectedDestination.city }}, {{ selectedDestination.province }}</span>
                  </p>
                </div>
                <div class="live-card-icon">
                  <ion-icon :icon="busOutline"></ion-icon>
                </div>
              </div>

              <TripStopProgress v-if="!previewMode" :visited="visitedIds.length" :total="tripPlaces.length" />

              <div v-if="routeSelection" class="live-transport-chip">
                <ion-icon :icon="busOutline" aria-hidden="true"></ion-icon>
                <span>{{ modes[routeSelection.mode] }}</span>
              </div>

              <div class="live-actions-grid">
                <button class="live-action live-action-primary" type="button" :disabled="!gpsSupported || untrackedStops.length > 0" @click="isLiveTracking ? stopLocation() : startLocation()">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  <span>{{ isLiveTracking ? 'Stop Tracking' : 'Start Live Tracking' }}</span>
                </button>
                <a v-if="mapUrl" class="live-action live-action-secondary" :href="mapUrl" target="_blank" rel="noreferrer">
                  <ion-icon :icon="navigateOutline"></ion-icon>
                  <span>Open Directions</span>
                </a>
                <button v-if="routeSelection" class="live-action live-action-ghost" type="button" @click="router.push({ name: 'RouteDetails', query: { from: routeSelection.fromId, to: routeSelection.toId, mode: routeSelection.mode, fareInfo: routeSelection.fareReference, travelTime: routeSelection.travelTime, stops: itinerary.stopIds.join(',') } })">
                  <ion-icon :icon="busOutline"></ion-icon>
                  <span>Route Details</span>
                </button>
              </div>

              <p v-if="locationError" class="explore-status" role="status">{{ locationError }}</p>

              <div v-if="selectedDestination && !previewMode && !tripEnded" class="live-arrival-card">
                <div class="live-arrival-text">
                  <p class="live-arrival-title">Already at this stop?</p>
                  <p class="live-arrival-sub">Tap “I arrived” to mark {{ selectedDestination.name }} as visited and continue to the next stop.</p>
                </div>
                <button class="live-arrival-btn" type="button" @click="confirmArrived(selectedDestination.id)">
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  I arrived
                </button>
              </div>
            </section>

            <section class="live-card" aria-labelledby="live-stops-title">
              <div class="live-section-heading">
                <div>
                  <p class="live-card-kicker">{{ previewMode ? 'Sample route' : 'Trip progress' }}</p>
                  <h2 id="live-stops-title" class="live-section-title">Stops in order</h2>
                </div>
                <span class="live-section-badge">{{ visitedIds.length }}/{{ tripPlaces.length }} visited</span>
              </div>
              <LiveRouteProgress :stops="tripPlaces" :visited-ids="visitedIds" :current-stop-id="previewMode ? undefined : selectedDestination?.id" :allow-marking="false" />
              <p v-if="previewMode" class="itinerary-data-note">This sample does not record real stop progress. Start a trip to track visited stops.</p>
            </section>

            <div class="live-complete-bar">
              <div class="live-complete-copy">
                <strong>{{ tripEnded ? 'Trip completed' : 'Finish your trip' }}</strong>
                <span>{{ tripEnded ? 'Your trip receipt is ready to view.' : `Mark all ${tripPlaces.length} ${tripPlaces.length === 1 ? 'stop' : 'stops'} as visited to complete this trip.` }}</span>
              </div>
              <button v-if="!tripEnded" class="live-complete-btn" type="button" :disabled="previewMode || untrackedStops.length > 0 || visitedIds.length !== tripPlaces.length" @click="completeTrip">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>Mark Trip as Complete</span>
              </button>
              <button v-if="tripEnded && activeTripId" class="live-complete-btn" type="button" @click="openReceipt">
                <ion-icon :icon="documentTextOutline"></ion-icon>
                <span>View Receipt</span>
              </button>
              <router-link v-if="!tripEnded" class="live-summary-link" :to="{ name: 'TripSummary', query: { tripId: activeTripId || undefined, source: route.query.source === 'saved' ? 'saved' : undefined } }">
                <span>View Trip Summary</span>
                <ion-icon :icon="navigateOutline"></ion-icon>
              </router-link>
            </div>
          </template>

          <section v-else class="live-card live-empty">
            <span class="live-empty-icon" aria-hidden="true"><ion-icon :icon="compassOutline"></ion-icon></span>
            <h2>No active trip</h2>
            <p>Choose a saved itinerary or add stops in the planner before starting RIDE Live.</p>
            <router-link to="/itinerary" class="button-primary">Open Itinerary Planner</router-link>
          </section>
        </section>

        <div v-if="arrivalModalVisible && selectedDestination" class="live-arrival-backdrop" @click.self="arrivalModalVisible = false">
          <section class="live-arrival-dialog" role="alertdialog" aria-modal="true" aria-labelledby="live-arrival-title" aria-describedby="live-arrival-description">
            <span class="live-arrival-icon"><ion-icon :icon="checkmarkCircleOutline" aria-hidden="true"></ion-icon></span>
            <p class="kicker"><span class="kicker-line"></span> Destination reached</p>
            <h2 id="live-arrival-title">Nakarating ka na ba?</h2>
            <p id="live-arrival-description">Malapit ka na sa <strong>{{ selectedDestination.name }}</strong>. Kumpirmahin kung naroon ka na para ma-update ang itinerary.</p>
            <div class="live-arrival-dialog-actions">
              <button class="button-secondary" type="button" @click="arrivalModalVisible = false">Not yet</button>
              <button class="button-primary" type="button" @click="confirmArrival">I’m here</button>
            </div>
          </section>
        </div>
        <RideBottomNav active="trips" />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.ride-live-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--surface-soft) 0%, var(--bg) 40%);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.ride-live-hero-stats {
  display: flex;
  gap: 10px;
}

.ride-live-overview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px;
  border: 1px solid var(--surface-soft);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 12px 32px -28px color-mix(in srgb, var(--brand-deep) 0.5, transparent);
}

.ride-live-overview-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.ride-live-overview-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.ride-live-overview-copy .ride-live-overview-title {
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
}

.ride-live-stat {
  display: flex;
  min-width: 104px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  padding: 8px 14px;
  border: 1px solid var(--surface-soft);
  border-radius: 14px;
  background: var(--bg);
}

.ride-live-stat-value {
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
}

.ride-live-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-secondary);
}

.ride-live-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  padding: 20px 16px 0 16px;
}

.live-card {
  padding: clamp(18px, 4vw, 24px);
  border: 1px solid var(--surface-soft);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: 0 24px 60px -52px color-mix(in srgb, var(--brand-deep) 0.75, transparent);
}

.live-focus-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.live-focus-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.live-focus-copy {
  min-width: 0;
}

.live-card-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 11px;
  color: var(--brand-accent);
  font-weight: 700;
}

.live-card-title {
  margin: 5px 0 0 0;
  font-family: var(--font-body);
  font-size: clamp(21px, 4.5vw, 27px);
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.2;
}

.live-place-address {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 8px 0 0;
  color: var(--text-body);
  font-size: 0.84rem;
  line-height: 1.45;
}

.live-place-address ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--brand-accent);
}

.live-place-address span {
  min-width: 0;
}

.live-card-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--brand-accent) 0.14, transparent);
  color: var(--brand-accent);
  font-size: 26px;
}

.live-transport-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  max-width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--surface-soft);
  border-radius: 999px;
  background: var(--bg);
  color: var(--brand-mid);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
}

.live-transport-chip ion-icon {
  flex: 0 0 auto;
  font-size: 1rem;
}

.live-transport-chip span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.live-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.live-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 48px;
  padding: 11px 18px;
  border: 1px solid transparent;
  border-radius: 14px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

.live-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.live-action-primary {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%);
  color: var(--on-brand);
  box-shadow: 0 18px 40px -26px rgba(47, 107, 79, 0.9);
}

.live-action-secondary {
  background: var(--surface-soft);
  color: var(--brand-accent);
}

.live-action-ghost {
  border-color: var(--border);
  background: var(--surface);
  color: var(--brand-accent);
}

.live-arrival-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--brand-accent) 12%, var(--surface)) 0%, var(--surface-soft) 100%);
}

.live-arrival-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.live-arrival-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 0.92rem;
  font-weight: 700;
}

.live-arrival-sub {
  margin: 0;
  color: var(--brand-accent);
  font-size: 0.82rem;
  line-height: 1.45;
}

.live-arrival-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 46px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%);
  color: var(--on-brand);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}

.live-map-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.live-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.live-section-title {
  margin: 4px 0 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.25;
}

.live-section-badge {
  flex: 0 0 auto;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

.live-section-badge-on {
  background: var(--border);
  color: var(--brand-mid);
}

.live-map-card {
  overflow: hidden;
  border: 1px solid var(--surface-soft);
  border-radius: 18px;
}

.live-map-card iframe {
  display: block;
  width: 100%;
  height: 280px;
  border: 0;
}

.live-map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 280px;
  padding: 18px;
  text-align: center;
  color: var(--text-body);
  background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 12%, transparent) 0%, var(--surface-soft) 100%);
}

.live-map-placeholder ion-icon {
  font-size: 36px;
  color: var(--brand-accent);
}

.live-location-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.live-location-strip > div {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--surface-soft);
  border-radius: 14px;
  background: var(--bg);
}

.live-location-strip span {
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.live-location-strip strong {
  color: var(--text-strong);
  font-size: 0.84rem;
  line-height: 1.4;
  word-break: break-word;
}

.live-location-strip small {
  color: var(--text-secondary);
  font-size: 0.72rem;
  line-height: 1.4;
}

.live-complete-bar {
  display: grid;
  gap: 10px;
  padding: 4px 0 8px;
}

.live-complete-copy {
  display: grid;
  gap: 3px;
  text-align: center;
}

.live-complete-copy strong {
  color: var(--text-strong);
  font-size: 0.95rem;
}

.live-complete-copy span {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
}

.live-complete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  padding: 14px 24px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--brand-mid) 0%, var(--brand-deep) 100%);
  color: var(--on-brand);
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 26px 50px -30px rgba(31, 77, 55, 0.95);
  cursor: pointer;
}

.live-complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.live-summary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--brand-accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
}

.live-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 32px 22px;
  text-align: center;
}

.live-empty-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-size: 1.6rem;
}

.live-empty h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 1.2rem;
}

.live-empty p {
  max-width: 360px;
  margin: 0 0 8px;
  color: var(--text-body);
  font-size: 0.88rem;
  line-height: 1.5;
}

.live-arrival-backdrop {
  position: fixed;
  z-index: 10000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  background: rgb(15 35 27 / 55%);
  backdrop-filter: blur(3px);
}

.live-arrival-dialog {
  display: grid;
  width: min(440px, 100%);
  max-height: calc(100dvh - max(32px, env(safe-area-inset-top)) - max(32px, env(safe-area-inset-bottom)));
  justify-items: center;
  gap: 14px;
  padding: clamp(20px, 6vw, 28px);
  overflow-y: auto;
  border: 1px solid var(--surface-soft);
  border-radius: 24px;
  background: var(--surface);
  box-shadow: 0 30px 70px rgba(15, 35, 27, 0.25);
  text-align: center;
}

.live-arrival-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--brand-accent) 0.16, transparent);
  color: var(--brand-accent);
  font-size: 30px;
}

.live-arrival-dialog h2 {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-strong);
}

.live-arrival-dialog p {
  margin: 0;
  color: var(--text-body);
  line-height: 1.5;
}

.live-arrival-dialog strong {
  color: var(--text-strong);
}

.live-arrival-dialog-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.live-arrival-dialog-actions > * {
  flex: 1;
  min-width: 0;
  min-height: 48px;
}

@media (max-width: 380px) {
  .live-arrival-dialog-actions {
    flex-direction: column-reverse;
  }
}

@media (min-width: 640px) {
  .ride-live-content {
    padding: 24px 24px 0;
  }

  .live-arrival-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .live-arrival-btn {
    flex: 0 0 auto;
  }

  .live-actions-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .live-complete-bar {
    grid-template-columns: 1fr auto auto;
    align-items: center;
  }

  .live-complete-copy {
    text-align: left;
  }

  .live-summary-link {
    justify-self: end;
  }
}

@media (max-width: 520px) {
  .ride-live-overview {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .ride-live-hero-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ride-live-stat {
    min-width: 0;
  }
}
</style>
