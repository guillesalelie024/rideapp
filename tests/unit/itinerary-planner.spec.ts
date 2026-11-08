import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import ItineraryPlannerPage from '@/views/ItineraryPlannerPage.vue';
import { ITINERARY_DRAFT_KEY } from '@/data/itinerary';

vi.mock('@ionic/vue', async (importOriginal) => {
  const ionic = await importOriginal<typeof import('@ionic/vue')>();
  return {
    ...ionic,
    onIonViewWillEnter: (callback: () => void) => callback(),
  };
});

const stubs = {
  IonContent: { template: '<div><slot /></div>' },
  IonIcon: { template: '<span><slot /></span>' },
  IonPage: { template: '<div><slot /></div>' },
  RideAppHeader: { template: '<header />' },
  RideBottomNav: { template: '<nav />' },
};

async function mountPlanner() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/itinerary', name: 'ItineraryPlanner', component: ItineraryPlannerPage },
      { path: '/commute', name: 'Commute', component: { template: '<div />' } },
      { path: '/live', name: 'RideLive', component: { template: '<div />' } },
    ],
  });
  await router.push('/itinerary');
  await router.isReady();
  const wrapper = mount(ItineraryPlannerPage, { global: { plugins: [router], stubs } });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('ItineraryPlannerPage transportation selection', () => {
  test('allows choosing a transportation mode before adding stops', async () => {
    const wrapper = await mountPlanner();
    const chooseButton = wrapper.get('.plan-route-change');

    expect((chooseButton.element as HTMLButtonElement).disabled).toBe(false);
    await chooseButton.trigger('click');
    await wrapper.get('.plan-select').setValue('tricycle');

    expect(JSON.parse(localStorage.getItem(`${ITINERARY_DRAFT_KEY}.route`) ?? 'null')).toMatchObject({
      mode: 'tricycle',
      fromId: '',
      toId: '',
    });
    expect(wrapper.text()).toContain('Tricycle');
    wrapper.unmount();
  });
});
