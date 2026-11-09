<script setup lang="ts">
import { checkmarkCircleOutline, compassOutline } from 'ionicons/icons';
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
      <section
        class="loading-progress-card"
        :class="{ 'is-complete': phase === 'complete' }"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span class="loading-progress-glow" aria-hidden="true"></span>

        <header class="loading-progress-header">
          <div class="loading-progress-brand">
            <span class="loading-progress-pin" aria-hidden="true">
              <ion-icon :icon="phase === 'complete' ? checkmarkCircleOutline : compassOutline"></ion-icon>
            </span>
            <span class="loading-progress-wordmark">
              RIDE
              <small>{{ phase === 'complete' ? 'Journey ready' : 'Journey in progress' }}</small>
            </span>
          </div>
          <span class="loading-progress-state">
            <span class="loading-progress-state-dot" aria-hidden="true"></span>
            {{ phase === 'complete' ? 'Ready' : 'Loading' }}
          </span>
        </header>

        <p class="loading-progress-message">{{ message }}</p>
        <RideProgressBar :phase="phase" label="Action progress" />
        <p class="loading-progress-hint">
          {{ phase === 'complete' ? 'You are all set. Continuing…' : 'Hang tight while we prepare everything.' }}
        </p>
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
  padding: clamp(1rem, 4vw, 2rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background:
    radial-gradient(circle at 50% 32%, color-mix(in srgb, var(--brand-accent) 16%, transparent), transparent 46%),
    rgb(7 27 18 / 56%);
  backdrop-filter: blur(8px) saturate(115%);
  -webkit-backdrop-filter: blur(8px) saturate(115%);
}

.loading-progress-card {
  position: relative;
  display: grid;
  width: min(370px, 100%);
  max-height: calc(100dvh - clamp(2rem, 8vw, 4rem));
  gap: 0.85rem;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(1.25rem, 4vw, 1.6rem);
  border: 1px solid color-mix(in srgb, var(--brand-accent) 22%, var(--border));
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow:
    0 40px 100px -34px rgb(7 27 18 / 62%),
    var(--shadow-lg);
  color: var(--text-primary);
}

.loading-progress-glow {
  position: absolute;
  inset: 0 0 auto;
  height: 140px;
  background: radial-gradient(90% 100% at 50% 0%, color-mix(in srgb, var(--brand-accent) 20%, transparent), transparent 70%);
  pointer-events: none;
}

.loading-progress-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.loading-progress-brand {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.7rem;
}

.loading-progress-pin {
  position: relative;
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--brand), var(--brand-mid));
  box-shadow: 0 12px 26px -12px color-mix(in srgb, var(--brand) 65%, transparent);
  color: var(--on-brand);
  font-size: 1.35rem;
}

.loading-progress-pin::after {
  content: '';
  position: absolute;
  inset: -5px;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 40%, transparent);
  border-radius: 19px;
  animation: loading-progress-pulse 1.7s var(--ease-out) infinite;
}

.loading-progress-wordmark {
  display: grid;
  gap: 0.18rem;
  color: var(--text-strong);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1;
}

.loading-progress-wordmark small {
  color: var(--text-muted);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.loading-progress-state {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  padding: 0.36rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 22%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--brand-soft) 62%, transparent);
  color: var(--brand-accent);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}

.loading-progress-state-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-accent);
  animation: loading-progress-blink 1.2s ease-in-out infinite;
}

.loading-progress-message {
  position: relative;
  margin: 0.1rem 0 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(1.12rem, 2vw, 1.3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.loading-progress-card :deep(.ride-progress-bar.ride-progress-bar) {
  position: relative;
  inset: auto;
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-pill);
}

.loading-progress-card :deep(.ride-progress-bar__track) {
  border-radius: inherit;
  background: color-mix(in srgb, var(--brand-soft) 85%, transparent);
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 6%);
}

.loading-progress-card :deep(.ride-progress-bar__indicator) {
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--brand-accent), var(--accent));
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 55%, transparent);
}

.loading-progress-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.72rem;
  line-height: 1.5;
}

.loading-progress-card.is-complete {
  border-color: color-mix(in srgb, var(--success) 28%, var(--border));
}

.loading-progress-card.is-complete .loading-progress-pin {
  background: linear-gradient(135deg, var(--success), var(--brand-accent));
}

.loading-progress-card.is-complete .loading-progress-pin::after {
  opacity: 0;
  animation: none;
}

.loading-progress-card.is-complete .loading-progress-state {
  border-color: color-mix(in srgb, var(--success) 28%, var(--border));
  background: var(--success-soft);
  color: var(--success);
}

.loading-progress-card.is-complete .loading-progress-state-dot {
  background: var(--success);
  animation: none;
}

.loading-progress-enter-active,
.loading-progress-leave-active {
  transition: opacity 160ms ease;
}

.loading-progress-enter-active .loading-progress-card,
.loading-progress-leave-active .loading-progress-card {
  transition:
    transform 220ms var(--ease-out),
    opacity 220ms var(--ease-out);
}

.loading-progress-enter-from,
.loading-progress-leave-to {
  opacity: 0;
}

.loading-progress-enter-from .loading-progress-card,
.loading-progress-leave-to .loading-progress-card {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

@keyframes loading-progress-pulse {
  0% {
    opacity: 0.7;
    transform: scale(0.96);
  }

  70% {
    opacity: 0;
    transform: scale(1.12);
  }

  100% {
    opacity: 0;
  }
}

@keyframes loading-progress-blink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

@media (max-width: 420px) {
  .loading-progress-card {
    width: 100%;
    border-radius: var(--radius-lg);
  }

  .loading-progress-header {
    gap: 0.6rem;
  }

  .loading-progress-pin {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    font-size: 1.2rem;
  }

  .loading-progress-state {
    padding: 0.32rem 0.5rem;
    font-size: 0.54rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-progress-pin::after,
  .loading-progress-state-dot {
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
