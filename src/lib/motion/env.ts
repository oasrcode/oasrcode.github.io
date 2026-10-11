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

/**
 * True only for a device whose primary pointer can hover AND is fine — a mouse
 * or trackpad.
 *
 * `(pointer: fine)` alone is not enough: a hybrid device (touchscreen + mouse)
 * can report a fine pointer even when its primary input is the touchscreen, so
 * a touch user would still get the cursor. Requiring `(hover: hover)` too gates
 * on a pointer that can actually hover; touch-only devices match neither part,
 * so they get no cursor.
 */
export const hasHoverFinePointer = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;
