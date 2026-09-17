// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Wave 3 acceptance — mobile navigation, scroll-spy, anchor offsets and
 * scroll reveals.
 *
 * Covers: mobile panel open/close, focus entry + trap, Escape, link activation,
 * scroll lock, resize-to-desktop close, scroll-spy, sticky-header offset,
 * one-shot reveals, reduced motion, the no-JS fallback, console/network health
 * and horizontal overflow.
 */

const MOBILE = { width: 375, height: 780 };
const TABLET = { width: 768, height: 1024 };
const DESKTOP = { width: 1440, height: 900 };
const SECTIONS = ['about', 'experience', 'stack', 'education', 'contact'];

/**
 * Wait for a smooth scroll to start AND then stay stable for 4 samples. It
 * cannot return before the animation begins, so the measured position is the
 * real landing position (a helper that only samples for stability could return
 * on the initial frame, before the smooth scroll has moved).
 */
async function waitForScrollEndStable(page) {
  const start = await page.evaluate(() => window.scrollY);
  let previous = start;
  let stable = 0;
  let started = false;

  for (let i = 0; i < 120; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(50);
    // eslint-disable-next-line no-await-in-loop
    const current = await page.evaluate(() => window.scrollY);
    if (current !== start) started = true;

    if (started && current === previous) {
      stable += 1;
      if (stable >= 4) return current;
    } else {
      stable = 0;
    }
    previous = current;
  }
  return previous;
}

/** Wait until the webfonts have settled (avoids measuring a mid-scroll swap). */
async function waitForFonts(page) {
  for (let i = 0; i < 60; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const status = await page.evaluate(() => (document.fonts ? document.fonts.status : 'loaded'));
    if (status === 'loaded') return;
    // eslint-disable-next-line no-await-in-loop
    await page.waitForTimeout(100);
  }
}

async function activeNavHrefs(page) {
  return page.$$eval('.site-nav__link[aria-current="true"]', (links) =>
    links.map((link) => link.getAttribute('href'))
  );
}

test.describe('mobile menu', () => {
  test('trigger opens the panel, moves focus into it and reflects state', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    const nav = page.locator('[data-nav]');

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'primary-nav');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();

    const focusInside = await page.evaluate(() => {
      const panel = document.querySelector('[data-nav]');
      return Boolean(panel && document.activeElement && panel.contains(document.activeElement));
    });
    expect(focusInside).toBe(true);
  });

  test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const activeId = await page.evaluate(() => document.activeElement?.id);
    expect(activeId).toBe('nav-toggle');
  });

  test('Tab cycle includes the close button and stays trapped', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const nav = page.locator('[data-nav]');
    const links = nav.locator('[data-nav-link]');
    const linkCount = await links.count();

    await page.locator('[data-nav-toggle]').click();
    await expect(page.locator('[data-nav-toggle]')).toHaveAttribute('aria-expanded', 'true');

    const readFocus = () =>
      page.evaluate(() => {
        const element = document.activeElement;
        const panel = document.querySelector('[data-nav]');
        return {
          inPanel: Boolean(panel && element && panel.contains(element)),
          isToggle: Boolean(element && element.id === 'nav-toggle'),
          text: element ? element.textContent?.trim() : null,
        };
      });

    // Forward cycle: link[0] … link[n-1] → toggle → link[0]. Focus must stay
    // inside the panel OR on the visible close button at every step.
    const seen = [];
    for (let index = 0; index < linkCount + 1; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const active = await readFocus();
      seen.push(active);
      expect(active.inPanel || active.isToggle, `focus escaped at step ${index}`).toBe(true);
      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press('Tab');
    }

    // Every link and the toggle are reachable within one cycle…
    expect(seen.every((active) => active.inPanel || active.isToggle)).toBe(true);
    expect(seen.some((active) => active.isToggle)).toBe(true);
    // …and after the full cycle focus wraps back to the first link.
    const wrapped = await readFocus();
    expect(wrapped.inPanel).toBe(true);
    expect(wrapped.text).toBe((await links.first().textContent())?.trim());

    // Shift+Tab from the first link wraps to the toggle; from the toggle it
    // wraps back to the last link.
    await links.first().focus();
    await page.keyboard.press('Shift+Tab');
    expect((await readFocus()).isToggle).toBe(true);

    await page.keyboard.press('Shift+Tab');
    const back = await readFocus();
    expect(back.inPanel).toBe(true);
    expect(back.text).toBe((await links.last().textContent())?.trim());
  });

  test('activating an in-page link closes the panel and navigates', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('[data-nav]').getByRole('link', { name: 'Stack' }).click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#stack$/);

    await waitForScrollEndStable(page);

    const { top, headerHeight } = await page.evaluate(() => ({
      top: document.getElementById('stack').getBoundingClientRect().top,
      headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
    }));
    expect(top).toBeGreaterThanOrEqual(headerHeight - 1);
  });

  test('locks background scroll while open without shifting layout', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    const readState = () =>
      page.evaluate(() => ({
        body: getComputedStyle(document.body).overflow,
        html: getComputedStyle(document.documentElement).overflow,
        y: window.scrollY,
        brandLeft: document.querySelector('.site-header__brand').getBoundingClientRect().left,
        headerTop: document.querySelector('.site-header').getBoundingClientRect().top,
      }));

    // Start part-way down so scroll preservation and the sticky header are
    // actually exercised (they would both be trivially true at the top).
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(150);

    const before = await readState();
    expect(before.body).not.toBe('hidden');
    expect(before.html).not.toBe('hidden');
    expect(Math.abs(before.headerTop)).toBeLessThan(1);

    // Coordinate click: Playwright's locator click pre-scrolls a sticky target
    // (toward its static document position), which a real user gesture does not.
    const box = await toggle.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200);
    const during = await readState();

    expect(during.body).toBe('hidden');
    // <html> must stay visible: freezing it would break `position: sticky`.
    expect(during.html).toBe(before.html);
    expect(during.y).toBe(before.y);
    expect(during.brandLeft).toBe(before.brandLeft);
    expect(Math.abs(during.headerTop)).toBeLessThan(1);

    // A user wheel gesture must not move the locked page.
    await page.mouse.move(8, Math.floor(MOBILE.height / 2));
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(before.y);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const after = await readState();
    expect(after.body).toBe(before.body);
    expect(after.html).toBe(before.html);
    expect(after.y).toBe(before.y);
  });

  test('resizing to desktop width closes the panel', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/', { waitUntil: 'load' });

    const toggle = page.locator('[data-nav-toggle]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.setViewportSize(DESKTOP);

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeHidden();

    const locked = await page.evaluate(() =>
      document.documentElement.classList.contains('nav-open')
    );
    expect(locked).toBe(false);
  });
});

test.describe('scroll-spy and anchors', () => {
  test('marks exactly one active link at three scroll positions', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/', { waitUntil: 'load' });

    for (const id of ['about', 'experience', 'stack']) {
      // eslint-disable-next-line no-await-in-loop
      await page.evaluate((target) => {
        const section = document.getElementById(target);
        const rect = section.getBoundingClientRect();
        const centre = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
        window.scrollTo(0, centre);
      }, id);

      // eslint-disable-next-line no-await-in-loop
      await expect.poll(() => activeNavHrefs(page).then((hrefs) => hrefs[0])).toBe(`#${id}`);
      // eslint-disable-next-line no-await-in-loop
      const hrefs = await activeNavHrefs(page);
      expect(hrefs, `active links at #${id}`).toEqual([`#${id}`]);
    }
  });

  test('anchor navigation clears the sticky header', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/', { waitUntil: 'load' });

    await page.locator('.site-nav__link[href="#experience"]').click();
    await waitForScrollEndStable(page);

    const { top, headerHeight } = await page.evaluate(() => ({
      top: document.getElementById('experience').getBoundingClientRect().top,
      headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
    }));

    expect(top).toBeGreaterThanOrEqual(headerHeight);
  });
});

test.describe('scroll reveal', () => {
  test('reveals once and never re-animates', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/', { waitUntil: 'load' });

    const target = page.locator('#about .about__layout');

    const initial = await target.evaluate((element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, transform: style.transform };
    });
    expect(Number(initial.opacity)).toBeLessThan(0.05);
    expect(initial.transform).not.toBe('none');

    await page.evaluate(() =>
      document.querySelector('#about .about__layout').scrollIntoView({ block: 'center' })
    );

    await expect
      .poll(() => target.evaluate((element) => getComputedStyle(element).opacity))
      .toBe('1');

    const revealed = await target.evaluate((element) => {
      const style = getComputedStyle(element);
      return { opacity: style.opacity, transform: style.transform };
    });
    expect(revealed.opacity).toBe('1');
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(revealed.transform);

    // Scroll far away and back: the element stays visible (observer gone).
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    expect(await target.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');

    await page.evaluate(() =>
      document.querySelector('#about .about__layout').scrollIntoView({ block: 'center' })
    );
    await page.waitForTimeout(200);
    expect(await target.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
  });

  test('reduced motion shows content immediately with no transform', async ({ browser }) => {
    const context = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });

    const state = await page.evaluate(() => {
      const element = document.querySelector('.contact__links');
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        transform: style.transform,
        transitionDuration: style.transitionDuration,
      };
    });

    expect(state.opacity).toBe('1');
    expect(state.transform).toBe('none');
    expect(state.transitionDuration).toBe('0s');

    await context.close();
  });
});

test.describe('progressive enhancement', () => {
  test('with JavaScript disabled content is visible and desktop anchors work', async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: DESKTOP, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });

    await expect(page.locator('html')).not.toHaveClass(/js/);

    for (const id of SECTIONS) {
      // eslint-disable-next-line no-await-in-loop
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    const opacity = await page
      .locator('.contact__links')
      .evaluate((element) => getComputedStyle(element).opacity);
    expect(opacity).toBe('1');

    await expect(page.locator('.site-nav')).toBeVisible();

    await page.locator('.site-nav__link[href="#education"]').click();
    await expect(page).toHaveURL(/#education$/);

    // CSS `scroll-behavior: smooth` still animates without JS; poll until the
    // section has actually landed in the viewport.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const rect = document.getElementById('education').getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        })
      )
      .toBe(true);

    await context.close();
  });

  test('with JavaScript disabled, mobile anchors clear the taller wrapped header', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 720 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });

    // Let the webfonts settle first: a font swap mid-scroll moves the target and
    // would measure a layout shift, not the anchor offset under test.
    await waitForFonts(page);

    // Without JS the nav wraps onto its own row, so the sticky header is much
    // taller than --header-h. Jump to a deep section and wait for the native
    // smooth scroll to actually finish before measuring.
    await page.locator('.site-nav__link[href="#education"]').click();
    await expect(page).toHaveURL(/#education$/);
    await waitForScrollEndStable(page);

    const { top, headerHeight, scrollY, maxScroll } = await page.evaluate(() => ({
      top: document.getElementById('education-title').getBoundingClientRect().top,
      headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
      scrollY: window.scrollY,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    }));

    expect(
      top,
      `scrollY=${scrollY} maxScroll=${maxScroll} headingTop=${top} headerHeight=${headerHeight}`
    ).toBeGreaterThanOrEqual(headerHeight - 1);

    await context.close();
  });

  test('with JavaScript disabled, mobile anchor lands before fonts settle and stays put', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 720 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    // Hold every webfont until this test releases them. `font-display: optional`
    // only prevents a late swap when the font really is late, so the guard has
    // to make it late deterministically: on a fast local server the font
    // settles before the jump and no swap could ever be observed.
    let releaseFonts;
    const fontsGate = new Promise((resolve) => {
      releaseFonts = resolve;
    });
    await page.route('**/*.woff2', async (route) => {
      await fontsGate;
      await route.continue();
    });

    // Chromium's scroll anchoring absorbs most of a swap-induced shift (~198 of
    // ~222px), which is why a `swap` revert could still pass the old heading
    // assertion. Disable anchoring for this page so the raw layout shift is
    // observable. Injected into the response in the test, not into the markup.
    await page.route(
      (url) => url.pathname === '/',
      async (route) => {
        const response = await route.fetch();
        const html = await response.text();
        await route.fulfill({
          response,
          body: html.replace('</head>', '<style>html{overflow-anchor:none}</style></head>'),
        });
      }
    );

    try {
      await page.goto('/', { waitUntil: 'load' });

      // Deliberately do NOT wait for `document.fonts` before jumping: the
      // fetches are gated above, so the jump is taken while the fallback font
      // is still showing. A late swap (i.e. `font-display: swap`) would then
      // reflow the document under the already-settled scroll position.
      await page.locator('.site-nav__link[href="#education"]').click();
      await expect(page).toHaveURL(/#education$/);
      await waitForScrollEndStable(page);

      const before = await page.evaluate(() => ({
        top: document.getElementById('education-title').getBoundingClientRect().top,
        scrollHeight: document.documentElement.scrollHeight,
        headerHeight: document.querySelector('.site-header').getBoundingClientRect().height,
      }));

      expect(
        before.top,
        `pre-font headingTop=${before.top} headerHeight=${before.headerHeight}`
      ).toBeGreaterThanOrEqual(before.headerHeight);

      // Let the gated webfonts arrive and the font-loading API settle.
      releaseFonts();
      await page.evaluate(() => (document.fonts ? document.fonts.ready : undefined));
      await page.waitForTimeout(200);

      const after = await page.evaluate(() => ({
        top: document.getElementById('education-title').getBoundingClientRect().top,
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
      }));

      // The whole-document height must survive the font settle. A late swap
      // changes glyph widths, line wrapping and section heights; scroll
      // anchoring hides that in the viewport but never in `scrollHeight`.
      expect(
        Math.abs(after.scrollHeight - before.scrollHeight),
        `pre=${before.scrollHeight} post=${after.scrollHeight} scrollY=${after.scrollY}`
      ).toBeLessThanOrEqual(2);

      // And the heading must still clear the sticky header. With scroll
      // anchoring disabled the swap moves it *up* under the header.
      expect(
        after.top,
        `post-font scrollY=${after.scrollY} headingTop=${after.top} headerHeight=${before.headerHeight}`
      ).toBeGreaterThanOrEqual(before.headerHeight);
    } finally {
      releaseFonts();
      await context.close();
    }
  });
});

test.describe('health', () => {
  for (const viewport of [MOBILE, TABLET, DESKTOP]) {
    test(`no console errors or failed local requests at ${viewport.width}px`, async ({ page }) => {
      /** @type {string[]} */
      const errors = [];
      /** @type {string[]} */
      const failed = [];
      const isLocal = (url) => url.startsWith('http://127.0.0.1:8080');

      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => {
        if (isLocal(request.url())) {
          failed.push(`${request.url()} :: ${request.failure()?.errorText}`);
        }
      });
      page.on('response', (response) => {
        if (isLocal(response.url()) && response.status() >= 400) {
          failed.push(`${response.status()} ${response.url()}`);
        }
      });

      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForTimeout(300);

      expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
      expect(failed, `failed local requests:\n${failed.join('\n')}`).toEqual([]);
    });
  }

  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForTimeout(150);

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(scrollWidth, `scrollWidth=${scrollWidth} innerWidth=${innerWidth}`).toBeLessThanOrEqual(
        innerWidth + 1
      );
    });
  }
});
