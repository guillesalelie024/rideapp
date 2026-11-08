<script setup lang="ts">
import { reactive, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { arrowBackOutline } from 'ionicons/icons';
import AuthScenery from '../components/AuthScenery.vue';
import RideLogo from '../components/RideLogo.vue';
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
              <h1>Forgot your password?</h1>
              <p class="auth-intro">We will email you a secure link to choose a new password.</p>

              <form class="auth-form" novalidate @submit.prevent="submit">
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
                  {{ busy ? 'Sending…' : 'Send reset link' }}
                </button>
              </form>

              <section v-if="sentMessage" class="auth-recovery-note" role="status">
                <p>{{ sentMessage }}</p>
                <p v-if="devResetUrl" class="auth-recovery-note-dev">
                  Development only: <router-link :to="devResetUrl">open the reset link</router-link>.
                </p>
                <router-link class="back-link" to="/login">Back to log in</router-link>
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

.auth-recovery-note-dev {
  color: var(--warning);
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
