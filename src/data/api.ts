import type { TripRecord } from './trips';

export const AUTH_TOKEN_KEY = 'ride.auth-token';
const AUTH_USER_KEY = 'ride.auth-user';
const AUTH_EXPIRY_KEY = 'ride.auth-expiry';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface RideUser { id: string; name: string; email: string; memberSince?: string }
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
}

export function updateStoredRideUser(user: RideUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearRideSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  sessionStorage.removeItem(AUTH_EXPIRY_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
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
