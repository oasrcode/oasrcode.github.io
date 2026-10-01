/**
 * cv.ts (lib) — build-time availability of the static CV download.
 *
 * The site no longer generates PDFs: the owner drops a single `public/cv.pdf`.
 * Every CV affordance (nav item, footer link) renders only when that file
 * exists at build time, so a missing file can never produce a broken link.
 *
 * Evaluated once, in Node, while Astro builds the static pages.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Public path of the CV file the owner provides. */
export const CV_HREF = '/cv.pdf';

/** True when `public/cv.pdf` exists at build time. */
export const hasCv = existsSync(resolve(process.cwd(), 'public/cv.pdf'));
