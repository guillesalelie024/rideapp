<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { lockClosedOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
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
        <section class="auth-panel" aria-label="Sign in to RIDE">
          <AuthScenery variant="login" />

          <div class="auth-content">
            <header class="auth-head">
              <RideLogo />
              <span class="auth-secure">
                <ion-icon :icon="shieldCheckmarkOutline" aria-hidden="true"></ion-icon>
                Secure sign-in
              </span>
            </header>

            <div class="auth-form-wrap">
              <p class="kicker">
                <span class="kicker-dot" aria-hidden="true"></span>
                Welcome back
              </p>
              <h1>Sign in to RIDE</h1>
              <p class="auth-intro">Pick up your saved routes, active trips, and next adventure.</p>

              <form class="auth-form" novalidate @submit.prevent="logIn">
                <div class="field">
                  <label class="field-label" for="login-email">Email address</label>
                  <div class="input-field">
                    <ion-icon :icon="mailOutline" aria-hidden="true"></ion-icon>
                    <input
                      id="login-email"
                      v-model="form.email"
                      autocomplete="email"
                      class="form-input"
                      :class="{ 'input-error': errors.email }"
                      :aria-invalid="Boolean(errors.email)"
                      :aria-describedby="errors.email ? 'login-email-error' : undefined"
                      inputmode="email"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>
                  <span v-if="errors.email" id="login-email-error" class="field-error">{{ errors.email }}</span>
                </div>

                <div class="field">
                  <div class="field-label-row">
                    <label class="field-label" for="login-password">Password</label>
                    <button class="text-button" type="button" @click="requestPasswordReset">Forgot password?</button>
                  </div>
                  <div class="input-field input-field--password">
                    <ion-icon :icon="lockClosedOutline" aria-hidden="true"></ion-icon>
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
                </div>

                <label class="remember-row">
                  <input v-model="form.rememberMe" type="checkbox" />
                  <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
                  <span>Keep me signed in</span>
                </label>

                <button class="button-primary submit-button" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Log in' }}</button>
              </form>

              <div class="auth-divider"><span>New to RIDE?</span></div>
              <router-link class="auth-secondary" to="/signup">Create your account</router-link>
            </div>

            <footer class="auth-footer">
              <p class="auth-footnote">Discover. Plan. Ride. Arrive.</p>
              <router-link class="back-link" to="/">Back home</router-link>
            </footer>
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: clamp(0.75rem, 3vw, 2.25rem);
  background:
    radial-gradient(1100px 640px at 8% -12%, color-mix(in srgb, var(--brand-accent) 20%, transparent), transparent 62%),
    radial-gradient(900px 640px at 102% 112%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%),
    linear-gradient(155deg, var(--bg) 0%, color-mix(in srgb, var(--brand-soft) 45%, var(--bg)) 100%);
}

.auth-panel {
  display: grid;
  width: min(1180px, 100%);
  min-width: 0;
  grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr);
  min-height: min(760px, calc(100vh - clamp(1.5rem, 6vw, 4.5rem)));
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 18%, var(--border));
  border-radius: clamp(22px, 2.2vw, 34px);
  background: var(--surface);
  box-shadow:
    0 42px 110px -42px color-mix(in srgb, var(--brand-deep) 55%, transparent),
    var(--shadow-lg);
}

.auth-panel :deep(aside.auth-brand-panel) {
  height: 100%;
  min-height: 0;
}

.auth-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(1.1rem, 2vw, 1.75rem);
  padding: clamp(1.4rem, 2.5vw, 2.4rem) clamp(1.4rem, 3vw, 3rem);
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 20rem),
    linear-gradient(180deg, var(--surface) 0%, color-mix(in srgb, var(--brand-soft) 35%, var(--surface)) 100%);
}

.auth-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.auth-head .brand {
  gap: 0.5rem;
}

.auth-secure {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 22%, var(--border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--brand-soft) 70%, transparent);
  color: var(--brand-accent);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.auth-secure ion-icon {
  font-size: 0.95rem;
}

.auth-form-wrap {
  width: min(440px, 100%);
  margin: 0 auto;
  padding: clamp(1.3rem, 2.2vw, 2rem);
  border: 1px solid color-mix(in srgb, var(--brand-accent) 14%, var(--border));
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: 0 24px 60px -34px color-mix(in srgb, var(--brand-deep) 42%, transparent);
}

.auth-form-wrap .kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.7rem;
  color: var(--brand-accent);
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.kicker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

.auth-form-wrap h1 {
  margin: 0 0 0.5rem;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 2.6vw, 2.4rem);
  font-weight: 600;
  letter-spacing: var(--tracking-tighter);
  line-height: 1.1;
}

.auth-intro {
  margin: 0 0 1.3rem;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.field {
  display: grid;
  gap: 0.42rem;
  margin-bottom: 0.95rem;
}

.auth-form .field-label {
  margin: 0;
  color: var(--text-body);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.field-label-row .text-button {
  color: var(--brand-accent);
  font-size: var(--text-xs);
  font-weight: 700;
}

.field-label-row .text-button:hover {
  color: var(--brand-mid);
  text-decoration: underline;
}

.input-field {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field > ion-icon {
  position: absolute;
  left: 1rem;
  z-index: 1;
  color: var(--text-muted);
  font-size: 1.05rem;
  pointer-events: none;
  transition: color var(--transition-fast);
}

.input-field:focus-within > ion-icon {
  color: var(--brand-accent);
}

.auth-form .input-field .form-input {
  width: 100%;
  height: 52px;
  margin: 0;
  padding: 0 1rem 0 2.85rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-primary);
  font-size: var(--text-sm);
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--text-primary) 4%, transparent);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.auth-form .input-field .form-input:hover {
  border-color: var(--border-strong);
}

.auth-form .input-field .form-input:focus {
  border-color: var(--brand-accent);
  background: var(--surface);
  outline: none;
  box-shadow: var(--shadow-focus);
}

.auth-form .input-field .form-input.input-error {
  border-color: var(--danger);
}

.auth-form .input-field .form-input.input-error:focus {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger) 16%, transparent);
}

.input-field--password .form-input {
  padding-right: 4.3rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.55rem;
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  padding: 0 0.65rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--brand-accent);
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transform: translateY(-50%);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.password-toggle:hover {
  background: var(--brand-soft-2);
}

.auth-form .field-error {
  display: flex;
  align-items: flex-start;
  margin: 0;
  color: var(--danger);
  font-size: var(--text-xs);
  line-height: 1.4;
}

.remember-row {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.2rem 0 1.15rem;
  color: var(--text-body);
  font-size: var(--text-sm);
  -webkit-user-select: none;
  user-select: none;
  cursor: pointer;
}

.remember-row input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.switch-track {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: var(--border-strong);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 1px 3px rgb(0 0 0 / 22%);
  transition: transform var(--transition-fast);
}

.remember-row input:checked + .switch-track {
  background: var(--brand);
}

.remember-row input:checked + .switch-track .switch-thumb {
  transform: translateX(16px);
}

.remember-row input:focus-visible + .switch-track {
  box-shadow: var(--shadow-focus);
}

.auth-form .submit-button {
  width: 100%;
  min-height: 54px;
  margin-top: 0.15rem;
  border: 0;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%);
  box-shadow: 0 16px 34px -14px color-mix(in srgb, var(--brand) 60%, transparent);
  color: var(--on-brand);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.auth-form .submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--brand-hover), var(--brand-mid));
  transform: translateY(-1px);
}

.auth-form .submit-button:active:not(:disabled) {
  transform: translateY(0) scale(0.995);
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 1.25rem 0 0.85rem;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--border);
}

.auth-secondary {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border: 1.5px solid color-mix(in srgb, var(--brand-accent) 24%, var(--border));
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--brand-accent);
  font-size: var(--text-sm);
  font-weight: 700;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.auth-secondary:hover {
  border-color: var(--brand-accent);
  background: var(--brand-soft-2);
  color: var(--brand-accent);
  transform: translateY(-1px);
}

.auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.auth-footnote {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 600;
}

.back-link:hover {
  color: var(--brand-accent);
}

@media (max-width: 980px) {
  .auth-page {
    display: block;
    min-height: 100dvh;
    padding: 0;
  }

  .auth-panel {
    display: flex;
    width: 100%;
    min-height: 100dvh;
    flex-direction: column;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .auth-panel :deep(aside.auth-brand-panel) {
    height: auto;
    flex: 0 0 auto;
  }

  .auth-content {
    position: relative;
    z-index: 2;
    flex: 1;
    justify-content: flex-start;
    gap: 1rem;
    margin-top: -18px;
    border-radius: 22px 22px 0 0;
    padding: 1.1rem clamp(1rem, 4vw, 1.5rem) calc(env(safe-area-inset-bottom) + 1.25rem);
    background: var(--surface);
    box-shadow: 0 -18px 40px -30px rgb(0 0 0 / 40%);
  }

  .auth-form-wrap {
    width: 100%;
    max-width: 460px;
  }
}

@media (max-width: 560px) {
  .auth-content {
    margin-top: -14px;
    border-radius: 20px 20px 0 0;
    padding: 0.95rem 1rem calc(env(safe-area-inset-bottom) + 1.1rem);
    gap: 0.8rem;
  }

  .auth-head {
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .auth-head .brand {
    min-width: 0;
  }

  .auth-secure {
    margin-left: auto;
  }

  .auth-form-wrap {
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .auth-form-wrap .kicker {
    margin-bottom: 0.45rem;
  }

  .auth-form-wrap h1 {
    font-size: 1.45rem;
  }

  .auth-intro {
    margin-bottom: 1rem;
    font-size: 0.84rem;
  }

  .field {
    margin-bottom: 0.8rem;
  }

  .field-label-row {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
  }

  .auth-form .input-field .form-input {
    height: 48px;
    padding-left: 2.65rem;
    font-size: 16px;
  }

  .input-field > ion-icon {
    left: 0.85rem;
  }

  .remember-row {
    margin: 0.1rem 0 1rem;
    font-size: 0.84rem;
  }

  .auth-form .submit-button {
    min-height: 48px;
    font-size: 0.92rem;
  }

  .auth-divider {
    margin: 1rem 0 0.75rem;
  }

  .auth-secondary {
    min-height: 46px;
    font-size: 0.88rem;
  }

  .auth-secure {
    padding: 0.28rem 0.48rem;
    font-size: 0.56rem;
    white-space: normal;
    text-align: right;
  }

  .auth-footer {
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    text-align: center;
  }
}
</style>
