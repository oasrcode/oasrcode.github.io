import gsap from 'gsap';
import { hasHoverFinePointer } from '../env';

/**
 * 07 — Bioluminescent cursor.
 *
 * A small light source, not a ring. `[data-cursor]` is the luminous CORE (always
 * blended normally, so it stays legible on any backdrop); the optional
 * `[data-cursor-glow]` sibling is a wide, soft HALO that screen-blends with the
 * page, so the content under the pointer visibly brightens — the bioluminescent
 * "illumination". The halo never moves the content: only `[data-magnetic]`
 * elements drift, exactly as before.
 *
 * The light adapts to depth: warm over the surface/hero, cyan bioluminescent
 * inside `.sea`. The switch is cheap — `.sea`'s top is cached in DOCUMENT space
 * (scrolling does not change layout, so the rect is measured on resize/load
 * only, never per pointer event) and the move handler simply compares the
 * pointer's viewport Y plus `window.scrollY` against it.
 *
 * Disabled unless the device has a hovering, fine pointer (see env.ts); the
 * global pointer handler additionally ignores non-mouse pointer types, so on a
 * hybrid touch+mouse device a finger never drives the cursor. Under reduced
 * motion the cursor is hidden by CSS. The native pointer stays visible so
 * nothing becomes unusable.
 */
export function initMagneticCursor(): () => void {
  if (!hasHoverFinePointer()) return () => {};

  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  if (!cursor) return () => {};
  const glow = document.querySelector<HTMLElement>('[data-cursor-glow]');
  const root = document.documentElement;

  root.classList.remove('ml-cursor-on', 'ml-cursor-dive');

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;
  const rest = { xPercent: -50, yPercent: -50, x: startX, y: startY };
  gsap.set(cursor, rest);
  if (glow) gsap.set(glow, rest);

  const follow = { duration: 0.5, ease: 'power3' } as const;
  const xTo = gsap.quickTo(cursor, 'x', follow);
  const yTo = gsap.quickTo(cursor, 'y', follow);
  const glowXTo = glow ? gsap.quickTo(glow, 'x', follow) : null;
  const glowYTo = glow ? gsap.quickTo(glow, 'y', follow) : null;

  // Adaptive colour. `.sea` top in document coordinates: stable while scrolling,
  // so it is measured only when layout can actually change. No geometry read in
  // the pointer handler — the handler touches `window.scrollY` (cheap) only.
  const sea = document.querySelector<HTMLElement>('[data-sea], .sea');
  let seaDocTop: number | null = null;
  let inDive = false;

  const measureSea = () => {
    if (!sea) return;
    seaDocTop = sea.getBoundingClientRect().top + window.scrollY;
  };
  measureSea();

  // Keep the light hidden until the pointer actually moves, so it never appears
  // resting at the centre of a freshly loaded page.
  let revealed = false;
  const onPointerMove = (e: PointerEvent) => {
    // On a hybrid device a finger must never drive the cursor (nor reveal it).
    if (e.pointerType !== 'mouse') return;

    if (!revealed) {
      revealed = true;
      root.classList.add('ml-cursor-on');
    }

    if (seaDocTop !== null) {
      const next = e.clientY + window.scrollY >= seaDocTop;
      if (next !== inDive) {
        inDive = next;
        root.classList.toggle('ml-cursor-dive', inDive);
      }
    }

    xTo(e.clientX);
    yTo(e.clientY);
    glowXTo?.(e.clientX);
    glowYTo?.(e.clientY);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Re-measure only when layout can move the waterline: viewport resize, late
  // font/image settlement, AND any change in the document's size. `load` runs
  // once; `home.ts` refreshes ScrollTrigger at the same moment, so the cached
  // value tracks the settled layout.
  window.addEventListener('resize', measureSea, { passive: true });
  window.addEventListener('load', measureSea, { once: true });

  // A language switch (ES↔EN) rewrites the hero copy in place, changing its
  // height and shifting `.sea` down with NO `resize` event — so a ResizeObserver
  // on the root element re-runs `measureSea` whenever the document's size
  // changes. It only reads geometry here, never in the pointer handler, so the
  // cached `seaDocTop` follows the new waterline without per-move reads.
  let seaObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    seaObserver = new ResizeObserver(measureSea);
    seaObserver.observe(document.documentElement);
  }

  // The light "focuses" over interactive elements: the core expands (as before)
  // and the halo grows with it, modestly, so the glow stays a bounded layer.
  const magnets = gsap.utils.toArray<HTMLElement>('[data-magnetic]');
  const cleanups: Array<() => void> = [];

  magnets.forEach((el) => {
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: 'power3.out' });
    };
    const onEnter = () => {
      gsap.to(cursor, { scale: 2.2, duration: 0.3, ease: 'power2.out' });
      if (glow) gsap.to(glow, { scale: 1.4, duration: 0.3, ease: 'power2.out' });
    };
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
      if (glow) gsap.to(glow, { scale: 1, duration: 0.3, ease: 'power2.out' });
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    });
  });

  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', measureSea);
    window.removeEventListener('load', measureSea);
    seaObserver?.disconnect();
    root.classList.remove('ml-cursor-on', 'ml-cursor-dive');
    cleanups.forEach((fn) => fn());
    gsap.killTweensOf(cursor);
    if (glow) gsap.killTweensOf(glow);
  };
}
