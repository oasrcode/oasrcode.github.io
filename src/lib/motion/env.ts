/**
 * Motion environment helpers.
 *
 * Every effect on the Home page is gated on these checks so that
 * `prefers-reduced-motion: reduce`, touch devices and coarse pointers
 * always get a fully visible, static page.
 */

declare global {
  interface Window {
    /** Set true once the Home hero's motion layer has initialised. */
    __homeMotionReady?: boolean;
  }
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

export const isTouchDevice = (): boolean =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);
