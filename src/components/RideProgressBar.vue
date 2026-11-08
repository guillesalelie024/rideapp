<script setup lang="ts">
withDefaults(defineProps<{
  phase: 'idle' | 'loading' | 'complete';
  label?: string;
}>(), {
  label: 'Loading page',
});
</script>

<template>
  <div
    v-if="phase !== 'idle'"
    class="ride-progress-bar"
    :class="{ 'ride-progress-bar--complete': phase === 'complete' }"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="phase === 'complete' ? 100 : undefined"
    :aria-valuetext="phase === 'complete' ? 'Page loaded' : 'Loading in progress'"
  >
    <span class="ride-progress-bar__track">
      <span class="ride-progress-bar__indicator"></span>
    </span>
  </div>
</template>

<style scoped>
.ride-progress-bar {
  position: fixed;
  z-index: 10002;
  inset: 0 0 auto;
  height: 4px;
  overflow: hidden;
  pointer-events: none;
}

.ride-progress-bar__track {
  position: absolute;
  inset: 0;
  display: block;
  overflow: hidden;
  background: rgb(120 169 130 / 22%);
}

.ride-progress-bar__indicator {
  display: block;
  width: 32%;
  height: 100%;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(90deg, var(--text-muted) 0%, var(--text-body) 55%, var(--text-body) 100%);
  box-shadow: 0 0 9px rgb(85 123 91 / 35%);
  transform: translateX(-110%);
  animation: ride-progress-travel 1.05s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.ride-progress-bar--complete .ride-progress-bar__indicator {
  width: 100%;
  border-radius: 0;
  transform: translateX(0);
  animation: none;
  transition: width 180ms ease-out, transform 180ms ease-out;
}

@keyframes ride-progress-travel {
  from { transform: translateX(-110%); }
  to { transform: translateX(420%); }
}

@media (prefers-reduced-motion: reduce) {
  .ride-progress-bar__indicator {
    width: 32%;
    transform: translateX(0);
    animation: none;
  }

  .ride-progress-bar--complete .ride-progress-bar__indicator {
    width: 100%;
    transition-duration: 1ms;
  }
}
</style>
