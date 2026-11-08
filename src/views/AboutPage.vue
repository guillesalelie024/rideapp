<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="about-page">
        <RideAppHeader
          eyebrow="About RIDE"
          title="Discover. Plan. Ride."
          subtitle="Real-time Itinerary and Destination Explorer"
          show-back
        />
        <main class="about-content desktop-content ride-content">
          <section class="about-card about-intro">
            <span class="about-mark" aria-hidden="true">R</span>
            <div>
              <h2>Your Calapan trip companion</h2>
              <p>RIDE helps you explore places around Calapan City, organize stops into an itinerary, compare transport options, and follow your trip progress.</p>
            </div>
          </section>

          <section class="about-card">
            <h2>What you can do</h2>
            <ul>
              <li>Discover destinations and save places for later.</li>
              <li>Build and manage trip itineraries.</li>
              <li>Review transport and fare information before traveling.</li>
              <li>Track itinerary stops while a live trip is open.</li>
              <li>Check local weather conditions and travel alerts.</li>
            </ul>
          </section>

          <section class="about-card about-note">
            <h2>Travel information</h2>
            <p>Fare and route details may be estimates or unavailable, and are not a booking or live transit service. Confirm current fares, schedules, and route instructions with the operator before traveling.</p>
            <p>Location tracking is used only when you enable it for a live trip. Saved places and emergency contacts are stored on this device; trip syncing requires signing in.</p>
          </section>

          <p class="about-footer">RIDE · Real-time Itinerary and Destination Explorer</p>
        </main>
        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.about-page { min-height: 100vh; padding-bottom: calc(104px + env(safe-area-inset-bottom)); background: var(--bg); }
.about-content { display: grid; gap: 16px; width: min(100%, 760px); margin: 0 auto; padding: 18px 16px 28px; }
.about-card { padding: 19px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.about-card h2 { margin: 0 0 10px; color: var(--text-strong); font-size: 17px; }
.about-card p, .about-card li { color: var(--text-body); font-size: 14px; line-height: 1.65; }
.about-card p { margin: 0; }
.about-card p + p { margin-top: 10px; }
.about-intro { display: flex; align-items: flex-start; gap: 14px; background: var(--surface-soft); }
.about-intro h2 { margin-top: 2px; }
.about-mark { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 13px; background: var(--brand); color: var(--on-brand); font-size: 22px; font-weight: 800; }
.about-card ul { display: grid; gap: 8px; margin: 0; padding-left: 20px; }
.about-note { border-color: var(--border); background: var(--surface); }
.about-footer { margin: 4px 0 0; color: var(--text-muted); font-size: 12px; text-align: center; }
@media (min-width: 600px) { .about-content { padding-right: 24px; padding-left: 24px; } }
</style>
