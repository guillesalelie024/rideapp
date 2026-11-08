<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import {
  bookmarkOutline,
  calendarOutline,
  compassOutline,
  homeOutline,
} from 'ionicons/icons';
import RideProfileAvatar from './RideProfileAvatar.vue';

withDefaults(defineProps<{
  active: 'home' | 'explore' | 'trips' | 'saved' | 'profile';
}>(), {
  active: 'home',
});
</script>

<template>
  <nav class="app-bottom-nav" aria-label="Main navigation">
    <router-link to="/home" class="nav-item" :class="{ 'nav-active': active === 'home' }" :aria-current="active === 'home' ? 'page' : undefined">
      <ion-icon :icon="homeOutline" aria-hidden="true"></ion-icon>
      <span>Home</span>
    </router-link>
    <router-link to="/explore" class="nav-item" :class="{ 'nav-active': active === 'explore' }" :aria-current="active === 'explore' ? 'page' : undefined">
      <ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon>
      <span>Explore</span>
    </router-link>
    <router-link to="/trips" class="nav-item" :class="{ 'nav-active': active === 'trips' }" :aria-current="active === 'trips' ? 'page' : undefined">
      <ion-icon :icon="calendarOutline" aria-hidden="true"></ion-icon>
      <span>Trips</span>
    </router-link>
    <router-link to="/saved" class="nav-item" :class="{ 'nav-active': active === 'saved' }" :aria-current="active === 'saved' ? 'page' : undefined">
      <ion-icon :icon="bookmarkOutline" aria-hidden="true"></ion-icon>
      <span>Saved</span>
    </router-link>
    <router-link to="/profile" class="nav-item" :class="{ 'nav-active': active === 'profile' }" :aria-current="active === 'profile' ? 'page' : undefined">
      <RideProfileAvatar />
      <span>Profile</span>
    </router-link>
  </nav>
</template>

<style scoped>
.app-bottom-nav {
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 50%;
  display: grid;
  width: min(560px, calc(100% - 22px));
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 26px;
  background: var(--surface-glass);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  transform: translateX(-50%);
  z-index: 1000;
}

.nav-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 2px 7px;
  border-radius: 16px;
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.nav-item ion-icon {
  font-size: 21px;
  transition: transform var(--transition-fast);
}

.nav-item :deep(.ride-profile-avatar) {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  font-size: 21px;
}

.nav-item span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item:active {
  transform: scale(0.96);
}

.nav-active {
  background: var(--brand-soft);
  color: var(--brand);
  box-shadow: none;
}

.nav-active ion-icon {
  color: var(--brand);
  transform: translateY(-1px);
}

.nav-item {
  font-size: 11px;
}

.nav-item ion-icon {
  font-size: 22px;
}

.nav-item :deep(.ride-profile-avatar) {
  width: 21px;
  height: 21px;
  font-size: 21px;
}

@media (max-width: 767px) {
  .app-bottom-nav {
    width: min(600px, calc(100% - 16px));
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>