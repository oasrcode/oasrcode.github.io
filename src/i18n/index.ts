import type { Locale, UI } from '../data/content';
import { ui } from '../data/content';

/** UI strings for a locale. */
export function getUI(lang: Locale): UI {
  return ui[lang];
}

/** BCP-47 tag for `lang` attributes. */
export const htmlLang = (lang: Locale): string => (lang === 'en' ? 'en' : 'es');
