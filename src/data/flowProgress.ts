import { DRAFT_TRIP_ID_KEY } from './trips';

export type PlanningStep = 'explore' | 'planner' | 'compare' | 'summary';
export const PLANNING_STEPS: PlanningStep[] = ['explore', 'planner', 'compare', 'summary'];

function flowKey(tripId?: string) {
  const id = tripId || localStorage.getItem(DRAFT_TRIP_ID_KEY);
  return id ? `ride.planning-progress.${id}` : '';
}

export function ensureDraftTripId() {
  try {
    const existing = localStorage.getItem(DRAFT_TRIP_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `ride-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(DRAFT_TRIP_ID_KEY, id);
    return id;
  } catch {
    return 'draft-session';
  }
}

export function getCompletedPlanningSteps(tripId?: string): PlanningStep[] {
  try {
    const key = flowKey(tripId);
    if (!key) return [];
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? PLANNING_STEPS.filter((step) => parsed.includes(step)) : [];
  } catch {
    return [];
  }
}

export function completePlanningStep(step: PlanningStep, tripId?: string) {
  try {
    const key = flowKey(tripId);
    if (!key) return;
    const completed = new Set(getCompletedPlanningSteps(tripId));
    completed.add(step);
    localStorage.setItem(key, JSON.stringify(PLANNING_STEPS.filter((item) => completed.has(item))));
  } catch {
    // Progress is an enhancement; trip selection and navigation remain usable without storage.
  }
}

