import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CurrentLocationError,
  detectCurrentLocation,
  loadCachedCurrentLocation,
} from '@/data/currentLocation';

function stubGeolocation(getCurrentPosition: (success: (position: unknown) => void, error: (positionError: unknown) => void) => void) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
}

function reverseGeocodeBody() {
  return {
    city: 'Calapan',
    locality: 'Calapan',
    principalSubdivision: 'Mimaropa (Region IV-B)',
    countryName: 'Philippines',
    localityInfo: {
      administrative: [
        { name: 'Philippines', adminLevel: 2 },
        { name: 'Mimaropa (Region IV-B)', adminLevel: 3 },
        { name: 'Mindoro Oriental', adminLevel: 4 },
        { name: 'Calapan', adminLevel: 6 },
      ],
    },
  };
}

describe('current location', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'geolocation');
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  test('resolves a street and barangay from device coordinates and caches it', async () => {
    const getCurrentPosition = vi.fn((success: (position: unknown) => void) => {
      success({ coords: { latitude: 13.4148, longitude: 121.1803, accuracy: 18 } });
    });
    stubGeolocation(getCurrentPosition);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [{
          properties: {
            street: 'Del Pilar Street',
            locality: 'San Vicente East',
            district: 'Bonbon',
            city: 'Calapan',
            state: 'Oriental Mindoro',
            country: 'Philippines',
          },
        }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const location = await detectCurrentLocation(true);

    expect(location.label).toBe('Del Pilar Street, San Vicente East, Calapan, Oriental Mindoro');
    expect(location.latitude).toBe(13.4148);
    expect(location.longitude).toBe(121.1803);
    expect(location.accuracyMeters).toBe(18);
    expect(loadCachedCurrentLocation()?.label).toBe('Del Pilar Street, San Vicente East, Calapan, Oriental Mindoro');

    await detectCurrentLocation();
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('falls back to the city lookup when the street lookup is unavailable', async () => {
    stubGeolocation((success) => {
      success({ coords: { latitude: 13.4148, longitude: 121.1803, accuracy: 25 } });
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => reverseGeocodeBody() });
    vi.stubGlobal('fetch', fetchMock);

    const location = await detectCurrentLocation(true);

    expect(location.label).toBe('Calapan, Mindoro Oriental, Philippines');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('falls back to the local area name when reverse geocoding fails', async () => {
    stubGeolocation((success) => {
      success({ coords: { latitude: 13.4148, longitude: 121.1803, accuracy: 25 } });
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const location = await detectCurrentLocation(true);

    expect(location.label).toBe('Calapan City, Oriental Mindoro');
  });

  test('reports denied permission explicitly', async () => {
    stubGeolocation((_success, error) => {
      error({ code: 1 });
    });

    await expect(detectCurrentLocation(true)).rejects.toBeInstanceOf(CurrentLocationError);
    await expect(detectCurrentLocation(true)).rejects.toMatchObject({ code: 'denied' });
  });
});
