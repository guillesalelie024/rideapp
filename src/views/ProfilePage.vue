<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { IonContent, IonIcon, IonPage, onIonViewWillEnter } from '@ionic/vue';
import {
  bookmarkOutline,
  busOutline,
  calendarOutline,
  carOutline,
  chevronForwardOutline,
  heartOutline,
  helpCircleOutline,
  lockClosedOutline,
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
  starOutline,
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import RideBottomNav from '../components/RideBottomNav.vue';
import RideAppHeader from '../components/RideAppHeader.vue';
import { clearRideSession, getRideSession, signOut, updateRideProfile, updateStoredRideUser, type RideUser } from '../data/api';
import { clearLocalTripData, loadTrips, type TripRecord } from '../data/trips';
import { loadTravelPreferences, PREFERRED_TRANSPORTATION, TRAVEL_INTERESTS, createEmptyTravelPreferences, type TravelPreferences } from '../data/profile';
import { showError, showSuccess } from '../composables/feedback';

const router = useRouter();
const trips = ref<TripRecord[]>([]);
const preferences = ref<TravelPreferences>(createEmptyTravelPreferences());
const user = ref<RideUser | null>(getRideSession()?.user ?? null);
const editing = ref(false);
const nameDraft = ref('');
const emailDraft = ref('');
const saving = ref(false);
const showLogoutConfirmation = ref(false);
const loggingOut = ref(false);
const logoutCancelButton = ref<HTMLButtonElement | null>(null);

function loadData() {
  try {
    trips.value = loadTrips();
  } catch {
    trips.value = [];
  }
  try {
    preferences.value = loadTravelPreferences();
  } catch {
    preferences.value = createEmptyTravelPreferences();
  }
}
loadData();
onIonViewWillEnter(() => {
  loadData();
  user.value = getRideSession()?.user ?? null;
});

const transportationSummary = computed(() => {
  const labels = PREFERRED_TRANSPORTATION
    .filter((option) => preferences.value.transportation.includes(option.id))
    .map((option) => option.label);
  return labels.length ? labels.join(', ') : 'Not set';
});

const interestsSummary = computed(() => {
  const labels = TRAVEL_INTERESTS
    .filter((option) => preferences.value.interests.includes(option.id))
    .map((option) => option.label);
  return labels.length ? labels.join(', ') : 'Not set';
});

const avatarInitials = computed(() => (user.value?.name ?? 'GU')
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toLocaleUpperCase())
  .join(''));

function startEdit() {
  if (!user.value) {
    router.push('/login');
    return;
  }
  nameDraft.value = user.value.name;
  emailDraft.value = user.value.email;
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  nameDraft.value = '';
  emailDraft.value = '';
}

async function saveEdit() {
  if (!user.value) return;
  const name = nameDraft.value.trim();
  const email = emailDraft.value.trim();
  if (!name) {
    showError('Name is required.');
    return;
  }
  if (!email) {
    showError('Email is required.');
    return;
  }
  saving.value = true;
  try {
    const res = await updateRideProfile(name, email);
    user.value = res.user;
    try { updateStoredRideUser(res.user); } catch { /* Keep the updated profile in memory if storage is unavailable. */ }
    editing.value = false;
    showSuccess('Profile updated.');
  } catch (e: any) {
    showError(e?.message || 'Could not update profile.');
  } finally {
    saving.value = false;
  }
}

async function requestLogOut() {
  if (!user.value) return;
  showLogoutConfirmation.value = true;
  await nextTick();
  logoutCancelButton.value?.focus();
}

function cancelLogOut() {
  if (!loggingOut.value) showLogoutConfirmation.value = false;
}

async function logOut() {
  if (!user.value || loggingOut.value) return;
  loggingOut.value = true;
  try {
    await signOut();
  } catch { /* Continue logging out locally if the server is unavailable. */ }
  try {
    clearRideSession();
  } catch { /* The local session may already be cleared. */ }
  try {
    clearLocalTripData();
  } catch { /* Trip storage may already be empty or unavailable. */ }
  trips.value = [];
  user.value = null;
  showLogoutConfirmation.value = false;
  showSuccess('Logged out.');
  router.replace('/');
  loggingOut.value = false;
}
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="pf-app">
        <RideAppHeader eyebrow="Profile" title="My Account" show-back />

        <div class="pf-content">
          <section class="pf-profile-card">
            <div class="pf-avatar">{{ avatarInitials }}</div>
            <div class="pf-profile-info">
              <h2>{{ user?.name || 'Guest User' }}</h2>
              <p class="pf-email">{{ user?.email || (user ? '' : 'Sign in to sync trips') }}</p>
            </div>
            <button class="pf-edit-btn" type="button" @click="startEdit">{{ user ? 'Edit' : 'Sign In' }}</button>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Travel Preferences</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/settings')">
                <div class="pf-item-icon"><ion-icon :icon="notificationsOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Trip Alerts</strong>
                  <span>Get-off notification and distance</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push('/preferences')">
                <div class="pf-item-icon"><ion-icon :icon="carOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Preferred Mode of Travel</strong>
                  <span>{{ transportationSummary }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push('/preferences')">
                <div class="pf-item-icon"><ion-icon :icon="heartOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Interests</strong>
                  <span>{{ interestsSummary }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">My Trips</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/trips')">
                <div class="pf-item-icon"><ion-icon :icon="calendarOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Upcoming &amp; Past Trips</strong>
                  <span>{{ trips.length }} trip{{ trips.length === 1 ? '' : 's' }}</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push('/itinerary')">
                <div class="pf-item-icon"><ion-icon :icon="busOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>My Itinerary</strong>
                  <span>Saved itineraries</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Saved Places</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/saved')">
                <div class="pf-item-icon"><ion-icon :icon="bookmarkOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Favorites</strong>
                  <span>Destinations to revisit</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Travel Activity</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/trips')">
                <div class="pf-item-icon"><ion-icon :icon="starOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Reviews &amp; Ratings</strong>
                  <span>Leave feedback after trips</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <section class="pf-section">
            <h2 class="pf-section-title">Account &amp; Safety</h2>
            <div class="pf-list">
              <button class="pf-item" type="button" @click="router.push('/emergency-contacts')">
                <div class="pf-item-icon"><ion-icon :icon="lockClosedOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Emergency Contacts</strong>
                  <span>For safety during trips</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push(user ? '/security' : '/privacy')">
                <div class="pf-item-icon"><ion-icon :icon="shieldCheckmarkOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Privacy &amp; Security</strong>
                  <span>Manage data and password</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
              <button class="pf-item" type="button" @click="router.push('/about')">
                <div class="pf-item-icon"><ion-icon :icon="helpCircleOutline"></ion-icon></div>
                <div class="pf-item-text">
                  <strong>Help &amp; Support</strong>
                  <span>Get assistance</span>
                </div>
                <ion-icon :icon="chevronForwardOutline"></ion-icon>
              </button>
            </div>
          </section>

          <button v-if="user" class="pf-logout" type="button" @click="requestLogOut">
            <ion-icon :icon="logOutOutline"></ion-icon>
            <span>Log Out</span>
          </button>
          <button v-else class="pf-logout pf-logout-green" type="button" @click="router.push('/login')">
            <ion-icon :icon="personCircleOutline"></ion-icon>
            <span>Sign In</span>
          </button>

          <div class="pf-spacer"></div>
        </div>

        <div v-if="showLogoutConfirmation" class="pf-modal-backdrop" @click.self="cancelLogOut">
          <section
            class="pf-logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="pf-logout-title"
            aria-describedby="pf-logout-description"
            @keydown.esc="cancelLogOut"
          >
            <h2 id="pf-logout-title">Log out?</h2>
            <p id="pf-logout-description">Are you sure you want to log out?</p>
            <div class="pf-modal-actions">
              <button
                ref="logoutCancelButton"
                class="pf-edit-btn pf-edit-cancel"
                type="button"
                :disabled="loggingOut"
                @click="cancelLogOut"
              >
                Cancel
              </button>
              <button
                class="pf-edit-btn pf-logout-confirm"
                type="button"
                :disabled="loggingOut"
                @click="logOut"
              >
                {{ loggingOut ? 'Logging out...' : 'Log Out' }}
              </button>
            </div>
          </section>
        </div>

        <div v-if="editing" class="pf-modal-backdrop" @click.self="cancelEdit">
          <section
            class="pf-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pf-edit-title"
            @keydown.esc="cancelEdit"
          >
            <h2 id="pf-edit-title">Edit Profile</h2>
            <p class="pf-modal-description">Update your name and email address.</p>
            <form class="pf-edit-form" @submit.prevent="saveEdit">
              <label class="pf-modal-label" for="pf-name">Full name</label>
              <input
                id="pf-name"
                v-model="nameDraft"
                class="pf-name-input"
                placeholder="Full name"
                maxlength="100"
                autocomplete="name"
                autofocus
              />
              <label class="pf-modal-label" for="pf-email">Email address</label>
              <input
                id="pf-email"
                v-model="emailDraft"
                class="pf-name-input"
                type="email"
                placeholder="name@gmail.com"
                maxlength="254"
                autocomplete="email"
                required
              />
              <div class="pf-modal-actions">
                <button class="pf-edit-btn pf-edit-cancel" type="button" :disabled="saving" @click="cancelEdit">Cancel</button>
                <button class="pf-edit-btn pf-edit-save" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
              </div>
            </form>
          </section>
        </div>

        <RideBottomNav active="profile" />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.pf-app { min-height: 100vh; background: #ffffff; padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
.pf-header { background: linear-gradient(135deg, #E8F4EC 0%, #F2F8F3 100%); padding: calc(env(safe-area-inset-top) + 12px) 16px 22px 16px; border-bottom-left-radius: 26px; border-bottom-right-radius: 26px; }
.pf-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.pf-brand :deep(.brand) { gap: 10px; align-items: center; }
.pf-brand :deep(.brand-mark) { width: 38px; height: 44px; }
.pf-brand :deep(.brand-wordmark) { width: 76px; }
.pf-actions { display: flex; align-items: center; gap: 8px; }
.pf-action-btn { width: 42px; height: 42px; border-radius: 14px; background: white; border: 1px solid #DCE9DF; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 22px; cursor: pointer; box-shadow: 0 2px 6px rgba(63, 128, 100, 0.06); }
.pf-header-greet { display: flex; flex-direction: column; gap: 4px; }
.pf-greet-line { color: #3F8064; font-weight: 600; margin: 0; font-size: 14px; }
.pf-greet-title { color: #174C40; font-size: 24px; font-weight: 700; margin: 0; font-family: 'Poppins', sans-serif; line-height: 1.15; }
.pf-content { padding: 16px; max-width: 100%; }
.pf-profile-card { background: white; border: 1px solid #DCE9DF; border-radius: 16px; padding: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(63, 128, 100, 0.04); margin-bottom: 18px; }
.pf-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #3F8064 0%, #2d5f4a 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.pf-profile-info { flex: 1; min-width: 0; overflow: hidden; }
.pf-profile-info h2 { color: #174C40; font-size: 16px; font-weight: 700; margin: 0; font-family: 'Poppins', sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-email { color: #658078; font-size: 11px; margin: 2px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-name-input { width: 100%; border: 1px solid #DCE9DF; border-radius: 10px; padding: 10px 12px; font-size: 14px; color: #174C40; font-family: inherit; }
.pf-edit-btn { background: #E8F4EC; color: #3F8064; border: 1px solid #DCE9DF; padding: 6px 14px; border-radius: 10px; font-weight: 600; font-size: 12px; cursor: pointer; white-space: nowrap; }
.pf-edit-cancel { background: white; }
.pf-edit-btn:disabled { cursor: not-allowed; opacity: .6; }
.pf-modal-backdrop { position: fixed; z-index: 10010; inset: 0; display: grid; place-items: center; padding: 16px; background: rgb(31 48 35 / 38%); backdrop-filter: blur(3px); }
.pf-edit-modal { width: min(420px, 100%); padding: 24px; border: 1px solid #e3eee6; border-radius: 20px; background: #fff; box-shadow: 0 22px 65px rgb(31 57 38 / 24%); }
.pf-edit-modal h2 { margin: 0; color: #174C40; font-family: 'Poppins', sans-serif; font-size: 20px; }
.pf-logout-modal { width: min(420px, 100%); padding: 24px; border: 1px solid #e3eee6; border-radius: 20px; background: #fff; box-shadow: 0 22px 65px rgb(31 57 38 / 24%); }
.pf-logout-modal h2 { margin: 0; color: #174C40; font-family: 'Poppins', sans-serif; font-size: 20px; }
.pf-logout-modal p { margin: 8px 0 20px; color: #658078; font-size: 14px; line-height: 1.5; }
.pf-modal-description { margin: 6px 0 20px; color: #658078; font-size: 13px; line-height: 1.5; }
.pf-edit-form { display: grid; gap: 8px; }
.pf-modal-label { color: #174C40; font-size: 13px; font-weight: 600; }
.pf-edit-form .pf-email { margin: 0; }
.pf-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.pf-modal-actions .pf-edit-btn { min-height: 40px; padding-inline: 16px; font-size: 13px; }
.pf-edit-save { background: #3F8064; border-color: #3F8064; color: #fff; }
.pf-logout-confirm { background: #3F8064; border-color: #3F8064; color: #fff; }
.pf-section { margin-bottom: 18px; }
.pf-section-title { color: #174C40; font-size: 17px; font-weight: 700; margin: 0 0 12px 0; font-family: 'Poppins', sans-serif; }
.pf-list { display: flex; flex-direction: column; gap: 8px; }
.pf-item { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #DCE9DF; border-radius: 14px; padding: 12px; text-align: left; cursor: pointer; font: inherit; width: 100%; }
.pf-item-icon { width: 42px; height: 42px; border-radius: 12px; background: #F2F8F3; display: flex; align-items: center; justify-content: center; color: #3F8064; font-size: 22px; flex-shrink: 0; }
.pf-item-text { flex: 1; min-width: 0; }
.pf-item-text strong { color: #174C40; font-size: 14px; display: block; }
.pf-item-text span { color: #658078; font-size: 12px; }
.pf-item ion-icon:last-child { color: #658078; font-size: 18px; }
.pf-logout { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #3F8064; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; margin-top: 8px; }
.pf-logout-green { background: #3F8064; color: white; }
.pf-spacer { height: 8px; }
@media (min-width: 480px) { .pf-content { padding-left: 18px; padding-right: 18px; } .pf-header { padding-left: 18px; padding-right: 18px; } }
</style>
