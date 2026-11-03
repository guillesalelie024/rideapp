<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { locationOutline, navigateOutline, refreshOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
import { getDistanceInKilometers, isInsideCalapan } from '../data/calapan';
import { getRideDestinations, type RideDestination } from '../data/destinations';
import { showError } from '../composables/feedback';

type Coordinates = { latitude: number; longitude: number };
type NearbyPlace = { place: RideDestination; distanceKm: number };

const router = useRouter();
const places = getRideDestinations();
const position = ref<Coordinates | null>(null);
const locating = ref(false);
const locationError = ref('');
const nearbyPlaces = ref<NearbyPlace[]>([]);

const sortedPreview = computed<NearbyPlace[]>(() => nearbyPlaces.value.length
  ? nearbyPlaces.value
  : places.map((place) => ({ place, distanceKm: Number.NaN })));

function locate() {
  if (locating.value) return;
  locationError.value = '';
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    locationError.value = 'Location is not available on this device. You can still browse all destinations.';
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (result) => {
      locating.value = false;
      const next = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      if (!isInsideCalapan(next.latitude, next.longitude)) {
        locationError.value = 'Your current location is outside Calapan City. Distances are still shown from your position.';
      }
      position.value = next;
      nearbyPlaces.value = places
        .map((place) => ({
          place,
          distanceKm: getDistanceInKilometers(next.latitude, next.longitude, place),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
    (error) => {
      locating.value = false;
      locationError.value = error.code === error.PERMISSION_DENIED
        ? 'Location permission was denied. Enable it in your browser or device settings, or browse all destinations below.'
        : 'Your location could not be determined. Check your connection or GPS and try again.';
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  );
}

function openPlace(place: RideDestination) {
  router.push({ name: 'DestinationDetails', params: { id: place.id } });
}

function directionsUrl(place: RideDestination) {
  const origin = position.value ? `${position.value.latitude},${position.value.longitude}` : '';
  const destination = `${place.latitude},${place.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}&travelmode=transit`;
}

function distanceLabel(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) return 'Distance available after locating';
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`;
}

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  const place = places.find((candidate) => candidate.id === image.dataset.placeId);
  if (place?.imageFallback) image.src = place.imageFallback;
  else showError('A destination photo could not be loaded.');
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="near-page">
        <RideAppHeader
          eyebrow="Near Me"
          title="Places around you"
          subtitle="Sorted by distance from your current location"
          show-back
        />

        <main class="near-content">
          <section class="near-card near-intro">
            <span class="near-icon" aria-hidden="true"><ion-icon :icon="locationOutline"></ion-icon></span>
            <div>
              <h2>{{ position ? 'Showing nearby destinations' : 'Find what is close by' }}</h2>
              <p>
                {{ position
                  ? 'Destinations are sorted by straight-line distance from your current position.'
                  : 'Share your location to sort Calapan destinations by distance. Your location stays on this device.' }}
              </p>
            </div>
          </section>

          <button class="near-locate" type="button" :disabled="locating" @click="locate">
            <ion-icon :icon="position ? refreshOutline : locationOutline" aria-hidden="true"></ion-icon>
            {{ locating ? 'Finding your location...' : position ? 'Update my location' : 'Use my location' }}
          </button>

          <p v-if="locationError" class="near-status" role="status">{{ locationError }}</p>

          <section class="near-list" aria-label="Destinations by distance">
            <article v-for="item in sortedPreview" :key="item.place.id" class="near-card near-place">
              <button class="near-place-main" type="button" @click="openPlace(item.place)">
                <img
                  v-if="item.place.image || item.place.imageFallback"
                  :src="item.place.image || item.place.imageFallback"
                  :alt="item.place.imageAlt || item.place.name"
                  :data-place-id="item.place.id"
                  loading="lazy"
                  @error="handleImageError"
                />
                <span v-else class="near-place-fallback" aria-hidden="true">
                  <ion-icon :icon="locationOutline"></ion-icon>
                </span>
                <span class="near-place-copy">
                  <strong>{{ item.place.name }}</strong>
                  <span>{{ item.place.category }}</span>
                  <span class="near-place-distance">{{ distanceLabel(item.distanceKm) }}</span>
                  <span class="near-place-address">{{ item.place.address }}</span>
                </span>
              </button>
              <a class="near-directions" :href="directionsUrl(item.place)" target="_blank" rel="noreferrer" :aria-label="`Open directions to ${item.place.name}`">
                <ion-icon :icon="navigateOutline" aria-hidden="true"></ion-icon>
              </a>
            </article>
          </section>
        </main>

        <RideBottomNav active="explore" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.near-page { min-height: 100vh; padding-bottom: calc(84px + env(safe-area-inset-bottom)); background: #f7fbf8; }
.near-content { display: grid; gap: 14px; width: min(100%, 820px); margin: 0 auto; padding: 18px 16px 30px; }
.near-card { border: 1px solid #dce9df; border-radius: 18px; background: #fff; box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.near-intro { display: flex; gap: 14px; align-items: flex-start; padding: 18px; background: #f2f8f3; }
.near-intro h2 { margin: 2px 0 6px; color: #174c40; font-family: 'Poppins', sans-serif; font-size: 17px; }
.near-intro p { margin: 0; color: #526b60; font-size: 13px; line-height: 1.55; }
.near-icon { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 13px; background: #3f8064; color: #fff; font-size: 21px; }
.near-locate { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 14px; background: #3f8064; color: #fff; cursor: pointer; font-weight: 700; }
.near-locate:disabled { cursor: progress; opacity: 0.7; }
.near-status { margin: 0; padding: 12px 14px; border: 1px solid #f0dfb6; border-radius: 12px; background: #fff9ec; color: #7a5a12; font-size: 13px; line-height: 1.5; }
.near-list { display: grid; gap: 10px; }
.near-place { display: flex; align-items: center; gap: 8px; padding: 10px; }
.near-place-main { display: flex; min-width: 0; flex: 1; align-items: center; gap: 12px; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; text-align: left; }
.near-place-main img, .near-place-fallback { width: 72px; height: 72px; flex: 0 0 72px; border-radius: 12px; object-fit: cover; }
.near-place-fallback { display: grid; place-items: center; background: #e8f4ec; color: #3f8064; font-size: 26px; }
.near-place-copy { display: grid; min-width: 0; gap: 3px; }
.near-place-copy strong { overflow: hidden; color: #174c40; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.near-place-copy span { overflow: hidden; color: #658078; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.near-place-copy .near-place-distance { color: #3f8064; font-weight: 700; }
.near-directions { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border-radius: 12px; background: #e8f4ec; color: #2f6b4f; font-size: 20px; }
.near-place-main:focus-visible, .near-directions:focus-visible, .near-locate:focus-visible { outline: 3px solid rgb(120 169 130 / 55%); outline-offset: 2px; }
@media (min-width: 720px) { .near-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
