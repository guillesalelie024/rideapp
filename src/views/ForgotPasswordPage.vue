<script setup lang="ts">
import { reactive, ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { requestPasswordReset } from '../data/api';
import { showError, showSuccess } from '../composables/feedback';

const form = reactive({ email: '' });
const busy = ref(false);
const errors = reactive<Record<string, string>>({});
const sentMessage = ref('');
const devResetUrl = ref('');

async function submit() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter the email address for your account.';
    return;
  }

  busy.value = true;
  try {
    const result = await requestPasswordReset(form.email.trim());
    sentMessage.value = result.message;
    devResetUrl.value = result.devResetUrl ?? '';
    showSuccess('If an account matches that email, a reset link is on its way.', 'Check your email');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'A reset link could not be requested.');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page-shell">
        <RideAppHeader
          eyebrow="Account recovery"
          title="Forgot your password?"
          subtitle="We will email you a secure link to choose a new password."
          show-back
          back-to="/login"
        />

        <main class="page-content">
          <form class="page-card" novalidate @submit.prevent="submit">
            <label class="field-label" for="reset-email">Email Address</label>
            <input
              id="reset-email"
              v-model="form.email"
              class="form-input"
              :class="{ 'input-error': errors.email }"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'reset-email-error' : undefined"
              autocomplete="email"
              placeholder="you@example.com"
              type="email"
            />
            <span v-if="errors.email" id="reset-email-error" class="field-error">{{ errors.email }}</span>
            <button class="button-primary submit-button" type="submit" :disabled="busy">
              {{ busy ? 'Sending...' : 'Send reset link' }}
            </button>
          </form>

          <section v-if="sentMessage" class="page-card page-note" role="status">
            <p>{{ sentMessage }}</p>
            <p v-if="devResetUrl" class="page-note-dev">
              Development only: <router-link :to="devResetUrl">open the reset link</router-link>.
            </p>
            <router-link class="back-link" to="/login">Back to log in</router-link>
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
.page-note-dev { color: #7a5a12; }
</style>
