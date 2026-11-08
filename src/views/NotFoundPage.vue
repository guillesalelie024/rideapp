<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { useRoute } from 'vue-router';
import RideAppHeader from '../components/RideAppHeader.vue';

const route = useRoute();
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="nf-shell">
        <RideAppHeader
          eyebrow="Page not found"
          title="This trail ends here"
          subtitle="The page you followed does not exist or may have moved."
        />

        <main class="nf-content">
          <p class="nf-path">{{ route.fullPath }}</p>
          <div class="nf-actions">
            <router-link class="button-primary" to="/home">Go to Home</router-link>
            <router-link class="nf-secondary" to="/explore">Explore destinations</router-link>
          </div>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.nf-shell { min-height: 100vh; background: var(--bg); }
.nf-content { display: grid; width: min(100%, 520px); margin: 0 auto; gap: 16px; padding: 28px 16px; }
.nf-path { overflow-wrap: anywhere; margin: 0; padding: 14px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-body); font-family: monospace; font-size: 13px; }
.nf-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.nf-actions .button-primary, .nf-secondary { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; padding: 0 18px; border-radius: 12px; font-weight: 700; text-decoration: none; }
.nf-secondary { border: 1px solid var(--border); color: var(--brand-mid); }
</style>
