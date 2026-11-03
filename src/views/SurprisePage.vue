<script setup lang="ts">
import { onMounted } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { getRideDestination, getRideDestinations } from '../data/destinations';

const route = useRoute();
const router = useRouter();
const places = getRideDestinations();

onMounted(() => {
  const requested = typeof route.query.place === 'string' ? getRideDestination(route.query.place) : undefined;
  const pick = requested ?? places[Math.floor(Math.random() * places.length)];
  if (pick) void router.replace({ name: 'DestinationDetails', params: { id: pick.id } });
  else void router.replace({ name: 'Explore' });
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main style="display: grid; min-height: 100vh; place-items: center; padding: 24px; text-align: center; color: #174c40;">
        <p>Picking a destination for you...</p>
      </main>
    </ion-content>
  </ion-page>
</template>
