<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import AuthScenery from '../components/AuthScenery.vue';
import RideLogo from '../components/RideLogo.vue';
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
      <main class="auth-page">
        <section class="auth-layout">
          <AuthScenery variant="recovery" />

          <div class="auth-content">
            <div class="auth-topline">
              <RideLogo />
            </div>

            <div class="auth-form-wrap">
              <router-link class="auth-back-link" to="/login">
                <ion-icon :icon="arrowBackOutline" aria-hidden="true"></ion-icon>
                Back to log in
              </router-link>
              <p class="kicker">RIDE · ACCOUNT RECOVERY</p>
              <h1>Choose a new password</h1>
              <p class="auth-intro">Reset links expire after 30 minutes and can only be used once.</p>

              <form class="auth-form" novalidate @submit.prevent="submit">
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
                  {{ busy ? 'Updating…' : 'Update password' }}
                </button>
              </form>

              <section v-if="!token" class="auth-recovery-note" role="status">
                <p>This reset link is incomplete.</p>
                <router-link to="/forgot-password">Request a new reset link</router-link>
              </section>
            </div>

            <p class="auth-footnote">Discover. Plan. Ride. Arrive.</p>
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg);
}

.auth-layout {
  display: grid;
  width: 100%;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--surface);
  box-shadow: none;
}

.auth-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding:
    calc(env(safe-area-inset-top) + 1.5rem)
    clamp(1.5rem, 4.5vw, 4.5rem)
    calc(env(safe-area-inset-bottom) + 1.25rem);
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 19rem),
    radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--brand-soft) 75%, transparent), transparent 22rem),
    linear-gradient(135deg, var(--bg), var(--surface));
}

.auth-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.auth-topline .brand {
  gap: 0.55rem;
}

.auth-form-wrap {
  width: min(460px, 100%);
  margin: clamp(1.5rem, 4vh, 3rem) auto;
  padding: clamp(1.5rem, 3vw, 2.4rem);
  border: 1px solid color-mix(in srgb, var(--brand-accent) 12%, var(--border));
  border-radius: var(--radius-xl);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
}

.auth-form-wrap .kicker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  color: var(--brand-accent);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wider);
}

.auth-form-wrap h1 {
  margin: 0 0 0.6rem;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: clamp(2rem, 3vw, 2.65rem);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-tighter);
  line-height: var(--leading-tight);
}

.auth-intro {
  margin: 0 0 1.2rem;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.auth-form .field-label {
  margin-bottom: 0.45rem;
  color: var(--text-body);
}

.auth-form .form-input {
  height: 50px;
  margin-bottom: 0.9rem;
  padding: 0 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.auth-form .form-input:hover {
  border-color: var(--border-strong);
}

.auth-form .form-input:focus {
  border-color: var(--brand-accent);
  background: var(--surface);
  box-shadow: var(--shadow-focus);
}

.auth-form .form-input.input-error {
  margin-bottom: 0.35rem;
  border-color: var(--danger);
}

.auth-form .field-error {
  margin: -0.45rem 0 0.75rem;
}

.auth-form .password-wrap {
  margin-bottom: 0.9rem;
  position: relative;
}

.auth-form .password-wrap .form-input {
  margin-bottom: 0;
  padding-right: 4.5rem;
}

.auth-form .password-toggle {
  position: absolute;
  top: 50%;
  right: 0.8rem;
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  border-radius: var(--radius-pill);
  color: var(--brand-accent);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0 0.5rem;
}

.auth-form .password-toggle:hover {
  background: var(--brand-soft-2);
}

.auth-form .submit-button {
  width: 100%;
  min-height: 52px;
  margin-top: 0.4rem;
}

.auth-back-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.auth-back-link:hover {
  color: var(--brand-accent);
}

.auth-back-link ion-icon {
  font-size: var(--icon-sm);
}

.back-link {
  display: block;
  width: fit-content;
  margin: 0.15rem 0 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  text-align: left;
  text-decoration: none;
}

.back-link:hover {
  color: var(--brand-accent);
}

.auth-footnote {
  margin: 0.8rem 0 0;
  color: var(--text-muted);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
  text-align: center;
}

.auth-recovery-note {
  display: grid;
  gap: 0.45rem;
  margin-top: 1.25rem;
  padding: 1rem 1.1rem;
  border: 1px solid color-mix(in srgb, var(--brand-accent) 16%, var(--border));
  border-radius: var(--radius-lg);
  background: var(--brand-soft-2);
  color: var(--text-body);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.auth-recovery-note p {
  margin: 0;
}

.auth-recovery-note .back-link {
  margin: 0.15rem 0 0;
  text-align: left;
}

@media (max-width: 980px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-content {
    padding:
      calc(env(safe-area-inset-top) + 1rem)
      clamp(1rem, 4vw, 2rem)
      calc(env(safe-area-inset-bottom) + 1.5rem);
  }

  .auth-form-wrap {
    margin-block: clamp(1.5rem, 4vh, 2.5rem);
  }
}

@media (max-width: 560px) {
  .auth-content {
    padding-inline: 1rem;
    padding-bottom: 1.5rem;
  }

  .auth-form-wrap {
    width: 100%;
    margin-block: 1.25rem;
    padding: 1.25rem;
    border-radius: var(--radius-lg);
  }

  .auth-form-wrap h1 {
    font-size: 1.95rem;
  }

  .auth-topline .brand-mark {
    width: 35px;
    height: 42px;
  }

  .auth-topline .brand-wordmark {
    width: 72px;
  }

  .auth-intro {
    font-size: 0.86rem;
  }

  .auth-footnote {
    font-size: 0.64rem;
  }
}
</style>
