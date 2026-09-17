/**
 * theme.js — Theme resolution, persistence and the accessible toggle.
 *
 * Contract:
 *   - The active theme lives as `data-theme="light|dark"` on <html>.
 *   - A user choice is persisted in localStorage under `theme`.
 *   - With no stored choice the OS preference decides; if the OS exposes no
 *     preference at all, dark (the design default) is used.
 *   - OS changes are only honoured while the user has not chosen explicitly.
 *
 * The synchronous anti-FOUC script in <head> duplicates `resolveInitialTheme`
 * in plain ES5 because it must run before this module is available.
 */

// Keep in sync with STORAGE_KEY in the inline anti-FOUC script in index.html
// (single source of truth; both must use the same key).
const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
const THEMES = ['light', 'dark'];

const root = document.documentElement;

/** @returns {'light'|'dark'|null} the explicitly stored theme, if valid. */
export function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : null;
  } catch (error) {
    // Storage can throw in private mode or when disabled.
    return null;
  }
}

/** @returns {'light'|'dark'} the theme suggested by the operating system. */
function getSystemTheme() {
  if (typeof window.matchMedia !== 'function') return 'dark';

  if (window.matchMedia(DARK_QUERY).matches) return 'dark';
  if (window.matchMedia(LIGHT_QUERY).matches) return 'light';

  // No explicit preference exposed → fall back to the design default.
  return 'dark';
}

/**
 * Stored choice wins; otherwise the OS preference; otherwise dark.
 * @returns {'light'|'dark'}
 */
export function resolveInitialTheme() {
  return getStoredTheme() || getSystemTheme();
}

/**
 * Apply a theme to the document and keep the toggle's ARIA state in sync.
 * This does NOT persist — use `toggleTheme` (or persist explicitly) for that.
 * @param {'light'|'dark'} theme
 * @returns {'light'|'dark'} the theme actually applied.
 */
export function applyTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'dark';

  root.setAttribute('data-theme', next);
  root.style.colorScheme = next;

  updateToggle(next);
  return next;
}

/** Flip to the opposite theme and persist the explicit choice. */
export function toggleTheme() {
  const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';

  applyTheme(next);

  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch (error) {
    // Persistence is best-effort; the theme still applies for this session.
  }

  return next;
}

/**
 * Reflect the current theme on the toggle button.
 *
 * Pattern (a): no `aria-pressed`. The accessible name describes the action the
 * button performs, and the CSS icon swap (driven by `data-theme`) conveys the
 * current state, so the name and state never contradict each other.
 */
function updateToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const isDark = theme === 'dark';
  toggle.setAttribute('aria-label', isDark ? 'Activar tema claro' : 'Activar tema oscuro');
}

/** Re-apply the OS theme on change, but only without an explicit choice. */
function watchSystemTheme() {
  if (typeof window.matchMedia !== 'function') return;

  const media = window.matchMedia(DARK_QUERY);
  const onChange = (event) => {
    if (getStoredTheme()) return; // explicit choice takes precedence
    applyTheme(event.matches ? 'dark' : 'light');
  };

  // `addEventListener` on MediaQueryList is not available in older Safari.
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onChange);
  } else if (typeof media.addListener === 'function') {
    media.addListener(onChange);
  }
}

/** Initialise the theme system and wire up the toggle. Call once on load. */
export function initTheme() {
  applyTheme(resolveInitialTheme());

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }

  watchSystemTheme();
}
