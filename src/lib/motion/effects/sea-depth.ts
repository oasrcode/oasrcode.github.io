import gsap from 'gsap';

/**
 * Sea depth — one scrubbed 0→1 value that makes the descent feel alive.
 *
 * A single ScrollTrigger owns the descent progress (its range is the `.sea`
 * dive) and writes it as the CSS custom property `--sea-depth` on the
 * `.sea-atmosphere` element — the subtree that actually consumes it. Writing it
 * there (instead of on `.sea`) keeps the property from inheriting across the
 * whole ~4000px dive where nothing reads it. CSS consumes it (see
 * SeaAtmosphere.astro): the god-ray band fades out as you go deeper
 * (`opacity: calc(1 - var(--sea-depth))`).
 *
 * Only `--sea-depth` is written per frame — no geometry reads, no layout, no
 * colour interpolation; the consuming node animates `opacity` only. The
 * trigger range is element-relative, so `invalidateOnRefresh` lets ScrollTrigger
 * re-derive start/end on every refresh while `onRefresh` re-asserts the value.
 *
 * Defaulted to 0 (the `.sea-atmosphere` default and the consumer's fallback),
 * so under reduced motion / no JS the property is never set and the page rests
 * in the settled surface scene (rays visible).
 */
export function initSeaDepth(): () => void {
  const sea = document.querySelector<HTMLElement>('[data-sea]');
  const atmosphere = document.querySelector<HTMLElement>('[data-sea-atmosphere]');
  if (!sea || !atmosphere) return () => {};

  // Single source of truth: scroll progress -> `--sea-depth` (0 surface → 1 abyss).
  const state = { d: 0 };

  const apply = () => {
    atmosphere.style.setProperty('--sea-depth', state.d.toFixed(4));
  };

  const tween = gsap.to(state, {
    d: 1,
    ease: 'none',
    onUpdate: apply,
    scrollTrigger: {
      trigger: sea,
      // Full descent: 0 when the sea's top reaches the viewport top (the hero
      // has just cleared), 1 when its foot reaches the viewport bottom (the
      // footer is about to enter). The marine layer stays a pure function of
      // this one scrubbed value.
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      invalidateOnRefresh: true,
      onRefresh: () => {
        // No custom geometry to cache (ScrollTrigger owns the range); re-assert
        // the value once it has recomputed start/end on refresh.
        apply();
      },
    },
  });

  apply();

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    atmosphere.style.removeProperty('--sea-depth');
  };
}
