/**
 * client.ts — nav utilities: the live Canary-Islands clock, the mobile
 * disclosure menu, and the scroll-driven bar detach.
 *
 * All are progressive enhancements layered on top of the server-rendered nav:
 *  - the clock ships as a static placeholder and is only filled by JS, so a
 *    no-JS visitor sees a neutral `--:--:--` rather than a wrong time;
 *  - the menu collapses into a burger only when `html.nav-js` is set (the
 *    inline bootstrap in `Nav.astro`), so without JS the links stay visible in
 *    the flow at every width;
 *  - the bar detaches from the top on scroll via `html.nav-scrolled`; without
 *    JS the class is never added, so the bar stays flush and usable.
 *
 * The language switch needs no code here: the single-URL i18n client already
 * wires every `[data-lang-set]` control and swaps the whole document in place.
 */

/** Reference timezone for the clock (Canary Islands). */
const TIME_ZONE = 'Atlantic/Canary';

/** Breakpoint at which the centre links collapse behind the burger. */
const MOBILE_QUERY = '(max-width: 700px)';

/** Scroll offsets (px) at which the bar detaches and re-attaches. The gap
 *  between them is hysteresis: it stops the bar flickering while a short scroll
 *  or a trackpad jitter parks it right on the threshold. */
const SCROLL_DETACH_AT = 12;
const SCROLL_ATTACH_AT = 4;

/** Class on <html> that switches the bar to its detached, floating state. */
const SCROLLED_CLASS = 'nav-scrolled';

/** Build a `HH:MM:SS` (24h) formatter, optionally pinned to Canary time. */
function makeFormatter(withTimeZone: boolean): Intl.DateTimeFormat | null {
  try {
    return new Intl.DateTimeFormat(undefined, {
      ...(withTimeZone ? { timeZone: TIME_ZONE } : {}),
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return null;
  }
}

/** Keep every `[data-nav-clock]` node showing the live Canary-Islands time. */
function initClock(): void {
  const nodes = document.querySelectorAll<HTMLTimeElement>('[data-nav-clock]');
  if (nodes.length === 0) return;

  // Canary time is the reference; fall back to local time if the zone is
  // unavailable in the runtime (older/limited Intl data).
  const formatter = makeFormatter(true) ?? makeFormatter(false);
  if (!formatter) return;

  const tick = (): void => {
    const now = new Date();
    const text = formatter.format(now);
    for (const node of nodes) {
      node.textContent = text;
      node.dateTime = now.toISOString();
      if (!node.title) node.title = TIME_ZONE;
    }
  };

  tick();
  window.setInterval(tick, 1000);
}

/** Wire the burger disclosure: open/close, Escape, link click, breakpoint. */
function initMenu(): void {
  const header = document.querySelector<HTMLElement>('[data-nav]');
  const burger = document.querySelector<HTMLButtonElement>('[data-nav-burger]');
  const menu = document.getElementById('primary-nav');
  if (!header || !burger || !menu) return;

  const isOpen = (): boolean => header.hasAttribute('data-nav-open');

  const setOpen = (open: boolean): void => {
    header.toggleAttribute('data-nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };

  burger.addEventListener('click', () => setOpen(!isOpen()));

  // Following a link closes the panel so the target is not left behind it.
  menu.addEventListener('click', (event) => {
    if ((event.target as Element | null)?.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      burger.focus();
    }
  });

  // Leaving the mobile breakpoint must never strand an open panel.
  const mobile = window.matchMedia(MOBILE_QUERY);
  const syncToViewport = (): void => {
    if (!mobile.matches) setOpen(false);
  };
  mobile.addEventListener('change', syncToViewport);
  syncToViewport();
}

/**
 * Toggle the bar's detached state from the scroll position.
 *
 * Reads the class the inline bootstrap may have set (so a page restored at an
 * offset starts already detached), then keeps it in sync on scroll. Updates are
 * coalesced into one rAF, the listener is passive, and the two thresholds give
 * hysteresis so the state cannot flicker around the boundary.
 */
function initScrollState(): void {
  const root = document.documentElement;
  let scrolled = root.classList.contains(SCROLLED_CLASS);
  let scheduled = false;

  const sync = (): void => {
    scheduled = false;
    const y = window.scrollY || window.pageYOffset || 0;
    if (!scrolled && y > SCROLL_DETACH_AT) scrolled = true;
    else if (scrolled && y < SCROLL_ATTACH_AT) scrolled = false;
    if (scrolled !== root.classList.contains(SCROLLED_CLASS)) {
      root.classList.toggle(SCROLLED_CLASS, scrolled);
    }
  };

  const onScroll = (): void => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(sync);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Layout changes (resize, responsive reflow) can move the scroll position
  // above or below a threshold, so re-evaluate once the viewport settles.
  window.addEventListener('resize', onScroll, { passive: true });
  sync();
}

/** Boot the nav enhancements. Safe to call on any page. */
export function initNav(): void {
  initClock();
  initMenu();
  initScrollState();
}
