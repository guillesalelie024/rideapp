import { CALAPAN_PLACES } from './calapan';

export const TRAVEL_PREFERENCES_KEY = 'ride.travel-preferences';
export const FARE_COMPARISON_HISTORY_KEY = 'ride.fare-comparison-history';
export const MAX_FARE_COMPARISON_HISTORY = 20;

export const PREFERRED_TRANSPORTATION = [
  { id: 'tricycle', label: 'Tricycle' },
  { id: 'jeepney', label: 'Jeepney' },
  { id: 'multicab', label: 'Multicab' },
  { id: 'bus', label: 'Bus' },
  { id: 'van', label: 'Van' },
  { id: 'ferry', label: 'Ferry' },
  { id: 'train', label: 'Train' },
  { id: 'airplane', label: 'Airplane' },
] as const;

export const TRAVEL_INTERESTS = [
  { id: 'beaches', label: 'Beaches' },
  { id: 'heritage', label: 'Heritage sites' },
  { id: 'nature', label: 'Nature' },
  { id: 'food', label: 'Food trips' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'adventure', label: 'Adventure' },
] as const;

export const BUDGET_PREFERENCES = [
  { id: 'budget-friendly', label: 'Budget-friendly' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
] as const;

export type PreferredTransportation = typeof PREFERRED_TRANSPORTATION[number]['id'];
export type TravelInterest = typeof TRAVEL_INTERESTS[number]['id'];
export type BudgetPreference = typeof BUDGET_PREFERENCES[number]['id'];

export interface TravelPreferences {
  transportation: PreferredTransportation[];
  budget: BudgetPreference | '';
  interests: TravelInterest[];
}

export function matchesTravelInterests(category: string, interests: readonly TravelInterest[]): boolean {
  return interests.some((interest) => (
    (interest === 'beaches' && category === 'Beaches')
    || (interest === 'heritage' && category === 'Heritage')
    || ((interest === 'nature' || interest === 'adventure') && category === 'Parks')
  ));
}

export type FareModeId = 'tricycle' | 'natsco' | 'vodactco' | 'jeepney' | 'multicab';

export interface FareComparisonMode {
  id: FareModeId;
  name: string;
  status: 'verified-reference' | 'not-verified';
  fareReference: string;
  quotedFare?: number;
}

export interface FareComparisonRecord {
  id: string;
  fromId: string;
  toId: string;
  selectedMode: FareModeId;
  modes: FareComparisonMode[];
  comparedAt: string;
}

const transportationIds = new Set<string>(PREFERRED_TRANSPORTATION.map(({ id }) => id));
const interestIds = new Set<string>(TRAVEL_INTERESTS.map(({ id }) => id));
const budgetIds = new Set<string>(BUDGET_PREFERENCES.map(({ id }) => id));
const fareModeIds = new Set<string>(['tricycle', 'natsco', 'vodactco', 'jeepney', 'multicab']);
const placeIds = new Set(CALAPAN_PLACES.map(({ id }) => id));

function isPreferredTransportation(value: string): value is PreferredTransportation {
  return transportationIds.has(value);
}

function isTravelInterest(value: string): value is TravelInterest {
  return interestIds.has(value);
}

function isBudgetPreference(value: unknown): value is BudgetPreference {
  return typeof value === 'string' && budgetIds.has(value);
}

function isFareModeId(value: unknown): value is FareModeId {
  return typeof value === 'string' && fareModeIds.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArrayOf<T extends string>(
  value: unknown,
  isAllowed: (item: string) => item is T,
): value is T[] {
  return Array.isArray(value)
    && value.every((item): item is T => typeof item === 'string' && isAllowed(item));
}

export function createEmptyTravelPreferences(): TravelPreferences {
  return { transportation: [], budget: '', interests: [] };
}

export function loadTravelPreferences(): TravelPreferences {
  const raw = localStorage.getItem(TRAVEL_PREFERENCES_KEY);
  if (!raw) return createEmptyTravelPreferences();

  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)
    || !isStringArrayOf(parsed.transportation, isPreferredTransportation)
    || (parsed.budget !== '' && !isBudgetPreference(parsed.budget))
    || !isStringArrayOf(parsed.interests, isTravelInterest)) {
    throw new Error('Saved travel preferences have an invalid format.');
  }

  return {
    transportation: [...new Set(parsed.transportation)],
    budget: parsed.budget,
    interests: [...new Set(parsed.interests)],
  };
}

export function saveTravelPreferences(preferences: TravelPreferences): void {
  if (!isStringArrayOf(preferences.transportation, isPreferredTransportation)
    || (preferences.budget !== '' && !budgetIds.has(preferences.budget))
    || !isStringArrayOf(preferences.interests, isTravelInterest)) {
    throw new Error('Travel preferences contain an unsupported option.');
  }

  localStorage.setItem(TRAVEL_PREFERENCES_KEY, JSON.stringify({
    transportation: [...new Set(preferences.transportation)],
    budget: preferences.budget,
    interests: [...new Set(preferences.interests)],
  }));
}

function isFareComparisonMode(value: unknown): value is FareComparisonMode {
  return isRecord(value)
    && isFareModeId(value.id)
    && typeof value.name === 'string'
    && value.name.length > 0
    && value.name.length <= 100
    && (value.status === 'verified-reference' || value.status === 'not-verified')
    && typeof value.fareReference === 'string'
    && value.fareReference.length <= 300
    && (!('quotedFare' in value) || (typeof value.quotedFare === 'number' && Number.isFinite(value.quotedFare) && value.quotedFare >= 0));
}

function isFareComparisonRecord(value: unknown): value is FareComparisonRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length <= 100
    && typeof value.fromId === 'string'
    && placeIds.has(value.fromId)
    && typeof value.toId === 'string'
    && placeIds.has(value.toId)
    && value.fromId !== value.toId
    && isFareModeId(value.selectedMode)
    && Array.isArray(value.modes)
    && value.modes.length > 0
    && value.modes.every(isFareComparisonMode)
    && typeof value.comparedAt === 'string'
    && Number.isFinite(Date.parse(value.comparedAt));
}

export function loadFareComparisonHistory(): FareComparisonRecord[] {
  const raw = localStorage.getItem(FARE_COMPARISON_HISTORY_KEY);
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isFareComparisonRecord)) {
    throw new Error('Saved fare comparison history has an invalid format.');
  }

  return parsed.slice(0, MAX_FARE_COMPARISON_HISTORY);
}

export function saveFareComparison(record: Omit<FareComparisonRecord, 'id' | 'comparedAt'>): FareComparisonRecord[] {
  if (!placeIds.has(record.fromId) || !placeIds.has(record.toId) || record.fromId === record.toId
    || !fareModeIds.has(record.selectedMode)
    || !record.modes.length || !record.modes.every(isFareComparisonMode)) {
    throw new Error('Fare comparison cannot be saved because its route data is invalid.');
  }

  const history = loadFareComparisonHistory();
  const saved: FareComparisonRecord = {
    ...record,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `fare-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    comparedAt: new Date().toISOString(),
  };
  const next = [saved, ...history].slice(0, MAX_FARE_COMPARISON_HISTORY);
  localStorage.setItem(FARE_COMPARISON_HISTORY_KEY, JSON.stringify(next));
  return next;
}
