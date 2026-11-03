import { createAnimation } from '@ionic/vue';
import type { AnimationBuilder } from '@ionic/vue';

export const RIDE_PAGE_TRANSITION_MS = 260;

/** A restrained fade and short slide used by Ionic's own router outlet. */
export const ridePageTransition: AnimationBuilder = (_baseEl, opts) => {
  const enteringEl = opts?.enteringEl as HTMLElement | undefined;
  const leavingEl = opts?.leavingEl as HTMLElement | undefined;
  const direction = opts?.direction;
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 1 : RIDE_PAGE_TRANSITION_MS;
  const forward = direction !== 'back';
  const enterOffset = direction === 'root' ? '0px' : (forward ? '10px' : '-10px');
  const leaveOffset = direction === 'root' ? '0px' : (forward ? '-6px' : '6px');

  const transition = createAnimation()
    .duration(duration)
    .easing('cubic-bezier(0.22, 1, 0.36, 1)');

  if (enteringEl) {
    transition.addAnimation(
      createAnimation()
        .addElement(enteringEl)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', `translateX(${enterOffset})`, 'translateX(0)'),
    );
  }

  if (leavingEl) {
    transition.addAnimation(
      createAnimation()
        .addElement(leavingEl)
        .fromTo('opacity', '1', '0.98')
        .fromTo('transform', 'translateX(0)', `translateX(${leaveOffset})`),
    );
  }

  return transition;
};
