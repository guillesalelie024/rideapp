<script setup lang="ts">
import { reactive, ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
import {
  BUDGET_PREFERENCES,
  createEmptyTravelPreferences,
  loadTravelPreferences,
  saveTravelPreferences,
  TRAVEL_INTERESTS,
  PREFERRED_TRANSPORTATION,
  type BudgetPreference,
  type PreferredTransportation,
  type TravelInterest,
} from '../data/profile';
import { showError, showSuccess } from '../composables/feedback';

const form = reactive(loadPreferences());

function loadPreferences() {
  try {
    return loadTravelPreferences();
  } catch {
    return createEmptyTravelPreferences();
  }
}

const saving = ref(false);

function toggleTransportation(id: PreferredTransportation) {
  form.transportation = form.transportation.includes(id)
    ? form.transportation.filter((item) => item !== id)
    : [...form.transportation, id];
}

function toggleInterest(id: TravelInterest) {
  form.interests = form.interests.includes(id)
    ? form.interests.filter((item) => item !== id)
    : [...form.interests, id];
}

function setBudget(id: BudgetPreference) {
  form.budget = form.budget === id ? '' : id;
}

function save() {
  saving.value = true;
  try {
    saveTravelPreferences({
      transportation: form.transportation,
      budget: form.budget,
      interests: form.interests,
    });
    showSuccess('Your travel preferences are saved on this device.', 'Preferences saved');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Your preferences could not be saved.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="pref-shell">
        <RideAppHeader
          eyebrow="Travel preferences"
          title="Make RIDE yours"
          subtitle="Your choices are stored on this device and used to personalize suggestions."
          show-back
          back-to="/profile"
        />

        <main class="pref-content">
          <section class="pref-card">
            <h2>Preferred transportation</h2>
            <p class="pref-hint">Select every mode you are comfortable using.</p>
            <div class="pref-chips">
              <button
                v-for="option in PREFERRED_TRANSPORTATION"
                :key="option.id"
                type="button"
                class="pref-chip"
                :class="{ 'pref-chip-active': form.transportation.includes(option.id) }"
                :aria-pressed="form.transportation.includes(option.id)"
                @click="toggleTransportation(option.id)"
              >{{ option.label }}</button>
            </div>
          </section>

          <section class="pref-card">
            <h2>Budget style</h2>
            <p class="pref-hint">Pick one, or leave blank if you have no preference.</p>
            <div class="pref-chips">
              <button
                v-for="option in BUDGET_PREFERENCES"
                :key="option.id"
                type="button"
                class="pref-chip"
                :class="{ 'pref-chip-active': form.budget === option.id }"
                :aria-pressed="form.budget === option.id"
                @click="setBudget(option.id)"
              >{{ option.label }}</button>
            </div>
          </section>

          <section class="pref-card">
            <h2>Interests</h2>
            <p class="pref-hint">We will highlight destinations that match these interests.</p>
            <div class="pref-chips">
              <button
                v-for="option in TRAVEL_INTERESTS"
                :key="option.id"
                type="button"
                class="pref-chip"
                :class="{ 'pref-chip-active': form.interests.includes(option.id) }"
                :aria-pressed="form.interests.includes(option.id)"
                @click="toggleInterest(option.id)"
              >{{ option.label }}</button>
            </div>
          </section>

          <button class="button-primary submit-button" type="button" :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : 'Save preferences' }}
          </button>
        </main>

        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.pref-shell { min-height: 100vh; padding-bottom: calc(84px + env(safe-area-inset-bottom)); background: #f7fbf8; }
.pref-content { display: grid; gap: 14px; width: min(100%, 680px); margin: 0 auto; padding: 18px 16px 30px; }
.pref-card { display: grid; gap: 8px; padding: 18px; border: 1px solid #dce9df; border-radius: 18px; background: #fff; box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.pref-card h2 { margin: 0; color: #174c40; font-family: 'Poppins', sans-serif; font-size: 16px; }
.pref-hint { margin: 0 0 4px; color: #658078; font-size: 12px; line-height: 1.5; }
.pref-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pref-chip { min-height: 42px; padding: 0 14px; border: 1px solid #cfe2d5; border-radius: 999px; background: #fff; color: #2f6b4f; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; }
.pref-chip-active { border-color: #3f8064; background: #3f8064; color: #fff; }
.pref-chip:focus-visible { outline: 3px solid rgb(120 169 130 / 55%); outline-offset: 2px; }
</style>
