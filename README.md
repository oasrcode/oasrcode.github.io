# oasrcode.github.io

Personal portfolio site for **Aythami Santana** ([oasrcode](https://github.com/oasrcode)),
published as a GitHub Pages user site at **[https://oasrcode.github.io](https://oasrcode.github.io)**
(served from the domain root — the repo *is* the site).

A single static page: one canonical URL per page, with Spanish and English resolved
client-side (no `/es` or `/en` route prefixes).

## Stack

- **Astro 7** — static build, zero client framework runtime.
- **Own CSS** — a self-authored base reset plus design tokens in `src/styles/`; no CSS
  framework or utility classes (see ADR-0013).
- **TypeScript** (strict).
- **GSAP + Lenis** — the Home page's scroll-driven motion layer.
- Client-side i18n: a single dictionary swap, no page reload.

Requires **Node.js >= 22.12.0**.

## Commands

| Command           | Action                                        |
| :---------------- | :-------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Start the dev server at `localhost:4321`      |
| `npm run build`   | Build the production site to `./dist/`        |
| `npm run preview` | Preview the production build locally          |

## Structure

```text
/
├── public/                 # Static assets served as-is (fonts, favicons, optional cv.pdf)
├── src/
│   ├── pages/
│   │   └── index.astro      # The single route (Home)
│   ├── layouts/
│   │   └── Base.astro       # Document shell: meta, i18n bootstrap, global CSS
│   ├── components/          # Page sections + atomic UI (Button, Tag, Section, …)
│   ├── data/
│   │   └── content.ts       # Single source of truth for all site content
│   ├── i18n/                # Flat dictionary builder + UI-string lookup (text source: content.ts)
│   ├── lib/                 # Motion effects, i18n runtime, nav, CV availability
│   └── styles/              # Design tokens, global CSS, motion states
└── assets/signature/        # Hero signature SVG source (inlined at build time)
```

All site text — page content and UI/chrome labels (ES + EN side by side) — lives in
`src/data/content.ts`, the single, independent source of truth; no text is derived from any
external file. The Portfolio section renders only real, explicitly provided projects (it currently
shows an honest empty state).

## CV download

The CV button is conditional. Drop the PDF at **`public/cv.pdf`** and it appears in the nav
and footer on the next build; without that file the link is not rendered, so it is never broken.
