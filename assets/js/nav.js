/**
 * nav.js — Mobile navigation, focus management and scroll-spy.
 *
 * Contract:
 *   - Below 48em, with JS active, the primary nav ([data-nav]) becomes an
 *     off-canvas panel driven by [data-nav-toggle]; the `.is-open` class owns
 *     the visible state and `html.nav-open` owns the scroll lock.
 *   - While open: focus moves into the panel, is trapped within the panel plus
 *     the visible close trigger, Escape closes it and restores focus to the
 *     trigger, a pointer outside closes it, and document scroll is locked
 *     (compensating the scrollbar width so nothing shifts horizontally).
 *   - Crossing back to >= 48em always closes the panel.
 *   - [data-nav-link] anchors are tracked with an IntersectionObserver; the
 *     link for the section crossing the viewport's middle band receives
 *     `aria-current="true"` plus the `.is-active` class and all others are
 *     cleared.
 *
 * Everything here is additive: with JS disabled the nav is a plain, visible
 * list and every anchor keeps working natively.
 */

const DESKTOP_QUERY = '(min-width: 48em)';
const OPEN_LABEL = 'Abrir menú de navegación';
const CLOSE_LABEL = 'Cerrar menú de navegación';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Focusable descendants that are actually laid out (skips `display:none`,
 * `visibility:hidden` and zero-sized nodes).
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  );
}

/**
 * Wire up the mobile panel and the scroll-spy. Safe to call when the markup is
 * absent (returns without side effects).
 */
export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (!toggle || !nav) return;

  const links = Array.from(nav.querySelectorAll('[data-nav-link]'));
  const desktop = window.matchMedia(DESKTOP_QUERY);

  let isOpen = false;

  function lockScroll() {
    // Reserve the space the scrollbar occupied so locking cannot shift layout.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) {
      document.documentElement.style.setProperty('--scrollbar-gap', `${gap}px`);
    } else {
      document.documentElement.style.removeProperty('--scrollbar-gap');
    }
    document.documentElement.classList.add('nav-open');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('nav-open');
    document.documentElement.style.removeProperty('--scrollbar-gap');
  }

  function open() {
    if (isOpen || desktop.matches) return;

    isOpen = true;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', CLOSE_LABEL);
    nav.classList.add('is-open');
    lockScroll();

    // The panel is fixed and already on screen: never let focus nudge the page.
    const [first] = getFocusable(nav);
    if (first) first.focus({ preventScroll: true });
  }

  /**
   * @param {{ restoreFocus?: boolean }} [options]
   */
  function close({ restoreFocus = false } = {}) {
    if (!isOpen) return;

    isOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', OPEN_LABEL);
    nav.classList.remove('is-open');
    unlockScroll();

    // The trigger lives in the sticky header, so it is already visible.
    if (restoreFocus) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => {
    if (isOpen) close({ restoreFocus: true });
    else open();
  });

  // A pointer outside the panel (and outside the trigger) dismisses it.
  document.addEventListener('pointerdown', (event) => {
    if (!isOpen) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    if (nav.contains(target) || toggle.contains(target)) return;

    close();
  });

  // Escape closes and restores focus; Tab is trapped within the panel.
  document.addEventListener('keydown', (event) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusable(nav);
    if (focusable.length === 0) return;

    // The visible close (toggle) button is a sibling of the panel, so it is not
    // returned by getFocusable(nav). Include it in the cycle explicitly:
    // link[0] … link[n-1] → toggle → link[0] (and the reverse with Shift+Tab).
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === toggle) {
        event.preventDefault();
        last.focus();
      } else if (active === first || !nav.contains(active)) {
        event.preventDefault();
        toggle.focus();
      }
    } else if (active === toggle) {
      event.preventDefault();
      first.focus();
    } else if (active === last || !nav.contains(active)) {
      event.preventDefault();
      toggle.focus();
    }
  });

  // Activating an in-page link closes the panel and hands focus to the target,
  // so keyboard users continue where the page scrolled to.
  nav.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('a[href]');
    if (!link || !nav.contains(link)) return;

    const hash = link.getAttribute('href');
    close();

    if (!hash || !hash.startsWith('#')) return;

    const destination = document.querySelector(hash);
    if (!destination) return;

    if (!destination.hasAttribute('tabindex')) {
      destination.setAttribute('tabindex', '-1');
      destination.addEventListener(
        'blur',
        () => destination.removeAttribute('tabindex'),
        { once: true }
      );
    }
    destination.focus({ preventScroll: true });
  });

  // The panel must never remain open once the layout reaches desktop width.
  const onBreakpointChange = (event) => {
    if (event.matches) close();
  };
  if (typeof desktop.addEventListener === 'function') {
    desktop.addEventListener('change', onBreakpointChange);
  } else if (typeof desktop.addListener === 'function') {
    desktop.addListener(onBreakpointChange);
  }

  initScrollSpy(links);
}

/**
 * Mark the nav link whose section is crossing the viewport centre.
 * @param {HTMLAnchorElement[]} links
 */
function initScrollSpy(links) {
  if (!('IntersectionObserver' in window) || links.length === 0) return;

  const pairs = links
    .map((link) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return null;

      const section = document.querySelector(hash);
      return section ? { link, section } : null;
    })
    .filter((pair) => pair !== null);

  if (pairs.length === 0) return;

  const visible = new Set();

  function update() {
    const active = pairs.find((pair) => visible.has(pair.section));

    pairs.forEach(({ link, section }) => {
      if (active && active.section === section) {
        link.setAttribute('aria-current', 'true');
        link.classList.add('is-active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      update();
    },
    {
      // A thin band across the middle of the viewport. A section becomes active
      // when it crosses the centre, so the highlight changes at predictable
      // scroll positions instead of on every pixel.
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    }
  );

  pairs.forEach(({ section }) => observer.observe(section));
}
