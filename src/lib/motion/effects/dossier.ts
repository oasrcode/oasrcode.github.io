import gsap from 'gsap';

/**
 * About — dossier aside.
 *
 * A one-shot (not scrubbed) beat: each fact block settles in with a small
 * transform + opacity stagger, then its hairline separator draws (scaleX).
 * The aside is present the moment the reader arrives; the stagger only settles
 * it, keeping the pull-quote as the section's scrub-driven moment.
 *
 * Under reduced motion / no JS the items and rules render in their final,
 * fully-visible state.
 */
export function initDossier(): () => void {
  const wrap = document.querySelector<HTMLElement>('[data-dossier]');
  if (!wrap) return () => {};

  const items = gsap.utils.toArray<HTMLElement>('[data-dossier-item]', wrap);
  if (items.length === 0) return () => {};

  const rules = gsap.utils.toArray<HTMLElement>('[data-dossier-rule]', wrap);

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: { trigger: wrap, start: 'top 78%' },
  });

  tl.fromTo(
    items,
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
  );

  if (rules.length > 0) {
    tl.fromTo(
      rules,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6, stagger: 0.12, transformOrigin: 'left center' },
      0.12,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}
