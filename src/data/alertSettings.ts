export const ALERT_SETTINGS_KEY = 'ride.alert-settings';

export const ALERT_DISTANCE_OPTIONS = [
  { value: 100, label: '100 m' },
  { value: 250, label: '250 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
] as const;

export type AlertDistance = typeof ALERT_DISTANCE_OPTIONS[number]['value'];

export interface AlertSettings {
  enabled: boolean;
  distance: AlertDistance;
}

const alertDistances = new Set<number>(ALERT_DISTANCE_OPTIONS.map(({ value }) => value));

export function isAlertDistance(value: unknown): value is AlertDistance {
  return typeof value === 'number' && alertDistances.has(value);
}

export function createDefaultAlertSettings(): AlertSettings {
  return { enabled: false, distance: 500 };
}

export function loadAlertSettings(): AlertSettings {
  try {
    const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
    if (!raw) return createDefaultAlertSettings();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null
      || !('enabled' in parsed) || typeof parsed.enabled !== 'boolean'
      || !('distance' in parsed) || !isAlertDistance(parsed.distance)) {
      return createDefaultAlertSettings();
    }
    return { enabled: parsed.enabled, distance: parsed.distance };
  } catch {
    return createDefaultAlertSettings();
  }
}

export function saveAlertSettings(settings: AlertSettings): void {
  if (typeof settings.enabled !== 'boolean' || !isAlertDistance(settings.distance)) {
    throw new Error('Alert settings contain an unsupported option.');
  }
  localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify({
    enabled: settings.enabled,
    distance: settings.distance,
    updatedAt: new Date().toISOString(),
  }));
}
