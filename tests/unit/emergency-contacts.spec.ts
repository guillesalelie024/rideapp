import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test } from 'vitest';
import EmergencyContactsPage from '@/views/EmergencyContactsPage.vue';

describe('EmergencyContactsPage.vue', () => {
  afterEach(() => localStorage.clear());

  test('saves a contact on this device and allows removing it', async () => {
    const wrapper = mount(EmergencyContactsPage, {
      global: {
        stubs: {
          IonContent: { template: '<div><slot /></div>' },
          IonIcon: { template: '<span><slot /></span>' },
          IonPage: { template: '<div><slot /></div>' },
          RideAppHeader: true,
          RideBottomNav: true,
        },
      },
    });

    await wrapper.get('input[type="text"]').setValue('Alex Rider');
    await wrapper.get('input[type="tel"]').setValue('+63 912 345 6789');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.text()).toContain('Alex Rider');
    expect(wrapper.get('a[href="tel:+63 912 345 6789"]').exists()).toBe(true);
    expect(JSON.parse(localStorage.getItem('ride.emergency-contacts') ?? '[]')).toHaveLength(1);

    await wrapper.get('button[aria-label="Remove Alex Rider"]').trigger('click');
    expect(wrapper.text()).toContain('No emergency contacts added yet.');
    expect(JSON.parse(localStorage.getItem('ride.emergency-contacts') ?? '[]')).toEqual([]);
  });
});
