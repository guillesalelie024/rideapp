<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { busOutline, compassOutline, locationOutline, mapOutline } from 'ionicons/icons';
import RideLogo from '../components/RideLogo.vue';
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="welcome-page">
        <header class="welcome-header page-width">
          <div class="welcome-brand">
            <RideLogo />
            <span>Real-time Itinerary and<br />Destination Explorer</span>
          </div>
        </header>

        <section class="welcome-hero page-width">
          <div id="about" class="welcome-content">
            <p class="welcome-location"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon> Calapan City, Oriental Mindoro</p>
            <h1>Your Next Journey <span>Starts Here.</span></h1>
            <p class="welcome-description">
              Discover beautiful places, plan your itinerary, and find the best way to get around Calapan City.
            </p>

            <div class="welcome-actions">
              <router-link class="button-primary button-large" to="/signup">Get Started</router-link>
              <router-link class="button-outline button-large" to="/login">Log In</router-link>
            </div>

            <div id="features" class="feature-list" aria-label="What you can do with RIDE">
              <article class="feature-item">
                <span class="feature-icon"><ion-icon :icon="compassOutline" aria-hidden="true"></ion-icon></span>
                <div><h2>Discover Destinations</h2><p>Explore verified places in Calapan City.</p></div>
              </article>
              <article class="feature-item">
                <span class="feature-icon"><ion-icon :icon="mapOutline" aria-hidden="true"></ion-icon></span>
                <div><h2>Plan Your Journey</h2><p>Keep your local itinerary in one place.</p></div>
              </article>
              <article class="feature-item">
                <span class="feature-icon"><ion-icon :icon="busOutline" aria-hidden="true"></ion-icon></span>
                <div><h2>Find Your Best Route</h2><p>Explore your way around the city.</p></div>
              </article>
            </div>
            <p class="welcome-tagline">Discover. <span>Plan.</span> Ride. Arrive.</p>
          </div>

          <div class="welcome-destination">
            <div class="destination-intro">
              <p>Featured Destination <span aria-hidden="true">•</span> Calapan City</p>
              <h2>A breath of nature</h2>
              <span>Explore the mangrove boardwalk at Silonay Eco-Park.</span>
            </div>
            <figure class="welcome-visual">
              <img
                class="welcome-photo"
                src="../assets/silonay-mangrove-eco-park.webp"
                alt="Wooden walkway through the mangroves at Silonay Mangrove Conservation Eco-Park"
                fetchpriority="high"
                decoding="async"
              />
              <figcaption class="photo-caption">
                <span class="photo-caption-copy">
                  <strong>Silonay Mangrove Conservation Eco-Park</strong>
                  <span>Calapan City, Oriental Mindoro</span>
                </span>
                <span class="photo-tag">NATURE ESCAPE</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <footer class="welcome-footer page-width">
          <span>Discover. Plan. Ride. Arrive. Around Calapan.</span>
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>
