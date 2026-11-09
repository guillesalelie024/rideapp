<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue";
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from "@ionic/vue";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  bookmarkOutline,
  bookOutline,
  busOutline,
  calendarOutline,
  callOutline,
  chevronForwardOutline,
  documentTextOutline,
  helpCircleOutline,
  lockClosedOutline,
  logOutOutline,
  moonOutline,
  notificationsOutline,
  personCircleOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";
import RideBottomNav from "../components/RideBottomNav.vue";
import RideAppHeader from "../components/RideAppHeader.vue";
import { changePassword, clearRideSession, getRideSession, signOut, updateRideProfile, updateStoredRideUser, type RideUser } from "../data/api";
import { clearLocalTripData, loadTrips, type TripRecord } from "../data/trips";
import { PROFILE_AVATAR_OPTIONS } from "../data/profileAvatars";
import { showError, showSuccess } from "../composables/feedback";
import { getThemeMode, setThemeMode, type ThemeMode } from "../composables/theme";
import {
  ALERT_DISTANCE_OPTIONS,
  isAlertDistance,
  loadAlertSettings,
  saveAlertSettings,
  type AlertDistance,
  type AlertSettings,
} from "../data/alertSettings";
import { beginLoadingOperation } from "../composables/loadingProgress";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

const router = useRouter();
const trips = ref<TripRecord[]>([]);
const user = ref<RideUser | null>(getRideSession()?.user ?? null);
const editing = ref(false);
const nameDraft = ref("");
const emailDraft = ref("");
const avatarDraft = ref("");
const saving = ref(false);
const showLogoutConfirmation = ref(false);
const loggingOut = ref(false);
const logoutCancelButton = ref<HTMLButtonElement | null>(null);
const showTutorial = ref(false);
const showAlerts = ref(false);
const supportModal = ref<"emergency" | "help" | "security" | "privacy" | "terms" | null>(null);
const modalCloseButton = ref<HTMLButtonElement | null>(null);
const securityForm = reactive({ currentPassword: "", newPassword: "", confirmPassword: "" });
const securityErrors = reactive<Record<string, string>>({});
const securityBusy = ref(false);
const securityPasswordVisible = ref(false);

const nativeRuntime = Capacitor.isNativePlatform();
const notificationsSupported = nativeRuntime
  ? Capacitor.isPluginAvailable("LocalNotifications")
  : typeof Notification !== "undefined";
const settings = ref<AlertSettings>(loadAlertSettings());
const savingAlerts = ref(false);
const permissionState = ref<PermissionState>("prompt");
const permissionCheckError = ref("");
const themeMode = ref<ThemeMode>(getThemeMode());

const appearanceOptions: Array<{ value: ThemeMode; label: string; description: string; icon: string }> = [
  { value: "light", label: "Light", description: "Bright, airy forest tones.", icon: sunnyOutline },
  { value: "dark", label: "Dark", description: "Easy on the eyes at night.", icon: moonOutline },
  { value: "system", label: "System", description: "Match your device setting.", icon: phonePortraitOutline },
];

const tutorialSteps = [
  { title: "Discover places", description: "Browse Home, Explore, Near Me, and Restaurants to find destinations in and around Calapan City." },
  { title: "Save & plan", description: "Tap heart/save actions to keep places, then create an itinerary from Saved Places or Trips." },
  { title: "Compare routes", description: "Use Route & Fares/Commute to choose a starting point, destination, and transport option with fare/time details." },
  { title: "Track your trip", description: "Start a trip from Trips, follow live progress, and review your receipt after completion." },
];

function loadData() {
  try { trips.value = loadTrips(); } catch { trips.value = []; }
  user.value = getRideSession()?.user ?? null;
}
loadData();
onIonViewWillEnter(() => {
  loadData();
  settings.value = loadAlertSettings();
  themeMode.value = getThemeMode();
  void refreshPermission();
});

const avatarInitials = computed(() => (user.value?.name ?? "GU")
  .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase()).join(""));
const avatarDraftInitials = computed(() => nameDraft.value.trim()
  .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toLocaleUpperCase()).join("") || avatarInitials.value);

function startEdit() {
  if (!user.value) { router.push("/login"); return; }
  nameDraft.value = user.value.name; emailDraft.value = user.value.email; avatarDraft.value = user.value.avatar ?? "";
  editing.value = true;
}
function cancelEdit() { editing.value = false; nameDraft.value = ""; emailDraft.value = ""; avatarDraft.value = ""; }
async function saveEdit() {
  if (!user.value) return;
  const name = nameDraft.value.trim();
  const email = emailDraft.value.trim();
  if (!name) { showError("Name is required."); return; }
  if (!email) { showError("Email is required."); return; }
  saving.value = true;
  try {
    const profileChanged = name !== user.value.name || email !== user.value.email;
    const avatarChanged = (avatarDraft.value || "") !== (user.value.avatar || "");
    let updatedUser = user.value;
    let profileUpdateError: unknown = null;
    if (profileChanged) {
      try { const res = await updateRideProfile(name, email); updatedUser = res.user; } catch (e) { profileUpdateError = e; }
    }
    if (profileUpdateError && !avatarChanged) { showError(profileUpdateError instanceof Error ? profileUpdateError.message : "Could not update profile."); return; }
    if (avatarChanged) updatedUser = { ...updatedUser, avatar: avatarDraft.value || undefined };
    user.value = updatedUser;
    try { updateStoredRideUser(updatedUser); } catch (e) { showError(e instanceof Error ? `Could not save profile: ${e.message}` : "Could not save profile."); return; }
    if (profileUpdateError) { showError("Avatar saved, but profile details could not be updated."); return; }
    editing.value = false;
    showSuccess(avatarChanged && !profileChanged ? "Your profile icon has been updated." : "Your profile has been updated.");
  } finally { saving.value = false; }
}

async function openTutorial() { showTutorial.value = true; await nextTick(); modalCloseButton.value?.focus(); }
function closeTutorial() { showTutorial.value = false; }
async function openAlerts() {
  showAlerts.value = true; settings.value = loadAlertSettings(); themeMode.value = getThemeMode();
  void refreshPermission(); await nextTick(); modalCloseButton.value?.focus();
}
function closeAlerts() { showAlerts.value = false; }
async function openSupport(kind: "emergency" | "help" | "security" | "privacy" | "terms") {
  if (kind === "security") clearSecurityForm();
  supportModal.value = kind;
  await nextTick();
  modalCloseButton.value?.focus();
}
function closeSupport() { supportModal.value = null; }
function clearSecurityForm() {
  securityForm.currentPassword = ""; securityForm.newPassword = ""; securityForm.confirmPassword = "";
  Object.keys(securityErrors).forEach((k) => delete securityErrors[k]);
  securityPasswordVisible.value = false;
}
async function submitSecurityPassword() {
  Object.keys(securityErrors).forEach((k) => delete securityErrors[k]);
  if (!securityForm.currentPassword) securityErrors.currentPassword = "Enter your current password.";
  if (securityForm.newPassword.length < 8) securityErrors.newPassword = "Use at least 8 characters.";
  else if (securityForm.newPassword === securityForm.currentPassword) securityErrors.newPassword = "Choose a password different from your current one.";
  if (securityForm.confirmPassword !== securityForm.newPassword) securityErrors.confirmPassword = "Your new passwords do not match.";
  if (Object.keys(securityErrors).length) return;
  securityBusy.value = true;
  const finishLoading = beginLoadingOperation();
  try {
    await changePassword(securityForm.currentPassword, securityForm.newPassword);
    clearSecurityForm();
    showSuccess("Your password was changed. Other signed-in devices were signed out.", "Password updated");
  } catch (error) {
    showError(error instanceof Error ? error.message : "Your password could not be changed.");
  } finally {
    securityBusy.value = false;
    finishLoading();
  }
}
function clearLocalDataFromProfile() {
  clearLocalTripData();
  showSuccess("Trips and itineraries saved on this device were cleared.", "Local data cleared");
}
function onThemeChange(next: ThemeMode) {
  themeMode.value = next; setThemeMode(next);
  showSuccess(`Appearance set to ${next === "system" ? "system default" : next}.`);
}
const permissionText = computed(() => {
  if (permissionCheckError.value) return permissionCheckError.value;
  if (!notificationsSupported) return "Notifications are not supported on this device.";
  if (permissionState.value === "granted") return "Notification permission is allowed.";
  if (permissionState.value === "denied") return nativeRuntime
    ? "Notifications are blocked. Allow them in your device settings to use get-off alerts."
    : "Notifications are blocked for this site. In Chrome, open Site settings > Notifications and choose Allow.";
  if (!nativeRuntime && typeof window !== "undefined" && !window.isSecureContext) return "Notifications require a secure website (HTTPS) or localhost.";
  return "Notification permission will be requested when you turn alerts on.";
});
const permissionTone = computed(() => (permissionState.value === "granted" ? "is-good" : permissionState.value === "denied" ? "is-bad" : ""));
async function refreshPermission() {
  permissionCheckError.value = "";
  if (!notificationsSupported) { permissionState.value = "unsupported"; return; }
  try {
    if (nativeRuntime) {
      const permission = await LocalNotifications.checkPermissions();
      permissionState.value = permission.display === "granted" ? "granted" : permission.display === "denied" ? "denied" : "prompt";
      return;
    }
    permissionState.value = Notification.permission === "granted" ? "granted" : Notification.permission === "denied" ? "denied" : "prompt";
  } catch (e) { permissionState.value = "unsupported"; permissionCheckError.value = e instanceof Error ? `Could not check notification permission: ${e.message}` : "Could not check notification permission."; }
}
async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (nativeRuntime) {
    let p = await LocalNotifications.checkPermissions();
    if (p.display !== "granted") p = await LocalNotifications.requestPermissions();
    await refreshPermission(); return p.display === "granted";
  }
  if (!window.isSecureContext) throw new Error("Notifications need HTTPS or localhost. Open RIDE from its secure website and try again.");
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") { await refreshPermission(); return false; }
  const result = await Notification.requestPermission(); await refreshPermission(); return result === "granted";
}
async function onToggle(event: Event) {
  const input = event.target as HTMLInputElement; const nextEnabled = input.checked;
  if (nextEnabled && !notificationsSupported) { input.checked = false; showError("Notifications are not supported on this device."); return; }
  const finishLoading = beginLoadingOperation(); savingAlerts.value = true;
  try {
    if (nextEnabled && !(await ensureNotificationPermission())) {
      input.checked = false;
      showError(permissionState.value === "denied"
        ? (nativeRuntime ? "Notifications are blocked. Allow them in your device settings, then try again." : "Notifications are blocked for this site. In Chrome, open Site settings > Notifications and choose Allow.")
        : "Allow notifications in the browser prompt to turn on get-off alerts.");
      return;
    }
    const next = { ...settings.value, enabled: nextEnabled }; saveAlertSettings(next); settings.value = next;
    showSuccess(nextEnabled ? "Get-off alerts enabled." : "Get-off alerts turned off.");
  } catch (e) { input.checked = settings.value.enabled; showError(e instanceof Error ? e.message : "Get-off alert settings could not be saved."); }
  finally { savingAlerts.value = false; finishLoading(); }
}
function onDistanceChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value); if (!isAlertDistance(value)) return;
  try {
    const next = { ...settings.value, distance: value as AlertDistance }; saveAlertSettings(next); settings.value = next;
    showSuccess(`Get-off alert distance set to ${ALERT_DISTANCE_OPTIONS.find((o) => o.value === value)?.label ?? ""}.`);
  } catch { showError("Get-off alert settings could not be saved."); }
}

async function requestLogOut() { if (!user.value) return; showLogoutConfirmation.value = true; await nextTick(); logoutCancelButton.value?.focus(); }
function cancelLogOut() { if (!loggingOut.value) showLogoutConfirmation.value = false; }
async function logOut() {
  if (!user.value || loggingOut.value) return; loggingOut.value = true;
  try { await signOut(); } catch { /* ignore sign-out API failure */ }
  try { clearRideSession(); } catch { /* ignore local clear failure */ }
  try { clearLocalTripData(); } catch { /* ignore local clear failure */ }
  trips.value = []; user.value = null; showLogoutConfirmation.value = false;
  showSuccess("Logged out."); router.replace("/"); loggingOut.value = false;
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="pf-app">
        <RideAppHeader eyebrow="Profile" title="My Account" show-back back-to="/home" />

        <div class="pf-content pf-full">
          <section class="pf-profile-card">
            <div class="pf-avatar" aria-hidden="true">
              <ion-icon v-if="!user?.avatar" :icon="personCircleOutline"></ion-icon>
              <span v-else>{{ avatarInitials }}</span>
            </div>
            <div class="pf-profile-info">
              <h2>{{ user?.name || "Guest User" }}</h2>
              <p class="pf-email">{{ user?.email || (user ? "" : "Sign in to sync trips") }}</p>
            </div>
            <button class="pf-edit-btn" type="button" @click="startEdit">{{ user ? "Edit" : "Sign In" }}</button>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Preferences</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="openAlerts">
                <div class="pf-item-icon"><ion-icon :icon="notificationsOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Trip Alerts</strong><span>Appearance and get-off alerts</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">My Trips</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/trips')">
                <div class="pf-item-icon"><ion-icon :icon="calendarOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Upcoming &amp; Past Trips</strong><span>{{ trips.length }} trip{{ trips.length === 1 ? "" : "s" }}</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push('/itinerary')">
                <div class="pf-item-icon"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>My Itinerary</strong><span>Saved itineraries</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Saved Places</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/saved')">
                <div class="pf-item-icon"><ion-icon :icon="bookmarkOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Favorites</strong><span>Destinations to revisit</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">App Guide</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="openTutorial">
                <div class="pf-item-icon"><ion-icon :icon="bookOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>How to use RIDE</strong><span>Quick tutorial and app guide</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Safety &amp; Support</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="openSupport('emergency')">
                <div class="pf-item-icon"><ion-icon :icon="callOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Emergency Contacts</strong><span>For safety during trips</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="openSupport('help')">
                <div class="pf-item-icon"><ion-icon :icon="helpCircleOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Help &amp; Support</strong><span>Get assistance</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="openSupport('security')">
                <div class="pf-item-icon"><ion-icon :icon="lockClosedOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Security</strong><span>Password and account protection</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="openSupport('privacy')">
                <div class="pf-item-icon"><ion-icon :icon="shieldCheckmarkOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Privacy Policy</strong><span>How your data is handled</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="openSupport('terms')">
                <div class="pf-item-icon"><ion-icon :icon="documentTextOutline"></ion-icon></div>
                <div class="pf-item-text"><strong>Terms of Service</strong><span>Rules for using RIDE</span></div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <button v-if="user" class="pf-logout" type="button" @click="requestLogOut"><ion-icon :icon="logOutOutline"></ion-icon><span>Log Out</span></button>
          <button v-else class="pf-logout pf-logout-green" type="button" @click="router.push('/login')"><ion-icon :icon="personCircleOutline"></ion-icon><span>Sign In</span></button>
          <div class="pf-spacer"></div>
        </div>

        <div v-if="showLogoutConfirmation" class="pf-modal-backdrop" @click.self="cancelLogOut">
          <section class="pf-logout-modal" role="alertdialog" aria-modal="true" aria-labelledby="pf-logout-title" aria-describedby="pf-logout-description" @keydown.esc="cancelLogOut">
            <h2 id="pf-logout-title">Log out?</h2>
            <p id="pf-logout-description">Are you sure you want to log out?</p>
            <div class="pf-modal-actions">
              <button ref="logoutCancelButton" class="pf-edit-btn pf-edit-cancel" type="button" :disabled="loggingOut" @click="cancelLogOut">Cancel</button>
              <button class="pf-edit-btn pf-logout-confirm" type="button" :disabled="loggingOut" @click="logOut">{{ loggingOut ? "Logging out..." : "Log Out" }}</button>
            </div>
          </section>
        </div>

        <div v-if="editing" class="pf-modal-backdrop" @click.self="cancelEdit">
          <section class="pf-edit-modal" role="dialog" aria-modal="true" aria-labelledby="pf-edit-title" @keydown.esc="cancelEdit">
            <h2 id="pf-edit-title">Edit Profile</h2>
            <p class="pf-modal-description">Update your profile details and choose an icon.</p>
            <form class="pf-edit-form" @submit.prevent="saveEdit">
              <span class="pf-modal-label">Profile icon</span>
              <div class="pf-avatar-picker" role="group" aria-label="Choose a profile icon">
                <button type="button" class="pf-avatar-option" :class="{ 'pf-avatar-option-active': !avatarDraft }" :aria-pressed="!avatarDraft" @click="avatarDraft = ''">{{ avatarDraftInitials || "U" }}</button>
                <button v-for="option in PROFILE_AVATAR_OPTIONS" :key="option.id" type="button" class="pf-avatar-option" :class="{ 'pf-avatar-option-active': avatarDraft === option.id }" :aria-pressed="avatarDraft === option.id" :aria-label="option.label" :title="option.label" @click="avatarDraft = option.id">
                  <ion-icon :icon="option.icon" aria-hidden="true"></ion-icon>
                </button>
              </div>
              <label class="pf-modal-label" for="pf-name">Full name</label>
              <input id="pf-name" v-model="nameDraft" class="pf-name-input" placeholder="Full name" maxlength="100" autocomplete="name" />
              <label class="pf-modal-label" for="pf-email">Email address</label>
              <input id="pf-email" v-model="emailDraft" class="pf-name-input" type="email" placeholder="name@gmail.com" maxlength="254" autocomplete="email" required />
              <div class="pf-modal-actions">
                <button class="pf-edit-btn pf-edit-cancel" type="button" :disabled="saving" @click="cancelEdit">Cancel</button>
                <button class="pf-edit-btn pf-edit-save" type="submit" :disabled="saving">{{ saving ? "Saving..." : "Save" }}</button>
              </div>
            </form>
          </section>
        </div>

        <div v-if="showTutorial" class="pf-modal-backdrop" @click.self="closeTutorial">
          <section class="pf-tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="pf-tutorial-title" aria-describedby="pf-tutorial-intro">
            <div class="pf-tutorial-head">
              <span class="pf-tutorial-badge"><ion-icon :icon="bookOutline" aria-hidden="true"></ion-icon></span>
              <div><h2 id="pf-tutorial-title">How to use RIDE</h2><p id="pf-tutorial-intro" class="pf-modal-description">A quick guide to plan, travel, and track your trips in the app.</p></div>
            </div>
            <ol class="pf-tutorial-steps">
              <li v-for="(step, index) in tutorialSteps" :key="step.title" class="pf-tutorial-step">
                <span class="pf-tutorial-num" aria-hidden="true">{{ index + 1 }}</span>
                <div class="pf-tutorial-copy"><strong>{{ step.title }}</strong><p>{{ step.description }}</p></div>
              </li>
            </ol>
            <div class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeTutorial">Got it</button></div>
          </section>
        </div>

        <div v-if="showAlerts" class="pf-modal-backdrop" @click.self="closeAlerts">
          <section class="pf-tutorial-modal pf-alerts-modal" role="dialog" aria-modal="true" aria-labelledby="pf-alerts-title">
            <div class="pf-tutorial-head">
              <span class="pf-tutorial-badge"><ion-icon :icon="notificationsOutline" aria-hidden="true"></ion-icon></span>
              <div><h2 id="pf-alerts-title">Trip Alerts</h2><p class="pf-modal-description">Appearance and get-off alert settings.</p></div>
            </div>
            <div class="pf-alerts-body">
              <section class="pf-alerts-card" aria-labelledby="pf-appearance-title">
                <h3 id="pf-appearance-title">Appearance</h3>
                <p>Choose how RIDE looks across every screen.</p>
                <div class="st-theme-grid" role="radiogroup" aria-label="Appearance">
                  <button v-for="option in appearanceOptions" :key="option.value" type="button" class="st-theme-option" :class="{ 'is-active': themeMode === option.value }" role="radio" :aria-checked="themeMode === option.value" @click="onThemeChange(option.value)">
                    <span class="st-theme-icon" aria-hidden="true"><ion-icon :icon="option.icon"></ion-icon></span>
                    <span class="st-theme-copy"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
                    <span class="st-theme-dot" aria-hidden="true"></span>
                  </button>
                </div>
              </section>
              <section class="pf-alerts-card" aria-labelledby="pf-getoff-title">
                <h3 id="pf-getoff-title">Get-off alert</h3>
                <p>Get a notification when you are close to the next stop in your itinerary.</p>
                <div class="st-setting-row">
                  <div class="st-setting-copy"><strong>Enable get-off alerts</strong><span>{{ settings.enabled ? "Alerts are on." : "Alerts are off." }}</span></div>
                  <label class="st-switch">
                    <input type="checkbox" :checked="settings.enabled" :disabled="savingAlerts || !notificationsSupported" aria-label="Enable get-off alerts" @change="onToggle" />
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
            </div>
            <div class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeAlerts">Done</button></div>
          </section>
        </div>

        <div v-if="supportModal" class="pf-modal-backdrop" @click.self="closeSupport">
          <section class="pf-tutorial-modal pf-safety-modal" role="dialog" aria-modal="true" aria-labelledby="pf-support-title" @keydown.esc="closeSupport">
            <template v-if="supportModal === 'emergency'">
              <div class="pf-tutorial-head">
                <span class="pf-tutorial-badge"><ion-icon :icon="callOutline" aria-hidden="true"></ion-icon></span>
                <div><h2 id="pf-support-title">Emergency Contacts</h2><p class="pf-modal-description">For safety during trips</p></div>
              </div>
              <div class="pf-alerts-body">
                <section class="pf-alerts-card">
                  <ul class="pf-info-list">
                    <li><strong>Emergency hotline</strong><span>Dial 911 for immediate emergency assistance (police, fire, medical) when available.</span></li>
                    <li><strong>Share trip details</strong><span>Before traveling, tell a trusted person your destination, route, and expected return time.</span></li>
                    <li><strong>Stay reachable</strong><span>Keep your phone charged and mobile data/signal available when possible during trips.</span></li>
                  </ul>
                </section>
              </div>
            </template>

            <template v-else-if="supportModal === 'help'">
              <div class="pf-tutorial-head">
                <span class="pf-tutorial-badge"><ion-icon :icon="helpCircleOutline" aria-hidden="true"></ion-icon></span>
                <div><h2 id="pf-support-title">Help &amp; Support</h2><p class="pf-modal-description">Get assistance</p></div>
              </div>
              <div class="pf-alerts-body">
                <section class="pf-alerts-card">
                  <ul class="pf-info-list">
                    <li><strong>Check the app guide</strong><span>Open “How to use RIDE” for quick steps on exploring, planning, routes, and trip tracking.</span></li>
                    <li><strong>Report an issue</strong><span>Share the page/action you were using and what happened if something is not working.</span></li>
                    <li><strong>Safety first</strong><span>For emergencies, contact official emergency services immediately.</span></li>
                  </ul>
                </section>
              </div>
            </template>

            <template v-else-if="supportModal === 'security'">
              <div class="pf-tutorial-head">
                <span class="pf-tutorial-badge"><ion-icon :icon="lockClosedOutline" aria-hidden="true"></ion-icon></span>
                <div><h2 id="pf-support-title">Security</h2><p class="pf-modal-description">Password and account protection</p></div>
              </div>
              <div class="pf-alerts-body">
                <section class="pf-alerts-card">
                  <h3>Change password</h3>
                  <template v-if="user">
                    <form class="pf-edit-form" novalidate @submit.prevent="submitSecurityPassword">
                      <label class="pf-modal-label" for="pf-current-password">Current password</label>
                      <input id="pf-current-password" v-model="securityForm.currentPassword" class="pf-name-input" :class="{ 'pf-input-error': securityErrors.currentPassword }" autocomplete="current-password" type="password" />
                      <span v-if="securityErrors.currentPassword" class="pf-field-error">{{ securityErrors.currentPassword }}</span>

                      <label class="pf-modal-label" for="pf-new-password">New password</label>
                      <div class="pf-password-wrap">
                        <input id="pf-new-password" v-model="securityForm.newPassword" class="pf-name-input" :class="{ 'pf-input-error': securityErrors.newPassword }" autocomplete="new-password" :type="securityPasswordVisible ? 'text' : 'password'" />
                        <button class="pf-password-toggle" type="button" :aria-pressed="securityPasswordVisible" @click="securityPasswordVisible = !securityPasswordVisible">{{ securityPasswordVisible ? 'Hide' : 'Show' }}</button>
                      </div>
                      <span v-if="securityErrors.newPassword" class="pf-field-error">{{ securityErrors.newPassword }}</span>

                      <label class="pf-modal-label" for="pf-confirm-password">Confirm new password</label>
                      <input id="pf-confirm-password" v-model="securityForm.confirmPassword" class="pf-name-input" :class="{ 'pf-input-error': securityErrors.confirmPassword }" autocomplete="new-password" :type="securityPasswordVisible ? 'text' : 'password'" />
                      <span v-if="securityErrors.confirmPassword" class="pf-field-error">{{ securityErrors.confirmPassword }}</span>

                      <button class="pf-edit-btn pf-edit-save pf-full-btn" type="submit" :disabled="securityBusy">{{ securityBusy ? 'Updating...' : 'Update password' }}</button>
                    </form>
                  </template>
                  <template v-else>
                    <p>Sign in to change your password. If you forgot it, request a reset link instead.</p>
                    <div class="pf-modal-actions pf-modal-actions-left">
                      <button class="pf-edit-btn pf-edit-save" type="button" @click="closeSupport(); router.push('/login')">Log in</button>
                      <button class="pf-edit-btn pf-edit-cancel" type="button" @click="closeSupport(); router.push('/forgot-password')">Forgot password</button>
                    </div>
                  </template>
                </section>
                <section class="pf-alerts-card">
                  <h3>Data on this device</h3>
                  <p>Trips, itineraries, saved places, and preferences are stored locally in this browser or app. Clear them if you share this device.</p>
                  <button class="pf-danger-btn" type="button" @click="clearLocalDataFromProfile">Clear local trips and itineraries</button>
                </section>
              </div>
              <div class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeSupport">Done</button></div>
            </template>

            <template v-else-if="supportModal === 'privacy'">
              <div class="pf-tutorial-head">
                <span class="pf-tutorial-badge"><ion-icon :icon="shieldCheckmarkOutline" aria-hidden="true"></ion-icon></span>
                <div><h2 id="pf-support-title">Privacy Policy</h2><p class="pf-modal-description">How your data is handled · Last updated: November 3, 2026</p></div>
              </div>
              <div class="pf-alerts-body">
                <section class="pf-alerts-card"><h3>What RIDE stores on your device</h3><p>Trips, itineraries, saved places, travel preferences, and your sign-in session are stored in your browser or app storage. Clearing the app's site data or using the clear option in Security removes this local data.</p></section>
                <section class="pf-alerts-card"><h3>Account data</h3><p>If you create an account, RIDE stores your name, email address, a securely hashed password, and the trips you sync. Reset tokens are stored as hashes with a 30-minute expiry. You can change your password from Security.</p></section>
                <section class="pf-alerts-card"><h3>Location</h3><p>Near Me and live tracking request your device location only when you tap the relevant button. Your coordinates are used on the device to calculate distances and map links; RIDE does not send your location to its server. Your device or browser controls location permission.</p></section>
                <section class="pf-alerts-card"><h3>Third-party services</h3><p>Weather data is requested from an external weather provider. Directions links open Google Maps. Destination photos may load from external image hosts. These providers receive standard request information such as your IP address under their own privacy policies.</p></section>
                <section class="pf-alerts-card"><h3>Email</h3><p>If you request a password reset, RIDE sends a one-time reset link to the email address on your account. The email delivery provider processes that address to deliver the message. Reset requests for unknown addresses receive the same generic response so accounts cannot be probed.</p></section>
                <section class="pf-alerts-card"><h3>Retention and choices</h3><p>Local data remains until you clear it or uninstall the app. Account data remains while your account exists. You can request correction or deletion of account data through the feedback channel provided in the app. Revoked sessions and expired reset tokens are no longer accepted.</p></section>
              </div>
              <div class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeSupport">Done</button></div>
            </template>

            <template v-else>
              <div class="pf-tutorial-head">
                <span class="pf-tutorial-badge"><ion-icon :icon="documentTextOutline" aria-hidden="true"></ion-icon></span>
                <div><h2 id="pf-support-title">Terms of Service</h2><p class="pf-modal-description">Rules for using RIDE · Last updated: November 3, 2026</p></div>
              </div>
              <div class="pf-alerts-body">
                <section class="pf-alerts-card"><h3>Using RIDE</h3><p>RIDE helps you explore Calapan City, plan itineraries, compare published fare references, and track trips you choose to start. By using the app, you agree to use it lawfully and to verify important travel details before you depart.</p></section>
                <section class="pf-alerts-card"><h3>Travel information</h3><p>Destination details, fares, schedules, weather, and map data come from public or third-party sources and may change without notice. RIDE does not operate transport services and does not guarantee fares, availability, opening hours, or travel times. Confirm details directly with the provider or local authority.</p></section>
                <section class="pf-alerts-card"><h3>Your account</h3><p>You are responsible for the accuracy of your account details and for keeping your password secure. Do not share your account. We may suspend accounts used for abuse, fraud, or attempts to disrupt the service.</p></section>
                <section class="pf-alerts-card"><h3>Your content</h3><p>Trips, itineraries, saved places, and preferences are stored on your device. If you sign in, trip data may be synced to the RIDE server so you can access it across sessions. You keep ownership of the content you create.</p></section>
                <section class="pf-alerts-card"><h3>Safety</h3><p>Live tracking is a convenience feature, not an emergency service. In an emergency, contact local emergency services. Use the app only when it is safe to do so, especially while walking, riding, or driving.</p></section>
                <section class="pf-alerts-card"><h3>Changes and contact</h3><p>We may update these terms as the app changes. Continued use after an update means you accept the revised terms. Questions about these terms can be sent through the feedback channel provided in the app.</p></section>
              </div>
              <div class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeSupport">Done</button></div>
            </template>

            <div v-if="supportModal === 'emergency' || supportModal === 'help'" class="pf-modal-actions"><button ref="modalCloseButton" class="pf-edit-btn pf-edit-save" type="button" @click="closeSupport">Done</button></div>
          </section>
        </div>

        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.pf-app { min-height: 100dvh; width: 100%; background: var(--bg); padding-bottom: calc(104px + env(safe-area-inset-bottom)); }
.pf-content { padding: 16px 16px 0; width: 100%; max-width: none; margin: 0; box-sizing: border-box; }
.pf-profile-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: var(--shadow-sm); margin-bottom: 22px; }
.pf-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%); color: var(--on-brand); display: grid; place-items: center; font-weight: 700; font-size: 16px; flex-shrink: 0; overflow: hidden; }
.pf-avatar ion-icon { font-size: 28px; }
.pf-avatar-picker { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 8px; }
.pf-avatar-option { display: grid; width: 42px; height: 42px; place-items: center; border: 1px solid var(--border); border-radius: 50%; background: var(--surface-soft); color: var(--brand-accent); font: inherit; font-size: 17px; font-weight: 700; cursor: pointer; }
.pf-avatar-option-active { border-color: var(--brand-accent); background: var(--brand); color: var(--on-brand); box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-accent) 20%, transparent); }
.pf-profile-info { flex: 1; min-width: 0; overflow: hidden; }
.pf-profile-info h2 { color: var(--text-strong); font-size: 16px; font-weight: 700; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-email { color: var(--text-secondary); font-size: 11px; margin: 2px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-name-input { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 14px; color: var(--text-strong); font-family: inherit; background: var(--surface); box-sizing: border-box; }
.pf-edit-btn { background: var(--brand-soft); color: var(--brand-accent); border: 1px solid var(--border); padding: 6px 14px; border-radius: 10px; font-weight: 600; font-size: 12px; cursor: pointer; white-space: nowrap; }
.pf-edit-cancel { background: var(--surface); }
.pf-edit-btn:disabled { cursor: not-allowed; opacity: .6; }
.pf-modal-backdrop { position: fixed; z-index: 10010; inset: 0; display: grid; place-items: center; padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom)); overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; background: rgb(31 48 35 / 38%); backdrop-filter: blur(3px); }
.pf-edit-modal, .pf-logout-modal { width: min(420px, 100%); max-height: calc(100dvh - 32px); overflow-y: auto; overscroll-behavior: contain; padding: 24px; border: 1px solid var(--surface-soft); border-radius: 20px; background: var(--surface); box-shadow: 0 22px 65px rgb(31 57 38 / 24%); }
.pf-edit-modal h2, .pf-logout-modal h2 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 22px; }
.pf-logout-modal p { margin: 8px 0 20px; color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
.pf-modal-description { margin: 6px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.pf-edit-form { display: grid; gap: 8px; margin-top: 14px; }
.pf-modal-label { color: var(--text-strong); font-size: 13px; font-weight: 600; }
.pf-modal-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.pf-modal-actions .pf-edit-btn { min-height: 40px; padding-inline: 16px; font-size: 13px; }
.pf-modal-actions-left { justify-content: flex-start; }
.pf-edit-save, .pf-logout-confirm { background: var(--brand); border-color: var(--brand-accent); color: var(--on-brand); }
.pf-full-btn { width: 100%; justify-content: center; margin-top: 4px; }
.pf-password-wrap { display: flex; gap: 8px; align-items: center; }
.pf-password-wrap .pf-name-input { flex: 1 1 auto; min-width: 0; }
.pf-password-toggle { flex: 0 0 auto; min-height: 38px; padding: 0 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--brand-accent); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.pf-input-error { border-color: color-mix(in srgb, var(--danger, #c84f4f) 55%, var(--border)); }
.pf-field-error { color: var(--danger, #c84f4f); font-size: 12px; line-height: 1.35; }
.pf-danger-btn { min-height: 44px; padding: 0 14px; border: 1px solid color-mix(in srgb, var(--danger, #c84f4f) 36%, var(--border)); border-radius: 12px; background: color-mix(in srgb, var(--danger, #c84f4f) 10%, var(--surface)); color: var(--danger, #c84f4f); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; text-align: left; }
.pf-tutorial-modal { display: flex; width: min(560px, 100%); max-height: calc(100dvh - 32px); flex-direction: column; overflow: hidden; padding: 22px; border: 1px solid var(--surface-soft); border-radius: 22px; background: linear-gradient(180deg, var(--surface), color-mix(in srgb, var(--surface-soft) 55%, var(--surface))); box-shadow: 0 22px 65px rgb(31 57 38 / 24%); }
.pf-tutorial-head { display: flex; flex: 0 0 auto; align-items: flex-start; gap: 12px; }
.pf-tutorial-badge { display: grid; width: 44px; height: 44px; flex-shrink: 0; place-items: center; border-radius: 14px; background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface)); color: var(--brand-accent); font-size: 22px; }
.pf-tutorial-head h2 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 22px; font-weight: 600; }
.pf-tutorial-steps { display: grid; gap: 10px; margin: 16px 0 0; padding: 0; list-style: none; }
.pf-tutorial-step { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border: 1px solid var(--border); border-radius: 16px; background: color-mix(in srgb, var(--surface) 92%, var(--brand-soft)); }
.pf-tutorial-num { display: inline-flex; width: 28px; height: 28px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 999px; background: var(--brand); color: var(--on-brand); font-size: 12px; font-weight: 700; }
.pf-tutorial-copy strong { display: block; color: var(--text-strong); font-size: 14px; }
.pf-tutorial-copy p { margin: 3px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
.pf-section { margin-bottom: 22px; }
.pf-section-title { color: var(--text-strong); font-size: 21px; font-weight: 600; margin: 0 0 14px; font-family: var(--font-display); }
.pf-list { display: flex; flex-direction: column; gap: 10px; }
.pf-item { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 13px; text-align: left; cursor: pointer; font: inherit; width: 100%; box-shadow: var(--shadow-xs); }
.pf-item-icon { width: 44px; height: 44px; border-radius: 13px; background: var(--brand-soft); display: flex; align-items: center; justify-content: center; color: var(--brand); font-size: 22px; flex-shrink: 0; }
.pf-item-text { flex: 1; min-width: 0; }
.pf-item-text strong { color: var(--text-strong); font-size: 14px; display: block; }
.pf-item-text span { color: var(--text-secondary); font-size: 12px; }
.pf-item ion-icon:last-child { color: var(--text-secondary); font-size: 18px; }
.pf-logout { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--brand); color: var(--on-brand); border: none; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; margin-top: 8px; }
.pf-logout-green { background: var(--brand); color: var(--on-brand); }
.pf-spacer { height: 8px; }
.pf-alerts-body { display: grid; flex: 1 1 auto; min-height: 0; gap: 12px; margin-top: 14px; overflow-y: auto; overscroll-behavior: contain; }
.pf-tutorial-steps { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.pf-alerts-card { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--border); border-radius: 16px; background: color-mix(in srgb, var(--surface) 92%, var(--brand-soft)); }
.pf-alerts-card h3 { margin: 0; color: var(--text-strong); font-size: 16px; font-family: var(--font-display); }
.pf-alerts-card p { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.45; }
.pf-info-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.pf-info-list li { display: grid; gap: 2px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
.pf-info-list strong { color: var(--text-strong); font-size: 13px; }
.pf-info-list span { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
.pf-link-btn { width: 100%; text-align: left; cursor: pointer; font: inherit; }
.st-theme-grid { display: grid; gap: 9px; }
.st-theme-option { display: flex; align-items: center; gap: 12px; width: 100%; padding: 13px 14px; border: 1px solid var(--border); border-radius: 16px; background: var(--bg); color: var(--text-body); cursor: pointer; text-align: left; }
.st-theme-option.is-active { border-color: color-mix(in srgb, var(--brand-accent) 50%, var(--border)); background: color-mix(in srgb, var(--brand-soft) 60%, var(--surface)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand-accent) 18%, transparent); }
.st-theme-icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: var(--surface); color: var(--brand-accent); font-size: 20px; }
.st-theme-option.is-active .st-theme-icon { background: var(--brand); color: var(--on-brand); }
.st-theme-copy { display: grid; gap: 1px; flex: 1 1 auto; min-width: 0; }
.st-theme-copy strong { color: var(--text-strong); font-size: 14px; font-weight: 700; }
.st-theme-copy small { color: var(--text-secondary); font-size: 12px; line-height: 1.35; }
.st-theme-dot { width: 18px; height: 18px; flex: 0 0 auto; border: 2px solid var(--border-strong); border-radius: 50%; background: var(--surface); }
.st-theme-option.is-active .st-theme-dot { border-color: var(--brand); background: radial-gradient(circle, var(--on-brand) 0 3px, var(--brand) 3.5px 100%); }
.st-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid var(--surface-soft); border-radius: 14px; background: var(--bg); }
.st-setting-copy { display: grid; gap: 2px; }
.st-setting-copy strong { color: var(--text-strong); font-size: 14px; }
.st-setting-copy span { color: var(--text-secondary); font-size: 12px; }
.st-switch { position: relative; display: inline-flex; flex: 0 0 auto; cursor: pointer; }
.st-switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.st-switch-track { display: flex; align-items: center; width: 52px; height: 30px; padding: 3px; border-radius: 999px; background: var(--border); transition: background 160ms ease; }
.st-switch-thumb { display: block; width: 24px; height: 24px; border-radius: 50%; background: var(--surface); box-shadow: 0 2px 6px color-mix(in srgb, var(--brand-deep) 0.24, transparent); transition: transform 160ms ease; }
.st-switch input:checked + .st-switch-track { background: var(--brand); }
.st-switch input:checked + .st-switch-track .st-switch-thumb { transform: translateX(22px); }
.st-field { display: grid; gap: 7px; color: var(--text-strong); font-size: 13px; font-weight: 700; }
.st-field select { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--bg); color: var(--text-strong); font: inherit; font-size: 14px; font-weight: 600; }
.st-field small { color: var(--text-secondary); font-size: 12px; font-weight: 500; line-height: 1.45; }
.st-permission { margin: 0; padding: 11px 13px; border-radius: 12px; background: var(--surface-soft); color: var(--text-body); font-size: 12px; line-height: 1.45; }
.st-permission.is-good { background: var(--brand-soft); color: var(--brand-mid); }
.st-permission.is-bad { background: var(--warning-soft); color: var(--warning); }
.st-notes { display: grid; gap: 8px; margin: 0; padding-left: 18px; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.st-links { display: grid; gap: 8px; }
.st-link { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--surface-soft); border-radius: 14px; background: var(--bg); color: inherit; text-decoration: none; }
.st-link-icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border-radius: 12px; background: var(--surface); color: var(--brand-accent); font-size: 20px; }
.st-link-copy { display: grid; gap: 1px; flex: 1 1 auto; min-width: 0; }
.st-link-copy strong { color: var(--text-strong); font-size: 14px; font-weight: 700; }
.st-link-copy small { color: var(--text-secondary); font-size: 12px; line-height: 1.35; }
.st-link > ion-icon:last-child { flex: 0 0 auto; color: var(--border-strong); font-size: 17px; }
</style>
