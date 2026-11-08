<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { arrowBackOutline, cafeOutline, restaurantOutline, searchOutline } from 'ionicons/icons';
import { useRoute } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { CALAPAN_CITY } from '../data/calapan';
import { CURATED_CAFE_LISTINGS, CURATED_RESTAURANT_LISTINGS } from '../data/curatedFoodPlaces';

const route = useRoute();
const destinationId = computed(() => typeof route.query.destination === 'string' ? route.query.destination : '');
const query = ref('');

const cafes = computed(() => filterListings(CURATED_CAFE_LISTINGS));
const restaurants = computed(() => filterListings(CURATED_RESTAURANT_LISTINGS));

function filterListings(listings: readonly { name: string; category: string }[]) {
  const term = query.value.trim().toLocaleLowerCase();
  if (!term) return listings;
  return listings.filter((listing) => listing.name.toLocaleLowerCase().includes(term));
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="explore-page">
        <RideAppHeader
          eyebrow="Local food guide"
          title="Restaurants &amp; Kainan"
          :subtitle="`Curated food names in ${CALAPAN_CITY}. Menus, prices, hours, and ratings are not verified here.`"
        />

        <section class="explore-content page-width restaurant-page">
          <router-link class="home-back-link" :to="destinationId ? { name: 'DestinationDetails', params: { id: destinationId } } : { name: 'Explore' }">
            <ion-icon :icon="arrowBackOutline" aria-hidden="true"></ion-icon> Back to Explore
          </router-link>

          <form class="restaurant-search home-search app-search" @submit.prevent>
            <ion-icon class="search-glyph" :icon="searchOutline" aria-hidden="true"></ion-icon>
            <input v-model="query" type="search" placeholder="Search food places..." aria-label="Search food places" />
          </form>

          <p class="restaurant-note">
            This guide lists place names gathered for Calapan City. It does not confirm that a business is open, and it does not provide menus, prices, ratings, or hours. Verify directly before traveling.
          </p>

          <section class="restaurant-group">
            <h2><ion-icon :icon="cafeOutline" aria-hidden="true"></ion-icon> Cafés &amp; Coffee Shops <span>{{ cafes.length }}</span></h2>
            <ul v-if="cafes.length" class="restaurant-list">
              <li v-for="listing in cafes" :key="listing.name">{{ listing.name }}</li>
            </ul>
            <p v-else class="restaurant-empty">No café names match your search.</p>
          </section>

          <section class="restaurant-group">
            <h2><ion-icon :icon="restaurantOutline" aria-hidden="true"></ion-icon> Restaurants &amp; Eateries <span>{{ restaurants.length }}</span></h2>
            <ul v-if="restaurants.length" class="restaurant-list">
              <li v-for="listing in restaurants" :key="listing.name">{{ listing.name }}</li>
            </ul>
            <p v-else class="restaurant-empty">No restaurant names match your search.</p>
          </section>

          <router-link to="/explore" class="text-button">Browse destinations with verified map details</router-link>
        </section>

        <RideBottomNav active="explore" />
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.restaurant-page { display: grid; gap: 16px; }
.restaurant-search { display:flex; align-items:center; gap:12px; width:100%; max-width:none; min-height:60px; padding:10px 18px 10px 20px; border:1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-md); transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.restaurant-search:focus-within { border-color: var(--brand-accent); box-shadow: var(--shadow-lg); }
.restaurant-search .search-glyph { color: var(--text-secondary); font-size:20px; flex-shrink:0; }
.restaurant-search input { flex:1; min-width:0; min-height:0; padding:0; border:0; border-radius:0; background: transparent; color: var(--text-primary); font-size:15px; outline:none; }
.restaurant-search input::placeholder { color: var(--text-muted); }
.restaurant-note { margin: 0; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--warning) 32%, var(--border)); border-radius: 12px; background: var(--warning-soft); color: var(--warning); font-size: 13px; line-height: 1.55; }
.restaurant-group { display: grid; gap: 10px; }
.restaurant-group h2 { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 21px; font-weight: 600; letter-spacing: -0.01em; }
.restaurant-group h2 span { margin-left: auto; color: var(--text-secondary); font-family: inherit; font-size: 12px; font-weight: 600; }
.restaurant-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.restaurant-list li { padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-body); font-size: 13px; }
.restaurant-empty { margin: 0; color: var(--text-secondary); font-size: 13px; }
</style>
