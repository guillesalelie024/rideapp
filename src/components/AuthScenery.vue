<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  barChartOutline,
  bicycleOutline,
  bookmarkOutline,
  calendarOutline,
  compassOutline,
  keyOutline,
  mapOutline,
  peopleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import loginScenery from '../assets/calapan-nature-park.png';
import signupScenery from '../assets/baruyan-river-cruise.png';
import recoveryScenery from '../assets/bulusan-park.jpg';

type SceneryVariant = 'login' | 'signup' | 'recovery';

const props = defineProps<{
  variant: SceneryVariant;
}>();

const scenery = computed(() => {
  if (props.variant === 'signup') return signupScenery;
  if (props.variant === 'recovery') return recoveryScenery;
  return loginScenery;
});

const content = computed(() => {
  if (props.variant === 'recovery') {
    return {
      kicker: 'RIDE · FIND YOUR WAY BACK',
      headline: 'Return to the Journey',
      tagline: 'A quiet step back to your account, then the road is yours again.',
      features: [
        { icon: shieldCheckmarkOutline, title: 'Secure Recovery', description: 'Reset links are private, time-limited, and single-use.' },
        { icon: keyOutline, title: 'Fresh Access', description: 'Choose a new password and sign back in with confidence.' },
        { icon: compassOutline, title: 'Back on Route', description: 'Your saved trips and plans are waiting for you.' },
      ],
    };
  }

  if (props.variant === 'login') {
    return {
      kicker: 'RIDE · YOUR JOURNEY CONTINUES',
      headline: 'Welcome Back to the Road',
      tagline: 'Pick up where you left off and get back to the journeys you love.',
      features: [
        { icon: bookmarkOutline, title: 'Saved Trails', description: 'Your favorite routes, ready whenever you are.' },
        { icon: calendarOutline, title: 'Active Bookings', description: 'Keep upcoming rides and reservations in view.' },
        { icon: barChartOutline, title: 'Trip Stats', description: 'See where your miles have taken you.' },
      ],
    };
  }

  return {
    kicker: 'RIDE · GO FURTHER',
    headline: 'Start Your Adventure Today',
    tagline: 'New roads, great rides, and a community of fellow explorers are waiting.',
    features: [
      { icon: mapOutline, title: 'Curated Routes', description: 'Find scenic roads and off-the-beaten-path trails.' },
      { icon: bicycleOutline, title: 'Instant Vehicle Rentals', description: 'Book motorcycles, scooters, or cars with ease.' },
      { icon: peopleOutline, title: 'Rider Community', description: 'Meet local enthusiasts and join group rides.' },
    ],
  };
});
</script>

<template>
  <aside class="auth-brand-panel" :class="`auth-brand-panel--${variant}`" :aria-label="`RIDE ${variant} highlights`">
    <img
      class="auth-scenery-art"
      :src="scenery"
      alt=""
      aria-hidden="true"
      decoding="async"
    />
    <div class="auth-scenery-shade" aria-hidden="true"></div>
    <div class="auth-scenery-glow" aria-hidden="true"></div>
    <span class="auth-scenery-badge"><span></span> Forest Explorer</span>
    <div class="auth-scenery-copy">
      <p class="auth-scenery-kicker">{{ content.kicker }}</p>
      <h2>{{ content.headline }}</h2>
      <p>{{ content.tagline }}</p>
      <ul class="auth-scenery-features" aria-label="RIDE features">
        <li v-for="feature in content.features" :key="feature.title">
          <span class="auth-scenery-feature-icon"><ion-icon :icon="feature.icon" aria-hidden="true"></ion-icon></span>
          <span><strong>{{ feature.title }}</strong><small>{{ feature.description }}</small></span>
        </li>
      </ul>
    </div>
    <span class="auth-scenery-route" aria-hidden="true">
      <span></span>
      Made for the open road
    </span>
  </aside>
</template>

<style scoped>
.auth-brand-panel {
  --auth-panel-pad: clamp(1.5rem, 3vw, 3rem);

  position: relative;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  padding: var(--auth-panel-pad);
  isolation: isolate;
  background: var(--deep-forest);
}

.auth-brand-panel::after {
  content: '';
  position: absolute;
  inset: clamp(0.55rem, 1vw, 0.85rem);
  z-index: 0;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: calc(var(--radius-2xl) - 4px);
  pointer-events: none;
}

.auth-scenery-art,
.auth-scenery-shade,
.auth-scenery-glow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.auth-scenery-art {
  z-index: -3;
  object-fit: cover;
  object-position: center;
  transform: scale(1.01);
}

.auth-brand-panel--signup .auth-scenery-art {
  object-position: center 52%;
}

.auth-brand-panel--recovery .auth-scenery-art {
  object-position: center 45%;
}

.auth-scenery-shade {
  z-index: -2;
  background:
    linear-gradient(180deg, rgb(7 27 18 / 14%) 0%, rgb(7 27 18 / 30%) 38%, rgb(7 27 18 / 90%) 100%),
    linear-gradient(90deg, rgb(7 27 18 / 32%), transparent 68%),
    radial-gradient(120% 95% at 18% 8%, transparent 38%, rgb(7 27 18 / 42%) 100%);
}

.auth-scenery-glow {
  z-index: -1;
  background: radial-gradient(circle at 22% 18%, rgb(143 208 168 / 22%), transparent 34%);
  mix-blend-mode: screen;
}

.auth-scenery-badge {
  position: absolute;
  top: var(--auth-panel-pad);
  left: var(--auth-panel-pad);
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.78rem;
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 12%);
  color: rgb(255 255 255 / 84%);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(14px);
}

.auth-scenery-badge > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mint-green);
  box-shadow: 0 0 0 4px rgb(143 208 168 / 18%);
}

.auth-scenery-copy {
  position: relative;
  z-index: 1;
  max-width: 34rem;
  color: var(--on-brand);
  text-shadow: 0 2px 22px rgb(3 16 10 / 34%);
}

.auth-scenery-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 0.85rem;
  color: var(--pale-green);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.17em;
  line-height: 1.4;
}

.auth-scenery-kicker::before {
  content: '';
  width: 24px;
  height: 1px;
  flex: 0 0 auto;
  background: currentColor;
  opacity: 0.6;
}

.auth-scenery-copy h2 {
  margin: 0;
  color: var(--white);
  font-family: var(--font-display);
  font-size: clamp(2rem, 2.9vw, 3.1rem);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.05;
  text-wrap: balance;
}

.auth-scenery-copy > p:not(.auth-scenery-kicker) {
  max-width: 26rem;
  margin: 0.9rem 0 0;
  color: rgb(255 255 255 / 78%);
  font-size: 0.9rem;
  line-height: 1.6;
}

.auth-scenery-features {
  display: grid;
  gap: 0.5rem;
  margin: 1.4rem 0 0;
  padding: 0;
  list-style: none;
}

.auth-scenery-features li {
  display: grid;
  grid-template-columns: 40px 1fr;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 8%);
  backdrop-filter: blur(12px);
}

.auth-scenery-feature-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 12px;
  background: rgb(255 255 255 / 10%);
  color: var(--pale-green);
  font-size: 1.16rem;
}

.auth-scenery-features li > span:last-child {
  display: grid;
  gap: 0.08rem;
}

.auth-scenery-features strong {
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;
}

.auth-scenery-features small {
  color: rgb(255 255 255 / 68%);
  font-size: 0.68rem;
  line-height: 1.4;
}

.auth-scenery-route {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  margin-top: 1.15rem;
  padding: 0.52rem 0.78rem;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: var(--radius-pill);
  background: rgb(255 255 255 / 10%);
  color: rgb(255 255 255 / 82%);
  font-size: 0.66rem;
  font-weight: 600;
  backdrop-filter: blur(12px);
}

.auth-scenery-route span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mint-green);
  box-shadow: 0 0 0 4px rgb(143 208 168 / 18%);
}

@media (max-width: 980px) {
  .auth-brand-panel {
    min-height: 340px;
    padding: 1.5rem clamp(1.25rem, 4vw, 2.5rem);
  }

  .auth-brand-panel::after {
    inset: 0.6rem;
  }

  .auth-scenery-badge {
    top: 1.5rem;
    left: clamp(1.25rem, 4vw, 2.5rem);
  }

  .auth-scenery-copy {
    max-width: 620px;
  }

  .auth-scenery-copy h2 {
    font-size: clamp(1.9rem, 5.6vw, 2.6rem);
  }

  .auth-scenery-copy > p:not(.auth-scenery-kicker) {
    max-width: 520px;
    margin-top: 0.55rem;
    font-size: 0.84rem;
  }

  .auth-scenery-features {
    display: none;
  }

  .auth-scenery-route {
    margin-top: 0.9rem;
  }
}

@media (max-width: 560px) {
  .auth-brand-panel {
    min-height: 240px;
    padding: 1.15rem;
  }

  .auth-brand-panel::after {
    inset: 0.5rem;
  }

  .auth-scenery-badge {
    top: 1.15rem;
    left: 1.15rem;
    padding: 0.4rem 0.6rem;
    font-size: 0.54rem;
  }

  .auth-scenery-kicker {
    margin-bottom: 0.45rem;
    font-size: 0.54rem;
    letter-spacing: 0.14em;
  }

  .auth-scenery-kicker::before {
    width: 16px;
  }

  .auth-scenery-copy h2 {
    font-size: clamp(1.65rem, 8vw, 2.1rem);
  }

  .auth-scenery-copy > p:not(.auth-scenery-kicker) {
    margin-top: 0.4rem;
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .auth-scenery-route {
    display: none;
  }
}
</style>
