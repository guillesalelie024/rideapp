import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import ProfilePage from '@/views/ProfilePage.vue';
import {
  FARE_COMPARISON_HISTORY_KEY,
  loadFareComparisonHistory,
  loadTravelPreferences,
  MAX_FARE_COMPARISON_HISTORY,
  saveFareComparison,
  saveTravelPreferences,
} from '@/data/profile';
import { getRideSession, storeRideSession } from '@/data/api';

const stubs = {
  IonContent: { template: '<div><slot /></div>' },
  IonIcon: { template: '<span aria-hidden="true"><slot /></span>' },
  IonPage: { template: '<div><slot /></div>' },
};

function routes(): RouteRecordRaw[] {
  return [
    { path: '/', name: 'Welcome', component: { template: '<div>Welcome</div>' } },
    { path: '/profile', name: 'Profile', component: ProfilePage },
    { path: '/home', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/explore', name: 'Explore', component: { template: '<div>Explore</div>' } },
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/trips', name: 'Trips', component: { template: '<div>Trips</div>' } },
    { path: '/itinerary', name: 'ItineraryPlanner', component: { template: '<div>Itinerary</div>' } },
    { path: '/saved', name: 'Saved', component: { template: '<div>Saved</div>' } },
    { path: '/settings', name: 'Settings', component: { template: '<div>Settings</div>' } },
    { path: '/preferences', name: 'Preferences', component: { template: '<div>Preferences</div>' } },
    { path: '/security', name: 'Security', component: { template: '<div>Security</div>' } },
    { path: '/about', name: 'About', component: { template: '<div>About</div>' } },
    { path: '/emergency-contacts', name: 'EmergencyContacts', component: { template: '<div>Emergency</div>' } },
  ];
}

async function mountProfile() {
  const router = createRouter({ history: createMemoryHistory(), routes: routes() });
  await router.push('/profile');
  await router.isReady();
  const wrapper = mount(ProfilePage, { global: { plugins: [router], stubs } });
  await flushPromises();
  return { router, wrapper };
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('travel profile data', () => {
  test('validates, deduplicates, and saves browser-local preferences', () => {
    saveTravelPreferences({
      transportation: ['tricycle', 'bus', 'bus'],
      budget: 'budget-friendly',
      interests: ['beaches', 'nature'],
    });

    expect(loadTravelPreferences()).toEqual({
      transportation: ['tricycle', 'bus'],
      budget: 'budget-friendly',
      interests: ['beaches', 'nature'],
    });
  });

  test('rejects malformed preferences instead of silently replacing them', () => {
    localStorage.setItem('ride.travel-preferences', '{"transportation":["hovercraft"],"budget":"","interests":[]}');
    expect(() => loadTravelPreferences()).toThrow('Saved travel preferences have an invalid format.');
  });

  test('keeps only the most recent saved fare comparisons', () => {
    for (let index = 0; index < MAX_FARE_COMPARISON_HISTORY + 1; index += 1) {
      saveFareComparison({
        fromId: 'calapan-cathedral',
        toId: 'calapan-city-plaza',
        selectedMode: 'tricycle',
        modes: [
          {
            id: 'tricycle',
            name: 'Tricycle',
            status: 'verified-reference',
            fareReference: 'Published tariff only; not a trip quote.',
          },
        ],
      });
    }

    expect(loadFareComparisonHistory()).toHaveLength(MAX_FARE_COMPARISON_HISTORY);
    expect(JSON.parse(localStorage.getItem(FARE_COMPARISON_HISTORY_KEY) ?? '[]')).toHaveLength(MAX_FARE_COMPARISON_HISTORY);
  });

  test('rejects invalid routes and negative user quotes in fare history', () => {
    expect(() => saveFareComparison({
      fromId: 'calapan-cathedral',
      toId: 'calapan-cathedral',
      selectedMode: 'tricycle',
      modes: [{ id: 'tricycle', name: 'Tricycle', status: 'verified-reference', fareReference: 'Reference only.' }],
    })).toThrow('Fare comparison cannot be saved because its route data is invalid.');

    expect(() => saveFareComparison({
      fromId: 'calapan-cathedral',
      toId: 'calapan-city-plaza',
      selectedMode: 'tricycle',
      modes: [{
        id: 'tricycle',
        name: 'Tricycle',
        status: 'verified-reference',
        fareReference: 'Published tariff only.',
        quotedFare: -1,
      }],
    })).toThrow('Fare comparison cannot be saved because its route data is invalid.');
  });
});

describe('ProfilePage.vue', () => {
  test('shows saved transportation and interests instead of placeholder values', async () => {
    saveTravelPreferences({
      transportation: ['tricycle', 'bus'],
      budget: 'standard',
      interests: ['beaches', 'nature'],
    });
    const { wrapper } = await mountProfile();

    expect(wrapper.text()).toContain('Tricycle, Bus');
    expect(wrapper.text()).toContain('Beaches, Nature');
    expect(wrapper.text()).not.toContain('Tricycle, Jeepney, Bus');
  });

  test('shows Not set when no preferences have been saved', async () => {
    const { wrapper } = await mountProfile();
    expect(wrapper.text()).toContain('Not set');
  });

  test('opens the account edit dialog with the signed-in profile values', async () => {
    storeRideSession({
      token: 'test-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 'user-1', name: 'Calapan Explorer', email: 'explorer@example.com' },
    });
    const { wrapper } = await mountProfile();

    expect(wrapper.text()).toContain('Calapan Explorer');
    await wrapper.get('.pf-edit-btn').trigger('click');
    await flushPromises();

    expect(wrapper.get('#pf-name').element.value).toBe('Calapan Explorer');
    expect(wrapper.get('#pf-email').element.value).toBe('explorer@example.com');
  });

  test('keeps the selected profile icon when saving updated account details', async () => {
    storeRideSession({
      token: 'test-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 'user-1', name: 'Calapan Explorer', email: 'explorer@example.com' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 'user-1', name: 'Calapan Traveler', email: 'explorer@example.com' },
      }),
    }));
    const { wrapper } = await mountProfile();

    await wrapper.get('.pf-edit-btn').trigger('click');
    await wrapper.get('[aria-label="Leaf profile icon"]').trigger('click');
    await wrapper.get('#pf-name').setValue('Calapan Traveler');
    expect(wrapper.get('[aria-label="Leaf profile icon"]').attributes('aria-pressed')).toBe('true');
    await wrapper.get('.pf-edit-form').trigger('submit');
    await flushPromises();

    expect(getRideSession()?.user.avatar).toBe('leaf');
    expect(getRideSession()?.user.name).toBe('Calapan Traveler');
    expect(wrapper.findAll('.ride-profile-avatar[data-avatar="leaf"]')).toHaveLength(2);
    expect(wrapper.find('.pf-edit-modal').exists()).toBe(false);
  });

  test('logging out clears the local trip cache and session', async () => {
    storeRideSession({
      token: 'test-token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: { id: 'user-1', name: 'Calapan Explorer', email: 'explorer@example.com' },
    });
    localStorage.setItem('ride.trip-records', '[]');
    localStorage.setItem('ride.itinerary-draft', '{}');
    localStorage.setItem('ride.saved-itinerary', '{}');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null }));

    const { router, wrapper } = await mountProfile();
    await wrapper.get('.pf-logout').trigger('click');
    await flushPromises();
    await wrapper.get('.pf-logout-confirm').trigger('click');
    await flushPromises();

    expect(localStorage.getItem('ride.trip-records')).toBeNull();
    expect(localStorage.getItem('ride.itinerary-draft')).toBeNull();
    expect(localStorage.getItem('ride.saved-itinerary')).toBeNull();
    expect(localStorage.getItem('ride.auth-token')).toBeNull();
    expect(router.currentRoute.value.name).toBe('Welcome');
  });
});
