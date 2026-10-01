/**
 * dict.ts — builds the flat key → string dictionaries that the client-side
 * language switcher uses. One dictionary per locale, keyed exactly like the
 * `data-i18n` attributes in the markup.
 *
 * Both parts live in `src/data/content.ts`:
 *   1. UI chrome (`ui`) — flattened from its nested shape, so `nav.work` and
 *      `meta.title` map 1:1 to the markup keys.
 *   2. Page content (profile/about/experience/…) — mapped to stable positional
 *      keys (`about.body.0`, `experience.<id>.highlights.2`, …).
 *
 * Both dictionaries ship to the browser (bundled by Vite), so the toggle can
 * swap every translatable node without a network round-trip.
 */
import type { Locale } from '../data/content';
import {
  about,
  education,
  experience,
  languages,
  profile,
  projects,
  skillGroups,
  ui,
} from '../data/content';

export type Dictionary = Record<string, string>;

/** Recursively flatten a nested object/array into `prefix.key` flat entries. */
function flatten(value: unknown, prefix: string, out: Dictionary): void {
  if (value == null) return;
  if (typeof value === 'string') {
    out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, i) => flatten(entry, `${prefix}.${i}`, out));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      flatten(entry, prefix ? `${prefix}.${key}` : key, out);
    }
  }
}

/** Content keys derived from `content.ts`, matching the markup's data-i18n keys. */
function content(lang: Locale, present: string): Dictionary {
  const d: Dictionary = {};

  d['profile.role'] = profile.role[lang];
  d['profile.location'] = profile.location[lang];
  d['profile.valueProp'] = profile.valueProp[lang];

  about.body[lang].forEach((paragraph, i) => {
    d[`about.body.${i}`] = paragraph;
  });
  d['about.manifesto.lead'] = about.manifesto[lang].lead;
  d['about.manifesto.accent'] = about.manifesto[lang].accent;
  d['about.manifesto.tail'] = about.manifesto[lang].tail;

  experience.forEach((item) => {
    d[`experience.${item.id}.role`] = item.role[lang];
    d[`experience.${item.id}.period`] = item.period[lang];
    d[`experience.${item.id}.summary`] = item.summary[lang];
    item.highlights?.[lang].forEach((highlight, j) => {
      d[`experience.${item.id}.highlights.${j}`] = highlight;
    });
  });

  skillGroups.forEach((group) => {
    d[`skillGroups.${group.id}.title`] = group.title[lang];
    group.skills.forEach((skill, i) => {
      if (skill.from) {
        d[`skillGroups.${group.id}.skills.${i}.years`] = `${skill.from}–${skill.to ?? present}`;
      }
    });
  });

  education.forEach((item, i) => {
    d[`education.${i}.title`] = item.title[lang];
  });

  languages.forEach((item, i) => {
    d[`languages.${i}.name`] = item.name[lang];
    d[`languages.${i}.detail`] = item.detail[lang];
  });

  // Empty today (the Portfolio guardrail), but keyed so real projects light up
  // the client switcher automatically when they are added.
  projects.forEach((project) => {
    d[`projects.${project.id}.sector`] = project.sector[lang];
    d[`projects.${project.id}.description`] = project.description[lang];
  });

  return d;
}

function build(lang: Locale): Dictionary {
  const out: Dictionary = {};
  flatten(ui[lang], '', out);
  // UI (flattened) and content-derived key prefixes are disjoint by design, so
  // this merge stays collision-free; on any future collision the content-derived
  // keys win (Object.assign order).
  Object.assign(out, content(lang, ui[lang].skills.present));
  return out;
}

export const dictionaries: Record<Locale, Dictionary> = {
  es: build('es'),
  en: build('en'),
};
