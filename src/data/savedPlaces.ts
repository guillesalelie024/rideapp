import { getRideDestination, getRideDestinations, type RideDestination } from './destinations';
import { getExploreListingId, getExploreListingLocation, getExploreCategoryListings } from './exploreListings';
import { getRideSession, fetchSavedPlaces, saveSavedPlace, removeSavedPlace, createSavedCollection, renameSavedCollection, deleteSavedCollection, addPlaceToSavedCollection, removePlaceFromSavedCollection, type SavedCollectionRecord, type SavedPlacesPayload } from './api';

export type { SavedCollectionRecord };

export const SAVED_IDS_KEY = 'ride.saved-destination-ids';
export const CURATED_FAVORITES_KEY = 'ride.saved-curated-destinations';
export const SAVED_COLLECTIONS_KEY = 'ride.saved-collections';
export const SAVED_COLLECTION_PLACES_KEY = 'ride.saved-collection-places';
export const SAVED_META_KEY = 'ride.saved-place-meta';
export const SAVED_PLACES_UPDATED_EVENT = 'ride:saved-places-updated';

export interface CuratedSavedPlace { name: string; category: string; note: string; savedAt?: string }
export interface SavedPlaceView {
  id: string;
  kind: 'destination' | 'curated';
  name: string;
  category: string;
  address: string;
  note: string;
  image?: string;
  imageFallback?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  savedAt: string;
  destination?: RideDestination;
}

type SavedMeta = Record<string, { savedAt?: string }>;

function nowIso() { return new Date().toISOString(); }
function notify() { window.dispatchEvent(new CustomEvent(SAVED_PLACES_UPDATED_EVENT)); }

const pendingRemoteWrites = new Set<Promise<unknown>>();
function trackRemoteWrite(promise: Promise<unknown>) {
  pendingRemoteWrites.add(promise);
  void promise.then(() => pendingRemoteWrites.delete(promise), () => pendingRemoteWrites.delete(promise));
}

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }

export function loadSavedIds(): string[] {
  const parsed = readJson<unknown>(SAVED_IDS_KEY, []);
  return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0))] : [];
}
export function saveSavedIds(ids: string[]) { writeJson(SAVED_IDS_KEY, [...new Set(ids)]); }

export function loadCuratedFavorites(): Record<string, CuratedSavedPlace> {
  const parsed = readJson<unknown>(CURATED_FAVORITES_KEY, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const result: Record<string, CuratedSavedPlace> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string' && typeof v.category === 'string') {
      result[id] = { name: v.name, category: v.category, note: typeof v.note === 'string' ? v.note : '', ...(typeof v.savedAt === 'string' ? { savedAt: v.savedAt } : {}) };
    }
  }
  return result;
}
export function saveCuratedFavorites(map: Record<string, CuratedSavedPlace>) { writeJson(CURATED_FAVORITES_KEY, map); }

export function loadSavedMeta(): SavedMeta {
  const parsed = readJson<unknown>(SAVED_META_KEY, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as SavedMeta : {};
}
function touchSavedMeta(id: string) {
  const meta = loadSavedMeta();
  if (!meta[id]?.savedAt) meta[id] = { savedAt: nowIso() };
  writeJson(SAVED_META_KEY, meta);
}
function removeSavedMeta(id: string) { const meta = loadSavedMeta(); delete meta[id]; writeJson(SAVED_META_KEY, meta); }

export function loadCollections(): SavedCollectionRecord[] {
  const parsed = readJson<unknown>(SAVED_COLLECTIONS_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is SavedCollectionRecord => !!v && typeof v === 'object' && typeof (v as any).id === 'string' && typeof (v as any).name === 'string')
    .map((c) => ({ id: c.id, name: c.name, count: Number((c as any).count || 0), coverPlaceId: (c as any).coverPlaceId ?? null, createdAt: c.createdAt, updatedAt: c.updatedAt }));
}
export function saveCollections(list: SavedCollectionRecord[]) { writeJson(SAVED_COLLECTIONS_KEY, list); }

export function loadCollectionPlaces(): Record<string, string[]> {
  const parsed = readJson<unknown>(SAVED_COLLECTION_PLACES_KEY, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const result: Record<string, string[]> = {};
  for (const [id, ids] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(ids)) result[id] = [...new Set(ids.filter((v): v is string => typeof v === 'string'))];
  }
  return result;
}
export function saveCollectionPlaces(map: Record<string, string[]>) { writeJson(SAVED_COLLECTION_PLACES_KEY, map); }

let exploreImageIndex: Map<string, string> | null = null;
function getExploreImage(name: string, category: string): string | undefined {
  if (!exploreImageIndex) {
    exploreImageIndex = new Map();
    for (const [cat, listings] of Object.entries(getExploreCategoryListings())) {
      for (const listing of listings) {
        if (listing.image) exploreImageIndex.set(getExploreListingId(listing.name, cat), listing.image);
      }
    }
  }
  return exploreImageIndex.get(getExploreListingId(name, category));
}

export function buildSavedPlaceView(id: string): SavedPlaceView | null {
  const destination = getRideDestination(id);
  const curated = loadCuratedFavorites()[id];
  const meta = loadSavedMeta()[id];
  if (destination) {
    return {
      id, kind: 'destination', name: destination.name, category: destination.category,
      address: destination.address, note: destination.description || '',
      image: destination.image || destination.imageFallback, imageFallback: destination.imageFallback || destination.image,
      latitude: destination.latitude, longitude: destination.longitude,
      rating: typeof (destination as any).rating === 'number' ? (destination as any).rating : undefined,
      reviewCount: typeof (destination as any).reviewCount === 'number' ? (destination as any).reviewCount : undefined,
      savedAt: meta?.savedAt ?? nowIso(), destination,
    };
  }
  if (curated) {
    const matched = getRideDestinations().find((d) => getExploreListingId(curated.name, curated.category) === d.id || d.name.toLowerCase() === curated.name.toLowerCase());
    if (matched) return buildSavedPlaceView(matched.id);
    const location = getExploreListingLocation({ name: curated.name, category: curated.category, note: curated.note } as any, curated.category);
    const image = getExploreImage(curated.name, curated.category);
    return { id, kind: 'curated', name: curated.name, category: curated.category, address: location.value, note: curated.note, ...(image ? { image, imageFallback: image } : {}), savedAt: curated.savedAt ?? meta?.savedAt ?? nowIso() };
  }
  const fallbackDestination = getRideDestinations().find((d) => d.id === id);
  if (fallbackDestination) return buildSavedPlaceView(fallbackDestination.id);
  return null;
}

export function getAllSavedViews(): SavedPlaceView[] {
  return loadSavedIds().map(buildSavedPlaceView).filter((v): v is SavedPlaceView => !!v);
}

export function isPlaceSaved(id: string): boolean { return loadSavedIds().includes(id); }

export function toggleSavedPlace(id: string, curated?: CuratedSavedPlace): { saved: boolean } {
  const ids = loadSavedIds();
  const saved = ids.includes(id);
  if (saved) {
    saveSavedIds(ids.filter((x) => x !== id));
    const curatedMap = loadCuratedFavorites(); delete curatedMap[id]; saveCuratedFavorites(curatedMap);
    removeSavedMeta(id);
    const cp = loadCollectionPlaces(); for (const cid of Object.keys(cp)) cp[cid] = cp[cid].filter((x) => x !== id); saveCollectionPlaces(cp);
    if (getRideSession()) trackRemoteWrite(removeSavedPlace(id).catch(() => {}));
    notify(); return { saved: false };
  }
  saveSavedIds([...ids, id]); touchSavedMeta(id);
  if (curated) { const curatedMap = loadCuratedFavorites(); curatedMap[id] = { ...curated, savedAt: curatedMap[id]?.savedAt ?? nowIso() }; saveCuratedFavorites(curatedMap); }
  if (getRideSession()) trackRemoteWrite(saveSavedPlace(id, curated ? { kind: 'curated', name: curated.name, category: curated.category, note: curated.note } : { kind: 'destination' }).catch(() => {}));
  notify(); return { saved: true };
}

export async function createCollection(name: string): Promise<SavedCollectionRecord> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error('Enter a collection name.');
  if (getRideSession()) {
    try {
      const created = await createSavedCollection(clean);
      const list = loadCollections().filter((c) => c.id !== created.id); list.unshift(created); saveCollections(list); notify(); return created;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (!/404|not found|failed to fetch|network/i.test(msg)) throw e;
      // API not available or server not updated; fall back to local so the user isn't blocked.
    }
  }
  const local: SavedCollectionRecord = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: clean, count: 0, coverPlaceId: null, createdAt: nowIso(), updatedAt: nowIso() };
  saveCollections([local, ...loadCollections()]); notify(); return local;
}

export async function updateCollectionName(id: string, name: string): Promise<void> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error('Enter a collection name.');
  if (getRideSession()) await renameSavedCollection(id, clean).catch(() => {});
  saveCollections(loadCollections().map((c) => c.id === id ? { ...c, name: clean, updatedAt: nowIso() } : c)); notify();
}

export async function removeCollection(id: string): Promise<void> {
  if (getRideSession()) await deleteSavedCollection(id).catch(() => {});
  saveCollections(loadCollections().filter((c) => c.id !== id));
  const cp = loadCollectionPlaces(); delete cp[id]; saveCollectionPlaces(cp); notify();
}

export async function togglePlaceInCollection(collectionId: string, placeId: string): Promise<void> {
  if (!isPlaceSaved(placeId)) toggleSavedPlace(placeId);
  const cp = loadCollectionPlaces(); const ids = cp[collectionId] ?? [];
  const has = ids.includes(placeId);
  cp[collectionId] = has ? ids.filter((x) => x !== placeId) : [...ids, placeId];
  saveCollectionPlaces(cp);
  saveCollections(loadCollections().map((c) => c.id === collectionId ? { ...c, count: cp[collectionId].length, coverPlaceId: cp[collectionId][0] ?? null, updatedAt: nowIso() } : c));
  if (getRideSession()) await (has ? removePlaceFromSavedCollection(collectionId, placeId) : addPlaceToSavedCollection(collectionId, placeId)).catch(() => {});
  notify();
}

export async function syncSavedFromAccount(): Promise<void> {
  if (!getRideSession()) return;
  try {
    if (pendingRemoteWrites.size) await Promise.allSettled([...pendingRemoteWrites]);
    const payload: SavedPlacesPayload = await fetchSavedPlaces();
    const ids = payload.places.map((p) => p.placeId);
    saveSavedIds(ids);
    const curated: Record<string, CuratedSavedPlace> = {};
    const meta = loadSavedMeta();
    for (const p of payload.places) {
      if (p.kind === 'curated' && p.name && p.category) curated[p.placeId] = { name: p.name, category: p.category, note: p.note ?? '', ...(p.savedAt ? { savedAt: p.savedAt } : {}) };
      if (p.savedAt) meta[p.placeId] = { savedAt: p.savedAt };
    }
    saveCuratedFavorites(curated); writeJson(SAVED_META_KEY, meta);
    saveCollections(payload.collections || []); saveCollectionPlaces(payload.collectionPlaceIds || {}); notify();
  } catch { /* keep local state if offline */ }
}

export function directionsForSaved(place: SavedPlaceView): string {
  if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=driving`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${place.name}, ${place.address}`)}`;
}

export function haversineKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(to.latitude - from.latitude), dLon = toRad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ensurePlaceForItinerary(place: SavedPlaceView): { stopId: string; curated?: { name: string; category: string; note?: string } } {
  if (place.destination) return { stopId: place.destination.id };
  return { stopId: place.id, curated: { name: place.name, category: place.category, ...(place.note ? { note: place.note } : {}) } };
}
