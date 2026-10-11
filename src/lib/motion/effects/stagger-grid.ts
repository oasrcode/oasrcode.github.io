import gsap from 'gsap';

/**
 * 05 — Stagger-in grid.
 * Groups rise and fade in, one after another, when the grid enters; the tags
 * inside each group are not animated here.
 */
export function initStaggerGrid(): () => void {
  const grid = document.querySelector<HTMLElement>('[data-stagger]');
  if (!grid) return () => {};

  const groups = gsap.utils.toArray<HTMLElement>('[data-stagger-group]', grid);

  const tween = gsap.fromTo(
    groups,
    { y: 20, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      stagger: { each: 0.12, from: 'start' },
      scrollTrigger: { trigger: grid, start: 'top 82%' },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
