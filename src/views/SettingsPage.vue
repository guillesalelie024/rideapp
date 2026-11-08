<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  chevronForwardOutline,
  documentTextOutline,
  informationCircleOutline,
  lockClosedOutline,
  moonOutline,
  notificationsOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
} from 'ionicons/icons';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { getThemeMode, setThemeMode, type ThemeMode } from '../composables/theme';
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
const themeMode = ref<ThemeMode>(getThemeMode());

const appearanceOptions: Array<{ value: ThemeMode; label: string; description: string; icon: string }> = [
  { value: 'light', label: 'Light', description: 'Bright, airy forest tones.', icon: sunnyOutline },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes at night.', icon: moonOutline },
  { value: 'system', label: 'System', description: 'Match your device setting.', icon: phonePortraitOutline },
];

function onThemeChange(next: ThemeMode) {
  themeMode.value = next;
  setThemeMode(next);
  showSuccess(`Appearance set to ${next === 'system' ? 'system default' : next}.`);
}

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
  themeMode.value = getThemeMode();
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
          title="Make RIDE yours"
          subtitle="Manage appearance, trip alerts, and account preferences."
          show-back
        />

        <main class="st-content desktop-content ride-content">
          <section class="st-card" aria-labelledby="appearance-title">
            <div class="st-card-head">
              <span class="st-card-icon st-card-icon-accent" aria-hidden="true"><ion-icon :icon="sunnyOutline"></ion-icon></span>
              <div>
                <h2 id="appearance-title">Appearance</h2>
                <p>Choose how RIDE looks across every screen.</p>
              </div>
            </div>

            <div class="st-theme-grid" role="radiogroup" aria-label="Appearance">
              <button
                v-for="option in appearanceOptions"
                :key="option.value"
                type="button"
                class="st-theme-option"
                :class="{ 'is-active': themeMode === option.value }"
                role="radio"
                :aria-checked="themeMode === option.value"
                @click="onThemeChange(option.value)"
              >
                <span class="st-theme-icon" aria-hidden="true"><ion-icon :icon="option.icon"></ion-icon></span>
                <span class="st-theme-copy">
                  <strong>{{ option.label }}</strong>
                  <small>{{ option.description }}</small>
                </span>
                <span class="st-theme-dot" aria-hidden="true"></span>
              </button>
            </div>
          </section>

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

          <section class="st-card st-links-card" aria-labelledby="st-links-title">
            <div class="st-card-head">
              <span class="st-card-icon" aria-hidden="true"><ion-icon :icon="shieldCheckmarkOutline"></ion-icon></span>
              <div>
                <h2 id="st-links-title">Privacy &amp; security</h2>
                <p>Review how RIDE protects your data and your account.</p>
              </div>
            </div>
            <nav class="st-links" aria-label="Privacy and security links">
              <router-link to="/security" class="st-link">
                <span class="st-link-icon" aria-hidden="true"><ion-icon :icon="lockClosedOutline"></ion-icon></span>
                <span class="st-link-copy"><strong>Security</strong><small>Password and account protection</small></span>
                <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
              </router-link>
              <router-link to="/privacy" class="st-link">
                <span class="st-link-icon" aria-hidden="true"><ion-icon :icon="shieldCheckmarkOutline"></ion-icon></span>
                <span class="st-link-copy"><strong>Privacy Policy</strong><small>How your data is handled</small></span>
                <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
              </router-link>
              <router-link to="/terms" class="st-link">
                <span class="st-link-icon" aria-hidden="true"><ion-icon :icon="documentTextOutline"></ion-icon></span>
                <span class="st-link-copy"><strong>Terms of Service</strong><small>Rules for using RIDE</small></span>
                <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
              </router-link>
              <router-link to="/about" class="st-link">
                <span class="st-link-icon" aria-hidden="true"><ion-icon :icon="informationCircleOutline"></ion-icon></span>
                <span class="st-link-copy"><strong>About RIDE</strong><small>Our story and mission</small></span>
                <ion-icon :icon="chevronForwardOutline" aria-hidden="true"></ion-icon>
              </router-link>
            </nav>
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
  background: var(--bg);
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.st-header {
  padding: calc(env(safe-area-inset-top) + 12px) 16px 24px;
  background: linear-gradient(135deg, var(--brand-soft) 0%, var(--surface-soft) 100%);
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
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--brand-accent);
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 6px color-mix(in srgb, var(--brand-accent) 0.06, transparent);
}

.st-header-copy {
  display: grid;
  gap: 4px;
}

.st-eyebrow {
  margin: 0;
  color: var(--brand-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.st-title {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
}

.st-subtitle {
  margin: 0;
  color: var(--text-body);
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
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 24px 60px -52px color-mix(in srgb, var(--brand-deep) 0.75, transparent);
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
  background: var(--surface-soft);
  color: var(--brand-accent);
  font-size: 23px;
}

.st-card-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
}

.st-card-head p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.st-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--surface-soft);
  border-radius: 14px;
  background: var(--bg);
}

.st-setting-copy {
  display: grid;
  gap: 2px;
}

.st-setting-copy strong {
  color: var(--text-strong);
  font-size: 14px;
}

.st-setting-copy span {
  color: var(--text-secondary);
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
  background: var(--border);
  transition: background 160ms ease;
}

.st-switch-thumb {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--brand-deep) 0.24, transparent);
  transition: transform 160ms ease;
}

.st-switch input:checked + .st-switch-track {
  background: var(--brand);
}

.st-switch input:checked + .st-switch-track .st-switch-thumb {
  transform: translateX(22px);
}

.st-switch input:focus-visible + .st-switch-track {
  outline: 3px solid color-mix(in srgb, var(--brand-accent) 0.35, transparent);
  outline-offset: 3px;
}

.st-switch input:disabled + .st-switch-track {
  opacity: 0.5;
  cursor: not-allowed;
}

.st-field {
  display: grid;
  gap: 7px;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
}

.st-field select {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-strong);
  font: inherit;
}

.st-field small {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
}

.st-permission {
  margin: 0;
  padding: 11px 13px;
  border-radius: 12px;
  background: var(--bg);
  color: var(--text-body);
  font-size: 12px;
  line-height: 1.45;
}

.st-permission.is-good {
  background: var(--brand-soft);
  color: var(--brand-mid);
}

.st-permission.is-bad {
  background: var(--warning-soft);
  color: var(--warning);
}

.st-notes {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-body);
  font-size: 12px;
  line-height: 1.5;
}

.st-auto-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}

.st-auto-save ion-icon {
  color: var(--brand-accent);
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
/* ===== Forest Explorer — Settings ===== */
.st-app {
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}

.st-content {
  gap: 16px;
  padding-top: 18px;
}

.st-card {
  gap: 16px;
  padding: 18px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.st-card-icon {
  background: var(--brand-soft-2);
  color: var(--brand-accent);
}

.st-card-icon-accent {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.st-card-head h2 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.st-setting-row {
  border-color: var(--border);
  background: var(--surface-soft);
}

.st-switch-thumb {
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

.st-field select {
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.st-field select:focus {
  border-color: var(--brand-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-accent) 14%, transparent);
  outline: none;
}

.st-permission {
  background: var(--surface-soft);
}

.st-permission.is-good {
  background: var(--brand-soft);
  color: var(--brand-mid);
}

.st-permission.is-bad {
  background: var(--warning-soft);
  color: var(--warning);
}

/* Appearance selector */
.st-theme-grid {
  display: grid;
  gap: 9px;
}

.st-theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-body);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
}

.st-theme-option:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.st-theme-option.is-active {
  border-color: var(--brand-accent);
  background: var(--brand-soft);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-accent) 12%, transparent);
}

.st-theme-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  background: var(--surface);
  color: var(--brand-accent);
  font-size: 21px;
  box-shadow: var(--shadow-xs);
}

.st-theme-option.is-active .st-theme-icon {
  background: var(--brand);
  color: var(--on-brand);
}

.st-theme-copy {
  display: grid;
  flex: 1;
  gap: 1px;
}

.st-theme-copy strong {
  color: var(--text-strong);
  font-size: 14px;
  font-weight: 600;
}

.st-theme-copy small {
  color: var(--text-secondary);
  font-size: 11.5px;
  line-height: 1.4;
}

.st-theme-dot {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border: 2px solid var(--border-strong);
  border-radius: 50%;
  background: transparent;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.st-theme-option.is-active .st-theme-dot {
  border-color: var(--brand);
  background: radial-gradient(circle, var(--brand) 0 45%, transparent 48%);
}

/* Privacy and security links */
.st-links-card {
  gap: 14px;
}

.st-links {
  display: grid;
  gap: 4px;
}

.st-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-body);
  text-decoration: none;
  transition: background var(--transition-fast);
}

.st-link:hover {
  background: var(--surface-soft);
}

.st-link + .st-link {
  border-top: 1px solid var(--border);
}

.st-link-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: var(--brand-soft-2);
  color: var(--brand-accent);
  font-size: 19px;
}

.st-link-copy {
  display: grid;
  flex: 1;
  gap: 1px;
}

.st-link-copy strong {
  color: var(--text-strong);
  font-size: 13.5px;
  font-weight: 600;
}

.st-link-copy small {
  color: var(--text-secondary);
  font-size: 11.5px;
}

.st-link > ion-icon {
  flex: 0 0 auto;
  color: var(--text-muted);
  font-size: 17px;
}

.st-auto-save {
  margin-top: 4px;
  margin-bottom: 8px;
}
</style>
