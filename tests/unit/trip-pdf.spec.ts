import { afterEach, describe, expect, test, vi } from 'vitest';
import { getRideDestinations } from '@/data/destinations';
import type { TripRecord } from '@/data/trips';
import { createTripPdf, downloadTripPdf, tripPdfFilename } from '@/lib/tripPdf';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function completedTrip(overrides: Partial<TripRecord> = {}): TripRecord {
  return {
    id: 'abc12345-rest',
    status: 'completed',
    itinerary: {
      stopIds: [],
      tripName: 'Calapan City Day Trip!',
      travelDate: '2026-10-31',
      travelerCount: 1,
      arrivalTimes: {},
      estimatedCosts: {},
      budget: {},
    },
    createdAt: '2026-10-31T08:00:00.000Z',
    updatedAt: '2026-10-31T10:00:00.000Z',
    visitedStopIds: [],
    receiptSaved: false,
    ...overrides,
  };
}

describe('trip PDF filename', () => {
  test('creates a safe filename from the trip name and travel date', () => {
    expect(tripPdfFilename(completedTrip())).toBe('ride-calapan-city-day-trip-2026-10-31.pdf');
  });

  test('falls back to the completion date when no travel date is set', () => {
    const trip = completedTrip({
      itinerary: { ...completedTrip().itinerary, tripName: '', travelDate: '' },
      completedAt: '2026-11-01T09:30:00.000Z',
    });

    expect(tripPdfFilename(trip)).toBe('ride-completed-trip-2026-11-01.pdf');
  });

  test('builds a readable PDF receipt', async () => {
    const trip = completedTrip({
      itinerary: {
        ...completedTrip().itinerary,
        stopIds: ['calapan-cathedral'],
      },
      visitedStopIds: ['calapan-cathedral'],
      actualExpenses: { transportation: 150, food: 200 },
      durationMs: 65 * 60000,
      selectedRoute: {
        mode: 'tricycle',
        fromId: 'calapan-city-plaza',
        toId: 'calapan-cathedral',
        fareReference: 'PHP 50',
        travelTime: '15 min',
      },
    });

    const { doc, filename } = await createTripPdf(trip, new Date('2026-10-31T12:00:00.000Z'));
    const output = doc.output('arraybuffer');

    expect(filename).toBe('ride-calapan-city-day-trip-2026-10-31.pdf');
    expect(output.byteLength).toBeGreaterThan(2000);
  });

  test('paginates long itineraries and keeps the receipt readable', async () => {
    const stopIds = getRideDestinations().slice(0, 24).map((place) => place.id);
    const trip = completedTrip({
      itinerary: {
        ...completedTrip().itinerary,
        tripName: 'A Longer Calapan and Oriental Mindoro Itinerary',
        stopIds,
      },
      visitedStopIds: stopIds,
    });

    const { doc } = await createTripPdf(trip, new Date('2026-10-31T12:00:00.000Z'));

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(5000);
  });

  test('opens the generated PDF in the pre-opened fallback tab', async () => {
    const createObjectURL = vi.fn(() => 'blob:ride-trip-pdf');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const previewWindow = { location: { href: '' } };

    await downloadTripPdf(
      completedTrip(),
      new Date('2026-10-31T12:00:00.000Z'),
      previewWindow,
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(previewWindow.location.href).toBe('blob:ride-trip-pdf');
  });
});
