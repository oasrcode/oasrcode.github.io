import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export interface SmoothScroll {
  lenis: Lenis;
  destroy: () => void;
}

/**
 * Wire Lenis smooth scrolling to GSAP so ScrollTrigger stays in sync:
 *  - Lenis emits 'scroll' -> ScrollTrigger.update
 *  - GSAP's ticker drives Lenis' raf (single rAF loop)
 *  - lagSmoothing is disabled so scrubbed values track the real scroll.
 *
 * Same-page anchor links (`#work`, `#about`, …) are intercepted explicitly:
 * Lenis' own `anchors` handler does not call preventDefault, so the browser's
 * instant hash jump would win. We preventDefault and hand the target to Lenis
 * so the scroll is animated instead of snapped.
 */
export function initSmoothScroll(): SmoothScroll | null {
  try {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank') return;

      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !url.hash
      ) {
        return;
      }

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: 0 });
      if (window.location.hash !== url.hash) {
        window.history.pushState(null, '', url.hash);
      }
    };
    document.addEventListener('click', onAnchorClick);

    return {
      lenis,
      destroy: () => {
        document.removeEventListener('click', onAnchorClick);
        lenis.off('scroll', onScroll);
        gsap.ticker.remove(raf);
        lenis.destroy();
      },
    };
  } catch {
    return null;
  }
}
