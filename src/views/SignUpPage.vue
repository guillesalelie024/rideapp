<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthScenery from '../components/AuthScenery.vue';
import RideLogo from '../components/RideLogo.vue';
import { signUp } from '../data/api';
import { beginLoadingOperation } from '../composables/loadingProgress';
import { showError, showSuccess } from '../composables/feedback';

const router = useRouter();
const form = reactive({ name: '', email: '', password: '', confirmPassword: '', termsAccepted: false });
const passwordVisible = ref(false);
const confirmPasswordVisible = ref(false);
const busy = ref(false);
const errors = reactive<Record<string, string>>({});
function validateForm() {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (!form.name.trim()) errors.name = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters for your password.';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Your passwords do not match.';
  if (!form.termsAccepted) errors.termsAccepted = 'Please agree to the Terms and Privacy Policy.';
  return Object.keys(errors).length === 0;
}

async function createAccount() {
  if (!validateForm()) return;
  busy.value = true;
  const finishLoading = beginLoadingOperation();
  try {
    await signUp(form.name, form.email, form.password);
    showSuccess('Your account was created successfully. Please log in to continue.', 'Account Created', () => {
      void router.replace('/login');
    });
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Your account could not be created.');
  } finally { busy.value = false; finishLoading(); }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="auth-page">
    <section class="auth-layout signup-layout">
      <AuthScenery variant="signup" />

      <div class="auth-content">
        <div class="auth-topline">
          <RideLogo />
          <router-link class="city-pill" to="/explore"><span></span> Explore Calapan</router-link>
        </div>
        <div class="auth-form-wrap">
          <p class="kicker">Your Calapan journey starts here</p>
          <h1>Create Your Account</h1>
          <p class="auth-intro">Join RIDE and discover more around Calapan City.</p>
          <div class="auth-notice" role="status">
            <span aria-hidden="true">✳</span>
            <p>Create your account to keep your trips synced across sessions.</p>
          </div>

          <form class="auth-form" novalidate @submit.prevent="createAccount">
            <label class="field-label" for="full-name">Full Name</label>
            <input
              id="full-name"
              v-model="form.name"
              autocomplete="name"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              :aria-invalid="Boolean(errors.name)"
              :aria-describedby="errors.name ? 'name-error' : undefined"
              placeholder="e.g. Alex Rivera"
            />
            <span v-if="errors.name" id="name-error" class="field-error">{{ errors.name }}</span>

            <label class="field-label" for="signup-email">Email Address</label>
            <input
              id="signup-email"
              v-model="form.email"
              autocomplete="email"
              class="form-input"
              :class="{ 'input-error': errors.email }"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'email-error' : undefined"
              placeholder="you@example.com"
              type="email"
            />
            <span v-if="errors.email" id="email-error" class="field-error">{{ errors.email }}</span>

            <label class="field-label" for="signup-password">Password</label>
            <div class="password-wrap">
              <input
                id="signup-password"
                v-model="form.password"
                autocomplete="new-password"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'password-error' : 'password-hint'"
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
            <span v-if="errors.password" id="password-error" class="field-error">{{ errors.password }}</span>
            <span v-else id="password-hint" class="field-hint">Use at least 8 characters.</span>

            <label class="field-label" for="confirm-password">Confirm Password</label>
            <div class="password-wrap">
              <input
                id="confirm-password"
                v-model="form.confirmPassword"
                autocomplete="new-password"
                class="form-input"
                :class="{ 'input-error': errors.confirmPassword }"
                :aria-invalid="Boolean(errors.confirmPassword)"
                :aria-describedby="errors.confirmPassword ? 'confirm-error' : undefined"
                placeholder="Enter your password again"
                :type="confirmPasswordVisible ? 'text' : 'password'"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-label="confirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'"
                :aria-pressed="confirmPasswordVisible"
                @click="confirmPasswordVisible = !confirmPasswordVisible"
              >{{ confirmPasswordVisible ? 'Hide' : 'Show' }}</button>
            </div>
            <span v-if="errors.confirmPassword" id="confirm-error" class="field-error">{{ errors.confirmPassword }}</span>

            <label class="terms-row">
              <input
                v-model="form.termsAccepted"
                type="checkbox"
                :aria-invalid="Boolean(errors.termsAccepted)"
                :aria-describedby="errors.termsAccepted ? 'terms-error' : undefined"
              />
              <span>
                I agree to the
                <router-link to="/terms">Terms</router-link> and
                <router-link to="/privacy">Privacy Policy</router-link>.
              </span>
            </label>
            <span v-if="errors.termsAccepted" id="terms-error" class="field-error terms-error">{{ errors.termsAccepted }}</span>

            <button class="button-primary submit-button" type="submit" :disabled="busy">{{ busy ? 'Creating Account…' : 'Create Account' }}</button>
          </form>

          <p class="auth-switch">Already have an account? <router-link to="/login">Log In</router-link></p>
          <router-link class="back-link" to="/">Back to RIDE</router-link>
        </div>
        <p class="auth-footnote">Discover. Plan. Ride. Arrive.</p>
      </div>
    </section>
      </main>
    </ion-content>
  </ion-page>
</template>
