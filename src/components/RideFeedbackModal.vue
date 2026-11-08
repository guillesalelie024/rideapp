<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { IonIcon } from '@ionic/vue';
import { alertCircleOutline, checkmarkCircleOutline, closeOutline, informationCircleOutline } from 'ionicons/icons';
import type { FeedbackTone } from '../composables/feedback';

interface FeedbackDetail {
  message: string;
  tone?: FeedbackTone;
  title?: string;
  onClose?: () => void;
}

const visible = ref(false);
const message = ref('');
const title = ref('Notice');
const tone = ref<FeedbackTone>('info');
const dialog = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
let previousFocus: HTMLElement | null = null;
let previousOverflow = '';
let afterClose: (() => void) | undefined;
const icon = computed(() => tone.value === 'success'
  ? checkmarkCircleOutline
  : tone.value === 'error' ? alertCircleOutline : informationCircleOutline);

function close() {
  visible.value = false;
  document.body.style.overflow = previousOverflow;
  const callback = afterClose;
  afterClose = undefined;
  nextTick(() => {
    if (previousFocus?.isConnected) previousFocus.focus();
    callback?.();
  });
}

function onFeedback(event: Event) {
  const detail = (event as CustomEvent<FeedbackDetail>).detail;
  if (!detail?.message) return;
  if (!visible.value) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  message.value = detail.message;
  tone.value = detail.tone ?? 'info';
  title.value = detail.title ?? (tone.value === 'success' ? 'Success' : tone.value === 'error' ? 'Something went wrong' : 'Notice');
  afterClose = detail.onClose;
  visible.value = true;
  nextTick(() => closeButton.value?.focus());
}

function onKeydown(event: KeyboardEvent) {
  if (!visible.value) return;
  if (event.key === 'Escape') { close(); return; }
  if (event.key !== 'Tab' || !dialog.value) return;
  const focusable = Array.from(dialog.value.querySelectorAll<HTMLElement>('button:not([disabled])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

onMounted(() => {
  window.addEventListener('ride:feedback', onFeedback);
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener('ride:feedback', onFeedback);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="ride-feedback">
      <div v-if="visible" class="ride-feedback-backdrop" @click.self="close">
        <section
          ref="dialog"
          class="ride-feedback-dialog"
          :class="`ride-feedback-dialog--${tone}`"
          :role="tone === 'error' ? 'alertdialog' : 'dialog'"
          aria-modal="true"
          aria-labelledby="ride-feedback-title"
          aria-describedby="ride-feedback-message"
        >
          <button ref="closeButton" class="ride-feedback-close" type="button" aria-label="Close message" @click="close">
            <ion-icon :icon="closeOutline" aria-hidden="true" />
          </button>
          <span class="ride-feedback-icon"><ion-icon :icon="icon" aria-hidden="true" /></span>
          <h2 id="ride-feedback-title">{{ title }}</h2>
          <p id="ride-feedback-message">{{ message }}</p>
          <button class="button-primary ride-feedback-confirm" type="button" @click="close">Got it</button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ride-feedback-backdrop {
  position: fixed;
  z-index: 10020;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(31 48 35 / 34%);
  backdrop-filter: blur(3px);
}

.ride-feedback-dialog {
  position: relative;
  display: grid;
  width: min(390px, 100%);
  justify-items: center;
  gap: .7rem;
  padding: 2rem 1.5rem 1.4rem;
  border: 1px solid var(--surface-soft);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: 0 22px 65px rgb(31 57 38 / 24%);
  color: var(--charcoal, var(--text-primary));
  text-align: center;
}

.ride-feedback-close {
  position: absolute;
  top: .65rem;
  right: .65rem;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--muted-foreground, var(--text-body));
  font-size: 1.2rem;
  cursor: pointer;
}

.ride-feedback-icon { display: grid; place-items: center; color: var(--forest, var(--text-body)); font-size: 2.65rem; }
.ride-feedback-dialog--error .ride-feedback-icon { color: var(--danger); }
.ride-feedback-dialog--info .ride-feedback-icon { color: var(--sage-action, var(--text-body)); }
.ride-feedback-dialog h2 { margin: 0; color: var(--forest, var(--text-body)); font-size: 1.25rem; font-weight: 750; }
.ride-feedback-dialog p { max-width: 32ch; margin: 0; color: var(--muted-foreground, var(--text-body)); font-size: .95rem; line-height: 1.55; }
.ride-feedback-confirm { min-width: 130px; margin-top: .45rem; }

.ride-feedback-enter-active, .ride-feedback-leave-active { transition: opacity 150ms ease; }
.ride-feedback-enter-active .ride-feedback-dialog, .ride-feedback-leave-active .ride-feedback-dialog { transition: transform 150ms ease; }
.ride-feedback-enter-from, .ride-feedback-leave-to { opacity: 0; }
.ride-feedback-enter-from .ride-feedback-dialog, .ride-feedback-leave-to .ride-feedback-dialog { transform: translateY(6px) scale(.98); }

@media (prefers-reduced-motion: reduce) {
  .ride-feedback-enter-active, .ride-feedback-leave-active,
  .ride-feedback-enter-active .ride-feedback-dialog, .ride-feedback-leave-active .ride-feedback-dialog { transition-duration: 1ms; }
}
</style>
