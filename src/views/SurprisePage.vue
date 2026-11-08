<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  arrowForwardOutline,
  cafeOutline,
  cloudOutline,
  compassOutline,
  gameControllerOutline,
  happyOutline,
  heartOutline,
  leafOutline,
  locationOutline,
  personOutline,
  rainyOutline,
  sparklesOutline,
  sunnyOutline,
  walletOutline,
} from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations, type RideDestination } from '../data/destinations';
import {
  getExploreCategoryListings,
  getExploreListingId,
  getExploreListingLocation,
  type ExploreListing,
} from '../data/exploreListings';

type MoodId =
  | 'relaxing' | 'adventure' | 'budget'
  | 'heartbroken' | 'in-love' | 'butterflies' | 'missing-someone'
  | 'moving-on' | 'me-time' | 'stressed' | 'bored';

type MoodOption = {
  id: MoodId;
  label: string;
  description: string;
  icon: string;
  categories: string[];
};

type MoodPlace = ExploreListing & {
  id: string;
  category: string;
  place?: RideDestination;
  location: { label: string; value: string };
};

const moods: MoodOption[] = [
  {
    id: 'relaxing',
    label: 'Relaxing',
    description: 'Calm spots to unwind and take it easy',
    icon: leafOutline,
    categories: [
      'Beaches', 'Parks & Recreation', 'Nature & Eco-Tourism', 'Cafés & Coffee Shops',
      'Resorts', 'Swimming Pools', 'Islands & Islets', 'Marine Sanctuaries',
    ],
  },
  {
    id: 'adventure',
    label: 'Adventure',
    description: 'Active experiences and outdoor fun',
    icon: compassOutline,
    categories: [
      'Adventure & Outdoor Activities', 'Waterparks', 'Marine Sanctuaries',
      'Islands & Islets', 'Nature & Eco-Tourism', 'Beaches',
    ],
  },
  {
    id: 'budget',
    label: 'Budget-friendly',
    description: 'Great places that are easy on the wallet',
    icon: walletOutline,
    categories: [
      'Parks & Recreation', 'Public Markets', 'Churches & Religious Sites',
      'Historical Sites', 'Beaches', 'Nature & Eco-Tourism', 'Museums & Heritage', 'Tourist Spots',
    ],
  },
  {
    id: 'heartbroken',
    label: 'Heartbroken',
    description: 'Quiet places to clear your mind and heal at your own pace',
    icon: rainyOutline,
    categories: [
      'Churches & Religious Sites', 'Beaches', 'Nature & Eco-Tourism',
      'Parks & Recreation', 'Cafés & Coffee Shops', 'Museums & Heritage',
    ],
  },
  {
    id: 'in-love',
    label: 'In Love',
    description: 'Romantic spots for sweet moments and memorable dates',
    icon: heartOutline,
    categories: [
      'Restaurants & Eateries', 'Cafés & Coffee Shops', 'Beaches',
      'Resorts', 'Parks & Recreation', 'Tourist Spots', 'Hotels & Accommodations',
    ],
  },
  {
    id: 'butterflies',
    label: 'Feeling the Butterflies',
    description: 'Cute places for exciting first dates and special moments',
    icon: sparklesOutline,
    categories: [
      'Cafés & Coffee Shops', 'Restaurants & Eateries', 'Parks & Recreation',
      'Tourist Spots', 'Beaches', 'Shopping Malls', 'Events & Venues',
    ],
  },
  {
    id: 'missing-someone',
    label: 'Missing Someone',
    description: 'Peaceful spots to reflect, relax, and enjoy a little alone time',
    icon: cloudOutline,
    categories: [
      'Beaches', 'Parks & Recreation', 'Nature & Eco-Tourism',
      'Cafés & Coffee Shops', 'Churches & Religious Sites', 'Islands & Islets',
    ],
  },
  {
    id: 'moving-on',
    label: 'Moving On',
    description: 'Fresh places to recharge and start a new chapter',
    icon: sunnyOutline,
    categories: [
      'Adventure & Outdoor Activities', 'Nature & Eco-Tourism', 'Beaches',
      'Parks & Recreation', 'Tourist Spots', 'Waterparks', 'Swimming Pools',
    ],
  },
  {
    id: 'me-time',
    label: 'Me Time',
    description: 'Cozy spots to enjoy your own company and take a break',
    icon: personOutline,
    categories: [
      'Cafés & Coffee Shops', 'Museums & Heritage', 'Parks & Recreation',
      'Beaches', 'Nature & Eco-Tourism', 'Shopping Malls', 'Souvenir Shops',
    ],
  },
  {
    id: 'stressed',
    label: 'Stressed Out',
    description: 'Calm places to slow down, breathe, and reset',
    icon: cafeOutline,
    categories: [
      'Nature & Eco-Tourism', 'Parks & Recreation', 'Cafés & Coffee Shops',
      'Beaches', 'Churches & Religious Sites', 'Resorts', 'Swimming Pools',
    ],
  },
  {
    id: 'bored',
    label: 'Bored',
    description: 'Fun places to try something new and make your day more exciting',
    icon: gameControllerOutline,
    categories: [
      'Adventure & Outdoor Activities', 'Tourist Spots', 'Shopping Malls',
      'Restaurants & Eateries', 'Waterparks', 'Events & Venues', 'Beaches', 'Public Markets',
    ],
  },
];

const route = useRoute();
const router = useRouter();
const rideDestinations = getRideDestinations();
const exploreGroups = getExploreCategoryListings();

const selectedMood = ref<MoodId | null>(null);
const highlightId = ref<string | null>(null);
const failedImages = ref<string[]>([]);

function buildPool(moodId: MoodId): MoodPlace[] {
  const mood = moods.find((m) => m.id === moodId);
  if (!mood) return [];
  const pool: MoodPlace[] = [];
  for (const category of mood.categories) {
    for (const listing of exploreGroups[category] ?? []) {
      if (listing.note && /temporarily closed/i.test(listing.note)) continue;
      const id = getExploreListingId(listing.name, category);
      const place = rideDestinations.find((d) => d.id === id);
      pool.push({
        ...listing,
        id,
        category,
        place,
        location: getExploreListingLocation(listing, category, place),
      });
    }
  }
  const seen = new Set<string>();
  return pool.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

const moodPlaces = computed(() => (selectedMood.value ? buildPool(selectedMood.value) : []));
const moodLabel = computed(() => moods.find((m) => m.id === selectedMood.value)?.label ?? '');

function listingImage(item: MoodPlace): string {
  if (failedImages.value.includes(item.id)) return item.place?.imageFallback || '';
  return item.image || item.place?.image || item.place?.imageFallback || '';
}

function markImageFailed(id: string) {
  if (!failedImages.value.includes(id)) failedImages.value = [...failedImages.value, id];
}

function chooseMood(moodId: MoodId) {
  selectedMood.value = moodId;
  highlightId.value = null;
  failedImages.value = [];
}

function changeMood() {
  selectedMood.value = null;
  highlightId.value = null;
}

function openPlace(item: MoodPlace) {
  void router.push({
    name: 'DestinationDetails',
    params: { id: item.id },
    query: { name: item.name, category: item.category, ...(item.address ? { address: item.address } : {}), ...(item.note ? { note: item.note } : {}) },
  });
}

function applyRoutePick() {
  const requested = typeof route.query.place === 'string' ? route.query.place : '';
  if (!requested) return;
  for (const mood of moods) {
    if (buildPool(mood.id).some((item) => item.id === requested)) {
      selectedMood.value = mood.id;
      highlightId.value = requested;
      requestAnimationFrame(() => {
        document.getElementById(`mood-place-${requested}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
  }
  selectedMood.value = 'relaxing';
}

onMounted(applyRoutePick);
onIonViewWillEnter(() => {});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="sv-app">
        <RideAppHeader
          :eyebrow="'Surprise Me'"
          :title="selectedMood ? moodLabel : 'How are you feeling?'"
          :subtitle="selectedMood ? 'Tap a place to view details' : 'Pick a mood to see destinations that match'"
          show-back
        />

        <main class="sv-content">
          <section v-if="!selectedMood" class="sv-pick" aria-label="Pick a mood">
            <div class="sv-pick-intro">
              <span class="sv-step-label">Step 1</span>
              <h2>Find your next stop</h2>
              <p>Choose a mood below. We’ll show every matching place from Explore.</p>
            </div>

            <div class="sv-mood-grid" role="group" aria-label="Moods">
              <button
                v-for="mood in moods"
                :key="mood.id"
                type="button"
                class="sv-mood-btn"
                @click="chooseMood(mood.id)"
              >
                <span class="sv-mood-btn-icon" aria-hidden="true"><ion-icon :icon="mood.icon"></ion-icon></span>
                <span class="sv-mood-btn-copy">
                  <strong>{{ mood.label }}</strong>
                  <span>{{ mood.description }}</span>
                </span>
                <span class="sv-mood-btn-go" aria-hidden="true"><ion-icon :icon="arrowForwardOutline"></ion-icon></span>
              </button>
            </div>

            <p class="sv-mood-note"><ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon> Destination ideas come from Explore.</p>
          </section>

          <template v-else>
            <section class="sv-results-head" aria-label="Selected mood">
              <div class="sv-results-top">
                <div class="sv-results-mood">
                  <span class="sv-results-label">Selected mood</span>
                  <span class="sv-mood-chip"><ion-icon :icon="happyOutline" aria-hidden="true"></ion-icon> {{ moodLabel }}</span>
                </div>
                <button type="button" class="sv-back-mood" @click="changeMood">
                  <span>Change mood</span>
                </button>
              </div>
              <p class="sv-results-count"><strong>{{ moodPlaces.length }}</strong> {{ moodPlaces.length === 1 ? 'place matches' : 'places match' }} this mood</p>
              <p class="sv-results-hint">Tap a place below to view details.</p>
            </section>

            <div class="sv-list" role="list" :aria-label="`${moodLabel} destinations`">
              <article
                v-for="(item, index) in moodPlaces"
                :id="`mood-place-${item.id}`"
                :key="item.id"
                class="sv-card"
                :class="{ 'is-highlight': highlightId === item.id }"
                role="listitem"
                tabindex="0"
                @click="openPlace(item)"
                @keydown.enter="openPlace(item)"
                @keydown.space.prevent="openPlace(item)"
              >
                <div class="sv-card-media" aria-hidden="true">
                  <img
                    v-if="listingImage(item)"
                    :src="listingImage(item)"
                    :alt="item.place?.imageAlt || item.name"
                    loading="lazy"
                    @error="markImageFailed(item.id)"
                  />
                  <div v-else class="sv-card-fallback"><ion-icon :icon="locationOutline"></ion-icon></div>
                  <span class="sv-card-index">{{ index + 1 }}</span>
                </div>
                <div class="sv-card-body">
                  <div class="sv-card-badges">
                    <span class="sv-card-cat">{{ item.category }}</span>
                    <span v-if="highlightId === item.id" class="sv-card-pick"><ion-icon :icon="sparklesOutline" aria-hidden="true"></ion-icon> Suggested</span>
                  </div>
                  <strong class="sv-card-title">{{ item.name }}</strong>
                  <p class="sv-card-loc">
                    <ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon>
                    <span>{{ item.location.label }}: {{ item.location.value }}</span>
                  </p>
                  <p v-if="item.note" class="sv-card-note">{{ item.note }}</p>
                  <span class="sv-card-cta">View details <ion-icon :icon="arrowForwardOutline" aria-hidden="true"></ion-icon></span>
                </div>
              </article>
            </div>

            <p v-if="!moodPlaces.length" class="sv-empty">No places found for this mood right now.</p>
          </template>
        </main>

        <RideBottomNav active="home" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.sv-app {
  min-height: 100vh;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
  background: var(--bg);
}

.sv-content {
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  padding: 18px 16px 30px;
}

.sv-pick {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sv-step-label {
  display: inline-flex;
  align-self: flex-start;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 10%, var(--surface));
  color: var(--brand-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sv-pick-intro h2 {
  margin: 0 0 4px;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(24px, 6vw, 28px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.sv-pick-intro p {
  margin: 0;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.55;
}

.sv-mood-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sv-mood-btn {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 16px 16px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface-soft) 55%, var(--surface)) 100%);
  color: var(--text-strong);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.sv-mood-btn:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 30%, var(--border));
  box-shadow: var(--shadow-md);
}

.sv-mood-btn:active {
  transform: scale(0.985);
}

.sv-mood-btn-icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface));
  color: var(--brand-accent);
  font-size: 24px;
}

.sv-mood-btn-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.sv-mood-btn-copy strong {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.sv-mood-btn-copy span {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.sv-mood-btn-go {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-size: 17px;
}

.sv-mood-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-size: 12.5px;
}

.sv-mood-note ion-icon {
  color: var(--brand-accent);
  font-size: 15px;
}

.sv-results-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--surface-soft) 45%, var(--surface)) 100%);
  box-shadow: var(--shadow-sm);
}

.sv-results-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sv-results-mood {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.sv-results-label {
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sv-back-mood {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.sv-mood-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface));
  color: var(--brand-accent);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.sv-mood-chip ion-icon {
  font-size: 16px;
}

.sv-results-count {
  margin: 2px 0 0;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.35;
}

.sv-results-count strong {
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-right: 2px;
}

.sv-results-hint {
  margin: 0;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.5;
}

.sv-surprise-pick:active {
  transform: scale(0.98);
}

.sv-surprise-pick ion-icon {
  font-size: 17px;
}

.sv-list {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sv-card {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  align-items: stretch;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  scroll-margin-top: 16px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.sv-card:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 22%, var(--border));
  box-shadow: var(--shadow-md);
}

.sv-card:active {
  transform: scale(0.992);
}

.sv-card:focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 2px;
}

.sv-card.is-highlight {
  border-color: color-mix(in srgb, var(--brand-accent) 45%, var(--border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-accent) 14%, transparent), var(--shadow-md);
}

.sv-card-media {
  position: relative;
  width: 112px;
  min-height: 112px;
  flex-shrink: 0;
  align-self: stretch;
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface-muted);
}

.sv-card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sv-card-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 112px;
  place-items: center;
  color: var(--brand-accent);
  font-size: 30px;
}

.sv-card-index {
  position: absolute;
  top: 8px;
  left: 8px;
  display: grid;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  place-items: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  color: var(--text-strong);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: var(--shadow-xs);
}

.sv-card-body {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 2px 2px 2px 0;
}

.sv-card-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.sv-card-cat {
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
  text-transform: uppercase;
}

.sv-card-pick {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 14%, var(--surface));
  color: var(--brand-accent);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
}

.sv-card-pick ion-icon {
  font-size: 12px;
}

.sv-card-title {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.sv-card-loc {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.sv-card-loc ion-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--brand-accent);
  font-size: 14px;
}

.sv-card-loc span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.sv-card-note {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.sv-card-cta {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  margin-top: auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-accent) 8%, var(--surface));
  color: var(--brand-accent);
  font-size: 12px;
  font-weight: 700;
}

.sv-card-cta ion-icon {
  font-size: 14px;
}

.sv-empty {
  margin: 8px 0 0;
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 18px;
  color: var(--text-secondary);
  font-size: 13.5px;
  text-align: center;
}

.sv-card.is-highlight .sv-card-index {
  background: var(--brand-accent);
  color: #fff;
}

@media (max-width: 700px) {
  .sv-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .sv-card {
    gap: 12px;
  }

  .sv-card-media {
    width: 92px;
    min-height: 96px;
  }

  .sv-card-fallback {
    min-height: 96px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sv-reveal {
    animation: none;
  }
}
</style>
