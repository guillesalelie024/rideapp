<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import {
  bookmarkOutline,
  calendarOutline,
  compassOutline,
  homeOutline,
  personCircleOutline,
} from 'ionicons/icons';

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
      <ion-icon :icon="personCircleOutline" aria-hidden="true"></ion-icon>
      <span>Profile</span>
    </router-link>
  </nav>
</template>

<style scoped>
.app-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: white;
  border-top: 1px solid #DCE9DF;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(63, 128, 100, 0.04);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: #658078;
  font-size: 10px;
  font-weight: 500;
  padding: 4px 2px;
  min-width: 0;
}

.nav-item ion-icon {
  font-size: 22px;
}

.nav-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.nav-active {
  color: #3F8064;
  font-weight: 600;
}

.nav-active ion-icon {
  color: #3F8064;
}
</style>
