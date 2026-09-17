// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Wave 1 smoke tests — theme foundation.
 * Verifies: clean load, toggle flips `data-theme`, persistence via localStorage.
 */

test('loads without console errors', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/', { waitUntil: 'load' });

  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
  await expect(page.locator('h1')).toHaveCount(1);
  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
});

test('toggle flips data-theme on <html>', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: /tema/i });

  const before = await html.getAttribute('data-theme');
  await toggle.click();
  const after = await html.getAttribute('data-theme');

  expect(after).not.toBe(before);
  expect(['light', 'dark']).toContain(after);

  // A second click returns to the original theme.
  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', before);
});

test('toggle exposes an action label without aria-pressed', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const html = page.locator('html');
  const toggle = page.locator('#theme-toggle');

  // Pattern (a): a plain action button — no `aria-pressed` that could be
  // announced together with the action label as an inverted toggle.
  expect(await toggle.evaluate((element) => element.hasAttribute('aria-pressed'))).toBe(false);

  const initial = await html.getAttribute('data-theme');
  await expect(toggle).toHaveAttribute(
    'aria-label',
    initial === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'
  );

  await toggle.click();

  const next = await html.getAttribute('data-theme');
  expect(next).not.toBe(initial);
  await expect(toggle).toHaveAttribute(
    'aria-label',
    next === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'
  );
  expect(await toggle.evaluate((element) => element.hasAttribute('aria-pressed'))).toBe(false);
});

test('toggle icon display tracks data-theme in both directions', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const html = page.locator('html');
  const sun = page.locator('.theme-toggle__icon--sun');
  const moon = page.locator('.theme-toggle__icon--moon');

  // Dark active → sun visible (action: switch to light).
  // Light active → moon visible (action: switch to dark).
  const expected = (theme) =>
    theme === 'dark' ? { sun: 'block', moon: 'none' } : { sun: 'none', moon: 'block' };

  const assertIcons = async (theme) => {
    const want = expected(theme);
    // Exact computed `display` values: if CSS and `data-theme` ever desync
    // (broken selector, wrong theme name), one of these fails.
    await expect(sun).toHaveCSS('display', want.sun);
    await expect(moon).toHaveCSS('display', want.moon);
  };

  const initial = await html.getAttribute('data-theme');
  await assertIcons(initial);

  await page.locator('#theme-toggle').click();
  const toggled = await html.getAttribute('data-theme');
  expect(toggled).not.toBe(initial);
  await assertIcons(toggled);

  // Back to the original theme: the icons must follow in both directions.
  await page.locator('#theme-toggle').click();
  await expect(html).toHaveAttribute('data-theme', initial);
  await assertIcons(initial);
});

test('persists the chosen theme across a reload', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const html = page.locator('html');
  await page.getByRole('button', { name: /tema/i }).click();

  const chosen = await html.getAttribute('data-theme');
  const stored = await page.evaluate(() => window.localStorage.getItem('theme'));

  expect(stored).toBe(chosen);

  await page.reload({ waitUntil: 'load' });
  await expect(html).toHaveAttribute('data-theme', chosen);
});

test('first visit honours prefers-color-scheme: dark', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();

  await page.goto('/', { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await context.close();
});
