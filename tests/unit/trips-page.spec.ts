import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import TripsPage from '@/views/TripsPage.vue';
import { saveSavedTrip, updateTrip } from '@/data/trips';

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

function createTrip(id: string, name: string, status: 'upcoming' | 'ongoing' | 'completed') {
  const trip = saveSavedTrip({
    stopIds: ['calapan-cathedral'],
    travelDate: '',
    tripName: name,
    travelerCount: 1,
    arrivalTimes: {},
    estimatedCosts: {},
    budget: {},
  }, undefined, id);
  return updateTrip(trip.id, (record) => ({ ...record, status }));
}

async function mountTripsPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/trips', name: 'Trips', component: TripsPage },
      { path: '/itinerary', component: { template: '<div />' } },
      { path: '/explore', component: { template: '<div />' } },
    ],
  });
  await router.push('/trips');
  await router.isReady();
  const wrapper = mount(TripsPage, { global: { plugins: [router], stubs } });
  await flushPromises();
  return wrapper;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('Trips page deletion', () => {
  test('shows delete buttons for ongoing and completed trips, but not upcoming trips', async () => {
    createTrip('trip-ongoing', 'Ongoing trip', 'ongoing');
    createTrip('trip-completed', 'Completed trip', 'completed');
    createTrip('trip-upcoming', 'Upcoming trip', 'upcoming');
    const wrapper = await mountTripsPage();

    const cards = wrapper.findAll('.trip-card');
    const ongoingActions = cards.find((card) => card.text().includes('Ongoing trip'))?.find('.trip-card-actions');
    expect(ongoingActions?.classes()).toContain('trip-card-actions-three');
    expect(ongoingActions?.findAll('button')).toHaveLength(3);
    expect(ongoingActions?.text()).toContain('Continue Trip');
    expect(ongoingActions?.text()).toContain('Details');
    expect(ongoingActions?.text()).toContain('Delete');
    const completedActions = cards.find((card) => card.text().includes('Completed trip'))?.find('.trip-card-actions');
    expect(completedActions?.classes()).toContain('trip-card-actions-three');
    expect(completedActions?.findAll('button')).toHaveLength(3);
    expect(completedActions?.text()).toContain('Plan Again');
    expect(completedActions?.text()).toContain('View Receipt');
    expect(completedActions?.text()).toContain('Delete');
    expect(cards.find((card) => card.text().includes('Upcoming trip'))?.find('.trip-action-danger').exists()).toBe(false);
    wrapper.unmount();
  });

  test('keeps the trip when cancelled and deletes it only after confirmation', async () => {
    const trip = createTrip('trip-completed', 'Completed trip', 'completed');
    const wrapper = await mountTripsPage();

    await wrapper.find('.trip-action-danger').trigger('click');
    expect(wrapper.get('[role="alertdialog"]').text()).toContain('Are you sure you want to delete');
    await wrapper.get('.trip-delete-cancel').trigger('click');
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
    expect(wrapper.find('.trip-card').exists()).toBe(true);

    await wrapper.find('.trip-action-danger').trigger('click');
    await wrapper.get('[role="alertdialog"] button:last-child').trigger('click');
    await flushPromises();
    expect(wrapper.find('.trip-card').exists()).toBe(false);
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false);
    expect(localStorage.getItem('ride.trip-records')).not.toContain(trip.id);
    wrapper.unmount();
  });
});
