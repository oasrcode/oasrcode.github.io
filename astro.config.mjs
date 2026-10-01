// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // User GitHub Pages site (repo: oasrcode.github.io) -> served from the domain root.
  site: 'https://oasrcode.github.io',

  // Single canonical URL per page. Language is resolved client-side and applied
  // in place (no /es/- or /en/-prefixed routes), so no i18n routing is needed.
  //
  // Old bookmarks to the locale-prefixed URLs are kept alive with permanent
  // redirects to the single canonical URL (Astro emits static meta-refresh
  // redirect pages). The /cv redirects (and their locale variants) were removed.
  redirects: {
    '/es': '/',
    '/en': '/',
  },
});
