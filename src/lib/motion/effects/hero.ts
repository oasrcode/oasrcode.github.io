import gsap from 'gsap';

/**
 * Home hero — a light entrance for the supporting copy and CTAs.
 *
 * The name is NO LONGER drawn by JS: the hero name is the client's animated
 * signature SVG, inlined in the DOM (HeroName.astro), and its per-stroke
 * drawing is a pure-CSS animation that runs on load — no JS, no custom drawing
 * code, and the authored ~10.311s timing is untouched.
 *
 * This effect therefore only settles the role/value/CTA fades after the name
 * starts writing. Reduced motion / no JS never reach here: the inline
 * bootstrap does not add `js-motion`, and the CSS shows the finished state.
 */
export function initHomeHero(): () => void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return () => {};

  const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');
  if (!fades.length) return () => {};

  gsap.set(fades, { opacity: 0, y: 16 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(fades, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.2);

  return () => tl.kill();
}
