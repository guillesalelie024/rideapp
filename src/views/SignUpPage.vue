<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { lockClosedOutline, mailOutline, personOutline, shieldCheckmarkOutline } from 'ionicons/icons';
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

const passwordStrength = computed(() => {
  const value = form.password;
  if (!value) return { score: 0, label: '' };
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const label = value.length < 8 ? 'Use at least 8 characters' : ['Weak', 'Fair', 'Good', 'Strong'][score - 1];
  return { score, label };
});

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
        <section class="auth-panel" aria-label="Create a RIDE account">
          <AuthScenery variant="signup" />

          <div class="auth-content">
            <header class="auth-head">
              <RideLogo />
              <span class="auth-secure">
                <ion-icon :icon="shieldCheckmarkOutline" aria-hidden="true"></ion-icon>
                Free to join
              </span>
            </header>

            <div class="auth-form-wrap">
              <p class="kicker">
                <span class="kicker-dot" aria-hidden="true"></span>
                Create account
              </p>
              <h1>Create Your Account</h1>
              <p class="auth-intro">A few details and you are ready to explore Calapan City.</p>

              <form class="auth-form" novalidate @submit.prevent="createAccount">
                <div class="field">
                  <label class="field-label" for="full-name">Full name</label>
                  <div class="input-field">
                    <ion-icon :icon="personOutline" aria-hidden="true"></ion-icon>
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
                  </div>
                  <span v-if="errors.name" id="name-error" class="field-error">{{ errors.name }}</span>
                </div>

                <div class="field">
                  <label class="field-label" for="signup-email">Email address</label>
                  <div class="input-field">
                    <ion-icon :icon="mailOutline" aria-hidden="true"></ion-icon>
                    <input
                      id="signup-email"
                      v-model="form.email"
                      autocomplete="email"
                      class="form-input"
                      :class="{ 'input-error': errors.email }"
                      :aria-invalid="Boolean(errors.email)"
                      :aria-describedby="errors.email ? 'email-error' : undefined"
                      inputmode="email"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </div>
                  <span v-if="errors.email" id="email-error" class="field-error">{{ errors.email }}</span>
                </div>

                <div class="field">
                  <label class="field-label" for="signup-password">Password</label>
                  <div class="input-field input-field--password">
                    <ion-icon :icon="lockClosedOutline" aria-hidden="true"></ion-icon>
                    <input
                      id="signup-password"
                      v-model="form.password"
                      autocomplete="new-password"
                      class="form-input"
                      :class="{ 'input-error': errors.password }"
                      :aria-invalid="Boolean(errors.password)"
                      :aria-describedby="errors.password ? 'password-error' : undefined"
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
                  <div
                    v-if="form.password"
                    class="password-strength"
                    :data-score="passwordStrength.score"
                    aria-live="polite"
                  >
                    <div class="strength-bars" aria-hidden="true">
                      <span v-for="n in 4" :key="n" :class="{ filled: n <= passwordStrength.score }"></span>
                    </div>
                    <small>{{ passwordStrength.label }}</small>
                  </div>
                  <span v-else-if="!errors.password" class="field-hint">Use at least 8 characters.</span>
                </div>

                <div class="field">
                  <label class="field-label" for="confirm-password">Confirm password</label>
                  <div class="input-field input-field--password">
                    <ion-icon :icon="lockClosedOutline" aria-hidden="true"></ion-icon>
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
                </div>

                <label class="terms-row">
                  <input
                    v-model="form.termsAccepted"
                    type="checkbox"
                    :aria-invalid="Boolean(errors.termsAccepted)"
                    :aria-describedby="errors.termsAccepted ? 'terms-error' : undefined"
                  />
                  <span class="terms-box" aria-hidden="true"></span>
                  <span class="terms-copy">
                    I agree to the
                    <router-link to="/terms">Terms</router-link> and
                    <router-link to="/privacy">Privacy Policy</router-link>.
                  </span>
                </label>
                <span v-if="errors.termsAccepted" id="terms-error" class="field-error terms-error">{{ errors.termsAccepted }}</span>

                <button class="button-primary submit-button" type="submit" :disabled="busy">{{ busy ? 'Creating account…' : 'Create account' }}</button>
              </form>

              <div class="auth-divider"><span>Already have an account?</span></div>
              <router-link class="auth-secondary" to="/login">Log in to your account</router-link>
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

.auth-form .field-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: 1.4;
}

.auth-form .field-error {
  display: flex;
  align-items: flex-start;
  margin: 0;
  color: var(--danger);
  font-size: var(--text-xs);
  line-height: 1.4;
}

.auth-form .terms-error {
  margin: 0.35rem 0 0;
}

.password-strength {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.1rem;
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;
}

.strength-bars span {
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--border);
  transition: background var(--transition-fast);
}

.password-strength[data-score='1'] .strength-bars span.filled { background: var(--danger); }
.password-strength[data-score='2'] .strength-bars span.filled { background: var(--warning); }
.password-strength[data-score='3'] .strength-bars span.filled { background: var(--brand-accent); }
.password-strength[data-score='4'] .strength-bars span.filled { background: var(--success); }

.password-strength small {
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  font-weight: 600;
}

.terms-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin: 0.1rem 0 1.15rem;
  color: var(--text-body);
  font-size: var(--text-xs);
  line-height: 1.55;
  cursor: pointer;
}

.terms-row input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.terms-box {
  position: relative;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border: 1.5px solid var(--border-strong);
  border-radius: 6px;
  background: var(--surface-soft);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.terms-box::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 6px;
  width: 5px;
  height: 9px;
  border: solid var(--on-brand);
  border-width: 0 2px 2px 0;
  opacity: 0;
  transform: rotate(45deg) scale(0.6);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.terms-row input:checked + .terms-box {
  border-color: var(--brand);
  background: var(--brand);
}

.terms-row input:checked + .terms-box::after {
  opacity: 1;
  transform: rotate(45deg) scale(1);
}

.terms-row input:focus-visible + .terms-box {
  box-shadow: var(--shadow-focus);
}

.terms-row a {
  color: var(--brand-accent);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
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
    padding: 0;
  }

  .auth-panel {
    display: flex;
    width: 100%;
    min-height: 100vh;
    flex-direction: column;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .auth-panel :deep(aside.auth-brand-panel) {
    height: auto;
    min-height: clamp(250px, 38vh, 340px);
  }

  .auth-content {
    position: relative;
    z-index: 2;
    flex: 1;
    margin-top: -26px;
    border-radius: 28px 28px 0 0;
    padding: 1.25rem clamp(1rem, 4vw, 2rem) calc(env(safe-area-inset-bottom) + 1.5rem);
    background: var(--surface);
    box-shadow: 0 -18px 40px -30px rgb(0 0 0 / 40%);
  }

  .auth-form-wrap {
    width: min(460px, 100%);
  }
}

@media (max-width: 560px) {
  .auth-panel :deep(aside.auth-brand-panel) {
    min-height: 240px;
  }

  .auth-form-wrap {
    padding: 1.2rem;
    border-radius: var(--radius-lg);
  }

  .auth-form-wrap h1 {
    font-size: 1.7rem;
  }

  .auth-intro {
    font-size: 0.82rem;
  }

  .auth-secure {
    padding: 0.32rem 0.55rem;
    font-size: 0.6rem;
  }

  .auth-footer {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
