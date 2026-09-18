// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Stack + Education + Contact + footer smoke tests (content wave).
 * Verifies: every stack technology renders under its new category, both
 * qualifications and the languages line are present, the contact section is a
 * links-only block (LinkedIn / GitHub, no form controls at all) and the
 * footer year is injected.
 */

const STACK_CATEGORIES = [
  'Lenguajes y Frontend',
  'Backend',
  'IA',
  'Tiempo real y alertas',
  'Datos',
  'Datos oficiales',
  'Mapas y GIS',
  'Herramientas',
];

const STACK_TECHNOLOGIES = [
  'JavaScript',
  'TypeScript',
  'Angular',
  'Tailwind CSS',
  'C#',
  '.NET',
  'REST APIs',
  'MVC',
  'RAG',
  'LlamaIndex Workflows',
  'spaCy',
  'guardrails',
  'Consultas de solo lectura',
  'MQTT',
  'Redis',
  'TETRA',
  'MongoDB',
  'CrateDB',
  'Power BI',
  'DGT',
  'DataPol-Eukalería',
  'AEMET',
  'IGN',
  'Calypso',
  'MapLibre GL',
  'Leaflet',
  'Git',
  'Azure',
  'Jira',
];

test('stack section renders every stack category heading', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const stack = page.locator('#stack');
  await expect(stack).toBeVisible();

  for (const category of STACK_CATEGORIES) {
    // `exact` avoids substring collisions such as "IA" matching "Datos oficiales".
    await expect(
      stack.getByRole('heading', { level: 3, name: category, exact: true })
    ).toBeVisible();
  }
});

test('stack section lists every technology exactly once', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const tags = (await page.locator('#stack .tag').allTextContents()).map((tag) => tag.trim());

  for (const technology of STACK_TECHNOLOGIES) {
    expect(tags, `missing stack technology: ${technology}`).toContain(technology);
  }

  // No accidental duplicates among the chips.
  expect(new Set(tags).size).toBe(tags.length);
});

test('education section renders both qualifications and the languages line', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const education = page.locator('#education');
  await expect(education).toBeVisible();

  const qualifications = (
    await education.locator('.education__qualification').allTextContents()
  ).map((text) => text.replace(/\s+/g, ' ').trim());

  expect(qualifications).toEqual([
    'CFGS Desarrollo de Aplicaciones Multiplataforma (DAM)',
    'Desarrollo de Videojuegos y Realidad Virtual con Unity 3D',
  ]);

  await expect(education).toContainText('IES El Rincón');
  await expect(education).toContainText('DYM Canarias');
  await expect(education).toContainText('Inglés B2.1');
  await expect(education).toContainText('Escuela Oficial de Idiomas');
  await expect(education).toContainText('ERASMUS+');
  await expect(education).toContainText('Prácticas internacionales');

  // 2020, 2023, 2018 and 2014 are all machine-readable.
  await expect(education.locator('time')).toHaveCount(4);
  for (const value of ['2020', '2023', '2018', '2014']) {
    await expect(education.locator(`time[datetime="${value}"]`)).toHaveCount(1);
  }
});

test('contact section exposes LinkedIn and GitHub as direct links', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const contact = page.locator('#contact');
  await expect(contact).toBeVisible();
  await expect(contact.getByRole('heading', { level: 2, name: 'Contacto' })).toBeVisible();

  await expect(contact.getByRole('link', { name: /linkedin\.com/i })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/oasrjob/'
  );
  await expect(contact.getByRole('link', { name: /github\.com\/oasrcode/i })).toHaveAttribute(
    'href',
    'https://github.com/oasrcode'
  );
});

test('external contact links are safe', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const contact = page.locator('#contact');

  for (const href of ['https://www.linkedin.com/in/oasrjob/', 'https://github.com/oasrcode']) {
    const link = contact.locator(`a[href="${href}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
  }
});

test('the document contains no form controls at all', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const count = await page.evaluate(
    () => document.querySelectorAll('form, input, textarea, select').length
  );
  expect(count).toBe(0);
});

test('footer injects a four-digit current year exactly once', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const year = page.locator('footer [data-current-year]');
  await expect(year).toHaveCount(1);
  await expect(year).toHaveText(/^\d{4}$/);
  await expect(page.locator('footer')).toContainText('HTML, CSS y JavaScript');
});
