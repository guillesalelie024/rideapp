import { afterEach, describe, expect, test, vi } from 'vitest';
import { deleteTripRecord, duplicateTripAsUpcoming, getPendingTripSyncCount, loadTrips, retryPendingTripSync, saveSavedTrip, updateTrip } from '@/data/trips';
import { storeRideSession } from '@/data/api';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('trip account sync', () => {
  test('keeps failed account saves queued and retries them', async () => {
    let responseStatus = 500;
    const fetch = vi.fn(async () => ({
      ok: responseStatus === 200,
      status: responseStatus,
      json: async () => ({ error: 'Offline' }),
    }));
    vi.stubGlobal('fetch', fetch);
    storeRideSession({
      token: 'test-token',
      expiresAt: '',
      user: { id: 'user-1', name: 'Test Rider', email: 'rider@example.com' },
    });

    saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });

    await vi.waitFor(() => expect(getPendingTripSyncCount()).toBe(1));
    responseStatus = 200;
    await retryPendingTripSync();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(getPendingTripSyncCount()).toBe(0);
  });
});

describe('trip cancellation', () => {
  test('keeps cancelled trips in saved trip records', () => {
    const trip = saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });

    updateTrip(trip.id, (record) => ({ ...record, status: 'cancelled' }));

    expect(loadTrips()).toHaveLength(1);
    expect(loadTrips()[0].status).toBe('cancelled');
  });

  test('starts a completed trip again as a fresh upcoming trip', () => {
    const trip = saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });
    const completed = updateTrip(trip.id, (record) => ({
      ...record,
      status: 'completed',
      visitedStopIds: ['calapan-cathedral'],
      receiptSaved: true,
    }));

    const restarted = duplicateTripAsUpcoming(completed);

    expect(restarted.id).not.toBe(completed.id);
    expect(restarted.status).toBe('upcoming');
    expect(restarted.itinerary).toEqual(completed.itinerary);
    expect(restarted.visitedStopIds).toEqual([]);
    expect(restarted.receiptSaved).toBe(false);
    expect(loadTrips()).toHaveLength(2);
  });
});

describe('trip deletion', () => {
  test('removes a trip from local storage', async () => {
    const trip = saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });

    await deleteTripRecord(trip.id);

    expect(loadTrips()).toEqual([]);
  });

  test('deletes the account copy before removing the local trip', async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 204, json: async () => null }));
    vi.stubGlobal('fetch', fetch);
    storeRideSession({
      token: 'test-token',
      expiresAt: '',
      user: { id: 'user-1', name: 'Test Rider', email: 'rider@example.com' },
    });
    const trip = saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    fetch.mockClear();

    await deleteTripRecord(trip.id);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain(`/trips/${trip.id}`);
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'DELETE' });
    expect(loadTrips()).toEqual([]);
  });

  test('keeps the local trip when account deletion fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Offline' }),
    })));
    storeRideSession({
      token: 'test-token',
      expiresAt: '',
      user: { id: 'user-1', name: 'Test Rider', email: 'rider@example.com' },
    });
    const trip = saveSavedTrip({
      stopIds: ['calapan-cathedral'],
      travelDate: '',
      tripName: 'City day',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    });
    await vi.waitFor(() => expect(getPendingTripSyncCount()).toBe(1));

    await expect(deleteTripRecord(trip.id)).rejects.toThrow('Offline');

    expect(loadTrips()).toHaveLength(1);
  });
});
