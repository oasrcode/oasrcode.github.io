/**
 * client.ts — the runtime language switcher.
 *
 * Single-URL i18n: the server always renders Spanish; this module resolves the
 * visitor's language, applies it in place (no navigation, reload or URL change)
 * and swaps every `[data-i18n]` node plus the document shell. The choice is
 * persisted in `localStorage('lang')`.
 *
 * The pre-paint bootstrap in `Base.astro` resolves the language first and hides
 * the document (`html.i18n-pending`) only when a swap is needed, so English
 * visitors never see a flash of Spanish. Without JS the class is never added,
 * so the Spanish default stays visible.
 */
import type { Locale } from '../../data/content';
import { dictionaries, type Dictionary } from '../../i18n/dict';

declare global {
  interface Window {
    /** Set true once the module has applied a language; read by the failsafe. */
    __i18nReady?: boolean;
  }
}

const STORAGE_KEY = 'lang';
const PENDING_CLASS = 'i18n-pending';

const isLocale = (value: unknown): value is Locale => value === 'es' || value === 'en';

/** Resolve the active language: stored choice → browser language → Spanish. */
export function resolveLanguage(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* storage unavailable (private mode / blocked) — fall through to detect */
  }

  const raw = navigator.language || navigator.languages?.[0] || '';
  return raw.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function setText(dict: Dictionary): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const value = dict[key];
    if (value != null) el.textContent = value;
  });
}

function setAttributes(dict: Dictionary): void {
  document.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    if (!spec) return;
    for (const pair of spec.split(';')) {
      const [attr, key] = pair.split(':').map((part) => part.trim());
      if (!attr || !key) continue;
      const value = dict[key];
      if (value != null) el.setAttribute(attr, value);
    }
  });
}

function setDocumentMeta(dict: Dictionary): void {
  const root = document.documentElement;

  const titleKey = root.getAttribute('data-i18n-title');
  if (titleKey && dict[titleKey]) document.title = dict[titleKey];

  const descKey = root.getAttribute('data-i18n-description');
  const meta = document.querySelector('meta[name="description"]');
  if (meta && descKey && dict[descKey]) meta.setAttribute('content', dict[descKey]);
}

/** Mark the active control in each `[data-lang-set]` group. */
function setLanguageControls(lang: Locale): void {
  document.querySelectorAll<HTMLElement>('[data-lang-set]').forEach((el) => {
    if (el.getAttribute('data-lang-set') === lang) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

/** Apply a language to the live document without navigating. */
export function applyLanguage(lang: Locale): void {
  const dict = dictionaries[lang];
  const root = document.documentElement;

  root.setAttribute('lang', lang);
  root.setAttribute('data-lang', lang);

  setText(dict);
  setAttributes(dict);
  setDocumentMeta(dict);
  setLanguageControls(lang);

  root.classList.remove(PENDING_CLASS);
  window.__i18nReady = true;
}

/** Apply + persist (used by every user-triggered change). */
export function setLanguage(lang: Locale): void {
  applyLanguage(lang);
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable — the in-memory language still applies */
  }
}

/** Apply the resolved language on load and wire up the controls. */
export function initI18n(): void {
  applyLanguage(resolveLanguage());

  document.querySelectorAll<HTMLElement>('[data-lang-set]').forEach((el) => {
    el.addEventListener('click', () => {
      const value = el.getAttribute('data-lang-set');
      if (isLocale(value)) setLanguage(value);
    });
  });
}
