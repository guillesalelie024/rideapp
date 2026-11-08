import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import LoginPage from '@/views/LoginPage.vue';
import SignUpPage from '@/views/SignUpPage.vue';
import WelcomePage from '@/views/WelcomePage.vue';
import AuthScenery from '@/components/AuthScenery.vue';
import RideProgressBar from '@/components/RideProgressBar.vue';

const commonStubs = {
  IonContent: { template: '<div><slot /></div>' },
  IonIcon: { template: '<span><slot /></span>' },
  IonPage: { template: '<div><slot /></div>' },
  RouterLink: { template: '<a><slot /></a>' },
};

function trackFeedback() {
  const messages: Array<{ message: string; tone: string; title?: string }> = [];
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ message: string; tone: string; title?: string }>).detail;
    messages.push(detail);
  };
  window.addEventListener('ride:feedback', listener);
  return {
    messages,
    stop: () => window.removeEventListener('ride:feedback', listener),
  };
}

describe('WelcomePage.vue', () => {
  test('keeps the header focused on the RIDE brand and the hero provides auth links', () => {
    const wrapper = mount(WelcomePage, { global: { stubs: commonStubs } });

    expect(wrapper.text()).toContain('Your Next Journey');
    expect(wrapper.text()).toContain('Discover Destinations');
    expect(wrapper.text()).toContain('Plan Your Journey');
    expect(wrapper.text()).toContain('Find Your Best Route');
    expect(wrapper.find('.welcome-header nav').exists()).toBe(false);
    expect(wrapper.find('.welcome-header .brand').exists()).toBe(true);
    expect(wrapper.find('.welcome-actions').text()).toContain('Log In');
    expect(wrapper.find('.welcome-actions').text()).toContain('Get Started');
    expect(wrapper.findAll('.welcome-destination img')).toHaveLength(1);
    expect(wrapper.find('.welcome-visual img').attributes('alt')).toContain('Silonay Mangrove Conservation Eco-Park');
    expect(wrapper.find('.destination-intro').text()).toContain('Featured Destination');
    expect(wrapper.find('.destination-intro').text()).toContain('A breath of nature');
    expect(wrapper.find('.destination-intro').text()).toContain('Explore the mangrove boardwalk at Silonay Eco-Park.');
    expect(wrapper.find('.photo-caption').text()).toContain('Silonay Mangrove Conservation Eco-Park');
    expect(wrapper.find('.photo-caption').text()).toContain('Calapan City, Oriental Mindoro');
    expect(wrapper.find('.welcome-photo-card').exists()).toBe(false);
  });
});

describe('SignUpPage.vue', () => {
  test('shows validation errors for an empty form', async () => {
    const wrapper = mount(SignUpPage, { global: { stubs: commonStubs } });
    await wrapper.get('form').trigger('submit');

    expect(wrapper.text()).toContain('Please enter your full name.');
    expect(wrapper.text()).toContain('Enter a valid email address.');
    expect(wrapper.text()).toContain('Use at least 8 characters for your password.');
    expect(wrapper.text()).toContain('Please confirm your password.');
    expect(wrapper.text()).toContain('Please agree to the Terms and Privacy Policy.');
  });

  test('never reports account creation when auth is unavailable', async () => {
    const feedback = trackFeedback();
    try {
      const wrapper = mount(SignUpPage, { global: { stubs: commonStubs } });
      await wrapper.get('#full-name').setValue('Ari Santos');
      await wrapper.get('#signup-email').setValue('ari@example.com');
      await wrapper.get('#signup-password').setValue('journey123');
      await wrapper.get('#confirm-password').setValue('journey123');
      await wrapper.get('.terms-row input').setValue(true);
      await wrapper.get('form').trigger('submit');
      await flushPromises();

      expect(feedback.messages.some((feedbackItem) => feedbackItem.tone === 'success')).toBe(false);
      expect(feedback.messages.some((feedbackItem) => feedbackItem.tone === 'error')).toBe(true);
    } finally {
      feedback.stop();
    }
  });
});

describe('AuthScenery.vue', () => {
  test('presents login-focused journey features', () => {
    const wrapper = mount(AuthScenery, { props: { variant: 'login' } });

    expect(wrapper.text()).toContain('Welcome Back to the Road');
    expect(wrapper.text()).toContain('Pick up where you left off');
    expect(wrapper.findAll('.auth-scenery-features li')).toHaveLength(3);
    expect(wrapper.text()).toContain('Saved Trails');
    expect(wrapper.text()).toContain('Active Bookings');
    expect(wrapper.text()).toContain('Trip Stats');
    expect(wrapper.find('.auth-scenery-art').attributes('src')).toContain('calapan-nature-park.png');
    expect(wrapper.find('.auth-brand-lockup').exists()).toBe(false);
  });

  test('welcomes new riders with sign-up-focused adventure features', () => {
    const wrapper = mount(AuthScenery, { props: { variant: 'signup' } });

    expect(wrapper.text()).toContain('Start Your Adventure Today');
    expect(wrapper.text()).toContain('New roads, great rides');
    expect(wrapper.findAll('.auth-scenery-features li')).toHaveLength(3);
    expect(wrapper.text()).toContain('Curated Routes');
    expect(wrapper.text()).toContain('Instant Vehicle Rentals');
    expect(wrapper.text()).toContain('Rider Community');
  });

  test('supports account recovery with calm, secure guidance', () => {
    const wrapper = mount(AuthScenery, { props: { variant: 'recovery' } });

    expect(wrapper.text()).toContain('Return to the Journey');
    expect(wrapper.text()).toContain('Secure Recovery');
    expect(wrapper.text()).toContain('Fresh Access');
    expect(wrapper.text()).toContain('Back on Route');
    expect(wrapper.findAll('.auth-scenery-features li')).toHaveLength(3);
  });
});

describe('LoginPage.vue', () => {
  test('validates credentials and reports that auth is not connected', async () => {
    const wrapper = mount(LoginPage, { global: { stubs: commonStubs } });

    await wrapper.get('form').trigger('submit');

    expect(wrapper.text()).toContain('Enter a valid email address.');
    expect(wrapper.text()).toContain('Please enter your password.');

    const feedback = trackFeedback();
    try {
      await wrapper.get('#login-email').setValue('ari@example.com');
      await wrapper.get('#login-password').setValue('journey123');
      await wrapper.get('form').trigger('submit');
      await flushPromises();

      expect(feedback.messages.some((feedbackItem) => feedbackItem.tone === 'success')).toBe(false);
      expect(feedback.messages.some((feedbackItem) => feedbackItem.tone === 'error')).toBe(true);
    } finally {
      feedback.stop();
    }
  });
});

describe('RideProgressBar.vue', () => {
  test('shows an indeterminate moving indicator while loading without inventing a percentage', () => {
    const wrapper = mount(RideProgressBar, { props: { phase: 'loading', label: 'Page navigation progress' } });

    expect(wrapper.get('[role="progressbar"]').attributes('aria-label')).toBe('Page navigation progress');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuetext')).toBe('Loading in progress');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBeUndefined();
    expect(wrapper.find('.ride-progress-bar__indicator').exists()).toBe(true);
  });

  test('fills only after the route operation completes', () => {
    const wrapper = mount(RideProgressBar, { props: { phase: 'complete' } });

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    expect(wrapper.find('.ride-progress-bar--complete').exists()).toBe(true);
  });

  test('is absent when no operation is active', () => {
    const wrapper = mount(RideProgressBar, { props: { phase: 'idle' } });

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
  });
});
