<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { checkmarkOutline, flagOutline, locationOutline } from 'ionicons/icons';
import type { RideDestination } from '../data/destinations';

defineProps<{
  stops: RideDestination[];
  visitedIds: string[];
  currentStopId?: string;
  allowMarking?: boolean;
}>();
const emit = defineEmits<{ markVisited: [placeId: string] }>();
</script>

<template>
  <ol class="live-route-progress" aria-label="Itinerary route progress">
    <li v-for="(stop, index) in stops" :key="stop.id" class="live-route-stop" :class="{
      'live-route-stop-complete': visitedIds.includes(stop.id),
      'live-route-stop-current': stop.id === currentStopId,
      'live-route-stop-first': index === 0,
      'live-route-stop-final': index === stops.length - 1,
    }" :aria-current="stop.id === currentStopId ? 'step' : undefined">
      <span class="live-route-marker">
        <ion-icon v-if="visitedIds.includes(stop.id)" :icon="checkmarkOutline" aria-label="Visited"></ion-icon>
        <ion-icon v-else-if="index === 0" :icon="locationOutline" aria-hidden="true"></ion-icon>
        <ion-icon v-else-if="index === stops.length - 1" :icon="flagOutline" aria-hidden="true"></ion-icon>
        <span v-else aria-hidden="true">{{ index + 1 }}</span>
      </span>
      <span class="live-route-stop-copy">
        <small>{{ index === 0 && index === stops.length - 1 ? 'Start and destination' : index === 0 ? 'Origin' : index === stops.length - 1 ? 'Final destination' : 'Itinerary stop' }} · {{ visitedIds.includes(stop.id) ? 'Visited' : stop.id === currentStopId ? 'Current stop' : 'Upcoming' }}</small>
        <strong>{{ stop.name }}</strong>
        <span>{{ stop.address }}, {{ stop.city }}</span>
      </span>
      <button v-if="allowMarking && !visitedIds.includes(stop.id)" class="button-secondary live-mark-button" type="button" @click="emit('markVisited', stop.id)">Mark Visited</button>
      <span v-if="index < stops.length - 1" class="live-route-connector" :class="{ 'live-route-connector-complete': visitedIds.includes(stop.id) }" aria-hidden="true"></span>
    </li>
  </ol>
</template>
