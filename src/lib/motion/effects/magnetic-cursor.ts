import gsap from 'gsap';
import { hasFinePointer, isTouchDevice } from '../env';

/**
 * 07 — Magnetic cursor.
 * A custom ring lags behind the pointer (quickTo) and scales on interactive
 * elements, which drift toward the cursor. Disabled on touch devices/coarse
 * pointers. The native pointer stays visible so nothing becomes unusable.
 */
export function initMagneticCursor(): () => void {
  if (!hasFinePointer() || isTouchDevice()) return () => {};

  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  if (!cursor) return () => {};

  document.documentElement.classList.remove('ml-cursor-on');
  gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });

  // Keep the ring hidden until the pointer actually moves, so it never appears
  // resting at the centre of a freshly loaded page.
  let revealed = false;
  const onPointerMove = (e: PointerEvent) => {
    if (!revealed) {
      revealed = true;
      document.documentElement.classList.add('ml-cursor-on');
    }
    xTo(e.clientX);
    yTo(e.clientY);
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const magnets = gsap.utils.toArray<HTMLElement>('[data-magnetic]');
  const cleanups: Array<() => void> = [];

  magnets.forEach((el) => {
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: 'power3.out' });
    };
    const onEnter = () => gsap.to(cursor, { scale: 2.4, duration: 0.3, ease: 'power2.out' });
    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out' });
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
    document.documentElement.classList.remove('ml-cursor-on');
    cleanups.forEach((fn) => fn());
    gsap.killTweensOf(cursor);
  };
}
