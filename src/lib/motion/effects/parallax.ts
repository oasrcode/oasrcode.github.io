import gsap from 'gsap';

/**
 * 06 — Parallax layers.
 * Three stacked layers translate on Y at different speeds, scrubbed across
 * the viewport. Transform only.
 */
export function initParallax(): () => void {
  const wrap = document.querySelector<HTMLElement>('[data-parallax]');
  if (!wrap) return () => {};

  const layers = gsap.utils.toArray<HTMLElement>('[data-parallax] [data-speed]');

  const tweens = layers.map((layer) => {
    const speed = Number.parseFloat(layer.dataset.speed ?? '0.5');
    const offset = Number.isFinite(speed) ? speed * 18 : 9;
    return gsap.fromTo(
      layer,
      { yPercent: offset },
      {
        yPercent: -offset,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });

  return () => tweens.forEach((t) => t.scrollTrigger?.kill());
}
