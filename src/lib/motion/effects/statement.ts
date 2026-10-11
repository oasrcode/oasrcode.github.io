import gsap from 'gsap';

/**
 * About — statement entrance.
 *
 * One-shot choreography for the section's display pull-quote, replacing the old
 * scroll-scrubbed clip wipe. The statement is authored as two forced visual
 * lines (`[data-manifesto-line]`): the lead phrase, then the accented phrase and
 * its full stop. They rise + fade in line by line with a small stagger, then the
 * signature bar (`[data-quote-bar]`, solid --spark) draws left→right — a single
 * pass, no scrub, no reverse.
 *
 * Lines are explicit elements rather than SplitText output: the accented phrase
 * is a `nowrap` inline whose absolutely-positioned bar must never be clipped or
 * re-measured, and the i18n switcher rewrites the `[data-i18n]` spans in place —
 * splitting the DOM would desync both. The two blocks are deterministic across
 * locales and widths, so the size calibration always holds.
 *
 * Motion is transform/opacity only (off the layout path). Under reduced motion /
 * no JS this effect never runs and both the statement and the bar render at
 * their final, fully-visible state.
 */
export function initStatement(): () => void {
  const quote = document.querySelector<HTMLElement>('[data-manifesto]');
  if (!quote) return () => {};

  const lines = gsap.utils.toArray<HTMLElement>('[data-manifesto-line]', quote);
  if (lines.length === 0) return () => {};

  const bar = quote.querySelector<HTMLElement>('[data-quote-bar]');

  // One-shot: plays once when the statement enters, then never again.
  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    scrollTrigger: { trigger: quote, start: 'top 80%', once: true },
  });

  // 1) Statement — line 1 then line 2, small stagger.
  tl.fromTo(lines, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.14 }, 0);

  // 2) Signature bar — draws left→right once, as the lines settle.
  if (bar) {
    tl.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.55, ease: 'power2.out', transformOrigin: 'left center' },
      0.42,
    );
  }

  return () => {
    tl.scrollTrigger?.kill();
    tl.kill();
  };
}
