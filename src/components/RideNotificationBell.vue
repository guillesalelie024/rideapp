<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { closeOutline, cloudOutline, notifications as notificationsIcon, rainyOutline, warningOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { getRideDestinations } from '../data/destinations';
import { getDistanceInKilometers } from '../data/calapan';
import { fetchCalapanWeather, getDemoCalapanWeather, isRainyWeather, type CalapanWeatherConditions } from '../data/weather';
import { fetchQueueReports, fetchRouteReports, type QueueReport, type RouteReport } from '../data/api';
import {
  clearWeatherNotifications,
  loadWeatherNotifications,
  markAllWeatherNotificationsRead,
  markWeatherNotificationRead,
  recordWeatherNotifications,
  WEATHER_NOTIFICATIONS_KEY,
  type WeatherNotification,
} from '../data/weatherNotifications';

withDefaults(defineProps<{
  buttonClass?: string;
  badgeClass?: string;
  panelClass?: string;
}>(), {});

const router = useRouter();
const places = getRideDestinations();
const open = ref(false);
const notifications = ref<WeatherNotification[]>(loadWeatherNotifications());
const modal = ref<WeatherNotification | null>(null);
const weather = ref<CalapanWeatherConditions | null>(null);
const routeReports = ref<RouteReport[]>([]);
const queueReports = ref<QueueReport[]>([]);
const reportsLoaded = ref(false);
let refreshInterval: number | undefined;

const MODAL_SHOWN_KEY = 'ride.weather-notification-modal-shown';
const modalShownIds = new Set<string>(JSON.parse(sessionStorage.getItem(MODAL_SHOWN_KEY) || '[]') as string[]);

function persistModalShown() {
  try { sessionStorage.setItem(MODAL_SHOWN_KEY, JSON.stringify([...modalShownIds].slice(-60))); } catch { /* ignore */ }
}

function showModalFor(notification: WeatherNotification | null | undefined) {
  if (!notification || notification.readAt || modalShownIds.has(notification.id) || modal.value) return;
  modalShownIds.add(notification.id);
  persistModalShown();
  modal.value = notification;
}

const unreadCount = computed(() => notifications.value.filter((n) => !n.readAt).length);
const isRainyNow = computed(() => (weather.value ? isRainyWeather(weather.value) : false));
const isSunnyNow = computed(() => weather.value?.weatherCode === 0 || weather.value?.weatherCode === 1);

function placeCondition(place: { latitude?: number | null; longitude?: number | null }) {
  if (!reportsLoaded.value) return { state: 'unknown' as const, label: 'Kondisyon ng ruta: sinusuri...', detail: '' };
  if (place.latitude == null || place.longitude == null) return { state: 'unknown' as const, label: 'Kondisyon ng ruta: walang data', detail: '' };
  const center = { latitude: place.latitude, longitude: place.longitude };
  const issues = routeReports.value.filter((r) => getDistanceInKilometers(r.latitude, r.longitude, center) < 5);
  const queues = queueReports.value.filter((q) => getDistanceInKilometers(q.latitude, q.longitude, center) < 5);
  if (!issues.length && !queues.length) return { state: 'good' as const, label: 'Ruta: good condition', detail: 'Walang nakatalang traffic o baha ngayon malapit dito.' };
  const labels = [
    ...issues.map((r) => ({ flood: 'baha', traffic: 'traffic', road_closure: 'road closure', transport_delay: 'transport delay', other: 'abiso' } as Record<string, string>)[r.category] || r.category),
    ...queues.map((q) => `pila (${q.queueLevel})`),
  ];
  return { state: 'alert' as const, label: 'Ruta: may abiso', detail: `May report malapit: ${[...new Set(labels)].slice(0, 3).join(', ')}.` };
}

const suggestedPlaces = computed(() => {
  const base = isRainyNow.value
    ? places.filter((p) => /Museum|Mall|Cathedral|Church|Library|Cafe|Restaurant|Market|Heritage|Religious|Center/i.test(`${p.name} ${p.category}`))
    : isSunnyNow.value
      ? places.filter((p) => /Beach|Park|Falls|Nature|View|Island|Eco|River|Trail|Garden/i.test(`${p.name} ${p.category}`))
      : [];
  return base.slice(0, 4).map((p) => ({ ...p, condition: placeCondition(p) }));
});

const suggestedRouteSummary = computed(() => {
  if (!suggestedPlaces.value.length) return null;
  if (!reportsLoaded.value) return { tone: 'unknown' as const, text: 'Sinusuri ang kondisyon ng ruta sa mga lugar na ito ngayong araw.' };
  const alertCount = suggestedPlaces.value.filter((p) => p.condition.state === 'alert').length;
  if (alertCount === 0) return { tone: 'good' as const, text: 'Good condition ang ruta papunta sa mga lugar na ito ngayong araw (base sa nakatalang reports).' };
  return { tone: 'alert' as const, text: `May abiso sa ruta para sa ${alertCount} sa mga lugar na ito ngayong araw. I-check ang detalye bago bumiyahe.` };
});

function iconFor(n: WeatherNotification) {
  if (n.event === 'strong-wind' || n.event === 'weather-demo') return warningOutline;
  if (n.event.startsWith('rain')) return rainyOutline;
  return cloudOutline;
}

function timeLabel(createdAt: string): string {
  const ts = Date.parse(createdAt);
  if (!Number.isFinite(ts)) return '';
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sync() { notifications.value = loadWeatherNotifications(); }

async function refreshRouteReports() {
  try {
    const [routes, queues] = await Promise.all([fetchRouteReports(), fetchQueueReports()]);
    routeReports.value = routes;
    queueReports.value = queues;
  } catch {
    // keep previous/empty report state
  } finally {
    reportsLoaded.value = true;
  }
}

async function refreshWeather() {
  try {
    const c = await fetchCalapanWeather();
    weather.value = c;
    const prev = new Set(notifications.value.map((n) => n.id));
    notifications.value = recordWeatherNotifications(c, { demo: false });
    const fresh = notifications.value.find((n) => !prev.has(n.id) && !n.readAt && n.event !== 'weather-update');
    showModalFor(fresh);
  } catch (e) {
    const demo = getDemoCalapanWeather();
    weather.value = demo;
    notifications.value = recordWeatherNotifications(demo, { demo: true, error: e instanceof Error ? e.message : 'Live weather unavailable' });
  }
}

function toggle() { open.value = !open.value; if (open.value) sync(); }
function close() { open.value = false; }
function openModal(n: WeatherNotification) { modal.value = n; open.value = false; if (!n.readAt) notifications.value = markWeatherNotificationRead(n.id); }
function dismissModal() {
  const current = modal.value;
  modal.value = null;
  if (current && !current.readAt) notifications.value = markWeatherNotificationRead(current.id);
}
function markAll() { notifications.value = markAllWeatherNotificationsRead(); modal.value = null; }
function clearAll() { notifications.value = clearWeatherNotifications(); modal.value = null; }
function openWeather() { open.value = false; modal.value = null; void router.push({ name: 'Weather' }); }
function onStorage(e: StorageEvent) { if (e.key === WEATHER_NOTIFICATIONS_KEY) sync(); }

onMounted(() => {
  sync();
  void refreshWeather();
  void refreshRouteReports();
  refreshInterval = window.setInterval(() => { void refreshWeather(); void refreshRouteReports(); }, 15 * 60 * 1000);
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', sync);
});
onUnmounted(() => {
  if (refreshInterval) window.clearInterval(refreshInterval);
  window.removeEventListener('storage', onStorage);
  window.removeEventListener('focus', sync);
});
watch(open, (v) => { if (v) sync(); });
</script>

<template>
  <div class="ride-notif-bell">
    <button
      type="button"
      :class="[
        'ride-notif-trigger',
        buttonClass || 'ride-notif-btn',
        { 'has-unread': unreadCount > 0, 'is-open': open, 'is-idle': unreadCount === 0 }
      ]"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <ion-icon class="ride-notif-glyph" :icon="notificationsIcon" aria-hidden="true"></ion-icon>
      <span v-if="unreadCount" :class="['ride-notif-badge-base', badgeClass || 'ride-notif-badge']" aria-hidden="true">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <button v-if="open" class="ride-notif-backdrop" type="button" aria-label="Close notifications" @click="close"></button>

    <section v-if="open" :class="['ride-notif-panel', panelClass]" aria-label="Weather notifications">
      <header class="ride-notif-head">
        <div><p>Weather</p><h2>Notifications</h2></div>
        <button v-if="unreadCount" class="ride-notif-readall" type="button" @click="markAll">Mark all read</button>
      </header>
      <div v-if="notifications.length" class="ride-notif-list">
        <button v-for="n in notifications" :key="n.id" type="button" class="ride-notif-item" :class="{ unread: !n.readAt }" @click="openModal(n)">
          <span class="ride-notif-icon" :class="`tone-${n.tone}`" aria-hidden="true"><ion-icon :icon="iconFor(n)"></ion-icon></span>
          <span class="ride-notif-copy"><strong>{{ n.title }}</strong><span>{{ n.detail }}</span><time :datetime="n.createdAt">{{ timeLabel(n.createdAt) }}</time></span>
          <span v-if="!n.readAt" class="ride-notif-dot" aria-hidden="true"></span>
        </button>
      </div>
      <p v-else class="ride-notif-empty">Weather notifications will appear here after RIDE checks the forecast.</p>
      <footer class="ride-notif-foot">
        <button type="button" @click="openWeather">Open Weather</button>
        <button v-if="notifications.length" class="ride-notif-clear" type="button" @click="clearAll">Clear all</button>
      </footer>
    </section>

    <div v-if="modal" class="ride-notif-modal" role="dialog" aria-modal="true" aria-label="Weather notification" @click.self="dismissModal">
      <section class="ride-notif-modal-card" :class="`tone-${modal.tone}`">
        <header class="ride-notif-modal-head">
          <span class="ride-notif-modal-icon" :class="`tone-${modal.tone}`" aria-hidden="true"><ion-icon :icon="iconFor(modal)"></ion-icon></span>
          <button class="ride-notif-modal-close" type="button" aria-label="Close notification" @click="dismissModal"><ion-icon :icon="closeOutline" aria-hidden="true"></ion-icon></button>
        </header>
        <h3>{{ modal.title }}</h3>
        <p class="ride-notif-modal-detail">{{ modal.detail }}</p>
        <p v-if="isRainyNow" class="ride-notif-modal-reminder">Magdala ng payong at planuhin ang biyahe nang ligtas.</p>
        <p v-else-if="isSunnyNow" class="ride-notif-modal-reminder">Magandang panahon para lumabas. Magdala ng tubig at sun protection.</p>
        <p v-if="suggestedRouteSummary" class="ride-notif-modal-route" :class="`tone-${suggestedRouteSummary.tone}`">{{ suggestedRouteSummary.text }}</p>
        <div v-if="suggestedPlaces.length" class="ride-notif-modal-suggest">
          <strong>{{ isRainyNow ? 'Mga lugar na pwedeng puntahan (indoor):' : 'Mga lugar na pwedeng puntahan:' }}</strong>
          <ul class="ride-notif-place-list">
            <li v-for="s in suggestedPlaces" :key="s.id" class="ride-notif-place-row">
              <span class="ride-notif-place-name">{{ s.name }}</span>
              <span class="ride-notif-place-cond" :class="`state-${s.condition.state}`">{{ s.condition.label }}</span>
              <small v-if="s.condition.detail" class="ride-notif-place-detail">{{ s.condition.detail }}</small>
            </li>
          </ul>
        </div>
        <div class="ride-notif-modal-actions">
          <button type="button" class="ride-notif-modal-primary" @click="openWeather">Open Weather</button>
          <button type="button" class="ride-notif-modal-secondary" @click="dismissModal">Dismiss</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.ride-notif-bell { position: relative; display: inline-flex; }
.ride-notif-trigger { position: relative; overflow: visible; }
.ride-notif-glyph, .ride-notif-trigger ion-icon, .ride-notif-btn ion-icon { font-size: inherit; width: 1em; height: 1em; display: block; flex: 0 0 auto; margin: 0 auto; }
.ride-notif-btn {
  display: inline-flex; width: 48px; min-width: 48px; height: 48px; align-items: center; justify-content: center;
  padding: 0 !important; line-height: 0;
  border: 1px solid var(--border); border-radius: 50%; background: var(--surface); box-shadow: var(--shadow-xs);
  color: var(--brand-accent); font-size: 24px; cursor: pointer;
  transition: background var(--transition-fast, 160ms ease), border-color var(--transition-fast, 160ms ease), color var(--transition-fast, 160ms ease), transform var(--transition-fast, 160ms ease);
}
.ride-notif-trigger, .ride-notif-btn, :deep(.ride-notif-btn), :deep(.ride-app-notification-btn), :deep(.home-bell) {
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  padding: 0 !important; line-height: 0 !important; box-sizing: border-box;
}
.ride-notif-btn:hover { border-color: var(--border-strong); background: var(--brand-soft-2); }
.ride-notif-trigger,
:deep(.ride-app-notification-btn),
:deep(.home-bell) {
  border: 1px solid var(--border) !important;
  border-radius: 50% !important;
  background: var(--surface, #fff) !important;
  box-shadow: var(--shadow-xs) !important;
  color: var(--brand-accent, #4F7A57) !important;
}
.ride-notif-trigger:hover,
:deep(.ride-app-notification-btn:hover),
:deep(.home-bell:hover) {
  border-color: var(--border-strong) !important;
  background: var(--brand-soft-2, #F0F3E8) !important;
}
.ride-notif-trigger .ride-notif-glyph,
.ride-notif-trigger ion-icon,
:deep(.ride-app-notification-btn .ride-notif-glyph),
:deep(.home-bell .ride-notif-glyph) { color: var(--brand-accent, #4F7A57) !important; }
.ride-notif-badge-base, .ride-notif-badge {
  position: absolute; top: -3px; right: -2px; min-width: 18px; height: 18px; padding: 0 4px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
  background: var(--danger, #d64545); color: #fff; font-size: 10px; font-weight: 700; line-height: 1;
  box-shadow: 0 0 0 2px var(--surface); z-index: 2; pointer-events: none;
}
.ride-notif-backdrop { position: fixed; inset: 0; border: 0; background: rgba(0,0,0,.02); z-index: 1000; cursor: default; }
.ride-notif-panel {
  position: absolute; top: calc(100% + 10px); right: 0; display: flex; width: min(360px, calc(100vw - 24px));
  max-height: min(70vh, 480px); flex-direction: column; overflow: hidden; border: 1px solid var(--border);
  border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-lg); z-index: 1001;
}
.ride-notif-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid var(--border); }
.ride-notif-head p { margin: 0 0 2px; color: var(--brand-accent); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.ride-notif-head h2 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 20px; font-weight: 600; }
.ride-notif-readall { padding: 6px 4px; border: 0; background: transparent; color: var(--brand-accent); font-size: 11px; font-weight: 700; cursor: pointer; }
.ride-notif-list { overflow-y: auto; }
.ride-notif-item { position: relative; display: flex; width: 100%; align-items: flex-start; gap: 12px; padding: 13px 16px; border: 0; border-bottom: 1px solid var(--border); background: var(--surface); text-align: left; cursor: pointer; }
.ride-notif-item:last-child { border-bottom: 0; }
.ride-notif-item.unread { background: color-mix(in srgb, var(--brand-soft) 45%, var(--surface)); }
.ride-notif-icon { display: grid; width: 36px; height: 36px; flex-shrink: 0; place-items: center; border-radius: 12px; background: var(--surface-soft); color: var(--brand-accent); font-size: 18px; }
.ride-notif-icon.tone-watch { background: var(--warning-soft, color-mix(in srgb, #f59e0b 14%, var(--surface-soft))); color: var(--warning, #b45309); }
.ride-notif-icon.tone-alert { background: var(--danger-soft, color-mix(in srgb, #d64545 14%, var(--surface-soft))); color: var(--danger, #b91c1c); }
.ride-notif-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 2px; }
.ride-notif-copy strong { color: var(--text-strong); font-size: 13px; font-weight: 700; }
.ride-notif-copy span { color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
.ride-notif-copy time { color: var(--text-muted); font-size: 10px; font-weight: 600; }
.ride-notif-dot { width: 8px; height: 8px; flex-shrink: 0; margin-top: 5px; border-radius: 50%; background: var(--brand-accent); }
.ride-notif-empty { margin: 0; padding: 22px 18px; color: var(--text-secondary); font-size: 13px; line-height: 1.5; text-align: center; }
.ride-notif-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-top: 1px solid var(--border); background: var(--surface-soft); }
.ride-notif-foot button { padding: 8px 6px; border: 0; background: transparent; color: var(--brand-accent); font-size: 12px; font-weight: 700; cursor: pointer; }
.ride-notif-clear { color: var(--text-secondary) !important; font-weight: 600 !important; }
.ride-notif-modal { position: fixed; inset: 0; display: grid; place-items: center; padding: 20px; background: color-mix(in srgb, var(--bg, #0b1410) 42%, transparent); backdrop-filter: blur(6px); z-index: 1010; }
.ride-notif-modal-card { width: min(380px, 100%); padding: 18px 18px 16px; border: 1px solid var(--border); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-lg); }
.ride-notif-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ride-notif-modal-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 14px; background: var(--surface-muted); color: var(--brand-accent); font-size: 22px; }
.ride-notif-modal-icon.tone-alert { background: color-mix(in srgb, #d97706 14%, var(--surface-muted)); color: #b45309; }
.ride-notif-modal-icon.tone-watch { background: color-mix(in srgb, var(--brand-accent) 12%, var(--surface-muted)); }
.ride-notif-modal-close { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid var(--border); border-radius: 50%; background: var(--surface-soft); color: var(--text-secondary); font-size: 18px; cursor: pointer; }
.ride-notif-modal-card h3 { margin: 0 0 6px; color: var(--text-strong); font-family: var(--font-display); font-size: 20px; font-weight: 600; line-height: 1.2; }
.ride-notif-modal-detail { margin: 0 0 10px; color: var(--text-secondary); font-size: 13.5px; line-height: 1.5; }
.ride-notif-modal-reminder { margin: 0 0 12px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--brand-accent) 18%, var(--border)); border-radius: 14px; background: color-mix(in srgb, var(--brand-accent) 8%, var(--surface-soft)); color: var(--text-strong); font-size: 13px; font-weight: 600; line-height: 1.4; }
.ride-notif-modal-route { margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-soft); color: var(--text-strong); font-size: 12.5px; font-weight: 600; line-height: 1.4; }
.ride-notif-modal-route.tone-good { border-color: color-mix(in srgb, #16a34a 28%, var(--border)); background: color-mix(in srgb, #16a34a 10%, var(--surface-soft)); }
.ride-notif-modal-route.tone-alert { border-color: color-mix(in srgb, var(--danger, #d64545) 28%, var(--border)); background: color-mix(in srgb, var(--danger, #d64545) 9%, var(--surface-soft)); }
.ride-notif-modal-route.tone-unknown { color: var(--text-secondary); }
.ride-notif-modal-suggest { margin: 0 0 14px; color: var(--text-secondary); font-size: 12.5px; line-height: 1.45; }
.ride-notif-modal-suggest strong { display: block; margin-bottom: 6px; color: var(--text-strong); }
.ride-notif-modal-suggest ul { margin: 0; padding-left: 18px; }
.ride-notif-place-list { list-style: none; padding: 0 !important; display: grid; gap: 8px; }
.ride-notif-place-row { display: grid; gap: 1px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-soft); }
.ride-notif-place-name { color: var(--text-strong); font-weight: 600; }
.ride-notif-place-cond { font-size: 11px; font-weight: 700; }
.ride-notif-place-cond.state-good { color: #15803d; }
.ride-notif-place-cond.state-alert { color: var(--danger, #b91c1c); }
.ride-notif-place-cond.state-unknown { color: var(--text-secondary); }
.ride-notif-place-detail { color: var(--text-secondary); font-size: 11px; line-height: 1.35; }
.ride-notif-modal-actions { display: flex; gap: 10px; }
.ride-notif-modal-primary, .ride-notif-modal-secondary { flex: 1; min-height: 42px; border-radius: 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
.ride-notif-modal-primary { border: 0; background: var(--brand-accent); color: var(--on-brand, #fff); }
.ride-notif-modal-secondary { border: 1px solid var(--border); background: var(--surface-soft); color: var(--text-primary); }

@media (max-width: 560px) {
  .ride-notif-btn { width: 40px; min-width: 40px; height: 40px; font-size: 20px; }
  .ride-notif-panel { position: fixed; top: calc(env(safe-area-inset-top) + 62px); left: 50% !important; right: auto !important; width: min(360px, calc(100vw - 24px)) !important; max-width: calc(100vw - 24px); max-height: min(62vh, 420px); border-radius: 18px; transform: translateX(-50%) !important; }
  .ride-notif-head { padding: 12px 13px 10px; gap: 8px; }
  .ride-notif-head h2 { font-size: 17px; }
  .ride-notif-item { gap: 10px; padding: 10px 13px; }
  .ride-notif-icon { width: 32px; height: 32px; border-radius: 10px; font-size: 16px; }
  .ride-notif-copy strong { font-size: 12.5px; }
  .ride-notif-copy span { font-size: 11.5px; }
  .ride-notif-empty { padding: 16px 14px; font-size: 12.5px; }
  .ride-notif-foot { padding: 8px 10px; }
  .ride-notif-modal { padding: 12px; align-items: end; }
  .ride-notif-modal-card { width: 100%; max-height: 78vh; overflow-y: auto; padding: 14px; border-radius: 18px; }
  .ride-notif-modal-card h3 { font-size: 17px; }
  .ride-notif-modal-detail, .ride-notif-modal-reminder, .ride-notif-modal-route, .ride-notif-modal-suggest { font-size: 12.5px; }
}
</style>
