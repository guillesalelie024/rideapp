<template>
  <ion-app>
    <TravelRouteLoader />
    <RideFeedbackModal />
    <ion-router-outlet :animated="true" :router-animation="ridePageTransition" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import TravelRouteLoader from './components/TravelRouteLoader.vue';
import RideFeedbackModal from './components/RideFeedbackModal.vue';
import { ridePageTransition } from './animations/ridePageTransition';
</script>
