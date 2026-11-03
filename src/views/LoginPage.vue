<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthScenery from '../components/AuthScenery.vue';
import RideLogo from '../components/RideLogo.vue';
import { signIn, storeRideSession, syncLocalTrips } from '../data/api';
import { clearPendingTripSync, loadTrips, queueTripsForSync, replaceTrips } from '../data/trips';
import { beginLoadingOperation } from '../composables/loadingProgress';
import { showError, showSuccess } from '../composables/feedback';

const router = useRouter();
const form = reactive({ email: '', password: '', rememberMe: false });
const passwordVisible = ref(false);
const busy = ref(false);
const errors = reactive<Record<string, string>>({});

async function logIn() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.password) errors.password = 'Please enter your password.';
  if (Object.keys(errors).length > 0) return;

  busy.value = true;
  const finishLoading = beginLoadingOperation();
  try {
    const session = await signIn(form.email, form.password);
    storeRideSession(session, form.rememberMe);
    let syncFailed = false;
    const localTrips = loadTrips();
    try {
      replaceTrips(await syncLocalTrips(localTrips));
      clearPendingTripSync();
    } catch {
      queueTripsForSync(localTrips);
      syncFailed = true;
    }
    showSuccess(syncFailed ? 'You are signed in. Some trips saved on this device could not sync yet.' : 'You are signed in to your RIDE account.');
    await router.replace('/home');
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Sign in could not be completed.');
  } finally { busy.value = false; finishLoading(); }
}

function requestPasswordReset() {
  void router.push('/forgot-password');
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="auth-page">
    <section class="auth-layout login-layout">
      <AuthScenery variant="login" />

      <div class="auth-content">
        <div class="auth-topline">
          <RideLogo />
          <router-link class="city-pill" to="/explore"><span></span> Explore Calapan</router-link>
        </div>
        <div class="auth-form-wrap login-form-wrap">
          <p class="kicker">It’s good to have you back</p>
          <h1>Welcome Back!</h1>
          <p class="auth-intro">Log in to continue planning your next Calapan journey.</p>
          <div class="auth-notice" role="status">
            <span aria-hidden="true">✳</span>
            <p>Sign in to sync your trips to your RIDE account.</p>
          </div>

          <form class="auth-form" novalidate @submit.prevent="logIn">
            <label class="field-label" for="login-email">Email Address</label>
            <input
              id="login-email"
              v-model="form.email"
              autocomplete="email"
              class="form-input"
              :class="{ 'input-error': errors.email }"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="errors.email ? 'login-email-error' : undefined"
              placeholder="you@example.com"
              type="email"
            />
            <span v-if="errors.email" id="login-email-error" class="field-error">{{ errors.email }}</span>

            <label class="field-label" for="login-password">Password</label>
            <div class="password-wrap">
              <input
                id="login-password"
                v-model="form.password"
                autocomplete="current-password"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                :aria-invalid="Boolean(errors.password)"
                :aria-describedby="errors.password ? 'login-password-error' : undefined"
                placeholder="Enter your password"
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
            <span v-if="errors.password" id="login-password-error" class="field-error">{{ errors.password }}</span>

            <div class="form-options">
              <label class="remember-row"><input v-model="form.rememberMe" type="checkbox" /> <span>Remember me</span></label>
              <button class="text-button" type="button" @click="requestPasswordReset">Forgot Password?</button>
            </div>
            <button class="button-primary submit-button" type="submit" :disabled="busy">{{ busy ? 'Signing In…' : 'Log In' }}</button>
          </form>

          <p class="auth-switch">Don’t have an account? <router-link to="/signup">Sign Up</router-link></p>
          <router-link class="back-link" to="/">Back to RIDE</router-link>
        </div>
        <p class="auth-footnote">Discover. Plan. Ride. Arrive.</p>
      </div>
    </section>
      </main>
    </ion-content>
  </ion-page>
</template>
