import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import RouteDetailsPage from '@/views/RouteDetailsPage.vue';

const stubs = {
  IonContent: { template: '<div><slot /></div>' },
  IonIcon: { template: '<span><slot /></span>' },
  IonPage: { template: '<div><slot /></div>' },
  RideAppHeader: true,
  RideBottomNav: true,
  TripFlowProgress: true,
};

async function mountRouteDetails(mode: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/route-details', name: 'RouteDetails', component: RouteDetailsPage },
      { path: '/commute', name: 'Commute', component: { template: '<div>Compare fares</div>' } },
      { path: '/trip-summary', name: 'TripSummary', component: { template: '<div>Trip summary</div>' } },
      { path: '/profile', name: 'Profile', component: { template: '<div>Profile</div>' } },
    ],
  });
  await router.push({
    name: 'RouteDetails',
    query: { mode, from: 'calapan-cathedral', to: 'calapan-city-plaza' },
  });
  await router.isReady();
  const wrapper = mount(RouteDetailsPage, { global: { plugins: [router], stubs } });
  await flushPromises();
  return { router, wrapper };
}

describe('RouteDetailsPage.vue', () => {
  afterEach(() => localStorage.clear());

  test('presents the selected route in clear steps and adds the supported fare reference', async () => {
    const { wrapper } = await mountRouteDetails('tricycle');

    expect(wrapper.text()).toContain('STARTING POINT');
    expect(wrapper.text()).toContain('DESTINATION');
    expect(wrapper.text()).toContain('Fare reference available');
    expect(wrapper.text()).toContain('This is a published reference, not a quote');
    expect(wrapper.get('.route-map-link').attributes('href')).toContain('google.com/maps/dir');

    await wrapper.get('.route-detail-actions .button-primary').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Added to trip');
    expect(JSON.parse(localStorage.getItem('ride.selected-route') ?? '{}')).toEqual(expect.objectContaining({
      mode: 'tricycle',
      fromId: 'calapan-cathedral',
      toId: 'calapan-city-plaza',
    }));
  });

  test('explains unverified transport and lets the user continue without selecting it', async () => {
    const { router, wrapper } = await mountRouteDetails('natsco');

    expect(wrapper.text()).toContain('Route not verified for this trip');
    expect(wrapper.text()).toContain('It won’t be saved as your selected transport.');
    expect(wrapper.find('.route-detail-actions .button-primary').exists()).toBe(false);
    expect(wrapper.text()).toContain('Continue without transport');

    await wrapper.get('.route-detail-actions .button-secondary').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('TripSummary');
  });
});
