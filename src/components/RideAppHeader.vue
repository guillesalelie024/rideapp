<script setup lang="ts">
import { IonIcon } from '@ionic/vue';
import { arrowBackOutline, personCircleOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideLogo from './RideLogo.vue';

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

function goBack() {
  if (props.backTo) {
    void router.push(props.backTo);
    return;
  }
  router.back();
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
        <slot name="actions"></slot>
        <router-link class="ride-app-profile-btn" to="/profile" aria-label="Profile">
          <ion-icon :icon="personCircleOutline" aria-hidden="true"></ion-icon>
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
  padding: calc(env(safe-area-inset-top) + 12px) 16px 22px;
  border-bottom-right-radius: 26px;
  border-bottom-left-radius: 26px;
  background: linear-gradient(135deg, #e8f4ec 0%, #f2f8f3 100%);
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
  display: flex;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid #dce9df;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(63 128 100 / 6%);
  color: #3f8064;
  font-size: 24px;
  text-decoration: none;
}

.ride-app-header-button {
  cursor: pointer;
}

.ride-app-header-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ride-app-header-eyebrow {
  margin: 0;
  color: #3f8064;
  font-size: 14px;
  font-weight: 600;
}

.ride-app-header-title {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
}

.ride-app-header-subtitle {
  margin: 0;
  color: #658078;
  font-size: 13px;
}
</style>
