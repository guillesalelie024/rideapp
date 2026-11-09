<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { arrowBackOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { getResolvedTheme, setThemeMode, type ThemeMode } from '../composables/theme';
import RideLogo from './RideLogo.vue';
import RideNotificationBell from './RideNotificationBell.vue';
import RideProfileAvatar from './RideProfileAvatar.vue';

const props = withDefaults(defineProps<{
  eyebrow: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
}>(), {
  subtitle: '',
  showBack: false,
});

const router = useRouter();
const resolvedTheme = computed(() => getResolvedTheme());

function goBack() {
  if (props.backTo) {
    void router.push(props.backTo);
    return;
  }
  router.back();
}

function toggleTheme() {
  const next: ThemeMode = resolvedTheme.value === 'dark' ? 'light' : 'dark';
  setThemeMode(next);
}
</script>

<template>
  <header class="ride-app-header">
    <div class="ride-app-header-top">
      <RideLogo to="/home" />
      <div class="ride-app-header-actions">
        <button
          v-if="showBack"
          class="ride-app-header-button"
          type="button"
          aria-label="Go back"
          @click="goBack"
        >
          <ion-icon :icon="arrowBackOutline" aria-hidden="true"></ion-icon>
        </button>
        <button
          class="ride-app-header-button ride-app-theme-toggle"
          type="button"
          :aria-label="resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <ion-icon :icon="resolvedTheme === 'dark' ? sunnyOutline : moonOutline" aria-hidden="true"></ion-icon>
        </button>
        <RideNotificationBell button-class="ride-app-header-button ride-app-notification-btn" badge-class="ride-app-notification-badge" />
        <slot name="actions"></slot>
        <router-link class="ride-app-profile-btn" to="/profile" aria-label="Profile">
          <RideProfileAvatar />
        </router-link>
      </div>
    </div>

    <div class="ride-app-header-copy">
      <slot name="leading"></slot>
      <p class="ride-app-header-eyebrow">{{ eyebrow }}</p>
      <h1 class="ride-app-header-title">{{ title }}</h1>
      <p v-if="subtitle" class="ride-app-header-subtitle">{{ subtitle }}</p>
      <slot name="details"></slot>
    </div>
  </header>
</template>

<style scoped>
.ride-app-header {
  position: relative;
  padding: calc(env(safe-area-inset-top) + 14px) clamp(16px, 4vw, 26px) 18px;
  background: var(--bg);
}

.ride-app-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.ride-app-header-top :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.ride-app-header-top :deep(.brand-mark) {
  width: 38px;
  height: 44px;
  flex-shrink: 0;
}

.ride-app-header-top :deep(.brand-wordmark) {
  width: 76px;
  height: auto;
  flex-shrink: 0;
}

.ride-app-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ride-app-profile-btn,
.ride-app-header-button {
  display: inline-flex;
  width: 44px;
  min-width: 44px;
  height: 44px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  color: var(--brand-accent);
  font-size: 22px;
  line-height: 0;
  text-decoration: none;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.ride-app-profile-btn:hover,
.ride-app-header-button:hover {
  border-color: var(--border-strong);
  background: var(--brand-soft-2);
}

.ride-app-header-button ion-icon,
.ride-app-header-actions :deep(.ride-app-notification-btn ion-icon),
.ride-app-header-actions :deep(.ride-notif-glyph) {
  font-size: 22px;
  width: 22px;
  height: 22px;
  display: block;
  flex: 0 0 auto;
}

.ride-app-notification-btn {
  position: relative;
  overflow: visible;
}
.ride-app-header-actions :deep(.ride-app-notification-btn) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 44px !important;
  min-width: 44px !important;
  height: 44px !important;
  padding: 0 !important;
  border: 1px solid var(--border) !important;
  border-radius: 50% !important;
  background: var(--surface) !important;
  box-shadow: var(--shadow-xs) !important;
  color: var(--brand-accent) !important;
  font-size: 22px !important;
  line-height: 0 !important;
}

.ride-app-header-actions :deep(.ride-app-notification-badge) {
  position: absolute;
  top: -3px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--danger, #d64545);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--surface);
}

.ride-app-theme-toggle {
  position: relative;
  overflow: hidden;
}

.ride-app-theme-toggle ion-icon {
  font-size: 22px;
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

:global(html.dark) .ride-app-theme-toggle ion-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}

.ride-app-theme-toggle::before {
  content: '';
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 30%, transparent) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.ride-app-theme-toggle:active::before {
  opacity: 1;
}

.ride-app-profile-btn :deep(.ride-profile-avatar) {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  font-size: 22px;
}

.ride-app-profile-btn :deep(.ride-profile-avatar ion-icon) {
  font-size: 22px;
  width: 22px;
  height: 22px;
}

.ride-app-header-button {
  cursor: pointer;
}

@media (max-width: 560px) {
  .ride-app-header { padding: calc(env(safe-area-inset-top) + 10px) 14px 14px; }
  .ride-app-header-top { margin-bottom: 12px; gap: 8px; }
  .ride-app-header-actions { gap: 6px; }
  .ride-app-profile-btn,
  .ride-app-header-button,
  .ride-app-header-actions :deep(.ride-app-notification-btn) {
    width: 40px !important; min-width: 40px !important; height: 40px !important; font-size: 20px !important;
  }
  .ride-app-header-button ion-icon,
  .ride-app-header-actions :deep(.ride-app-notification-btn ion-icon),
  .ride-app-header-actions :deep(.ride-notif-glyph),
  .ride-app-profile-btn :deep(.ride-profile-avatar),
  .ride-app-profile-btn :deep(.ride-profile-avatar ion-icon) { font-size: 20px; width: 20px; height: 20px; }
  .ride-app-header-actions :deep(.ride-notif-panel) {
    position: fixed; top: calc(env(safe-area-inset-top) + 58px); left: 50% !important; right: auto !important; width: min(360px, calc(100vw - 24px)) !important; max-height: min(62vh, 420px); border-radius: 18px; transform: translateX(-50%) !important;
  }
}

.ride-app-header-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 700px;
}

.ride-app-header-eyebrow {
  margin: 0;
  color: var(--brand-accent);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ride-app-header-title {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(28px, 6.4vw, 38px);
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.06;
}

.ride-app-header-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
</style>