import gsap from 'gsap';

/**
 * About — dossier aside.
 *
 * A one-shot (not scrubbed) beat in the section's entrance choreography: each
 * fact block fades in FROM THE RIGHT (x: positive → 0 + opacity) with a small
 * stagger, then its hairline separator draws (scaleX). The aside is present the
 * moment the reader arrives; the stagger only settles it. A short delay lets the
 * statement lines and the underline land first, so the order reads
 * statement → underline → dossier.
 *
 * Motion is transform/opacity only. Under reduced motion / no JS the items and
 * rules render in their final, fully-visible state.
 */
export function initDossier(): () => void {
  const wrap = document.querySelector<HTMLElement>('[data-dossier]');
  if (!wrap) return () => {};

  const items = gsap.utils.toArray<HTMLElement>('[data-dossier-item]', wrap);
  if (items.length === 0) return () => {};

  const rules = gsap.utils.toArray<HTMLElement>('[data-dossier-rule]', wrap);

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    // Let the statement lines + underline land before the aside follows.
    delay: 0.5,
    scrollTrigger: { trigger: wrap, start: 'top 78%', once: true },
  });

  tl.fromTo(items, { x: 28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, stagger: 0.12 }, 0);

  if (rules.length > 0) {
    tl.fromTo(
      rules,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6, ease: 'power2.out', stagger: 0.12, transformOrigin: 'left center' },
      0.12,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}
