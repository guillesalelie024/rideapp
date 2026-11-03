<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ visited: number; total: number; compact?: boolean }>();
const safeTotal = computed(() => Math.max(0, Math.floor(props.total)));
const safeVisited = computed(() => Math.min(safeTotal.value, Math.max(0, Math.floor(props.visited))));
const percentage = computed(() => safeTotal.value ? Math.round((safeVisited.value / safeTotal.value) * 100) : 0);
</script>

<template>
  <div v-if="safeTotal" class="trip-stop-progress" :class="{ 'trip-stop-progress-compact': compact }">
    <div class="trip-stop-progress-label"><strong>{{ safeVisited }} of {{ safeTotal }} stops completed</strong><span>{{ percentage }}%</span></div>
    <div class="trip-stop-progress-track" role="progressbar" :aria-label="`${safeVisited} of ${safeTotal} itinerary stops completed`" aria-valuemin="0" :aria-valuemax="safeTotal" :aria-valuenow="safeVisited">
      <span :style="{ width: `${percentage}%` }"></span>
    </div>
  </div>
</template>
