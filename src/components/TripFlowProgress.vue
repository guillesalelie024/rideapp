<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { checkmarkOutline } from 'ionicons/icons';
import type { PlanningStep } from '../data/flowProgress';

defineProps<{
  current: PlanningStep;
  completedSteps?: PlanningStep[];
}>();

const steps: Array<{ id: PlanningStep; label: string }> = [
  { id: 'explore', label: 'Explore Destination' },
  { id: 'planner', label: 'Plan Itinerary' },
  { id: 'compare', label: 'Compare Transportation' },
  { id: 'summary', label: 'Review Trip Summary' },
];
</script>

<template>
  <nav class="trip-flow-progress" aria-label="Trip planning progress">
    <ol>
      <li v-for="(step, index) in steps" :key="step.id" :class="{
        'trip-flow-current': current === step.id,
        'trip-flow-complete': completedSteps?.includes(step.id),
      }" :aria-current="current === step.id ? 'step' : undefined">
        <span class="trip-flow-number">
          <ion-icon v-if="completedSteps?.includes(step.id)" :icon="checkmarkOutline" aria-label="Completed"></ion-icon>
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span class="trip-flow-label">{{ step.label }}</span>
        <span v-if="index < steps.length - 1" class="trip-flow-connector" :class="{ 'trip-flow-connector-complete': completedSteps?.includes(step.id) }" aria-hidden="true"><span></span></span>
      </li>
    </ol>
  </nav>
</template>
