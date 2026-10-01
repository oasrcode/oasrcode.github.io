import gsap from 'gsap';

/**
 * 04 — Pinned horizontal gallery (the signature moment).
 * ≥769px: the wrapper pins and the track translates on X, scrubbed.
 * ≤768px: no pin, no horizontal motion — cards reveal vertically instead.
 * No horizontal page scroll: the wrapper clips its overflowing track.
 *
 * Conditional on the project count: with 0 or 1 projects there is nothing to
 * scroll horizontally, so the effect bails before creating any pin/track/spacer
 * and re-enables automatically once ≥2 projects are rendered.
 */
export function initGallery(): () => void {
  const pin = document.querySelector<HTMLElement>('[data-pin]');
  const cardCount = pin?.querySelectorAll('[data-pin-card]').length ?? 0;
  if (!pin || cardCount < 2) {
    return () => {};
  }

  const mm = gsap.matchMedia();

  mm.add('(min-width: 769px)', () => {
    const section = document.querySelector<HTMLElement>('[data-pin]');
    const track = document.querySelector<HTMLElement>('[data-pin-track]');
    if (!section || !track) return;

    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: 'x' });
    };
  });

  mm.add('(max-width: 768px)', () => {
    const cards = gsap.utils.toArray<HTMLElement>('[data-pin] [data-pin-card]');
    // fromTo (not from): the cards' initial hidden state is CSS-gated, so a
    // `from` tween would read opacity 0 as its end value and never reveal them.
    const tween = gsap.fromTo(
      cards,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-pin]', start: 'top 85%' },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  });

  return () => mm.revert();
}
