<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import {
  barChartOutline,
  bicycleOutline,
  bookmarkOutline,
  calendarOutline,
  mapOutline,
  peopleOutline,
} from 'ionicons/icons';

const props = defineProps<{
  variant: 'login' | 'signup';
}>();

const content = computed(() => {
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
  <aside class="auth-brand-panel" :aria-label="`RIDE ${variant} highlights`">
    <img
      class="auth-scenery-art"
      src="../assets/auth-road-scene.svg"
      alt=""
      aria-hidden="true"
    />
    <div class="auth-scenery-shade" aria-hidden="true"></div>
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
  position: relative;
  display: flex;
  min-height: 590px;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  padding: clamp(2rem, 5vw, 4.5rem);
  isolation: isolate;
  background: #eaf4e8;
}

.auth-scenery-art,
.auth-scenery-shade {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
}

.auth-scenery-art {
  object-fit: cover;
  object-position: center;
}

.auth-scenery-shade {
  background: linear-gradient(
    180deg,
    rgb(28 55 39 / 0%) 20%,
    rgb(28 55 39 / 30%) 42%,
    rgb(28 55 39 / 88%) 100%
  );
}

.auth-scenery-copy {
  max-width: 540px;
  color: #ffffff;
  text-shadow: 0 2px 18px rgb(30 54 38 / 28%);
}

.auth-scenery-kicker {
  margin: 0 0 0.9rem;
  color: #e4f1dc;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.auth-scenery-copy h2 {
  margin: 0;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-size: clamp(2.2rem, 3.8vw, 3.45rem);
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 1.08;
}

.auth-scenery-copy > p:not(.auth-scenery-kicker) {
  max-width: 400px;
  margin: 1rem 0 0;
  color: rgb(255 255 255 / 90%);
  font-size: 0.98rem;
  line-height: 1.65;
}

.auth-scenery-features {
  display: grid;
  gap: 0.85rem;
  margin: 1.45rem 0 0;
  padding: 0;
  list-style: none;
}

.auth-scenery-features li {
  display: grid;
  grid-template-columns: 38px 1fr;
  align-items: center;
  gap: 0.75rem;
}

.auth-scenery-feature-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 12px;
  background: rgb(255 255 255 / 15%);
  color: #ffffff;
  font-size: 1.2rem;
  backdrop-filter: blur(8px);
}

.auth-scenery-features li > span:last-child {
  display: grid;
  gap: 0.1rem;
}

.auth-scenery-features strong {
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
}

.auth-scenery-features small {
  color: rgb(255 255 255 / 84%);
  font-size: 0.72rem;
  line-height: 1.4;
}

.auth-scenery-route {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  margin-top: 2rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 999px;
  background: rgb(255 255 255 / 15%);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.auth-scenery-route span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cce8c5;
  box-shadow: 0 0 0 4px rgb(204 232 197 / 20%);
}

@media (max-width: 820px) {
  .auth-brand-panel {
    min-height: 500px;
    padding: 2rem clamp(1.5rem, 6vw, 3rem);
  }

  .auth-scenery-copy h2 {
    font-size: clamp(2rem, 7vw, 2.8rem);
  }

  .auth-scenery-copy > p:not(.auth-scenery-kicker) {
    max-width: 460px;
    margin-top: 0.6rem;
    font-size: 0.88rem;
  }

  .auth-scenery-features {
    gap: 0.65rem;
    margin-top: 1rem;
  }

  .auth-scenery-route {
    margin-top: 1rem;
  }
}

@media (max-width: 520px) {
  .auth-brand-panel {
    min-height: 460px;
    padding: 1.25rem 1.4rem;
  }

  .auth-scenery-shade {
    background: linear-gradient(
      180deg,
      rgb(28 55 39 / 8%) 8%,
      rgb(28 55 39 / 35%) 30%,
      rgb(28 55 39 / 90%) 100%
    );
  }

  .auth-scenery-kicker {
    margin-bottom: 0.45rem;
    font-size: 0.58rem;
  }

  .auth-scenery-copy h2 {
    font-size: 1.8rem;
  }

  .auth-scenery-copy > p:not(.auth-scenery-kicker) {
    max-width: 330px;
    margin-top: 0.4rem;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .auth-scenery-features {
    gap: 0.55rem;
    margin-top: 0.85rem;
  }

  .auth-scenery-features li {
    grid-template-columns: 32px 1fr;
    gap: 0.6rem;
  }

  .auth-scenery-feature-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    font-size: 1rem;
  }

  .auth-scenery-features strong {
    font-size: 0.76rem;
  }

  .auth-scenery-features small {
    font-size: 0.66rem;
  }

  .auth-scenery-route {
    margin-top: 0.65rem;
    padding: 0.42rem 0.65rem;
    font-size: 0.63rem;
  }
}
</style>
