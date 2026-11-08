import { beforeEach, describe, expect, test } from 'vitest';
import type { CalapanWeatherConditions } from '@/data/weather';
import {
  clearWeatherNotifications,
  loadWeatherNotifications,
  markAllWeatherNotificationsRead,
  markWeatherNotificationRead,
  recordWeatherNotifications,
  WEATHER_NOTIFICATIONS_KEY,
} from '@/data/weatherNotifications';

function conditions(overrides: Partial<CalapanWeatherConditions> = {}): CalapanWeatherConditions {
  return {
    source: 'Open-Meteo',
    location: 'Calapan City',
    temperatureC: 29,
    apparentTemperatureC: 33,
    humidityPercent: 78,
    weatherCode: 2,
    windSpeedKmh: 12,
    observedAt: new Date().toISOString(),
    rainChancePercent: 35,
    precipitationMm: 0,
    ...overrides,
  };
}

describe('weather notifications', () => {
  beforeEach(() => {
    localStorage.removeItem(WEATHER_NOTIFICATIONS_KEY);
  });

  test('records a weather update and rain alert without duplicates', () => {
    const first = recordWeatherNotifications(conditions({
      weatherCode: 63,
      rainChancePercent: 80,
      precipitationMm: 2.4,
    }));

    expect(first.map((notification) => notification.event)).toEqual(
      expect.arrayContaining(['weather-update', 'rain-now']),
    );
    expect(first.every((notification) => notification.readAt === null)).toBe(true);

    const second = recordWeatherNotifications(conditions({
      weatherCode: 63,
      rainChancePercent: 80,
      precipitationMm: 2.4,
    }));

    expect(second).toHaveLength(first.length);
    expect(loadWeatherNotifications()).toHaveLength(first.length);
  });

  test('marks notifications read and clears the inbox', () => {
    const notifications = recordWeatherNotifications(conditions());
    const target = notifications[0];

    const afterRead = markWeatherNotificationRead(target.id);
    expect(afterRead.find((notification) => notification.id === target.id)?.readAt).toBeTruthy();

    const afterAllRead = markAllWeatherNotificationsRead();
    expect(afterAllRead.every((notification) => notification.readAt !== null)).toBe(true);

    expect(clearWeatherNotifications()).toEqual([]);
    expect(loadWeatherNotifications()).toEqual([]);
  });

  test('records a watch notification when live weather falls back to sample data', () => {
    const notifications = recordWeatherNotifications(conditions(), {
      demo: true,
      error: 'offline',
    });

    const demo = notifications.find((notification) => notification.event === 'weather-demo');
    expect(demo?.tone).toBe('watch');
    expect(demo?.detail).toBe('offline');
  });
});
