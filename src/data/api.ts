import type { TripRecord } from './trips';

export const AUTH_TOKEN_KEY = 'ride.auth-token';
const AUTH_USER_KEY = 'ride.auth-user';
const AUTH_EXPIRY_KEY = 'ride.auth-expiry';
export const RIDE_PROFILE_UPDATED_EVENT = 'ride:profile-updated';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface RideUser { id: string; name: string; email: string; memberSince?: string; avatar?: string }
export interface RideSession { token: string; expiresAt: string; user: RideUser }

function readToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function readExpiry() {
  return localStorage.getItem(AUTH_EXPIRY_KEY) || sessionStorage.getItem(AUTH_EXPIRY_KEY) || '';
}

export function getRideSession(): RideSession | null {
  try {
    const token = readToken();
    const user = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null') as RideUser | null;
    const expiresAt = readExpiry();
    if (!token || !user?.id || !user.name || !user.email) return null;
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      clearRideSession();
      return null;
    }
    return { token, user, expiresAt };
  } catch { return null; }
}

export function storeRideSession(session: RideSession, remember = true) {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  sessionStorage.removeItem(AUTH_EXPIRY_KEY);
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, session.token);
  if (session.expiresAt) storage.setItem(AUTH_EXPIRY_KEY, session.expiresAt);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  window.dispatchEvent(new Event(RIDE_PROFILE_UPDATED_EVENT));
}

export function updateStoredRideUser(user: RideUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(RIDE_PROFILE_UPDATED_EVENT));
}

export function clearRideSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  sessionStorage.removeItem(AUTH_EXPIRY_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(RIDE_PROFILE_UPDATED_EVENT));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status}).`);
  return body as T;
}

export async function signUp(name: string, email: string, password: string) {
  return request<{ user: RideUser }>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export async function signIn(email: string, password: string) {
  return request<RideSession>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function signOut() {
  if (readToken()) await request<void>('/auth/logout', { method: 'POST' });
}

export async function updateRideProfile(name: string, email: string) {
  return request<{ user: RideUser }>('/me', { method: 'PATCH', body: JSON.stringify({ name, email }) });
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string; devResetUrl?: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(token: string, password: string) {
  return request<void>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request<void>('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
}

export async function fetchAccountTrips() {
  return (await request<{ trips: TripRecord[] }>('/trips')).trips;
}

export async function saveAccountTrip(trip: TripRecord) {
  if (!readToken()) throw new Error('Sign in to sync trips to your account.');
  await request(`/trips/${encodeURIComponent(trip.id)}`, { method: 'PUT', body: JSON.stringify(trip) });
}

export async function deleteAccountTrip(id: string) {
  if (!readToken()) return;
  await request<void>(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function syncLocalTrips(trips: TripRecord[]) {
  const remoteTrips = await fetchAccountTrips();
  const remoteById = new Map(remoteTrips.map((trip) => [trip.id, trip]));
  const selected = new Map(remoteTrips.map((trip) => [trip.id, trip]));
  for (const localTrip of trips) {
    const serverTrip = remoteById.get(localTrip.id);
    if (serverTrip && Date.parse(serverTrip.updatedAt) > Date.parse(localTrip.updatedAt)) continue;
    await saveAccountTrip(localTrip);
    selected.set(localTrip.id, localTrip);
  }
  return [...selected.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/* ===== Route condition reports ===== */
export interface RouteReport {
  id: string;
  userId: string | null;
  userName: string | null;
  category: 'flood' | 'traffic' | 'road_closure' | 'transport_delay' | 'other';
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
  status: 'pending' | 'verified' | 'expired';
  reportedAt: string;
  expiresAt: string;
}

export interface QueueReport {
  id: string;
  userId: string | null;
  userName: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  queueLevel: 'short' | 'moderate' | 'long';
  description: string | null;
  reportedAt: string;
  expiresAt: string;
}

export interface SubmitRouteReport {
  category: RouteReport['category'];
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface SubmitQueueReport {
  locationName: string;
  latitude: number;
  longitude: number;
  queueLevel: QueueReport['queueLevel'];
  description?: string;
}

export interface TripRating {
  rating: number;
  review: string | null;
  ratedAt: string;
  userName: string | null;
}

export interface SubmitTripRating {
  tripId: string;
  rating: number;
  review?: string;
}

export async function fetchRouteReports(): Promise<RouteReport[]> {
  const result = await request<{ reports: RouteReport[] }>('/reports');
  return result.reports;
}

export async function submitRouteReport(report: SubmitRouteReport): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function fetchQueueReports(): Promise<QueueReport[]> {
  const result = await request<{ reports: QueueReport[] }>('/queue-reports');
  return result.reports;
}

export async function submitQueueReport(report: SubmitQueueReport): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>('/queue-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function fetchTripRatings(tripId: string): Promise<TripRating[]> {
  const result = await request<{ ratings: TripRating[] }>(`/trip-ratings/${encodeURIComponent(tripId)}`);
  return result.ratings;
}

export async function submitTripRating(rating: SubmitTripRating): Promise<{ id: string; rating: number; review: string | null; ratedAt: string }> {
  return request<{ id: string; rating: number; review: string | null; ratedAt: string }>('/trip-ratings', {
    method: 'POST',
    body: JSON.stringify(rating),
  });
}

/* ===== Saved places & collections ===== */
export interface SavedPlaceRecord {
  placeId: string;
  kind: 'destination' | 'curated';
  name?: string;
  category?: string;
  note?: string;
  savedAt?: string;
  updatedAt?: string;
}

export interface SavedCollectionRecord {
  id: string;
  name: string;
  count: number;
  coverPlaceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedPlacesPayload {
  places: SavedPlaceRecord[];
  collections: SavedCollectionRecord[];
  collectionPlaceIds: Record<string, string[]>;
}

export async function fetchSavedPlaces(): Promise<SavedPlacesPayload> {
  return request<SavedPlacesPayload>('/saved');
}

export async function saveSavedPlace(placeId: string, body: Omit<SavedPlaceRecord, 'placeId' | 'savedAt' | 'updatedAt'>): Promise<SavedPlaceRecord> {
  return (await request<{ place: SavedPlaceRecord }>(`/saved/${encodeURIComponent(placeId)}`, { method: 'PUT', body: JSON.stringify(body) })).place;
}

export async function removeSavedPlace(placeId: string): Promise<void> {
  if (!readToken()) return;
  await request<void>(`/saved/${encodeURIComponent(placeId)}`, { method: 'DELETE' });
}

export async function createSavedCollection(name: string): Promise<SavedCollectionRecord> {
  return (await request<{ collection: SavedCollectionRecord }>('/saved/collections', { method: 'POST', body: JSON.stringify({ name }) })).collection;
}

export async function renameSavedCollection(id: string, name: string): Promise<SavedCollectionRecord> {
  return (await request<{ collection: SavedCollectionRecord }>(`/saved/collections/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name }) })).collection;
}

export async function deleteSavedCollection(id: string): Promise<void> {
  await request<void>(`/saved/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function addPlaceToSavedCollection(collectionId: string, placeId: string): Promise<void> {
  await request<void>(`/saved/collections/${encodeURIComponent(collectionId)}/places/${encodeURIComponent(placeId)}`, { method: 'PUT' });
}

export async function removePlaceFromSavedCollection(collectionId: string, placeId: string): Promise<void> {
  await request<void>(`/saved/collections/${encodeURIComponent(collectionId)}/places/${encodeURIComponent(placeId)}`, { method: 'DELETE' });
}
