import gsap from 'gsap';

/**
 * About — pull-quote reveal.
 *
 * The statement itself is a [data-wipe] like the section headings, but it is
 * excluded from the shared title wipe and opened here on a later, tighter
 * window: the mask starts only once the quote is well inside the viewport
 * (its top at ~76% — the lower quarter) and opens by the time it reaches 46%.
 * That way the quote is never caught clipped/half-revealed as the section
 * enters view, at any load size.
 *
 * As the mask settles, the signature bar (--spark -> --trigger, the hero's
 * motif) draws under the accented phrase: a single scrub on transform: scaleX,
 * so it stays on the compositor and in lockstep with scroll — one beat just
 * after the mask, not a competing reveal.
 *
 * Under reduced motion / no JS this effect never runs and both the statement
 * and the bar render at their final, fully-visible state.
 */
export function initQuoteBar(): () => void {
  const bar = document.querySelector<HTMLElement>('[data-quote-bar]');
  if (!bar) return () => {};

  // Anchor both beats to the quote itself.
  const quote = bar.closest<HTMLElement>('[data-wipe]') ?? bar;

  // 1) Mask wipe — deliberately late so the statement enters already hidden
  //    and only opens once it is well within the viewport.
  const wipe = gsap.fromTo(
    quote,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      ease: 'none',
      scrollTrigger: {
        trigger: quote,
        start: 'top 76%',
        end: 'top 46%',
        scrub: true,
      },
    },
  );

  // 2) Gradient bar — draws as the mask finishes.
  const tween = gsap.fromTo(
    bar,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: quote,
        start: 'top 66%',
        end: 'top 40%',
        scrub: true,
      },
    },
  );

  return () => {
    wipe.scrollTrigger?.kill();
    wipe.kill();
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
