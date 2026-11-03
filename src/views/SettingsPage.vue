<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { notificationsOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import {
  ALERT_DISTANCE_OPTIONS,
  isAlertDistance,
  loadAlertSettings,
  saveAlertSettings,
  type AlertDistance,
  type AlertSettings,
} from '../data/alertSettings';
import { beginLoadingOperation } from '../composables/loadingProgress';
import { showError, showSuccess } from '../composables/feedback';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

const nativeRuntime = Capacitor.isNativePlatform();
const notificationsSupported = nativeRuntime
  ? Capacitor.isPluginAvailable('LocalNotifications')
  : typeof Notification !== 'undefined';
const settings = ref<AlertSettings>(loadAlertSettings());
const saving = ref(false);
const permissionState = ref<PermissionState>('prompt');
const permissionCheckError = ref('');

const permissionText = computed(() => {
  if (permissionCheckError.value) return permissionCheckError.value;
  if (!notificationsSupported) return 'Notifications are not supported on this device.';
  if (permissionState.value === 'granted') return 'Notification permission is allowed.';
  if (permissionState.value === 'denied') return nativeRuntime
    ? 'Notifications are blocked. Allow them in your device settings to use get-off alerts.'
    : 'Notifications are blocked for this site. In Chrome, open Site settings > Notifications and choose Allow.';
  if (!nativeRuntime && typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Notifications require a secure website (HTTPS) or localhost.';
  }
  return 'Notification permission will be requested when you turn alerts on.';
});

const permissionTone = computed(() => {
  if (permissionState.value === 'granted') return 'is-good';
  if (permissionState.value === 'denied') return 'is-bad';
  return '';
});

async function refreshPermission() {
  permissionCheckError.value = '';
  if (!notificationsSupported) {
    permissionState.value = 'unsupported';
    return;
  }
  try {
    if (nativeRuntime) {
      const permission = await LocalNotifications.checkPermissions();
      permissionState.value = permission.display === 'granted'
        ? 'granted'
        : permission.display === 'denied' ? 'denied' : 'prompt';
      return;
    }
    permissionState.value = Notification.permission === 'granted'
      ? 'granted'
      : Notification.permission === 'denied' ? 'denied' : 'prompt';
  } catch (error) {
    permissionState.value = 'unsupported';
    permissionCheckError.value = error instanceof Error
      ? `Could not check notification permission: ${error.message}`
      : 'Could not check notification permission.';
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (nativeRuntime) {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') permission = await LocalNotifications.requestPermissions();
    await refreshPermission();
    return permission.display === 'granted';
  }
  if (!window.isSecureContext) {
    throw new Error('Notifications need HTTPS or localhost. Open RIDE from its secure website and try again.');
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    await refreshPermission();
    return false;
  }
  const result = await Notification.requestPermission();
  await refreshPermission();
  return result === 'granted';
}

onIonViewWillEnter(() => {
  settings.value = loadAlertSettings();
  void refreshPermission();
});

async function onToggle(event: Event) {
  const input = event.target as HTMLInputElement;
  const nextEnabled = input.checked;
  if (nextEnabled && !notificationsSupported) {
    input.checked = false;
    showError('Notifications are not supported on this device.');
    return;
  }
  const finishLoading = beginLoadingOperation();
  saving.value = true;
  try {
    if (nextEnabled && !(await ensureNotificationPermission())) {
      input.checked = false;
      showError(permissionState.value === 'denied'
        ? nativeRuntime
          ? 'Notifications are blocked. Allow them in your device settings, then try again.'
          : 'Notifications are blocked for this site. In Chrome, open Site settings > Notifications and choose Allow.'
        : 'Allow notifications in the browser prompt to turn on get-off alerts.');
      return;
    }
    const next = { ...settings.value, enabled: nextEnabled };
    saveAlertSettings(next);
    settings.value = next;
    showSuccess(nextEnabled ? 'Get-off alerts enabled.' : 'Get-off alerts turned off.');
  } catch (error) {
    input.checked = settings.value.enabled;
    showError(error instanceof Error
      ? error.message
      : 'Get-off alert settings could not be saved.');
  } finally {
    saving.value = false;
    finishLoading();
  }
}

function onDistanceChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  if (!isAlertDistance(value)) return;
  try {
    const next = { ...settings.value, distance: value as AlertDistance };
    saveAlertSettings(next);
    settings.value = next;
    showSuccess(`Get-off alert distance set to ${ALERT_DISTANCE_OPTIONS.find((option) => option.value === value)?.label ?? ''}.`);
  } catch {
    showError('Get-off alert settings could not be saved.');
  }
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="st-app">
        <RideAppHeader
          eyebrow="Settings"
          title="Trip Alerts"
          subtitle="Control how RIDE notifies you while a live trip is running."
          show-back
        />

        <main class="st-content">
          <section class="st-card" aria-labelledby="get-off-alert-title">
            <div class="st-card-head">
              <span class="st-card-icon" aria-hidden="true"><ion-icon :icon="notificationsOutline"></ion-icon></span>
              <div>
                <h2 id="get-off-alert-title">Get-off alert</h2>
                <p>Get a notification when you are close to the next stop in your itinerary.</p>
              </div>
            </div>

            <div class="st-setting-row">
              <div class="st-setting-copy">
                <strong>Enable get-off alerts</strong>
                <span>{{ settings.enabled ? 'Alerts are on.' : 'Alerts are off.' }}</span>
              </div>
              <label class="st-switch">
                <input
                  type="checkbox"
                  :checked="settings.enabled"
                  :disabled="saving || !notificationsSupported"
                  aria-label="Enable get-off alerts"
                  @change="onToggle"
                />
                <span class="st-switch-track" aria-hidden="true"><span class="st-switch-thumb"></span></span>
              </label>
            </div>

            <label class="st-field">
              <span>Notify me within</span>
              <select :value="settings.distance" @change="onDistanceChange">
                <option v-for="option in ALERT_DISTANCE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <small>Distance is measured in a straight line from your current GPS position.</small>
            </label>

            <p class="st-permission" :class="permissionTone" aria-live="polite">{{ permissionText }}</p>

            <ul class="st-notes">
              <li>Alerts run only while RIDE Live is open.</li>
              <li>Opening a live trip with alerts on starts location tracking automatically.</li>
              <li>Your location stays on this device and is only used to measure the remaining distance.</li>
            </ul>
          </section>

          <p class="st-auto-save">
            <ion-icon :icon="shieldCheckmarkOutline" aria-hidden="true"></ion-icon>
            <span>Changes are saved automatically on this device.</span>
          </p>
        </main>

        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.st-app {
  min-height: 100vh;
  background: #ffffff;
  padding-bottom: calc(84px + env(safe-area-inset-bottom));
}

.st-header {
  padding: calc(env(safe-area-inset-top) + 12px) 16px 24px;
  background: linear-gradient(135deg, #e8f4ec 0%, #f2f8f3 100%);
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
}

.st-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.st-brand :deep(.brand) {
  gap: 10px;
  align-items: center;
}

.st-brand :deep(.brand-mark) {
  width: 38px;
  height: 44px;
}

.st-brand :deep(.brand-wordmark) {
  width: 76px;
}

.st-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid #dce9df;
  border-radius: 14px;
  background: #ffffff;
  color: #3f8064;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06);
}

.st-header-copy {
  display: grid;
  gap: 4px;
}

.st-eyebrow {
  margin: 0;
  color: #3f8064;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.st-title {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
}

.st-subtitle {
  margin: 0;
  color: #5b7566;
  font-size: 13px;
  line-height: 1.45;
}

.st-content {
  display: grid;
  gap: 14px;
  padding: 18px 16px 0;
  max-width: 720px;
  margin: 0 auto;
}

.st-card {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid #dce9df;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 60px -52px rgba(23, 76, 64, 0.75);
}

.st-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.st-card-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  background: #f2f8f3;
  color: #3f8064;
  font-size: 23px;
}

.st-card-head h2 {
  margin: 0;
  color: #174c40;
  font-family: 'Poppins', sans-serif;
  font-size: 18px;
  font-weight: 700;
}

.st-card-head p {
  margin: 4px 0 0;
  color: #658078;
  font-size: 13px;
  line-height: 1.45;
}

.st-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #edf5ef;
  border-radius: 14px;
  background: #f7fbf8;
}

.st-setting-copy {
  display: grid;
  gap: 2px;
}

.st-setting-copy strong {
  color: #174c40;
  font-size: 14px;
}

.st-setting-copy span {
  color: #658078;
  font-size: 12px;
}

.st-switch {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  cursor: pointer;
}

.st-switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.st-switch-track {
  display: flex;
  align-items: center;
  width: 52px;
  height: 30px;
  padding: 3px;
  border-radius: 999px;
  background: #d6e2d9;
  transition: background 160ms ease;
}

.st-switch-thumb {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(23, 76, 64, 0.24);
  transition: transform 160ms ease;
}

.st-switch input:checked + .st-switch-track {
  background: #3f8064;
}

.st-switch input:checked + .st-switch-track .st-switch-thumb {
  transform: translateX(22px);
}

.st-switch input:focus-visible + .st-switch-track {
  outline: 3px solid rgba(63, 128, 100, 0.35);
  outline-offset: 3px;
}

.st-switch input:disabled + .st-switch-track {
  opacity: 0.5;
  cursor: not-allowed;
}

.st-field {
  display: grid;
  gap: 7px;
  color: #174c40;
  font-size: 13px;
  font-weight: 700;
}

.st-field select {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #dce9df;
  border-radius: 12px;
  background: #ffffff;
  color: #174c40;
  font: inherit;
}

.st-field small {
  color: #658078;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
}

.st-permission {
  margin: 0;
  padding: 11px 13px;
  border-radius: 12px;
  background: #f7fbf8;
  color: #5b7566;
  font-size: 12px;
  line-height: 1.45;
}

.st-permission.is-good {
  background: #e8f4ec;
  color: #2f6b4f;
}

.st-permission.is-bad {
  background: #fff4ed;
  color: #9a4c1f;
}

.st-notes {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #5b7566;
  font-size: 12px;
  line-height: 1.5;
}

.st-auto-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 0;
  color: #658078;
  font-size: 12px;
}

.st-auto-save ion-icon {
  color: #3f8064;
  font-size: 16px;
}

@media (min-width: 480px) {
  .st-header {
    padding-left: 22px;
    padding-right: 22px;
  }

  .st-content {
    padding-left: 22px;
    padding-right: 22px;
  }
}
</style>
