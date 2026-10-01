import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { prefersReducedMotion } from './env';
import { initSmoothScroll, type SmoothScroll } from './lenis';
import { initHomeHero } from './effects/hero';
import { initHeroTrace } from './effects/hero-trace';
import { initTitleWipe } from './effects/title-wipe';
import { initTimelineRail } from './effects/timeline-rail';
import { initQuoteBar } from './effects/quote-bar';
import { initDossier } from './effects/dossier';
import { initGallery } from './effects/gallery';
import { initStaggerGrid } from './effects/stagger-grid';
import { initParallax } from './effects/parallax';
import { initMagneticCursor } from './effects/magnetic-cursor';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

/**
 * Boot the Home motion system — one coherent, scroll-driven layer. Returns a
 * teardown function.
 *
 * Everything is skipped and the page is left fully visible when the user
 * prefers reduced motion or when the inline bootstrap did not mark the document
 * as motion-ready (no JS / failed boot). The `data-*` hooks are inert on their
 * own, so no-JS visitors always see the final state.
 */
export function initHomeMotion(): () => void {
  const root = document.documentElement;

  if (prefersReducedMotion() || !root.classList.contains('js-motion')) {
    root.classList.remove('js-motion');
    window.__homeMotionReady = true;
    return () => {};
  }

  let smooth: SmoothScroll | null = null;
  let cleanups: Array<() => void> = [];

  const start = () => {
    smooth = initSmoothScroll();

    cleanups = [
      initHomeHero(),
      initHeroTrace(),
      initTitleWipe(),
      initTimelineRail(),
      initQuoteBar(),
      initDossier(),
      initGallery(),
      initStaggerGrid(),
      initParallax(),
      initMagneticCursor(),
    ];

    window.__homeMotionReady = true;
    ScrollTrigger.refresh();

    // Re-measure once webfonts/layout have settled.
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  };

  // SplitText should run after webfonts resolve, otherwise measurements drift.
  const fonts = document.fonts;
  if (fonts && typeof fonts.ready?.then === 'function') {
    fonts.ready.then(start).catch(start);
  } else {
    start();
  }

  return () => {
    cleanups.forEach((fn) => fn());
    smooth?.destroy();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    root.classList.remove('js-motion');
  };
}
