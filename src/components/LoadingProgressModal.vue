<script setup lang="ts">
import { locationOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/vue';
import RideProgressBar from './RideProgressBar.vue';

defineProps<{
  visible: boolean;
  message: string;
  phase: 'loading' | 'complete';
}>();
</script>

<template>
  <Transition name="loading-progress">
    <div v-if="visible" class="loading-progress-backdrop">
      <section class="loading-progress-card" role="status" aria-live="polite" aria-atomic="true">
        <div class="loading-progress-brand">
          <span class="loading-progress-pin" aria-hidden="true">
            <ion-icon :icon="locationOutline"></ion-icon>
          </span>
          <span class="loading-progress-wordmark">RIDE</span>
        </div>
        <RideProgressBar :phase="phase" label="Action progress" />
        <span class="loading-progress-state" aria-live="polite">{{ phase === 'complete' ? '100%' : 'Loading…' }}</span>
        <p class="loading-progress-message">{{ message }}</p>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.loading-progress-backdrop {
  position: fixed;
  z-index: 10000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(31 48 35 / 25%);
  backdrop-filter: blur(2px);
}

.loading-progress-card {
  display: grid;
  width: min(310px, 100%);
  justify-items: center;
  gap: 0.85rem;
  padding: 1.35rem 1.4rem 1.2rem;
  border: 1px solid rgb(255 255 255 / 88%);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 18px 52px rgb(31 57 38 / 20%);
  color: var(--charcoal, #29332d);
}

.loading-progress-brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--forest, #355e3b);
}

.loading-progress-pin {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: #eff7ee;
  color: #557b5b;
  font-size: 1.2rem;
  animation: loading-progress-bob 1.1s ease-in-out infinite;
}

.loading-progress-wordmark {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.loading-progress-card :deep(.ride-progress-bar) {
  position: relative;
  inset: auto;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
}

.loading-progress-card :deep(.ride-progress-bar__track) {
  border-radius: inherit;
  background: #e7f0e5;
}

.loading-progress-message {
  margin: 0;
  color: #52645a;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

.loading-progress-state {
  margin-top: -0.55rem;
  color: #557b5b;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.loading-progress-enter-active,
.loading-progress-leave-active {
  transition: opacity 140ms ease;
}

.loading-progress-enter-active .loading-progress-card,
.loading-progress-leave-active .loading-progress-card {
  transition: transform 140ms ease;
}

.loading-progress-enter-from,
.loading-progress-leave-to {
  opacity: 0;
}

.loading-progress-enter-from .loading-progress-card,
.loading-progress-leave-to .loading-progress-card {
  transform: translateY(5px) scale(0.98);
}

@keyframes loading-progress-bob {
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .loading-progress-pin {
    animation: none;
  }

  .loading-progress-enter-active,
  .loading-progress-leave-active,
  .loading-progress-enter-active .loading-progress-card,
  .loading-progress-leave-active .loading-progress-card {
    transition-duration: 1ms;
  }
}
</style>
