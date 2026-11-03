import { normalizeDestinationId, RIDE_DESTINATIONS } from './destinations';
import { isExploreListingId } from './exploreListings';
import type { CuratedItineraryStop, Itinerary } from './itinerary';
import { deleteAccountTrip, getRideSession, saveAccountTrip } from './api';

export const TRIPS_STORAGE_KEY = 'ride.trip-records';
const PENDING_TRIP_SYNC_KEY = 'ride.pending-trip-sync';
export const DRAFT_TRIP_ID_KEY = 'ride.draft-trip-id';
export const SAVED_TRIP_ID_KEY = 'ride.saved-trip-id';
export type TripStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface TripRecord {
  id: string;
  status: TripStatus;
  itinerary: Itinerary;
  selectedRoute?: { mode: string; fromId: string; toId: string; fareReference: string; travelTime: string };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  visitedStopIds: string[];
  actualExpenses?: Record<string, number>;
  receiptSaved: boolean;
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `ride-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validTrip(value: unknown): TripRecord | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<TripRecord>;
  if (typeof item.id !== 'string' || !['upcoming', 'ongoing', 'completed', 'cancelled'].includes(item.status ?? '')
    || !item.itinerary || !Array.isArray(item.itinerary.stopIds)) return null;
  const allowedIds = new Set(RIDE_DESTINATIONS.map((place) => place.id));
  const curatedStopsRaw = item.itinerary.curatedStops && typeof item.itinerary.curatedStops === 'object'
    ? item.itinerary.curatedStops as Record<string, unknown>
    : {};
  const curatedStops: Record<string, CuratedItineraryStop> = {};
  for (const [id, value] of Object.entries(curatedStopsRaw)) {
    if (!isExploreListingId(id) || !value || typeof value !== 'object' || Array.isArray(value)) continue;
    const stop = value as Record<string, unknown>;
    if (typeof stop.name !== 'string' || typeof stop.category !== 'string') continue;
    curatedStops[id] = {
      name: stop.name.slice(0, 200),
      category: stop.category.slice(0, 100),
      ...(typeof stop.note === 'string' ? { note: stop.note.slice(0, 200) } : {}),
    };
  }
  const normalizedStopIds = item.itinerary.stopIds.map((id) => typeof id === 'string' ? normalizeDestinationId(id) : id);
  const stopIds = [...new Set(normalizedStopIds.filter((id): id is string => typeof id === 'string'
    && (allowedIds.has(id) || isExploreListingId(id) && Boolean(curatedStops[id]))))];
  if (stopIds.length !== normalizedStopIds.length) return null;
  const itinerary: Itinerary = {
    stopIds,
    ...(Object.keys(curatedStops).length ? { curatedStops } : {}),
    tripName: typeof item.itinerary.tripName === 'string' ? item.itinerary.tripName.slice(0, 100) : 'Calapan City Day Trip',
    travelDate: typeof item.itinerary.travelDate === 'string' ? item.itinerary.travelDate : '',
    travelerCount: Number.isInteger(item.itinerary.travelerCount) && item.itinerary.travelerCount >= 1 ? item.itinerary.travelerCount : 1,
    arrivalTimes: item.itinerary.arrivalTimes ?? {},
    estimatedCosts: item.itinerary.estimatedCosts ?? {},
    budget: item.itinerary.budget ?? {},
    stopNotes: item.itinerary.stopNotes ?? {},
  };
  const route = item.selectedRoute && typeof item.selectedRoute === 'object'
    && typeof item.selectedRoute.mode === 'string' && typeof item.selectedRoute.fromId === 'string'
    && typeof item.selectedRoute.toId === 'string' && typeof item.selectedRoute.fareReference === 'string'
    && typeof item.selectedRoute.travelTime === 'string'
    ? {
        ...item.selectedRoute,
        fromId: normalizeDestinationId(item.selectedRoute.fromId),
        toId: normalizeDestinationId(item.selectedRoute.toId),
      } : undefined;
  return {
    id: item.id,
    status: item.status as TripStatus,
    itinerary,
    ...(route ? { selectedRoute: route } : {}),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    ...(typeof item.startedAt === 'string' ? { startedAt: item.startedAt } : {}),
    ...(typeof item.completedAt === 'string' ? { completedAt: item.completedAt } : {}),
    ...(typeof item.durationMs === 'number' && Number.isFinite(item.durationMs) && item.durationMs >= 0 ? { durationMs: item.durationMs } : {}),
    visitedStopIds: Array.isArray(item.visitedStopIds)
      ? [...new Set(item.visitedStopIds
          .filter((id): id is string => typeof id === 'string')
          .map((id) => normalizeDestinationId(id))
          .filter((id) => stopIds.includes(id)))]
      : [],
    actualExpenses: item.actualExpenses && typeof item.actualExpenses === 'object' ? item.actualExpenses : undefined,
    receiptSaved: item.receiptSaved === true,
  };
}

function loadPendingTripSync(): TripRecord[] {
  const session = getRideSession();
  if (!session) return [];
  const raw = localStorage.getItem(`${PENDING_TRIP_SYNC_KEY}.${session.user.id}`);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Pending trip sync data has an invalid format.');
  return parsed.map(validTrip).filter((trip): trip is TripRecord => trip !== null);
}

function savePendingTripSync(records: TripRecord[]) {
  const session = getRideSession();
  if (!session) throw new Error('Sign in to sync trips to your account.');
  localStorage.setItem(`${PENDING_TRIP_SYNC_KEY}.${session.user.id}`, JSON.stringify(records));
}

function notifyTripSyncError(message: string) {
  window.dispatchEvent(new CustomEvent('ride:trip-sync-error'));
  window.dispatchEvent(new CustomEvent('ride:feedback', {
    detail: {
      tone: 'error',
      title: 'Trip sync failed',
      message,
    },
  }));
}

function addPendingTripSync(record: TripRecord) {
  const pending = loadPendingTripSync().filter((trip) => trip.id !== record.id);
  savePendingTripSync([record, ...pending]);
}

function clearPendingTripSyncIfCurrent(id: string, updatedAt: string) {
  const pending = loadPendingTripSync();
  const current = pending.find((trip) => trip.id === id);
  if (!current || current.updatedAt !== updatedAt) return;
  savePendingTripSync(pending.filter((trip) => trip.id !== id));
}

const accountSaveQueues = new Map<string, Promise<void>>();

function persistTripToAccount(record: TripRecord) {
  try {
    addPendingTripSync(record);
  } catch {
    notifyTripSyncError('This trip is saved on your device, but its sync could not be queued. Check your device storage and try again.');
    return;
  }

  const previous = accountSaveQueues.get(record.id) ?? Promise.resolve();
  const save = previous.catch(() => undefined).then(async () => {
    try {
      await saveAccountTrip(record);
      clearPendingTripSyncIfCurrent(record.id, record.updatedAt);
      window.dispatchEvent(new CustomEvent('ride:trip-sync-updated'));
    } catch {
      const latest = getTrip(record.id) ?? record;
      try {
        addPendingTripSync(latest);
      } catch {
        notifyTripSyncError('This trip is saved on your device, but its sync could not be queued. Check your device storage and try again.');
        return;
      }
      notifyTripSyncError('Your trip is saved on this device, but could not be synced to your account. Open Trips and retry when you are online.');
    }
  });
  accountSaveQueues.set(record.id, save);
  void save.finally(() => {
    if (accountSaveQueues.get(record.id) === save) accountSaveQueues.delete(record.id);
  });
}

export function getPendingTripSyncCount(): number {
  return loadPendingTripSync().length;
}

export function queueTripsForSync(records: TripRecord[]) {
  for (const record of records) addPendingTripSync(record);
  window.dispatchEvent(new CustomEvent('ride:trip-sync-updated'));
}

export function clearPendingTripSync() {
  const session = getRideSession();
  if (!session) return;
  localStorage.removeItem(`${PENDING_TRIP_SYNC_KEY}.${session.user.id}`);
  window.dispatchEvent(new CustomEvent('ride:trip-sync-updated'));
}

export async function retryPendingTripSync(): Promise<void> {
  if (!getRideSession()) throw new Error('Sign in to sync trips to your account.');
  const pending = loadPendingTripSync();
  if (!pending.length) return;
  let firstError: Error | null = null;
  for (const queuedTrip of pending) {
    const latest = getTrip(queuedTrip.id) ?? queuedTrip;
    try {
      await saveAccountTrip(latest);
      clearPendingTripSyncIfCurrent(latest.id, queuedTrip.updatedAt);
      if (latest.updatedAt !== queuedTrip.updatedAt) {
        clearPendingTripSyncIfCurrent(latest.id, latest.updatedAt);
      }
    } catch (error) {
      if (!firstError) firstError = error instanceof Error ? error : new Error('A trip could not be synced.');
    }
  }
  window.dispatchEvent(new CustomEvent('ride:trip-sync-updated'));
  if (firstError) throw firstError;
}

export function loadTrips(): TripRecord[] {
  const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saved trips have an invalid format.');
  return parsed.map(validTrip).filter((trip): trip is TripRecord => trip !== null);
}

export function getTrip(id: string): TripRecord | null {
  return loadTrips().find((trip) => trip.id === id) ?? null;
}

export function putTrip(record: TripRecord, persistAccount = true): TripRecord {
  const trips = loadTrips();
  const validated = validTrip(record);
  if (!validated) throw new Error('Trip record is invalid.');
  const index = trips.findIndex((trip) => trip.id === validated.id);
  if (index >= 0) trips[index] = validated;
  else trips.unshift(validated);
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  if (persistAccount && getRideSession()) persistTripToAccount(validated);
  return validated;
}

export function replaceTrips(records: TripRecord[]): TripRecord[] {
  const valid = records.map(validTrip).filter((trip): trip is TripRecord => trip !== null);
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(valid));
  return valid;
}

export async function deleteTripRecord(id: string): Promise<void> {
  if (!getTrip(id)) throw new Error('Trip not found.');
  await accountSaveQueues.get(id);
  await deleteAccountTrip(id);

  const remainingTrips = loadTrips().filter((trip) => trip.id !== id);
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(remainingTrips));

  if (getRideSession()) {
    savePendingTripSync(loadPendingTripSync().filter((trip) => trip.id !== id));
  }
  window.dispatchEvent(new CustomEvent('ride:trip-sync-updated'));
}

export function clearLocalTripData() {
  [TRIPS_STORAGE_KEY, DRAFT_TRIP_ID_KEY, SAVED_TRIP_ID_KEY, 'ride.itinerary-draft', 'ride.itinerary-draft.route', 'ride.saved-itinerary', 'ride.saved-itinerary.route']
    .forEach((key) => localStorage.removeItem(key));
}

export function saveUpcomingTrip(
  itinerary: Itinerary,
  selectedRoute?: TripRecord['selectedRoute'],
  preferredId?: string,
): TripRecord {
  const currentId = preferredId || localStorage.getItem(DRAFT_TRIP_ID_KEY) || newId();
  const existing = getTrip(currentId);
  const now = new Date().toISOString();
  const record: TripRecord = {
    id: currentId,
    status: existing?.status ?? 'upcoming',
    itinerary: JSON.parse(JSON.stringify(itinerary)) as Itinerary,
    ...(selectedRoute ?? existing?.selectedRoute ? { selectedRoute: selectedRoute ?? existing?.selectedRoute } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(existing?.startedAt ? { startedAt: existing.startedAt } : {}),
    ...(existing?.completedAt ? { completedAt: existing.completedAt } : {}),
    ...(existing?.durationMs !== undefined ? { durationMs: existing.durationMs } : {}),
    visitedStopIds: existing?.visitedStopIds ?? [],
    ...(existing?.actualExpenses ? { actualExpenses: existing.actualExpenses } : {}),
    receiptSaved: existing?.receiptSaved ?? false,
  };
  localStorage.setItem(DRAFT_TRIP_ID_KEY, currentId);
  return putTrip(record);
}

export function saveSavedTrip(itinerary: Itinerary, selectedRoute?: TripRecord['selectedRoute'], preferredId?: string): TripRecord {
  const currentId = preferredId || localStorage.getItem(DRAFT_TRIP_ID_KEY) || localStorage.getItem(SAVED_TRIP_ID_KEY) || newId();
  const existing = getTrip(currentId);
  const now = new Date().toISOString();
  const record: TripRecord = {
    id: currentId,
    status: existing?.status ?? 'upcoming',
    itinerary: JSON.parse(JSON.stringify(itinerary)) as Itinerary,
    ...(selectedRoute ?? existing?.selectedRoute ? { selectedRoute: selectedRoute ?? existing?.selectedRoute } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(existing?.startedAt ? { startedAt: existing.startedAt } : {}),
    ...(existing?.completedAt ? { completedAt: existing.completedAt } : {}),
    ...(existing?.durationMs !== undefined ? { durationMs: existing.durationMs } : {}),
    visitedStopIds: existing?.visitedStopIds ?? [],
    ...(existing?.actualExpenses ? { actualExpenses: existing.actualExpenses } : {}),
    receiptSaved: existing?.receiptSaved ?? false,
  };
  localStorage.setItem(SAVED_TRIP_ID_KEY, currentId);
  return putTrip(record);
}

export function duplicateTripAsUpcoming(trip: TripRecord): TripRecord {
  const now = new Date().toISOString();
  return putTrip({
    id: newId(),
    status: 'upcoming',
    itinerary: JSON.parse(JSON.stringify(trip.itinerary)) as Itinerary,
    ...(trip.selectedRoute ? { selectedRoute: { ...trip.selectedRoute } } : {}),
    createdAt: now,
    updatedAt: now,
    visitedStopIds: [],
    receiptSaved: false,
  });
}

export function updateTrip(id: string, update: (trip: TripRecord) => TripRecord, persistAccount = true): TripRecord {
  const current = getTrip(id);
  if (!current) throw new Error('Trip not found.');
  return putTrip({ ...update(current), updatedAt: new Date().toISOString() }, persistAccount);
}
