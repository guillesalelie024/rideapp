<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import {
  bagHandleOutline,
  businessOutline,
  cafeOutline,
  calendarOutline,
  compassOutline,
  leafOutline,
  locationOutline,
  restaurantOutline,
  searchOutline,
  sparklesOutline,
  waterOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getRideDestinations } from '../data/destinations';
import { EXPLORE_CATEGORY_LISTINGS, getExploreListingId, getExploreListingLocation, type ExploreListing } from '../data/exploreListings';

const categoryOptions = [
  { name: 'All Places', icon: compassOutline },
  { name: 'Adventure & Outdoor Activities', icon: compassOutline },
  { name: 'Beaches', icon: waterOutline },
  { name: 'Cafés & Coffee Shops', icon: cafeOutline },
  { name: 'Churches & Religious Sites', icon: businessOutline },
  { name: 'Events & Venues', icon: calendarOutline },
  { name: 'Farm Tourism', icon: leafOutline },
  { name: 'Historical Sites', icon: businessOutline },
  { name: 'Hotels & Accommodations', icon: businessOutline },
  { name: 'Islands & Islets', icon: waterOutline },
  { name: 'Marine Sanctuaries', icon: waterOutline },
  { name: 'Museums & Heritage', icon: businessOutline },
  { name: 'Nature & Eco-Tourism', icon: leafOutline },
  { name: 'Parks & Recreation', icon: leafOutline },
  { name: 'Public Markets', icon: businessOutline },
  { name: 'Restaurants & Eateries', icon: restaurantOutline },
  { name: 'Resorts', icon: businessOutline },
  { name: 'Shopping Malls', icon: businessOutline },
  { name: 'Souvenir Shops', icon: bagHandleOutline },
  { name: 'Swimming Pools', icon: waterOutline },
  { name: 'Tourist Spots', icon: compassOutline },
  { name: 'Waterparks', icon: waterOutline },
] as const;
type CategoryFilter = (typeof categoryOptions)[number]['name'];
type CategoryListing = ExploreListing & { category?: string };

type AllPlaceListing = CategoryListing & { category: string };

const router = useRouter();
const allPlaceListings: AllPlaceListing[] = categoryOptions.flatMap(({ name }) => {
  if (name === 'All Places') return [];
  return (EXPLORE_CATEGORY_LISTINGS[name] ?? []).map((listing) => ({ ...listing, category: name }));
});
const surprisePlaces = getRideDestinations();
const selectedCategory = ref<CategoryFilter>('All Places');
const searchQuery = ref('');
const statusMessage = ref('');
const failedListingImages = ref<string[]>([]);
const filteredAllPlaces = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return allPlaceListings.filter((place) => {
    if (!query) return true;
    return `${place.name} ${place.category} ${place.note ?? ''}`.toLocaleLowerCase().includes(query);
  });
});

const filteredCategoryListings = computed(() => {
  if (selectedCategory.value === 'All Places') return [];
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return (EXPLORE_CATEGORY_LISTINGS[selectedCategory.value] ?? []).filter((listing) =>
    `${listing.name} ${listing.note ?? ''}`.toLocaleLowerCase().includes(query)
  );
});

function selectCategory(category: CategoryFilter) {
  selectedCategory.value = category;
  statusMessage.value = '';
}

function getListingDestination(listing: CategoryListing) {
  const category = listing.category ?? selectedCategory.value;
  const id = getExploreListingId(listing.name, category);
  return surprisePlaces.find((place) => place.id === id);
}

function listingImage(listing: CategoryListing) {
  const place = getListingDestination(listing);
  const imageKey = listing.image ?? place?.id;
  if (imageKey && failedListingImages.value.includes(imageKey)) return '';
  return listing.image || place?.image || place?.imageFallback || '';
}

function listingLocation(listing: CategoryListing) {
  return getExploreListingLocation(listing, listing.category ?? selectedCategory.value);
}

function markListingImageFailed(listing: CategoryListing) {
  const place = getListingDestination(listing);
  const imageKey = listing.image ?? place?.id;
  if (imageKey && !failedListingImages.value.includes(imageKey)) {
    failedListingImages.value = [...failedListingImages.value, imageKey];
  }
}

function openListing(listing: CategoryListing) {
  const category = listing.category ?? selectedCategory.value;
  const knownPlace = getListingDestination(listing);
  const id = knownPlace?.id ?? getExploreListingId(listing.name, category);

  void router.push({
    name: 'DestinationDetails',
    params: { id },
    query: {
      name: listing.name,
      category,
      ...(listing.note ? { note: listing.note } : {}),
    },
  });
}

function findNearbyPlaces() {
  void router.push({ name: 'NearMe' });
}

function surpriseMe() {
  if (surprisePlaces.length === 0) {
    router.push({ name: 'Explore' });
    return;
  }
  const pick = surprisePlaces[Math.floor(Math.random() * surprisePlaces.length)];
  router.push({ name: 'SurpriseMe', query: { place: pick.id } });
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="exp-app">
        <RideAppHeader
          eyebrow="Explore"
          title="Discover places to visit"
          subtitle="Find destinations and plan your next ride"
          show-back
        />

        <div class="exp-content">
          <section class="exp-search-section">
            <div class="exp-search">
              <ion-icon :icon="searchOutline"></ion-icon>
              <input v-model="searchQuery" type="search" placeholder="Search destinations, attractions..." />
            </div>
            <div class="exp-quick-actions">
              <button class="exp-quick-btn" type="button" @click="findNearbyPlaces">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span>Near Me</span>
              </button>
              <button class="exp-quick-btn" type="button" @click="surpriseMe">
                <ion-icon :icon="sparklesOutline"></ion-icon>
                <span>Surprise Me</span>
              </button>
            </div>
            <p v-if="statusMessage" class="exp-status">{{ statusMessage }}</p>
          </section>

          <section class="exp-section">
            <h2 class="exp-section-title">Categories</h2>
            <div class="exp-cat-grid">
              <button v-for="cat in categoryOptions" :key="cat.name" class="exp-cat-btn" :class="{ 'exp-cat-active': selectedCategory === cat.name }" @click="selectCategory(cat.name)">
                <ion-icon :icon="cat.icon"></ion-icon>
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </section>

          <section class="exp-section">
            <div class="exp-section-header">
              <h2 class="exp-section-title">
                {{ selectedCategory === 'Adventure & Outdoor Activities' ? 'Activities' : selectedCategory }}
              </h2>
              <span class="exp-count">
                {{ selectedCategory === 'All Places' ? filteredAllPlaces.length : filteredCategoryListings.length }}
                {{ selectedCategory === 'Adventure & Outdoor Activities' ? 'activities' : selectedCategory === 'All Places' ? 'places' : 'items' }}
              </span>
            </div>
            <div class="exp-list exp-category-listing">
              <article
                v-for="listing in selectedCategory === 'All Places' ? filteredAllPlaces : filteredCategoryListings"
                :key="`${listing.category ?? selectedCategory}-${listing.name}`"
                class="exp-card"
                role="link"
                tabindex="0"
                @click="openListing(listing)"
                @keydown.enter="openListing(listing)"
                @keydown.space.prevent="openListing(listing)"
              >
                <div class="exp-card-image" aria-hidden="true">
                  <img
                    v-if="listingImage(listing)"
                    :src="listingImage(listing)"
                    :alt="listing.image ? listing.name : getListingDestination(listing)?.imageAlt || listing.name"
                    @error="markListingImageFailed(listing)"
                  />
                  <div v-else class="exp-card-fallback"><ion-icon :icon="compassOutline"></ion-icon></div>
                </div>
                <div class="exp-card-body">
                  <div class="exp-card-main">
                    <strong class="exp-card-title">{{ listing.name }}</strong>
                    <p class="exp-card-location">
                      <strong>{{ listingLocation(listing).label }}:</strong>
                      {{ listingLocation(listing).value }}
                    </p>
                    <span class="exp-card-badge">{{ listing.category ?? selectedCategory }}</span>
                    <p v-if="listing.note" class="exp-card-note">{{ listing.note }}</p>
                  </div>
                </div>
              </article>
            </div>
            <div v-if="selectedCategory !== 'All Places' && filteredCategoryListings.length === 0" class="exp-empty">
              <ion-icon :icon="compassOutline"></ion-icon>
              <p>No matching places found</p>
            </div>
            <div v-else-if="selectedCategory === 'All Places' && filteredAllPlaces.length === 0" class="exp-empty">
              <ion-icon :icon="compassOutline"></ion-icon>
              <p>No destinations found</p>
            </div>
          </section>

          <div class="exp-spacer"></div>
        </div>

        <RideBottomNav active="explore" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.exp-app {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: calc(72px + env(safe-area-inset-bottom));
}

.exp-header {
  background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%);
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px;
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
}

.exp-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.exp-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.exp-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
}

.exp-brand :deep(.brand-wordmark) {
  width: 76px;
}

.exp-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.exp-action-btn {
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
  box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06);
}

.exp-header-greet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exp-greet-line {
  color: #3F8064;
  font-weight: 600;
  margin: 0;
  font-size: 14px;
}

.exp-greet-title {
  color: #174C40;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  line-height: 1.15;
}

.exp-greet-sub {
  color: #658078;
  font-size: 13px;
  margin: 0;
}

.exp-content {
  padding: 16px;
  max-width: 100%;
}

.exp-search-section {
  margin-bottom: 18px;
}

.exp-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04);
  margin-bottom: 10px;
}

.exp-search ion-icon {
  color: #658078;
  font-size: 20px;
}

.exp-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
}

.exp-quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.exp-quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 12px;
  padding: 10px;
  color: #174C40;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.exp-quick-btn ion-icon {
  color: #3F8064;
  font-size: 20px;
}

.exp-status {
  color: #658078;
  font-size: 12px;
  margin: 8px 0 0 0;
}

.exp-section {
  margin-bottom: 18px;
}

.exp-section-title {
  color: #174C40;
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 12px 0;
  font-family: 'Poppins', sans-serif;
}

.exp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.exp-section-header .exp-section-title {
  margin: 0;
}

.exp-count {
  color: #658078;
  font-size: 13px;
}

.exp-cat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.exp-cat-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  padding: 10px 12px;
  color: #174C40;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
}

.exp-cat-btn ion-icon {
  color: #3F8064;
  font-size: 22px;
  flex-shrink: 0;
}

.exp-cat-active {
  background: #E8F4EC;
  border-color: #3F8064;
  color: #174C40;
  font-weight: 600;
}

.exp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #DCE9DF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(63, 128, 100, 0.03);
  padding: 10px;
  position: relative;
}

.exp-category-listing .exp-card {
  cursor: pointer;
}

.exp-category-listing .exp-card:focus-visible {
  outline: 2px solid #3F8064;
  outline-offset: 2px;
}

.exp-card-image {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: #E8F4EC;
  overflow: hidden;
  flex-shrink: 0;
}

.exp-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.exp-card-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3F8064;
  font-size: 30px;
}

.exp-card-body {
  flex: 1;
  min-width: 0;
}

.exp-card-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exp-card-title {
  color: #174C40;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exp-card-location {
  color: #658078;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.exp-card-location strong {
  color: #3F8064;
  font-weight: 600;
}

.exp-card-note {
  color: #658078;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
}

.exp-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.exp-card-badge {
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  background: #E8F4EC;
  color: #3F8064;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exp-card-dist {
  color: #658078;
  font-size: 11px;
}

.exp-card-fav {
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

.exp-empty {
  text-align: center;
  padding: 24px;
  color: #658078;
}

.exp-empty ion-icon {
  font-size: 40px;
  color: #DCE9DF;
}

.exp-spacer {
  height: 8px;
}

@media (min-width: 480px) {
  .exp-content {
    padding-left: 18px;
    padding-right: 18px;
  }
  .exp-header {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
