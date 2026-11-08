import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { isInsideCalapan } from './calapan';

export type CurrentLocationErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  label: string;
  updatedAt: number;
}

export class CurrentLocationError extends Error {
  readonly code: CurrentLocationErrorCode;

  constructor(code: CurrentLocationErrorCode, message: string) {
    super(message);
    this.name = 'CurrentLocationError';
    this.code = code;
  }
}

type Coordinates = Pick<CurrentLocation, 'latitude' | 'longitude' | 'accuracyMeters'>;

const CACHE_KEY = 'ride.current-location';
const CACHE_TTL_MS = 5 * 60 * 1000;
const POSITION_TIMEOUT_MS = 15000;
const REVERSE_GEOCODE_TIMEOUT_MS = 6000;
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const CITY_REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCurrentLocation(value: unknown): value is CurrentLocation {
  return isRecord(value)
    && isFiniteNumber(value.latitude)
    && isFiniteNumber(value.longitude)
    && (value.accuracyMeters === null || isFiniteNumber(value.accuracyMeters))
    && isText(value.label)
    && isFiniteNumber(value.updatedAt);
}

function browserPositionError(error: GeolocationPositionError): CurrentLocationError {
  if (error.code === 1) return new CurrentLocationError('denied', 'Location permission was denied.');
  if (error.code === 3) return new CurrentLocationError('timeout', 'Location request timed out.');
  return new CurrentLocationError('unavailable', 'Your location could not be determined.');
}

function nativePositionError(error: unknown): CurrentLocationError {
  const details = isRecord(error) ? error : {};
  const code = details.code;
  const message = typeof details.message === 'string' ? details.message : '';
  if (code === 'OS-PLUG-GLOC-0003' || /denied/i.test(message)) {
    return new CurrentLocationError('denied', 'Location permission was denied.');
  }
  if (/timeout|timed out/i.test(message)) {
    return new CurrentLocationError('timeout', 'Location request timed out.');
  }
  return new CurrentLocationError('unavailable', 'Your location could not be determined.');
}

function getBrowserCoordinates(): Promise<Coordinates> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.reject(new CurrentLocationError('unsupported', 'Location is not available on this device.'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
      }),
      (error) => reject(browserPositionError(error)),
      { enableHighAccuracy: true, timeout: POSITION_TIMEOUT_MS, maximumAge: 60000 },
    );
  });
}

async function getCurrentCoordinates(): Promise<Coordinates> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Geolocation')) {
    try {
      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions({ permissions: ['location'] });
      }
      if (permission.location !== 'granted') {
        throw new CurrentLocationError('denied', 'Location permission was denied.');
      }
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: POSITION_TIMEOUT_MS,
        maximumAge: 60000,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
      };
    } catch (error) {
      if (error instanceof CurrentLocationError) throw error;
      throw nativePositionError(error);
    }
  }
  return getBrowserCoordinates();
}

function getProvinceName(body: Record<string, unknown>): string {
  const localityInfo = body.localityInfo;
  if (!isRecord(localityInfo) || !Array.isArray(localityInfo.administrative)) return '';
  const province = localityInfo.administrative.find((entry) => isRecord(entry) && entry.adminLevel === 4);
  return isRecord(province) && isText(province.name) ? province.name : '';
}

function readProperty(properties: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = properties[key];
    if (isText(value)) return value.trim();
  }
  return '';
}

function joinLabel(parts: Array<string | undefined>): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique.join(', ');
}

function formatCoordinates(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(longitude).toFixed(4)}° ${lonDirection}`;
}

function fallbackLabel(latitude: number, longitude: number): string {
  return isInsideCalapan(latitude, longitude)
    ? 'Calapan City, Oriental Mindoro'
    : formatCoordinates(latitude, longitude);
}

async function reverseGeocodeWithPhoton(latitude: number, longitude: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);
  try {
    const url = `${PHOTON_REVERSE_URL}?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&lang=en&limit=1`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return '';
    const body: unknown = await response.json().catch(() => null);
    if (!isRecord(body) || !Array.isArray(body.features)) return '';
    const first = body.features[0];
    if (!isRecord(first) || !isRecord(first.properties)) return '';
    const properties = first.properties;
    const street = readProperty(properties, 'street');
    const houseNumber = readProperty(properties, 'housenumber', 'house_number', 'houseNumber');
    const streetLine = [houseNumber, street].filter(Boolean).join(' ');
    const locality = readProperty(properties, 'locality');
    const district = readProperty(properties, 'district');
    const city = readProperty(properties, 'city');
    const state = readProperty(properties, 'state');
    const country = readProperty(properties, 'country');
    const parts = [streetLine, locality || district, city, state];
    if (country && country.toLowerCase() !== 'philippines') parts.push(country);
    return joinLabel(parts);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocodeCity(latitude: number, longitude: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);
  try {
    const url = `${CITY_REVERSE_URL}?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) return '';
    const body: unknown = await response.json().catch(() => null);
    if (!isRecord(body)) return '';
    const city = isText(body.city) ? body.city : isText(body.locality) ? body.locality : '';
    const province = getProvinceName(body);
    const country = isText(body.countryName) ? body.countryName : '';
    return joinLabel([city, province, country]);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const precise = await reverseGeocodeWithPhoton(latitude, longitude);
  if (precise) return precise;
  return reverseGeocodeCity(latitude, longitude);
}

export function loadCachedCurrentLocation(): CurrentLocation | null {
  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isCurrentLocation(parsed)) return null;
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedCurrentLocation(location: CurrentLocation): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(location));
  } catch {
    return;
  }
}

export async function detectCurrentLocation(force = false): Promise<CurrentLocation> {
  if (!force) {
    const cached = loadCachedCurrentLocation();
    if (cached) return cached;
  }
  const coordinates = await getCurrentCoordinates();
  const resolvedLabel = await reverseGeocode(coordinates.latitude, coordinates.longitude);
  const location: CurrentLocation = {
    ...coordinates,
    label: resolvedLabel || fallbackLabel(coordinates.latitude, coordinates.longitude),
    updatedAt: Date.now(),
  };
  saveCachedCurrentLocation(location);
  return location;
}
