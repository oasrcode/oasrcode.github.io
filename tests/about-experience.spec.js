// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * About + Experience smoke tests (content wave).
 * Verifies: the biography renders, the timeline shows all three CV entries in
 * strict reverse-chronological order (newest first) and every entry exposes a
 * machine-readable <time>.
 */

const COMPANIES = ['Técnicas Competitivas S.A.', 'AtlasSystems S.L.', 'DYM Canarias'];
const ROLES = [
  'Desarrollador Full Stack',
  'Gestor de Plataforma Moodle',
  'Desarrollador de Videojuegos y Formador',
];

test('about section renders the heading and the biography', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const about = page.locator('#about');
  await expect(about).toBeVisible();

  const title = about.getByRole('heading', { level: 2, name: 'Sobre mí' });
  await expect(title).toBeVisible();
  await expect(title).toHaveText('Sobre mí');

  await expect(about).toContainText('Técnicas Competitivas');
  await expect(about).toContainText('datos de sensores');
});

test('experience renders three timeline entries with the CV companies', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const items = page.locator('#experience .timeline__item');
  await expect(items).toHaveCount(3);

  const companies = await items.locator('.timeline__company').allTextContents();
  expect(companies.map((name) => name.trim())).toEqual(COMPANIES);

  // Each entry carries its role and a date range.
  await expect(items.first()).toContainText(ROLES[0]);
  await expect(items.nth(1)).toContainText(ROLES[1]);
  await expect(items.nth(2)).toContainText(ROLES[2]);
});

test('experience timeline is in strict reverse-chronological order', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const items = page.locator('#experience .timeline__item');
  await expect(items).toHaveCount(3);

  // The DOM order of the companies must be newest → oldest. This is an explicit
  // regression guard: readers parse a list that opens on the current role as
  // reverse-chronological, so a non-monotonic entry is misleading.
  const order = await items.evaluateAll((entries) =>
    entries.map((entry) => ({
      company: entry.querySelector('.timeline__company')?.textContent?.trim(),
      role: entry.querySelector('.timeline__role')?.textContent?.trim(),
      start: entry.querySelector('time')?.getAttribute('datetime'),
    }))
  );

  expect(order.map((entry) => entry.company)).toEqual(COMPANIES);
  expect(order.map((entry) => entry.role)).toEqual(ROLES);
  expect(order.map((entry) => entry.start)).toEqual(['2023-03', '2020-05', '2018-11']);

  // The start dates must be strictly descending (strict reverse-chronology).
  for (let index = 1; index < order.length; index += 1) {
    expect(
      order[index - 1].start > order[index].start,
      `${order[index - 1].start} must be newer than ${order[index].start}`
    ).toBe(true);
  }
});

test('every experience entry exposes a machine-readable <time>', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const items = page.locator('#experience .timeline__item');
  await expect(items).toHaveCount(3);

  for (let index = 0; index < COMPANIES.length; index += 1) {
    const entry = items.nth(index);
    const times = entry.locator('time');
    await expect(times.first()).toBeVisible();
    await expect(times.first()).toHaveAttribute('datetime', /^\d{4}-\d{2}$/);
  }
});
