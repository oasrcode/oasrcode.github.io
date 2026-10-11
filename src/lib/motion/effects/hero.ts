import gsap from 'gsap';

/**
 * Home hero — the live nib + a light entrance for the supporting content.
 *
 * The name is NOT drawn by JS: it is the client's animated signature SVG,
 * inlined in the DOM (HeroName.astro), and its per-stroke drawing is a
 * pure-CSS animation that runs on load — no JS, no custom drawing code, and
 * the authored ~3.387s total timing is untouched.
 *
 * One beat rides on top of that CSS draw: a live nib (Hero.astro's
 * `.hero__nib`) that follows the ink's leading edge while the signature draws.
 *
 * The nib loop reads the 30 running `.recorrido` CSS animations, picks the
 * stroke currently being drawn, and maps its current point through the SVG
 * viewBox into the element box. It must only run under `html.js-motion` — this
 * effect is only ever booted from `initHomeMotion()` in that state — and it is
 * fully cleaned up on teardown, leaving the nib hidden. The nib rests at
 * `visibility: hidden` + `opacity: 0` and is revealed by toggling the
 * `is-active` class, so no stray dot can ever paint at its default origin.
 *
 * This effect also settles the supporting fades after the signature begins:
 * four `[data-hero-fade]` nodes (top row, statement, right profile column,
 * actions), revealed in document order trailing the first strokes.
 * Reduced motion / no JS never reach here: the inline bootstrap does not add
 * `js-motion`, and the CSS shows the finished state.
 */
export function initHomeHero(): () => void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return () => {};

  const cleanups: Array<() => void> = [];

  // Live nib. Non-null only when there is a signature to follow.
  const stopNib = initSignatureNib(hero);
  if (stopNib) cleanups.push(stopNib);

  // Supporting fades (unchanged behaviour).
  const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
  if (fades.length) {
    gsap.set(fades, { opacity: 0, y: 20 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to(fades, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.35);
    cleanups.push(() => tl.kill());
  }

  return () => cleanups.forEach((fn) => fn());
}

/**
 * "Live nib": place the hero's `[data-nib-dot]` at the leading edge of the
 * ink as the signature draws.
 *
 * The signature reveals itself through 30 `.recorrido` mask strokes, each a
 * `<path>` whose `stroke-dashoffset` animates 1000 → 0 (the `escribir` CSS
 * animation) from the path start to its end. Every frame we ask each stroke's
 * running CSS animation for its progress, keep the one with the greatest
 * delay, and place the nib at `getPointAtLength(progress * length)` mapped from
 * the SVG viewBox to the element rect. The nib therefore always sits on the
 * visible ink's leading edge, fading at pen lifts and vanishing when the draw
 * completes.
 *
 * The nib is decorative and its visibility is owned entirely by the
 * `is-active` class; it starts hidden (visibility + opacity) in CSS, so without
 * this effect it simply never appears.
 */
function initSignatureNib(hero: HTMLElement): (() => void) | null {
  const wrap = hero.querySelector<HTMLElement>('[data-nibwrap]');
  const svg = wrap?.querySelector<SVGSVGElement>('svg');
  const nib = wrap?.querySelector<HTMLElement>('[data-nib-dot]');
  if (!wrap || !svg || !nib) return null;

  type Stroke = { p: SVGPathElement; anim: Animation; delay: number };
  const items: Stroke[] = [];

  svg.querySelectorAll<SVGPathElement>('path.recorrido').forEach((p) => {
    if (typeof p.getAnimations !== 'function') return;
    const anims = p.getAnimations();
    const anim =
      anims.find((a) => (a as CSSAnimation).animationName === 'escribir') ||
      anims[0];
    const effect = anim?.effect;
    if (!anim || !effect) return;
    items.push({ p, anim, delay: effect.getTiming().delay || 0 });
  });

  if (!items.length) return null;

  const vb = svg.viewBox.baseVal;
  const vw = vb && vb.width ? vb.width : 2048;
  const vh = vb && vb.height ? vb.height : 682;

  // --- geometry: measured once (and on resize/load), NEVER per frame -------
  // The signature's box is stable while the draw plays (the CSS animation only
  // moves stroke-dashoffset, and the hero fades never touch the signature's
  // ancestors), so the viewBox → element mapping is cached here. Reading
  // `getBoundingClientRect()` inside the rAF loop used to force a document-wide
  // style/layout recalc every frame (the nib's own writes dirty the document),
  // which was the largest main-thread cost of the whole boot.
  let originX = 0;
  let originY = 0;
  let scaleX = 1;
  let scaleY = 1;

  const measure = () => {
    const rect = svg.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    originX = rect.left - wrapRect.left;
    originY = rect.top - wrapRect.top;
    scaleX = rect.width / vw;
    scaleY = rect.height / vh;
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  // A language switch rewrites the hero copy in place, which can shift the
  // signature with no `resize` event; observing the root re-measures whenever
  // the document's size changes. Same guard the magnetic cursor uses.
  let boxObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    boxObserver = new ResizeObserver(measure);
    boxObserver.observe(document.documentElement);
  }

  let raf = 0;
  let cancelled = false;
  // Track the revealed state so the class is only toggled when it actually
  // changes — a per-frame toggle would dirty style every frame.
  let active = false;
  // Safety stop a little after the authored draw ends; the nib is naturally
  // hidden earlier (no running stroke) — this only ends the rAF loop.
  const deadline = performance.now() + 5000;

  const setActive = (on: boolean) => {
    if (on === active) return;
    active = on;
    nib.classList.toggle('is-active', on);
  };

  const tick = () => {
    if (cancelled) return;

    let best: Stroke | null = null;
    let bestProgress = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      // `progress` is null during the delay and 1 once finished; only a
      // genuinely running stroke with progress < 1 is being drawn. Guarding on
      // playState keeps finished strokes (which can report 0.999…) from
      // parking the nib after the signature is complete.
      if (it.anim.playState !== 'running') continue;
      const prog = it.anim.effect?.getComputedTiming().progress;
      if (prog === null || prog === undefined || prog >= 1) continue;
      if (!best || it.delay >= best.delay) {
        best = it;
        bestProgress = prog;
      }
    }

    if (best && scaleX > 0) {
      const pt = best.p.getPointAtLength(bestProgress * best.p.getTotalLength());
      const x = originX + pt.x * scaleX;
      const y = originY + pt.y * scaleY;
      nib.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      setActive(true);
    } else {
      setActive(false);
    }

    if (performance.now() < deadline) {
      raf = requestAnimationFrame(tick);
    } else {
      setActive(false);
    }
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', measure);
    window.removeEventListener('load', measure);
    boxObserver?.disconnect();
    setActive(false);
    nib.style.transform = '';
  };
}
