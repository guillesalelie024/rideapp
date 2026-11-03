<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { bookmarkOutline, heartOutline, locationOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations } from '../data/destinations';
import { showError } from '../composables/feedback';

const router = useRouter();
const places = getRideDestinations();
const savedIds = ref<string[]>([]);
const curatedFavorites = ref<Record<string, { name: string; category: string; note: string }>>({});

function loadSaved() {
  try {
    const raw = localStorage.getItem('ride.saved-destination-ids');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      savedIds.value = parsed.filter((id) => typeof id === 'string');
    } else {
      savedIds.value = [];
    }
  } catch {
    savedIds.value = [];
  }

  try {
    const raw = localStorage.getItem('ride.saved-curated-destinations');
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      curatedFavorites.value = Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, { name: string; category: string; note: string }] => {
          const value: unknown = entry[1];
          return Boolean(
            value
            && typeof value === 'object'
            && 'name' in value
            && typeof value.name === 'string'
            && 'category' in value
            && typeof value.category === 'string'
            && 'note' in value
            && typeof value.note === 'string'
          );
        })
      );
    } else {
      curatedFavorites.value = {};
    }
  } catch {
    curatedFavorites.value = {};
  }
}

loadSaved();
onIonViewWillEnter(loadSaved);

const savedPlaces = computed(() => places.filter((p) => savedIds.value.includes(p.id)));
const savedCuratedPlaces = computed(() => Object.entries(curatedFavorites.value)
  .filter(([id]) => savedIds.value.includes(id))
  .map(([id, place]) => ({ id, ...place })));

function removeSaved(id: string) {
  savedIds.value = savedIds.value.filter((x) => x !== id);
  const nextCuratedPlaces = { ...curatedFavorites.value };
  delete nextCuratedPlaces[id];
  curatedFavorites.value = nextCuratedPlaces;
  try {
    localStorage.setItem('ride.saved-destination-ids', JSON.stringify(savedIds.value));
    localStorage.setItem('ride.saved-curated-destinations', JSON.stringify(curatedFavorites.value));
  } catch {
    showError('Could not update saved places.');
  }
}

function openPlace(id: string) {
  router.push({ name: 'DestinationDetails', params: { id } });
}

function openCuratedPlace(place: { id: string; name: string; category: string; note: string }) {
  router.push({
    name: 'DestinationDetails',
    params: { id: place.id },
    query: {
      name: place.name,
      category: place.category,
      ...(place.note ? { note: place.note } : {}),
    },
  });
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="sv-app">
        <RideAppHeader
          eyebrow="Saved Places"
          title="My Favorites"
          :subtitle="`${savedPlaces.length} place${savedPlaces.length === 1 ? '' : 's'} saved`"
          show-back
        />

        <div class="sv-content">
          <section v-if="savedPlaces.length || savedCuratedPlaces.length" class="sv-list">
            <article v-for="place in savedPlaces" :key="place.id" class="sv-card">
              <button class="sv-card-main" type="button" @click="openPlace(place.id)">
                <div class="sv-img-wrap">
                  <img v-if="place.image || place.imageFallback" :src="place.image || place.imageFallback" :alt="place.name" />
                  <div v-else class="sv-img-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                </div>
                <div class="sv-info">
                  <strong>{{ place.name }}</strong>
                  <p>{{ place.category }} • {{ place.city }}</p>
                </div>
              </button>
              <button class="sv-remove" type="button" @click="removeSaved(place.id)">
                <ion-icon :icon="heartOutline"></ion-icon>
              </button>
            </article>
            <article v-for="place in savedCuratedPlaces" :key="place.id" class="sv-card">
              <button class="sv-card-main" type="button" @click="openCuratedPlace(place)">
                <div class="sv-img-wrap"><div class="sv-img-fallback"><ion-icon :icon="locationOutline"></ion-icon></div></div>
                <div class="sv-info">
                  <strong>{{ place.name }}</strong>
                  <p>{{ place.category }}</p>
                </div>
              </button>
              <button class="sv-remove" type="button" @click="removeSaved(place.id)">
                <ion-icon :icon="heartOutline"></ion-icon>
              </button>
            </article>
          </section>

          <section v-else class="sv-empty">
            <ion-icon :icon="bookmarkOutline"></ion-icon>
            <h3>No saved places yet</h3>
            <p>Save destinations from Explore to see them here</p>
            <button class="sv-explore-btn" @click="router.push('/explore')">Explore Places</button>
          </section>

          <div class="sv-spacer"></div>
        </div>

        <RideBottomNav active="saved" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.sv-app { min-height: 100vh; background: #ffffff; padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
.sv-header { background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%); padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px; border-bottom-left-radius: 26px; border-bottom-right-radius: 26px; }
.sv-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.sv-brand :deep(.brand) { gap: 10px; align-items: center; }
.sv-brand :deep(.brand-mark) { width: 38px; height: 44px; }
.sv-brand :deep(.brand-wordmark) { width: 76px; }
.sv-actions { display: flex; align-items: center; gap: 8px; }
.sv-action-btn { width: 42px; height: 42px; border-radius: 14px; background: white; border: 1px solid #DCE9DF; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 24px; cursor: pointer; box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06); }
.sv-header-greet { display: flex; flex-direction: column; gap: 4px; }
.sv-greet-line { color: #3F8064; font-weight: 600; margin: 0; font-size: 14px; }
.sv-greet-title { color: #174C40; font-size: 24px; font-weight: 700; margin: 0; font-family: 'Poppins', sans-serif; line-height: 1.15; }
.sv-greet-sub { color: #658078; font-size: 13px; margin: 0; }
.sv-content { padding: 16px; max-width: 100%; }
.sv-list { display: flex; flex-direction: column; gap: 10px; }
.sv-card { display: flex; align-items: center; background: white; border: 1px solid #DCE9DF; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03); }
.sv-card-main { flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px; text-align: left; background: none; border: none; cursor: pointer; font: inherit; }
.sv-img-wrap { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #E8F4EC; }
.sv-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.sv-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 24px; }
.sv-info { flex: 1; min-width: 0; }
.sv-info strong { color: #174C40; font-size: 14px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sv-info p { color: #658078; font-size: 12px; margin: 2px 0 0 0; }
.sv-remove { width: 44px; height: 76px; background: #FEF2F2; border: none; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; }
.sv-empty { text-align: center; padding: 40px 20px; color: #658078; }
.sv-empty ion-icon { font-size: 48px; color: #DCE9DF; }
.sv-empty h3 { color: #174C40; margin: 12px 0 4px 0; }
.sv-empty p { margin: 0 0 16px 0; }
.sv-explore-btn { background: #3F8064; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; }
.sv-spacer { height: 8px; }
@media (min-width: 480px) { .sv-content { padding-left: 18px; padding-right: 18px; } .sv-header { padding-left: 18px; padding-right: 18px; } }
</style>
