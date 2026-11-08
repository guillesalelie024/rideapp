import { describeWeatherCode, isRainyWeather, type CalapanWeatherConditions } from './weather';

export type WeatherNotificationTone = 'info' | 'watch' | 'alert';

export interface WeatherNotification {
  id: string;
  event: string;
  title: string;
  detail: string;
  tone: WeatherNotificationTone;
  createdAt: string;
  readAt: string | null;
}

export interface WeatherNotificationOptions {
  demo?: boolean;
  error?: string;
}

type WeatherNotificationDraft = Pick<WeatherNotification, 'event' | 'title' | 'detail' | 'tone'>;

export const WEATHER_NOTIFICATIONS_KEY = 'ride.weather-notifications';

const MAX_NOTIFICATIONS = 30;
const DEDUPE_WINDOW_MS = 4 * 60 * 60 * 1000;
const TONES = new Set<WeatherNotificationTone>(['info', 'watch', 'alert']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isWeatherNotification(value: unknown): value is WeatherNotification {
  if (!isRecord(value)) return false;
  return isText(value.id)
    && isText(value.event)
    && isText(value.title)
    && isText(value.detail)
    && typeof value.tone === 'string'
    && TONES.has(value.tone as WeatherNotificationTone)
    && isText(value.createdAt)
    && (value.readAt === null || isText(value.readAt));
}

function createDrafts(conditions: CalapanWeatherConditions, options: WeatherNotificationOptions): WeatherNotificationDraft[] {
  const temperature = Math.round(conditions.temperatureC);
  const condition = describeWeatherCode(conditions.weatherCode);
  const rainChance = Math.round(conditions.rainChancePercent);
  const drafts: WeatherNotificationDraft[] = [
    {
      event: 'weather-update',
      tone: 'info',
      title: 'Calapan weather update',
      detail: `${temperature}°C · ${condition} · ${rainChance}% chance of rain.`,
    },
  ];

  if (isRainyWeather(conditions)) {
    drafts.push({
      event: 'rain-now',
      tone: 'alert',
      title: 'Rain in Calapan right now',
      detail: 'Bring a rain jacket, protect your bags, and allow extra time for transfers.',
    });
  } else if (conditions.rainChancePercent >= 60) {
    drafts.push({
      event: 'rain-likely',
      tone: 'watch',
      title: 'Rain is likely later',
      detail: `About ${rainChance}% chance of rain. Keep an umbrella nearby before heading out.`,
    });
  } else if (conditions.rainChancePercent >= 30) {
    drafts.push({
      event: 'rain-possible',
      tone: 'info',
      title: 'A passing shower is possible',
      detail: `About ${rainChance}% chance of rain. A compact umbrella may help.`,
    });
  }

  if (conditions.windSpeedKmh >= 25) {
    drafts.push({
      event: 'strong-wind',
      tone: 'watch',
      title: 'Breezy conditions in Calapan',
      detail: 'Secure loose items and check coastal advisories before traveling by water.',
    });
  }

  if (options.demo) {
    drafts.push({
      event: 'weather-demo',
      tone: 'watch',
      title: 'Live weather is unavailable',
      detail: options.error || 'Showing sample weather data. Check again when you have a connection.',
    });
  }

  return drafts;
}

export function loadWeatherNotifications(): WeatherNotification[] {
  try {
    const raw = localStorage.getItem(WEATHER_NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isWeatherNotification)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

function saveWeatherNotifications(notifications: WeatherNotification[]): void {
  try {
    localStorage.setItem(WEATHER_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {
    return;
  }
}

export function recordWeatherNotifications(
  conditions: CalapanWeatherConditions,
  options: WeatherNotificationOptions = {},
): WeatherNotification[] {
  const now = Date.now();
  const existing = loadWeatherNotifications();
  const recentlyNotified = new Set(
    existing
      .filter((notification) => {
        const createdAt = Date.parse(notification.createdAt);
        return Number.isFinite(createdAt) && now - createdAt < DEDUPE_WINDOW_MS;
      })
      .map((notification) => notification.event),
  );

  const additions = createDrafts(conditions, options)
    .filter((draft) => !recentlyNotified.has(draft.event))
    .map((draft, index) => ({
      ...draft,
      id: `${draft.event}-${now}-${index}`,
      createdAt: new Date(now).toISOString(),
      readAt: null,
    }));

  if (!additions.length) return existing;

  const next = [...additions, ...existing].slice(0, MAX_NOTIFICATIONS);
  saveWeatherNotifications(next);
  return next;
}

export function markWeatherNotificationRead(id: string): WeatherNotification[] {
  const now = new Date().toISOString();
  const next = loadWeatherNotifications().map((notification) => (
    notification.id === id && !notification.readAt
      ? { ...notification, readAt: now }
      : notification
  ));
  saveWeatherNotifications(next);
  return next;
}

export function markAllWeatherNotificationsRead(): WeatherNotification[] {
  const now = new Date().toISOString();
  const next = loadWeatherNotifications().map((notification) => (
    notification.readAt ? notification : { ...notification, readAt: now }
  ));
  saveWeatherNotifications(next);
  return next;
}

export function clearWeatherNotifications(): WeatherNotification[] {
  saveWeatherNotifications([]);
  return [];
}
