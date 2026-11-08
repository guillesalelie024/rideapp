<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRouter } from 'vue-router';
import RideAppHeader from '../components/RideAppHeader.vue';
import RideBottomNav from '../components/RideBottomNav.vue';
import { changePassword, getRideSession } from '../data/api';
import { clearLocalTripData } from '../data/trips';
import { showError, showSuccess } from '../composables/feedback';
import { beginLoadingOperation } from '../composables/loadingProgress';

const router = useRouter();
const session = computed(() => getRideSession());
const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const errors = reactive<Record<string, string>>({});
const busy = ref(false);
const passwordVisible = ref(false);

async function submit() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.currentPassword) errors.currentPassword = 'Enter your current password.';
  if (form.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.';
  else if (form.newPassword === form.currentPassword) errors.newPassword = 'Choose a password different from your current one.';
  if (form.confirmPassword !== form.newPassword) errors.confirmPassword = 'Your new passwords do not match.';
  if (Object.keys(errors).length) return;

  busy.value = true;
  const finishLoading = beginLoadingOperation();
  try {
    await changePassword(form.currentPassword, form.newPassword);
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    showSuccess('Your password was changed. Other signed-in devices were signed out.', 'Password updated');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Your password could not be changed.');
  } finally {
    busy.value = false;
    finishLoading();
  }
}

function clearLocalData() {
  clearLocalTripData();
  showSuccess('Trips and itineraries saved on this device were cleared.', 'Local data cleared');
}

function goToLogin() {
  void router.push('/login');
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="sec-shell">
        <RideAppHeader
          eyebrow="Privacy & security"
          title="Manage your account"
          subtitle="Control your password, local data, and legal policies."
          show-back
          back-to="/profile"
        />

        <main class="sec-content desktop-content ride-content">
          <section class="sec-card">
            <h2>Change password</h2>
            <template v-if="session">
              <form class="sec-form" novalidate @submit.prevent="submit">
                <label class="field-label" for="current-password">Current password</label>
                <input
                  id="current-password"
                  v-model="form.currentPassword"
                  class="form-input"
                  :class="{ 'input-error': errors.currentPassword }"
                  :aria-invalid="Boolean(errors.currentPassword)"
                  :aria-describedby="errors.currentPassword ? 'current-password-error' : undefined"
                  autocomplete="current-password"
                  type="password"
                />
                <span v-if="errors.currentPassword" id="current-password-error" class="field-error">{{ errors.currentPassword }}</span>

                <label class="field-label" for="security-new-password">New password</label>
                <div class="password-wrap">
                  <input
                    id="security-new-password"
                    v-model="form.newPassword"
                    class="form-input"
                    :class="{ 'input-error': errors.newPassword }"
                    :aria-invalid="Boolean(errors.newPassword)"
                    :aria-describedby="errors.newPassword ? 'security-new-password-error' : undefined"
                    autocomplete="new-password"
                    type="password"
                  />
                  <button
                    class="password-toggle"
                    type="button"
                    :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                    :aria-pressed="passwordVisible"
                    @click="passwordVisible = !passwordVisible"
                  >{{ passwordVisible ? 'Hide' : 'Show' }}</button>
                </div>
                <span v-if="errors.newPassword" id="security-new-password-error" class="field-error">{{ errors.newPassword }}</span>

                <label class="field-label" for="security-confirm-password">Confirm new password</label>
                <input
                  id="security-confirm-password"
                  v-model="form.confirmPassword"
                  class="form-input"
                  :class="{ 'input-error': errors.confirmPassword }"
                  :aria-invalid="Boolean(errors.confirmPassword)"
                  :aria-describedby="errors.confirmPassword ? 'security-confirm-password-error' : undefined"
                  autocomplete="new-password"
                  :type="passwordVisible ? 'text' : 'password'"
                />
                <span v-if="errors.confirmPassword" id="security-confirm-password-error" class="field-error">{{ errors.confirmPassword }}</span>

                <button class="button-primary submit-button" type="submit" :disabled="busy">
                  {{ busy ? 'Updating...' : 'Update password' }}
                </button>
              </form>
            </template>
            <template v-else>
              <p class="sec-note">Sign in to change your password. If you forgot it, request a reset link instead.</p>
              <div class="sec-actions">
                <button class="button-primary" type="button" @click="goToLogin">Log in</button>
                <router-link class="sec-link-button" to="/forgot-password">Forgot password</router-link>
              </div>
            </template>
          </section>

          <section class="sec-card">
            <h2>Data on this device</h2>
            <p class="sec-note">Trips, itineraries, saved places, and preferences are stored locally in this browser or app. Clear them if you share this device.</p>
            <button class="sec-danger" type="button" @click="clearLocalData">Clear local trips and itineraries</button>
          </section>

          <section class="sec-card">
            <h2>Policies</h2>
            <div class="sec-links">
              <router-link to="/terms">Terms of Service</router-link>
              <router-link to="/privacy">Privacy Policy</router-link>
            </div>
          </section>
        </main>

        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.sec-shell { min-height: 100vh; padding-bottom: calc(104px + env(safe-area-inset-bottom)); background: var(--bg); }
.sec-content { display: grid; gap: 14px; width: min(100%, 680px); margin: 0 auto; padding: 18px 16px 30px; }
.sec-card { display: grid; gap: 10px; padding: 18px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.sec-card h2 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.sec-form { display: grid; gap: 8px; }
.sec-note { margin: 0; color: var(--text-body); font-size: 13px; line-height: 1.55; }
.sec-actions, .sec-links { display: flex; flex-wrap: wrap; gap: 10px; }
.sec-link-button { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 0 16px; border: 1px solid var(--border); border-radius: 12px; color: var(--brand-mid); font-weight: 600; text-decoration: none; }
.sec-danger { min-height: 44px; padding: 0 16px; border: 1px solid color-mix(in srgb, var(--danger) 36%, var(--border)); border-radius: 12px; background: var(--danger-soft); color: var(--danger); cursor: pointer; font-weight: 600; }
.sec-links a { color: var(--brand-mid); font-weight: 600; }
</style>
