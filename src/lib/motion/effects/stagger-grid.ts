import gsap from 'gsap';

/**
 * 05 — Stagger-in grid.
 * Tags rise and fade in with a transform-only stagger when the grid enters.
 */
export function initStaggerGrid(): () => void {
  const grid = document.querySelector<HTMLElement>('[data-stagger]');
  if (!grid) return () => {};

  const items = gsap.utils.toArray<HTMLElement>('[data-stagger-item]', grid);

  const tween = gsap.fromTo(
    items,
    { y: 20, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      stagger: { each: 0.05, from: 'start' },
      scrollTrigger: { trigger: grid, start: 'top 82%' },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
