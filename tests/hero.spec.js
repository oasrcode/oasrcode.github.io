// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Hero smoke tests.
 * Verifies: the real content renders, the primary CTA targets the experience
 * anchor, the secondary contact group exposes LinkedIn/GitHub with safe
 * external attributes, every action has an accessible name and the hero still
 * fits a single desktop viewport.
 */

test('renders the hero content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const hero = page.locator('#hero');
  await expect(hero).toBeVisible();

  await expect(page.locator('#hero-title')).toHaveText('Aythami Santana');
  await expect(hero.getByText('Desarrollador Full Stack')).toBeVisible();
  await expect(hero.getByText('Las Palmas de Gran Canaria, España')).toBeVisible();
});

test('hero primary CTA points at the experience anchor', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const hero = page.locator('#hero');

  await expect(hero.getByRole('link', { name: 'Ver experiencia' })).toHaveAttribute(
    'href',
    '#experience'
  );

  await expect(page.locator('#experience')).toHaveCount(1);
  await expect(page.locator('#contact')).toHaveCount(1);
});

test('every hero action is reachable by its accessible name', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const hero = page.locator('#hero');

  // getByRole resolves each link through the accessible-name computation, so
  // this is also the assertion that no icon-only control ships unnamed.
  const actions = [
    { name: 'Ver experiencia', href: '#experience' },
    { name: 'Perfil de LinkedIn', href: 'https://www.linkedin.com/in/oasrjob/' },
    { name: 'GitHub de oasrcode', href: 'https://github.com/oasrcode' },
  ];

  for (const action of actions) {
    await expect(
      hero.getByRole('link', { name: action.name }),
      `missing hero action: ${action.name}`
    ).toHaveAttribute('href', action.href);
  }
});

test('external hero contact links are safe', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const hero = page.locator('#hero');

  for (const href of ['https://www.linkedin.com/in/oasrjob/', 'https://github.com/oasrcode']) {
    const link = hero.locator(`a[href="${href}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
  }
});

test('hero fits within a single desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'load' });

  const { heroHeight, viewportHeight } = await page.evaluate(() => ({
    heroHeight: document.getElementById('hero').getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
  }));

  expect(heroHeight, `hero=${heroHeight} viewport=${viewportHeight}`).toBeLessThanOrEqual(
    viewportHeight + 1
  );
});
