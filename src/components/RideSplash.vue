<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import RideLogo from './RideLogo.vue';

const emit = defineEmits<{
  finished: [];
}>();

const leaving = ref(false);
const visible = ref(true);
let leaveTimer: ReturnType<typeof setTimeout> | undefined;
let finishTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  const reduceMotion = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = reduceMotion ? 300 : 1350;

  leaveTimer = setTimeout(() => {
    leaving.value = true;
  }, hold);
  finishTimer = setTimeout(() => {
    visible.value = false;
    emit('finished');
  }, hold + (reduceMotion ? 80 : 480));
});

onBeforeUnmount(() => {
  if (leaveTimer) clearTimeout(leaveTimer);
  if (finishTimer) clearTimeout(finishTimer);
});
</script>

<template>
  <transition name="ride-splash-fade">
    <div v-if="visible" class="ride-splash" :class="{ 'is-leaving': leaving }" role="status" aria-label="RIDE is preparing your journey">
      <div class="ride-splash-scene" aria-hidden="true"></div>
      <div class="ride-splash-overlay" aria-hidden="true"></div>
      <div class="ride-splash-content">
        <RideLogo />
        <p class="ride-splash-kicker">Calapan City · Oriental Mindoro</p>
        <p class="ride-splash-tagline">Plan<span class="dot">•</span>Commute<span class="dot">•</span>Explore</p>
        <span class="ride-splash-loader" aria-hidden="true"><span></span></span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.ride-splash {
  position: fixed;
  z-index: 11050;
  inset: 0;
  display: grid;
  overflow: hidden;
  place-items: center;
  background: var(--deep-forest);
  color: var(--on-brand);
  transition: opacity 450ms var(--ease-out), visibility 450ms var(--ease-out);
}

.ride-splash.is-leaving {
  visibility: hidden;
  opacity: 0;
}

.ride-splash-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background:
    linear-gradient(180deg, rgb(6 24 16 / 40%), rgb(6 24 16 / 82%) 72%, var(--deep-forest) 100%),
    url('../assets/feraren-hills.png') center / cover no-repeat;
  transform: scale(1.04);
  animation: ride-splash-drift 6s var(--ease-out) both;
}

.ride-splash-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--deep-forest) 0%, color-mix(in srgb, var(--deep-forest) 70%, transparent) 45%, transparent 100%);
}

.ride-splash-content {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  animation: ride-splash-rise 700ms var(--ease-out) both;
}

.ride-splash-content :deep(.brand) {
  gap: 0.7rem;
  margin-bottom: 0.6rem;
  padding: 0.52rem 1rem 0.52rem 0.66rem;
  border: 1px solid rgb(255 255 255 / 48%);
  border-radius: var(--radius-pill);
  background: var(--white);
  box-shadow: 0 18px 46px rgb(3 16 10 / 30%);
}

.ride-splash-content :deep(.brand-mark) {
  width: 50px;
  height: 60px;
  filter: none;
}

.ride-splash-content :deep(.brand-wordmark) {
  width: 112px;
  filter: none;
}

.ride-splash-kicker {
  margin: 0;
  color: rgb(255 255 255 / 66%);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.ride-splash-tagline {
  margin: 0;
  color: var(--ivory);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  letter-spacing: 0.06em;
}

.ride-splash-tagline .dot {
  color: var(--mint-green);
  margin: 0 0.45rem;
  font-weight: 400;
  opacity: 0.7;
}

.ride-splash-loader {
  position: relative;
  display: block;
  width: 128px;
  height: 3px;
  overflow: hidden;
  margin-top: 0.85rem;
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 18%);
}

.ride-splash-loader span {
  display: block;
  width: 46%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--mint-green), var(--pale-green));
  animation: ride-splash-load 1.25s var(--ease-in-out) infinite;
}

@keyframes ride-splash-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ride-splash-drift {
  from {
    transform: scale(1.09);
  }

  to {
    transform: scale(1.02);
  }
}

@keyframes ride-splash-load {
  from {
    transform: translateX(-110%);
  }

  to {
    transform: translateX(230%);
  }
}

.ride-splash-fade-leave-active {
  transition: opacity 380ms var(--ease-out);
}

.ride-splash-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .ride-splash-content :deep(.brand-mark) {
    width: 50px;
    height: 60px;
  }

  .ride-splash-content :deep(.brand-wordmark) {
    width: 104px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ride-splash-scene,
  .ride-splash-content,
  .ride-splash-loader span {
    animation: none;
  }
}
</style>
