import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import LoadingProgressModal from '@/components/LoadingProgressModal.vue';

describe('LoadingProgressModal.vue', () => {
  test('shows RIDE branding, the action message, and an indeterminate progress bar', () => {
    const wrapper = mount(LoadingProgressModal, {
      props: { visible: true, message: 'Preparing your journey...' },
      global: {
        stubs: {
          IonIcon: true,
        },
      },
    });

    expect(wrapper.get('.loading-progress-card').text()).toContain('RIDE');
    expect(wrapper.text()).toContain('Preparing your journey...');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuetext')).toBe('Loading in progress');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined();
    expect(wrapper.find('.ride-progress-bar__indicator').exists()).toBe(true);
  });

  test('is not rendered while no action is loading', () => {
    const wrapper = mount(LoadingProgressModal, {
      props: { visible: false, message: 'Opening page...' },
    });

    expect(wrapper.find('.loading-progress-card').exists()).toBe(false);
  });
});
