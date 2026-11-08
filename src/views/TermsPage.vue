<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import RideAppHeader from '../components/RideAppHeader.vue';
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="legal-shell">
        <RideAppHeader
          eyebrow="Legal"
          title="Terms of Service"
          subtitle="Last updated: November 3, 2026"
          show-back
          back-to="/profile"
        />

        <main class="legal-content desktop-content ride-content">
          <section class="legal-card">
            <h2>Using RIDE</h2>
            <p>RIDE helps you explore Calapan City, plan itineraries, compare published fare references, and track trips you choose to start. By using the app, you agree to use it lawfully and to verify important travel details before you depart.</p>
          </section>

          <section class="legal-card">
            <h2>Travel information</h2>
            <p>Destination details, fares, schedules, weather, and map data come from public or third-party sources and may change without notice. RIDE does not operate transport services and does not guarantee fares, availability, opening hours, or travel times. Confirm details directly with the provider or local authority.</p>
          </section>

          <section class="legal-card">
            <h2>Your account</h2>
            <p>You are responsible for the accuracy of your account details and for keeping your password secure. Do not share your account. We may suspend accounts used for abuse, fraud, or attempts to disrupt the service.</p>
          </section>

          <section class="legal-card">
            <h2>Your content</h2>
            <p>Trips, itineraries, saved places, and preferences are stored on your device. If you sign in, trip data may be synced to the RIDE server so you can access it across sessions. You keep ownership of the content you create.</p>
          </section>

          <section class="legal-card">
            <h2>Safety</h2>
            <p>Live tracking is a convenience feature, not an emergency service. In an emergency, contact local emergency services. Use the app only when it is safe to do so, especially while walking, riding, or driving.</p>
          </section>

          <section class="legal-card">
            <h2>Changes and contact</h2>
            <p>We may update these terms as the app changes. Continued use after an update means you accept the revised terms. Questions about these terms can be sent through the feedback channel provided in the app.</p>
          </section>

          <router-link class="legal-back" to="/privacy">Read the Privacy Policy</router-link>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.legal-shell { min-height: 100vh; background: var(--bg); }
.legal-content { display: grid; gap: 12px; width: min(100%, 760px); margin: 0 auto; padding: 18px 16px 40px; }
.legal-card { padding: 18px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
.legal-card h2 { margin: 0 0 8px; color: var(--text-strong); font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.legal-card p { margin: 0; color: var(--text-body); font-size: 13px; line-height: 1.65; }
.legal-back { justify-self: start; color: var(--brand-mid); font-weight: 700; }
</style>
