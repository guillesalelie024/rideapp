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
          title="Privacy Policy"
          subtitle="Last updated: November 3, 2026"
          show-back
          back-to="/profile"
        />

        <main class="legal-content desktop-content ride-content">
          <section class="legal-card">
            <h2>What RIDE stores on your device</h2>
            <p>Trips, itineraries, saved places, travel preferences, and your sign-in session are stored in your browser or app storage. Clearing the app's site data or using the clear option in Privacy &amp; Security removes this local data.</p>
          </section>

          <section class="legal-card">
            <h2>Account data</h2>
            <p>If you create an account, RIDE stores your name, email address, a securely hashed password, and the trips you sync. Reset tokens are stored as hashes with a 30-minute expiry. You can change your password from Privacy &amp; Security.</p>
          </section>

          <section class="legal-card">
            <h2>Location</h2>
            <p>Near Me and live tracking request your device location only when you tap the relevant button. Your coordinates are used on the device to calculate distances and map links; RIDE does not send your location to its server. Your device or browser controls location permission.</p>
          </section>

          <section class="legal-card">
            <h2>Third-party services</h2>
            <p>Weather data is requested from an external weather provider. Directions links open Google Maps. Destination photos may load from external image hosts. These providers receive standard request information such as your IP address under their own privacy policies.</p>
          </section>

          <section class="legal-card">
            <h2>Email</h2>
            <p>If you request a password reset, RIDE sends a one-time reset link to the email address on your account. The email delivery provider processes that address to deliver the message. Reset requests for unknown addresses receive the same generic response so accounts cannot be probed.</p>
          </section>

          <section class="legal-card">
            <h2>Retention and choices</h2>
            <p>Local data remains until you clear it or uninstall the app. Account data remains while your account exists. You can request correction or deletion of account data through the feedback channel provided in the app. Revoked sessions and expired reset tokens are no longer accepted.</p>
          </section>

          <router-link class="legal-back" to="/terms">Read the Terms of Service</router-link>
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
