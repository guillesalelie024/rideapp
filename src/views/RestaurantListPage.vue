<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { arrowBackOutline, cafeOutline, restaurantOutline } from 'ionicons/icons';
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

          <div class="restaurant-search">
            <input v-model="query" type="search" placeholder="Search food places..." aria-label="Search food places" />
          </div>

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
.restaurant-search input { width: 100%; min-height: 46px; padding: 0 14px; border: 1px solid #dce9df; border-radius: 12px; background: #fff; color: #174c40; font: inherit; }
.restaurant-search input:focus-visible { outline: 3px solid rgb(120 169 130 / 55%); outline-offset: 2px; }
.restaurant-note { margin: 0; padding: 12px 14px; border: 1px solid #f0dfb6; border-radius: 12px; background: #fff9ec; color: #7a5a12; font-size: 13px; line-height: 1.55; }
.restaurant-group { display: grid; gap: 10px; }
.restaurant-group h2 { display: flex; align-items: center; gap: 8px; margin: 0; color: #174c40; font-family: 'Poppins', sans-serif; font-size: 17px; }
.restaurant-group h2 span { margin-left: auto; color: #658078; font-family: inherit; font-size: 12px; font-weight: 600; }
.restaurant-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.restaurant-list li { padding: 12px 14px; border: 1px solid #dce9df; border-radius: 12px; background: #fff; color: #2f4f43; font-size: 13px; }
.restaurant-empty { margin: 0; color: #658078; font-size: 13px; }
</style>
