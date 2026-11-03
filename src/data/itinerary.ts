import { normalizeDestinationId, RIDE_DESTINATIONS, type RideDestination } from './destinations';
import { isExploreListingId } from './exploreListings';

export const ITINERARY_DRAFT_KEY = 'ride.itinerary-draft';
export const SAVED_ITINERARY_KEY = 'ride.saved-itinerary';

export interface CuratedItineraryStop {
  name: string;
  category: string;
  note?: string;
}

export interface ItineraryStopView {
  id: string;
  name: string;
  category: string;
  city: string;
  province: string;
  address: string;
  description?: string;
  image?: string;
  imageFallback?: string;
  destination?: RideDestination;
}

export interface Itinerary {
  stopIds: string[];
  curatedStops?: Record<string, CuratedItineraryStop>;
  travelDate: string;
  tripName: string;
  travelerCount: number;
  arrivalTimes: Record<string, string>;
  estimatedCosts: Record<string, number>;
  budget: {
    transportation?: number;
    food?: number;
    activities?: number;
    other?: number;
  };
  stopNotes?: Record<string, string>;
}

export function createEmptyItinerary(): Itinerary {
  return {
    stopIds: [],
    curatedStops: {},
    travelDate: '',
    tripName: '',
    travelerCount: 0,
    arrivalTimes: {},
    estimatedCosts: {},
    budget: {},
    stopNotes: {},
  };
}

export function getItineraryStops(itinerary: Itinerary): ItineraryStopView[] {
  return itinerary.stopIds.flatMap((id) => {
    const normalizedId = normalizeDestinationId(id);
    const destination = RIDE_DESTINATIONS.find((place) => place.id === normalizedId);
    if (destination) {
      return [{
        id: normalizedId,
        name: destination.name,
        category: destination.category,
        city: destination.city,
        province: destination.province,
        address: destination.address,
        description: destination.description,
        image: destination.image,
        imageFallback: destination.imageFallback,
        destination,
      }];
    }
    const curatedStop = itinerary.curatedStops?.[id];
    if (!curatedStop) return [];
    return [{
      id,
      name: curatedStop.name,
      category: curatedStop.category,
      city: 'Calapan City',
      province: 'Oriental Mindoro',
      address: 'Location details not verified',
      description: curatedStop.note,
    }];
  });
}

export function getUntrackedItineraryStops(itinerary: Itinerary): ItineraryStopView[] {
  return getItineraryStops(itinerary).filter((stop) => !stop.destination);
}

function finiteAmounts(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount) && amount >= 0));
}

function validTimes(value: unknown, validIds: Set<string>): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .map(([id, time]) => [normalizeDestinationId(id), time] as const)
    .filter(([id, time]) => validIds.has(id) && typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)));
}

function isValidDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime())
    && parsed.getFullYear() === Number(value.slice(0, 4))
    && parsed.getMonth() + 1 === Number(value.slice(5, 7))
    && parsed.getDate() === Number(value.slice(8, 10));
}

function parseItinerary(raw: string | null): Itinerary | null {
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object'
    || parsed === null
    || !('stopIds' in parsed)
    || !Array.isArray(parsed.stopIds)
    || !parsed.stopIds.every((id) => typeof id === 'string')
    || !('travelDate' in parsed)
    || typeof parsed.travelDate !== 'string'
    || !isValidDate(parsed.travelDate)
  ) {
    throw new Error('Stored itinerary has an invalid format.');
  }
  const validIds = new Set(RIDE_DESTINATIONS.map((place) => place.id));
  const isValidStopId = (id: string) => validIds.has(id) || isExploreListingId(id);
  const budget = typeof parsed === 'object' && 'budget' in parsed && typeof parsed.budget === 'object' && parsed.budget !== null
    ? parsed.budget as Record<string, unknown>
    : {};
  const travelerCount = 'travelerCount' in parsed && typeof parsed.travelerCount === 'number'
    && Number.isInteger(parsed.travelerCount) && parsed.travelerCount >= 0 && parsed.travelerCount <= 50
    ? parsed.travelerCount
    : 0;
  const stopNotesRaw = 'stopNotes' in parsed && typeof parsed.stopNotes === 'object' && parsed.stopNotes !== null && !Array.isArray(parsed.stopNotes)
    ? parsed.stopNotes as Record<string, unknown>
    : {};
  const stopNotes: Record<string, string> = {};
  for (const [id, val] of Object.entries(stopNotesRaw)) {
    const normalizedId = normalizeDestinationId(id);
    if (isValidStopId(normalizedId) && typeof val === 'string') {
      stopNotes[normalizedId] = val.slice(0, 200);
    }
  }
  const curatedStopsRaw = 'curatedStops' in parsed && typeof parsed.curatedStops === 'object'
    && parsed.curatedStops !== null && !Array.isArray(parsed.curatedStops)
    ? parsed.curatedStops as Record<string, unknown>
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
  const stopIds = [...new Set(parsed.stopIds.map((id) => normalizeDestinationId(id)))];
  const stopIdSet = new Set(stopIds.filter((id) => validIds.has(id) || Boolean(curatedStops[id])));
  return {
    stopIds: [...stopIdSet],
    curatedStops,
    travelDate: parsed.travelDate,
    tripName: 'tripName' in parsed && typeof parsed.tripName === 'string' ? parsed.tripName.slice(0, 100) : '',
    travelerCount,
    arrivalTimes: 'arrivalTimes' in parsed ? validTimes(parsed.arrivalTimes, stopIdSet) : {},
    estimatedCosts: 'estimatedCosts' in parsed ? finiteAmounts(parsed.estimatedCosts) : {},
    budget: finiteAmounts(budget),
    stopNotes,
  };
}

export function loadItinerary(key: string): Itinerary | null {
  return parseItinerary(localStorage.getItem(key));
}

export function saveItinerary(key: string, itinerary: Itinerary): void {
  const validIds = new Set(RIDE_DESTINATIONS.map((place) => place.id));
  const stopIds = [...new Set(itinerary.stopIds.map((id) => normalizeDestinationId(id)))];
  const isValidStopId = (id: string) => validIds.has(id) || isExploreListingId(id);
  if (!stopIds.every((id) => isValidStopId(id)
    && (validIds.has(id) || typeof itinerary.curatedStops?.[id]?.name === 'string'
      && typeof itinerary.curatedStops[id].category === 'string'))) {
    throw new Error('Only destinations in the RIDE guide can be added.');
  }
  if (!isValidDate(itinerary.travelDate)) {
    throw new Error('Choose a valid travel date.');
  }
  const isDraft = key === ITINERARY_DRAFT_KEY;
  const minimumTravelerCount = isDraft ? 0 : 1;
  if (!Number.isInteger(itinerary.travelerCount) || itinerary.travelerCount < minimumTravelerCount || itinerary.travelerCount > 50) {
    throw new Error('Traveler count must be between 1 and 50.');
  }
  const stopNotes = itinerary.stopNotes || {};
  const cleanedNotes: Record<string, string> = {};
  for (const id of stopIds) {
    if (isValidStopId(id) && typeof stopNotes[id] === 'string' && stopNotes[id].trim()) {
      cleanedNotes[id] = stopNotes[id].slice(0, 200);
    }
  }
  const curatedStops = Object.fromEntries(stopIds
    .filter((id) => !validIds.has(id) && itinerary.curatedStops?.[id])
    .map((id) => [id, itinerary.curatedStops![id]]));
  localStorage.setItem(key, JSON.stringify({
    stopIds,
    curatedStops,
    travelDate: itinerary.travelDate,
    tripName: itinerary.tripName.slice(0, 100),
    travelerCount: itinerary.travelerCount,
    arrivalTimes: validTimes(itinerary.arrivalTimes, new Set(stopIds)),
    estimatedCosts: finiteAmounts(itinerary.estimatedCosts),
    budget: finiteAmounts(itinerary.budget),
    stopNotes: cleanedNotes,
  }));
}
