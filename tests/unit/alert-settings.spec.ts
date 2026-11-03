import { afterEach, describe, expect, test } from 'vitest';
import {
  ALERT_SETTINGS_KEY,
  createDefaultAlertSettings,
  loadAlertSettings,
  saveAlertSettings,
} from '@/data/alertSettings';

afterEach(() => {
  localStorage.clear();
});

describe('get-off alert settings', () => {
  test('uses safe defaults when nothing has been saved', () => {
    expect(loadAlertSettings()).toEqual(createDefaultAlertSettings());
  });

  test('saves and reloads the enabled state and distance', () => {
    saveAlertSettings({ enabled: true, distance: 1000 });

    expect(loadAlertSettings()).toEqual({ enabled: true, distance: 1000 });
  });

  test('falls back to defaults when saved settings are malformed', () => {
    localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify({ enabled: 'yes', distance: 999 }));

    expect(loadAlertSettings()).toEqual(createDefaultAlertSettings());
  });

  test('rejects unsupported distances before saving', () => {
    expect(() => saveAlertSettings({ enabled: true, distance: 400 as never })).toThrow();
  });
});
