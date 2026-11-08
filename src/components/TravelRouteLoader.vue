<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import LoadingProgressModal from './LoadingProgressModal.vue';
import RideProgressBar from './RideProgressBar.vue';
import { RIDE_PAGE_TRANSITION_MS } from '../animations/ridePageTransition';
import { pendingLoadingOperations } from '../composables/loadingProgress';
import { showError } from '../composables/feedback';

const MINIMUM_VISIBLE_MS = 700;
const COMPLETE_ANIMATION_MS = 190;
const router = useRouter();
const isVisible = ref(false);
const progressPhase = ref<'idle' | 'loading' | 'complete'>('idle');
const loadingMessage = ref('Preparing your journey...');
let activePath = '';
let actionStartedAt = 0;
let routePending = false;
let routeReady = false;
let routeFailed = false;
let routeReadyAt = 0;
let finishTimer: ReturnType<typeof setTimeout> | undefined;
let progressTimer: ReturnType<typeof setTimeout> | undefined;

const routeMessages: Record<string, string> = {
  Explore: 'Opening destinations...',
  DestinationDetails: 'Opening destination...',
  Restaurants: 'Opening restaurants...',
  ItineraryPlanner: 'Preparing your itinerary...',
  Commute: 'Finding available routes...',
  RouteDetails: 'Opening route details...',
  TripSummary: 'Updating your trip...',
  RideLive: 'Preparing RIDE Live...',
  Trips: 'Loading your trips...',
  TripCompletion: 'Preparing your trip receipt...',
  Profile: 'Opening your profile...',
  Login: 'Opening Login...',
  SignUp: 'Opening Sign Up...',
  Welcome: 'Opening RIDE...',
  Home: 'Opening Home...',
  NearMe: 'Finding nearby places...',
  SurpriseMe: 'Finding somewhere new...',
};

const removeBeforeEach = router.beforeEach((to, from) => {
  if (to.fullPath === from.fullPath) return;

  clearTimeout(finishTimer);
  finishTimer = undefined;
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = undefined;
  }
  routePending = true;
  routeReady = false;
  routeFailed = false;
  routeReadyAt = 0;
  activePath = to.fullPath;
  loadingMessage.value = routeMessages[String(to.name ?? '')] ?? 'Preparing your journey...';
  if (!isVisible.value) {
    actionStartedAt = Date.now();
    isVisible.value = true;
  }
  progressPhase.value = 'loading';
});

function endLoadingAfterAction() {
  if (finishTimer) clearTimeout(finishTimer);
  const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - actionStartedAt));
  finishTimer = setTimeout(() => {
    finishTimer = undefined;
    if (routePending || pendingLoadingOperations.value > 0) return;
    showCompleteThenHide();
  }, remaining);
}

function showCompleteThenHide() {
  if (finishTimer) clearTimeout(finishTimer);
  progressPhase.value = 'complete';
  finishTimer = setTimeout(() => {
    finishTimer = undefined;
    if (routePending || pendingLoadingOperations.value > 0) {
      progressPhase.value = 'loading';
      return;
    }
    isVisible.value = false;
    progressPhase.value = 'idle';
    activePath = '';
  }, COMPLETE_ANIMATION_MS);
}

function endLoadingAfterRoute() {
  if (finishTimer) clearTimeout(finishTimer);
  const elapsed = Date.now() - actionStartedAt;
  const transitionDuration = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 1
    : RIDE_PAGE_TRANSITION_MS;
  const routeTransitionRemaining = Math.max(0, transitionDuration - (Date.now() - routeReadyAt));
  const remaining = Math.max(MINIMUM_VISIBLE_MS - elapsed, routeTransitionRemaining);

  finishTimer = setTimeout(() => {
    finishTimer = undefined;
    if (pendingLoadingOperations.value > 0) return;
    showCompleteThenHide();
  }, remaining);
}

function endLoadingAfterFailedRoute() {
  if (finishTimer) clearTimeout(finishTimer);
  const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - actionStartedAt));
  finishTimer = setTimeout(() => {
    finishTimer = undefined;
    if (pendingLoadingOperations.value > 0) return;
    isVisible.value = false;
    progressPhase.value = 'idle';
    activePath = '';
  }, remaining);
}

const removeAfterEach = router.afterEach(async (to, _from, failure) => {
  if (activePath !== to.fullPath || !routePending) return;

  routePending = false;
  routeFailed = false;
  if (failure) {
    routeReady = true;
    routeFailed = true;
    showActionError('Could not open that page. Please try again.');
    endLoadingAfterFailedRoute();
    return;
  }

  await nextTick();
  routeReady = true;
  routeReadyAt = Date.now();
  endLoadingAfterRoute();
});

const removeOnError = router.onError(() => {
  routePending = false;
  routeReady = true;
  routeFailed = true;
  routeReadyAt = Date.now();
  showActionError('Could not open that page. Please try again.');
  endLoadingAfterFailedRoute();
});

function showActionError(message: string) {
  showError(message);
}

function handleActionError() {
  if (finishTimer) clearTimeout(finishTimer);
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = undefined;
  }
  finishTimer = undefined;
  routePending = false;
  routeReady = false;
  activePath = '';
  isVisible.value = false;
  progressPhase.value = 'idle';
  showActionError('This action could not be completed. Please try again.');
}

function getActionControl(target: EventTarget | null): HTMLElement | null {
  const element = target instanceof Element
    ? target
    : target instanceof Node
      ? target.parentElement
      : null;
  return element?.closest<HTMLElement>(
    'button, a[href], [role="button"], [role="link"], [role="tab"], ion-button, ion-back-button, ion-item[button], ion-fab-button, ion-segment-button, ion-tab-button, input[type="button"], input[type="submit"], input[type="reset"]',
  ) ?? null;
}

function messageForControl(control: HTMLElement): string {
  if (control.getAttribute('type') === 'submit') return 'Submitting...';
  const label = (control.getAttribute('aria-label') || control.innerText || control.textContent || '').trim().toLowerCase();
  if (/save|remove|delete|edit|update|submit|confirm/.test(label)) return 'Saving changes...';
  if (/continue|start|ride|route|trip|itinerary|journey/.test(label)) return 'Preparing your journey...';
  return 'Opening page...';
}

function startAction(message: string) {
  if (progressTimer) {
    clearTimeout(progressTimer);
    progressTimer = undefined;
  }
  activePath = '';
  routeReady = false;
  routeFailed = false;
  routeReadyAt = 0;
  actionStartedAt = Date.now();
  loadingMessage.value = message;
  isVisible.value = true;
  progressPhase.value = 'loading';
  routePending = false;
  endLoadingAfterAction();
}

function handleDocumentClick(event: MouseEvent) {
  const control = getActionControl(event.target);
  if (!control) return;
  if (control.closest('.ride-feedback-backdrop, [data-instant-action]')) return;
  if (control.matches(':disabled, [aria-disabled="true"]') || control.hasAttribute('disabled')) return;

  if (isVisible.value) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  startAction(messageForControl(control));
}

function handleDocumentChange(event: Event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target?.closest('select, input[type="checkbox"], input[type="radio"]') || isVisible.value) return;
  startAction('Updating your selection...');
}

function handleFormSubmit() {
  if (!isVisible.value) startAction('Submitting...');
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('change', handleDocumentChange, true);
  document.addEventListener('submit', handleFormSubmit, true);
  window.addEventListener('ride:action-error', handleActionError);
});

watch(pendingLoadingOperations, (pendingCount) => {
  if (pendingCount > 0) {
    if (finishTimer) clearTimeout(finishTimer);
    finishTimer = undefined;
    if (isVisible.value) progressPhase.value = 'loading';
    return;
  }
  if (!isVisible.value || routePending) return;
  if (routeReady && activePath) {
    if (routeFailed) endLoadingAfterFailedRoute();
    else endLoadingAfterRoute();
  } else if (!activePath) {
    endLoadingAfterAction();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true);
  document.removeEventListener('change', handleDocumentChange, true);
  document.removeEventListener('submit', handleFormSubmit, true);
  window.removeEventListener('ride:action-error', handleActionError);
  removeBeforeEach();
  removeAfterEach();
  removeOnError();
  if (finishTimer) clearTimeout(finishTimer);
  if (progressTimer) clearTimeout(progressTimer);
});
</script>

<template>
  <RideProgressBar :phase="progressPhase" label="Page navigation progress" />
  <LoadingProgressModal :visible="isVisible" :message="loadingMessage" :phase="progressPhase === 'complete' ? 'complete' : 'loading'" />
</template>
