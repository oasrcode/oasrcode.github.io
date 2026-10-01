import gsap from 'gsap';

/**
 * 02 — Section title wipe.
 * Headings are opened by a clip-path inset wipe scrubbed to scroll progress.
 * Applied to every [data-wipe] heading on the page.
 *
 * The About pull-quote is also a [data-wipe], but it is deliberately excluded:
 * it reveals on a later, tighter window in `initQuoteBar` so the statement can
 * never be caught half-drawn as it enters the viewport.
 */
export function initTitleWipe(): () => void {
  const items = gsap.utils
    .toArray<HTMLElement>('[data-wipe]')
    .filter((el) => !el.querySelector('[data-quote-bar]'));

  const tweens = items.map((el) =>
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          end: 'top 48%',
          scrub: true,
        },
      },
    ),
  );

  return () => tweens.forEach((t) => t.scrollTrigger?.kill());
}
