<template>
  <ion-app>
    <RideSplash v-if="splashVisible" @finished="splashVisible = false" />
    <TravelRouteLoader />
    <RideFeedbackModal />
    <ion-router-outlet :animated="true" :router-animation="ridePageTransition" />
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import RideSplash from './components/RideSplash.vue';
import TravelRouteLoader from './components/TravelRouteLoader.vue';
import RideFeedbackModal from './components/RideFeedbackModal.vue';
import { ridePageTransition } from './animations/ridePageTransition';

const splashVisible = ref(false);

onMounted(() => {
  try {
    if (sessionStorage.getItem('ride.splash-seen')) return;
    sessionStorage.setItem('ride.splash-seen', 'true');
  } catch {
    splashVisible.value = true;
    return;
  }
  splashVisible.value = true;
});
</script>
