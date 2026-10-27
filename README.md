# The Ship of Theseus

A small website having a large identity crisis. Replace six wooden planks with increasingly unreasonable materials; the drawing, inventory, and ship’s opinion change together. Undo or reset the experiment. The ship remains officially a ship.

This is the first version. The real `/changelog/` page contains numbered entry **1**, dated **27 October 2026**. Repairs stay in the visitor’s browser and do not create website versions. There is no scheduler, backend, wallet, telemetry, or runtime dependency.

## Install, build, preview

Use Node.js 22 or newer. The production build uses Node’s standard library only; development packages support typechecking and browser validation.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/`. An optional port can be passed as `npm run preview -- 8080`. Stop the preview with Ctrl+C.

`npm run build` exports the pages and runtime assets from `src/` to `dist/` and verifies them. The editable share-card SVG stays in source; its PNG is exported. **The complete production export is included in `dist/`**. It can be served directly by a static host; no build service or SPA rewrite is required. Both source and export are delivered alongside `package-lock.json`. Dependency installation is unnecessary just to build or serve this export.

The pages use relative asset and navigation URLs, including `../assets/` from the changelog, so they work under a gateway subpath. `/changelog` redirects to `/changelog/` on a normal directory-serving static host. Use an HTTP static server rather than opening `index.html` as a `file:` URL, because the repair code uses native JavaScript modules. The site makes no API or external requests; browser requests load only its own static documents and assets.

## Source map

| Path | Purpose |
| --- | --- |
| `src/index.html` | Home, interactive ship drawing, inventory, metadata |
| `src/changelog/index.html` | Exported changelog and first version entry |
| `src/assets/site.css` | Shared tokens, layout, responsive styles, interaction states |
| `src/assets/state.js` | Six repairs, boundaries, validated versioned browser storage |
| `src/assets/ship.js` | Local interaction, announcements, persistence fallback |
| `src/assets/favicon.svg` | Original local ship icon |
| `src/assets/share.svg` / `share.png` | Original share-card source and ready-to-use 1200 × 630 image |
| `scripts/build.mjs` | Dependency-free static export |
| `scripts/preview.mjs`, `server.mjs` | Local static preview, with real directory routes |
| `scripts/validate.mjs` | Browser checks using a temporary subpath preview |
| `tests/state.test.mjs` | Repair bounds, reversibility, save parsing and corruption recovery |
| `DESIGN.md` | Implemented design system and responsive behavior |
| `artifacts/validation.md` | Actual checks, review findings, evidence, and limitations |

## Validate

```sh
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:browser
```

Browser validation starts and closes its own foreground server, serves the export under `/preview/`, exercises primary flows in Chromium and WebKit, and writes its results/screenshots outside the repository at `/tmp/theseus-validation`. Set `VALIDATION_OUT` to another temporary directory if needed. The script exits nonzero for failed assertions or unavailable required browser runtimes. `IMD_PLAYWRIGHT` and `IMD_AXE` optionally name installed module files when tooling lives outside the checkout.

The 200% text test enlarges the root font size; it does not claim to automate native browser zoom. Accessibility scans complement keyboard and visual inspection; they do not establish complete accessibility compliance.

To regenerate the share PNG after editing its SVG source, run `node scripts/share-card.mjs` with Playwright Chromium installed, then `npm run build`. The existing PNG is a complete runtime asset, so normal production builds do not require a browser.

## Delivery and review

Production build, JavaScript typecheck, four state tests, browser interaction results, and the pinned design probe are recorded with their actual outcomes in [artifacts/validation.md](artifacts/validation.md). The review covers accessibility, layout, writing, typography, colors, and UI. See that record for viewport evidence, corrections, and checks that could not be performed.

Final worker results on 27 October 2026: production build and typecheck passed; **4/4 state tests**, **17/17 Chromium/WebKit browser checks**, and **16/16 pinned design-probe checks** passed. Three Chromium axe scans reported zero violations, with contrast items requiring manual review. Both engines showed the complete drawing and repair action on the first 390 × 844 screen. The finished export contains seven files totaling **112,486 bytes**.

WebKit ran with temporary system libraries and software rendering outside the repository. Its Playwright screenshot helper attempted to inject an empty stylesheet 13 times; the site correctly blocked those injections. Validation records these screenshot-only warnings separately, without weakening the production CSP. Actual page/interaction errors, missing files, and external requests were zero. Native screen-reader use, physical devices, native browser zoom, and a hosted social-card unfurl were not tested.

No ignore file was added or changed. Development dependencies, browser binaries, package caches, and temporary tests were kept outside the repository. `dist/` includes the runtime assets directly, without dependency directories, source maps, packaging archives, or a vendored registry. Publish the contents of `dist/` through the assignment’s static publisher; the site does not publish itself.
