<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import RideAppHeader from '../components/RideAppHeader.vue';
import { confirmPasswordReset } from '../data/api';
import { showError, showSuccess } from '../composables/feedback';
import { beginLoadingOperation } from '../composables/loadingProgress';

const route = useRoute();
const router = useRouter();
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token.trim() : ''));
const form = reactive({ password: '', confirmPassword: '' });
const passwordVisible = ref(false);
const busy = ref(false);
const errors = reactive<Record<string, string>>({});

async function submit() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!token.value) errors.token = 'This reset link is missing its token. Request a new link.';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (!form.confirmPassword) errors.confirmPassword = 'Confirm your new password.';
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Your passwords do not match.';
  if (Object.keys(errors).length) return;

  busy.value = true;
  const finishLoading = beginLoadingOperation();
  try {
    await confirmPasswordReset(token.value, form.password);
    showSuccess('Your password was updated. Log in with your new password.', 'Password reset');
    await router.replace('/login');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Your password could not be reset.');
  } finally {
    busy.value = false;
    finishLoading();
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page-shell">
        <RideAppHeader
          eyebrow="Account recovery"
          title="Choose a new password"
          subtitle="Reset links expire after 30 minutes and can only be used once."
          show-back
          back-to="/login"
        />

        <main class="page-content">
          <form class="page-card" novalidate @submit.prevent="submit">
            <p v-if="errors.token" class="field-error" role="alert">{{ errors.token }}</p>

            <label class="field-label" for="new-password">New Password</label>
            <div class="password-wrap">
              <input
                id="new-password"
                v-model="form.password"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'new-password-error' : undefined"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                :type="passwordVisible ? 'text' : 'password'"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                :aria-pressed="passwordVisible"
                @click="passwordVisible = !passwordVisible"
              >{{ passwordVisible ? 'Hide' : 'Show' }}</button>
            </div>
            <span v-if="errors.password" id="new-password-error" class="field-error">{{ errors.password }}</span>

            <label class="field-label" for="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              v-model="form.confirmPassword"
              class="form-input"
              :class="{ 'input-error': errors.confirmPassword }"
              :aria-invalid="Boolean(errors.confirmPassword)"
              :aria-describedby="errors.confirmPassword ? 'confirm-new-password-error' : undefined"
              autocomplete="new-password"
              placeholder="Re-enter your new password"
              :type="passwordVisible ? 'text' : 'password'"
            />
            <span v-if="errors.confirmPassword" id="confirm-new-password-error" class="field-error">{{ errors.confirmPassword }}</span>

            <button class="button-primary submit-button" type="submit" :disabled="busy || !token">
              {{ busy ? 'Updating...' : 'Update password' }}
            </button>
          </form>

          <section v-if="!token" class="page-card page-note" role="status">
            <p>This reset link is incomplete.</p>
            <router-link to="/forgot-password">Request a new reset link</router-link>
          </section>
        </main>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page-shell { min-height: 100vh; background: #f7fbf8; }
.page-content { display: grid; gap: 14px; width: min(100%, 520px); margin: 0 auto; padding: 20px 16px 40px; }
.page-card { display: grid; gap: 8px; padding: 20px; border: 1px solid #dce9df; border-radius: 18px; background: #fff; box-shadow: 0 4px 16px rgb(23 76 64 / 5%); }
.page-note { color: #526b60; font-size: 13px; line-height: 1.55; }
.page-note p { margin: 0; }
</style>
