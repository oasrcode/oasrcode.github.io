/**
 * reveal.js — One-shot scroll reveal for [data-reveal] elements.
 *
 * The pre-reveal state lives behind the `.js` class (added by an inline script
 * in <head>), so when JavaScript is unavailable every element renders visible.
 * Only `opacity` and `transform` animate, which never affects layout, so the
 * transition cannot cause CLS.
 *
 * Each element is unobserved after its first reveal, so it never re-animates
 * when scrolled away and back.
 */

const REVEAL_SELECTOR = '[data-reveal]';
const VISIBLE_CLASS = 'is-visible';

/** Initialise the reveal observer. Call once on load. */
export function initReveal() {
  const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
  if (elements.length === 0) return;

  // No IntersectionObserver: show everything immediately (safe fallback).
  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(VISIBLE_CLASS));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add(VISIBLE_CLASS);
        instance.unobserve(entry.target);
      });
    },
    {
      // Reveal slightly before the element is fully in view so the motion is
      // perceptible without feeling late.
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.1,
    }
  );

  elements.forEach((element) => observer.observe(element));
}
