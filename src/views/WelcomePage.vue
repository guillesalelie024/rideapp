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
          <span class="welcome-pill">
            <span class="welcome-pill-dot" aria-hidden="true"></span>
            Your local travel companion
          </span>
        </header>

        <section class="welcome-hero page-width">
          <div id="about" class="welcome-content">
            <p class="welcome-location"><ion-icon :icon="locationOutline" aria-hidden="true"></ion-icon> Calapan City, Oriental Mindoro</p>
            <h1>Your Next Journey <span>Starts Here.</span></h1>
            <p class="welcome-description">
              Discover beautiful places, plan your itinerary, and find the best way to get around Calapan City.
            </p>

            <div class="welcome-actions">
              <router-link class="button-primary button-large welcome-cta-primary" to="/signup">Get Started</router-link>
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

<style scoped>
.welcome-page {
  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  padding-bottom: 0;
  background:
    radial-gradient(1100px 700px at 0% -10%, color-mix(in srgb, var(--brand-soft) 90%, transparent), transparent 60%),
    radial-gradient(900px 620px at 100% 8%, color-mix(in srgb, var(--accent-soft) 70%, transparent), transparent 55%),
    var(--bg);
}

.welcome-page::before,
.welcome-page::after {
  content: '';
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
}

.welcome-page::before {
  top: -220px;
  left: -160px;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 20%, transparent), transparent 68%);
}

.welcome-page::after {
  right: -140px;
  bottom: -200px;
  width: 460px;
  height: 460px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 68%);
}

.welcome-header {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.welcome-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.welcome-brand > span {
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.welcome-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 18%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface) 75%, transparent);
  box-shadow: var(--shadow-xs);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(12px);
}

.welcome-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-accent) 16%, transparent);
}

.welcome-hero {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(1280px, calc(100% - clamp(24px, 4vw, 64px)));
  min-height: 0;
  flex: 1;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  align-items: center;
  gap: clamp(2rem, 4vw, 4rem);
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 2.5rem) 0 clamp(2rem, 4vw, 3.5rem);
}

.welcome-content {
  z-index: 1;
  width: 100%;
  max-width: 640px;
  margin-inline: auto;
  padding: 0;
}

.welcome-location {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 1.1rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 16%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  color: var(--brand-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.welcome-location ion-icon {
  font-size: 1rem;
}

.welcome-content h1 {
  max-width: 620px;
  margin: 0 0 1rem;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(2.7rem, 4.7vw, 4.9rem);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

.welcome-content h1 span {
  display: block;
  color: var(--brand-accent);
}

.welcome-description {
  max-width: 500px;
  margin: 0;
  color: var(--text-body);
  font-size: 0.98rem;
  line-height: 1.65;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.welcome-actions .button-large {
  min-width: 154px;
  min-height: 52px;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
}

.welcome-cta-primary {
  background: linear-gradient(135deg, var(--brand), var(--brand-mid));
  box-shadow: 0 16px 34px -16px color-mix(in srgb, var(--brand) 60%, transparent);
}

.welcome-actions .button-outline {
  border: 1.5px solid color-mix(in srgb, var(--brand-accent) 32%, var(--border-strong));
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  color: var(--brand-accent);
}

.welcome-actions .button-outline:hover {
  border-color: var(--brand-accent);
  background: var(--brand-soft-2);
}

.feature-list {
  display: grid;
  max-width: 660px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 1.85rem 0 0;
}

.feature-item {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 0.5rem;
  padding: 0.9rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 12%, var(--border));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 72%, transparent);
  box-shadow: var(--shadow-xs);
  backdrop-filter: blur(10px);
  transition:
    transform var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}

.feature-item:hover {
  border-color: color-mix(in srgb, var(--brand-accent) 28%, var(--border));
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.feature-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: var(--brand-soft-2);
  color: var(--brand-accent);
  font-size: 1.3rem;
}

.feature-item h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 0.83rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.feature-item p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.73rem;
  line-height: 1.5;
}

.welcome-tagline {
  margin: 1.6rem 0 0;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.6vw, 1.5rem);
  font-style: italic;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.welcome-tagline span {
  color: var(--accent-strong);
}

.welcome-destination {
  display: flex;
  width: 100%;
  max-width: 560px;
  flex-direction: column;
  align-self: center;
  justify-self: center;
  margin: 0 auto;
  padding: clamp(0.7rem, 1.1vw, 0.95rem);
  border: 1px solid color-mix(in srgb, var(--brand-accent) 16%, var(--border));
  border-radius: var(--radius-2xl);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: 0 34px 90px -46px color-mix(in srgb, var(--brand-deep) 55%, transparent);
  backdrop-filter: blur(14px);
}

.destination-intro {
  padding: 0.55rem 0.55rem 1rem;
}

.destination-intro > p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.45rem;
  color: var(--accent-strong);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.destination-intro > p span {
  color: var(--text-muted);
}

.destination-intro h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.destination-intro > span {
  display: block;
  margin-top: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.5;
}

.welcome-visual {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  margin: 0;
  border: 0;
  border-radius: calc(var(--radius-2xl) - 8px);
  background: var(--surface-soft);
  aspect-ratio: 4 / 3.35;
}

.welcome-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 55%;
  transition: transform 600ms var(--ease-out);
}

.welcome-visual:hover .welcome-photo {
  transform: scale(1.03);
}

.photo-caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
  padding: clamp(1rem, 2vw, 1.4rem);
  background: linear-gradient(180deg, transparent 0%, rgb(7 27 18 / 86%) 100%);
  color: var(--white);
}

.photo-caption-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.2rem;
}

.photo-caption-copy strong {
  color: var(--white);
  font-size: clamp(0.9rem, 1.2vw, 1.05rem);
  font-weight: 700;
  line-height: 1.3;
}

.photo-caption-copy > span {
  color: rgb(255 255 255 / 76%);
  font-size: 0.76rem;
  font-weight: 600;
}

.photo-tag {
  flex: 0 0 auto;
  padding: 0.45rem 0.65rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 14%);
  color: var(--white);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  backdrop-filter: blur(10px);
}

.welcome-footer {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 70px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.74rem;
}

.welcome-footer > span:last-child {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

@media (max-width: 1080px) {
  .welcome-hero {
    grid-template-columns: 1fr;
    gap: clamp(1.5rem, 3vw, 2.5rem);
    padding-top: 0.5rem;
  }

  .welcome-content,
  .welcome-destination {
    max-width: 640px;
  }

  .welcome-content h1 {
    font-size: clamp(2.6rem, 7vw, 3.8rem);
  }

  .welcome-destination {
    max-width: 620px;
  }
}

@media (max-width: 720px) {
  .welcome-header {
    min-height: 78px;
  }

  .welcome-pill {
    display: none;
  }

  .welcome-brand > span {
    font-size: 0.68rem;
  }

  .welcome-hero {
    width: calc(100% - clamp(24px, 6vw, 48px));
  }

  .welcome-content h1 {
    font-size: clamp(2.25rem, 10vw, 3rem);
  }

  .welcome-description {
    font-size: 0.92rem;
  }

  .welcome-actions {
    gap: 0.65rem;
  }

  .welcome-actions .button-large {
    flex: 1 1 0;
    min-width: 0;
    min-height: 46px;
    padding: 0 1rem;
    font-size: 0.88rem;
  }

  .feature-list {
    max-width: 520px;
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .feature-item {
    grid-template-columns: auto 1fr;
    column-gap: 0.7rem;
    row-gap: 0.15rem;
    align-items: center;
    padding: 0.7rem 0.8rem;
  }

  .feature-icon {
    grid-row: 1 / span 2;
    width: 38px;
    height: 38px;
    font-size: 1.15rem;
  }

  .feature-item h2,
  .feature-item p {
    grid-column: 2;
  }

  .welcome-visual {
    aspect-ratio: 4 / 3.6;
  }

  .welcome-footer {
    min-height: 64px;
    flex-direction: column;
    justify-content: center;
    gap: 0.35rem;
    padding-block: 0.9rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .welcome-brand > span {
    display: none;
  }

  .welcome-content h1 {
    font-size: clamp(2rem, 11vw, 2.7rem);
  }

  .welcome-location {
    font-size: 0.66rem;
  }

  .welcome-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }

  .welcome-actions .button-large {
    width: 100%;
    min-height: 48px;
  }

  .welcome-tagline {
    text-align: center;
  }

  .photo-caption {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.55rem;
  }
}
</style>
