import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env';
import { initSmoothScroll, type SmoothScroll } from './lenis';
import { initHomeHero } from './effects/hero';
import { whenIdle } from './schedule';

gsap.registerPlugin(ScrollTrigger);

/**
 * Boot the Home motion system — one coherent, scroll-driven layer. Returns a
 * teardown function.
 *
 * Everything is skipped and the page is left fully visible when the user
 * prefers reduced motion or when the inline bootstrap did not mark the document
 * as motion-ready (no JS / failed boot). The `data-*` hooks are inert on their
 * own, so no-JS visitors always see the final state.
 *
 * The boot is split so the critical path stays tiny:
 *
 *   1. EAGER — `initSmoothScroll()` + `initHomeHero()` only. These are the
 *      above-the-fold work (Lenis + the signature nib and the hero entrance).
 *      As soon as they are up the critical path is marked ready, clearing the
 *      inline failsafe's 4s window.
 *   2. DEFERRED — every other effect (plus DrawSVGPlugin) lives in a separate
 *      chunk (`effects/deferred`) loaded via dynamic `import()` from an idle
 *      callback, and initialised one at a time with a yield between each so no
 *      single task blocks the main thread for long.
 *
 * If the deferred chunk or any effect fails, `js-motion` is dropped so the page
 * falls back to its fully-visible static state instead of leaving pre-hidden
 * content invisible.
 */
export function initHomeMotion(): () => void {
  const root = document.documentElement;

  if (prefersReducedMotion() || !root.classList.contains('js-motion')) {
    root.classList.remove('js-motion');
    window.__homeMotionReady = true;
    return () => {};
  }

  let smooth: SmoothScroll | null = null;
  const cleanups: Array<() => void> = [];
  let disposed = false;

  const register = (fn: () => void) => {
    cleanups.push(fn);
  };

  // Load + boot the non-critical effects once the browser is next idle, so
  // they never compete with the critical path or first paint.
  const startDeferred = () => {
    whenIdle(() => {
      if (disposed) return;
      import('./effects/deferred')
        .then((mod) => mod.runDeferredEffects(register, () => disposed))
        .then((ok) => {
          if (!ok && !disposed) root.classList.remove('js-motion');
        })
        .catch(() => {
          if (!disposed) root.classList.remove('js-motion');
        });
    });
  };

  const start = () => {
    if (disposed) return;

    // --- Critical, above-the-fold work (eager) ----------------------------
    smooth = initSmoothScroll();
    register(initHomeHero());

    // Critical path is up: mark the document motion-ready so the inline 4s
    // failsafe never strips `js-motion` while the deferred effects are pending.
    window.__homeMotionReady = true;
    ScrollTrigger.refresh();

    // Re-measure once webfonts/layout have settled.
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

    // --- Non-critical work: code-split + deferred -------------------------
    startDeferred();
  };

  // SplitText-like measurement should run after webfonts resolve, otherwise the
  // signature geometry drifts.
  const fonts = document.fonts;
  if (fonts && typeof fonts.ready?.then === 'function') {
    fonts.ready.then(start).catch(start);
  } else {
    start();
  }

  return () => {
    disposed = true;
    cleanups.forEach((fn) => fn());
    smooth?.destroy();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    root.classList.remove('js-motion');
  };
}
