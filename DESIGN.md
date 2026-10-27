# The Ship of Theseus

## Overview

A small, surreal website for visitors who would like to repair a ship and accidentally make a philosophical problem worse. The single visual idea is a maritime exhibit with very questionable paperwork: a large serif headline, an original technical ship drawing, a hull inventory, and a captain’s note.

The system is quiet enough for the ship’s absurd statements to do the work. The home page is the experiment; `/changelog/` is its permanent editorial history. Repairs are personal browser state, not published site versions. There is one light theme and no external font, script, image service, or wallet integration.

The implemented source of truth is [src/assets/site.css](src/assets/site.css), with page structure in [src/index.html](src/index.html) and [src/changelog/index.html](src/changelog/index.html).

## Colors

CSS primitives map to semantic roles in `:root`. Components consume the role tokens.

| Role token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#f5f2e9` | Warm paper page background |
| `--color-surface` | `#ebe7da` | Captain’s note, small-screen changelog aside, disabled primary button |
| `--color-border` | `#d3cebf` | Dividers and secondary button border |
| `--color-text` | `#292d26` | Primary text and drawing outlines |
| `--color-text-muted` | `#656457` | Captions, metadata, secondary text |
| `--color-accent` | `#a43b25` | Primary button, italic headline, question flag |
| `--color-accent-hover` | `#84301e` | Primary hover background and link hover text |
| `--color-on-accent` | `#fffdf7` | Primary button text and flag question mark |
| `--color-focus` | `#292d26` | Keyboard focus perimeter |
| `--color-wood` | `#bdab85` | Original hull planks and inventory swatches |
| `--color-guide` | `#d8d3c5` | Drafting guides and sail seams |
| `--color-sail` | `#fffdf7` | Sail fill |

Material colors are illustration categories, defined by the SVG patterns in `src/index.html` and matching swatch selectors in `site.css`: receipt/paper `#f5f2e9`, cheese `#dac76e`, knitting `#b5bcc5`, Thursday `#cdc3d8`, compliment `#d6aaa1`, and absence/paper with hatching. Patterns, full material names, and descriptions supplement color.

Computed browser pairs measured during review: body/paper **12.53:1**, muted text/paper **5.34:1**, button text/rust **6.39:1**, and rust/paper **5.81:1**. The focus ring is the same dark ink against the page, separated from the control by a 5px offset. These figures do not certify every possible browser or forced-colors palette.

## Typography

System fonts only. `--font-display` is `Georgia, 'Times New Roman', serif`; `--font-body` is `Arial, Helvetica, sans-serif`. Georgia supplies headings, the wordmark, counters, ship statements, and quotations. Arial supplies navigation, controls, descriptions, and inventory. The site uses regular weight 400, with true system italic where available. Rendering follows locally available fallback fonts.

| Token | Default size | Role |
| --- | --- | --- |
| `--text-small` | `.875rem` / 14px | Metadata, captions, secondary controls |
| `--text-body` | `1rem` / 16px | Prose and primary button |
| `--text-lead` | `1.25rem` / 20px | Intro, wordmark, quotations, ship statement |
| `--text-heading` | `1.75rem` / 28px | Section headings and ship designation |
| `--text-stat` | `3rem` / 48px | Original plank count |
| `--text-display` | `clamp(3.5rem, 7.25vw, 6.5rem)` | Page heading; 104px at 1440 wide |

At 45rem and below, display type becomes `clamp(3.5rem, 11vw, 4.75rem)`; it is 56px at 390 wide. The intro and wordmark become body size. SVG art has its own 22px question mark and 13px annotation in its coordinate system; these are drawing details, not extra UI type roles.

Body line height is 1.6, intros and quotations 1.5, section headings 1.25, and display headings 1.02 (1.04 on small screens). Display tracking is `-.055em`; section headings use `-.025em`. Headings balance wrapping and paragraphs use `text-wrap: pretty`, with normal wrapping as the fallback. Long prose is limited to 65ch; the captain’s note to 34ch, increasing to 38ch on small screens. Changing numbers use tabular figures. Text remains selectable. Long words can wrap to preserve enlarged-text reflow.

## Layout

Spacing tokens `--space-1` through `--space-7` are 8, 16, 24, 32, 48, 64, and 96px at the default root size. Small optical details also use 4, 10, and 12px. Reuse the tokens for section and component spacing.

`.page-shell` is centered and at most 87rem wide, with 3rem inline padding. At 100rem and above its maximum is 94rem. Header, main, and footer share its alignment edges. The normal header has a 104px minimum height and wraps when enlarged text needs more room.

- Above 62rem: the experiment is a `1 : 1.15` grid, inventory/note a `1.3 : 1` grid, and condition data has three columns. The drawing uses its native `620 × 430` SVG viewBox.
- At 62rem and below: page padding becomes 2rem and grid gaps reduce. The inventory heading can wrap.
- At 45rem and below: page padding becomes 1.5rem, the header minimum becomes 88px, and the experiment, lower section, and changelog use one column. The home link in navigation disappears because the wordmark already links home. The full product name and changelog link remain. The action precedes the drawing in DOM order. Condition data has two columns, followed by a full-width ship statement. The footer becomes a vertical list. The changelog aside becomes a tinted note.
- At 22rem and below: page padding becomes 1rem and the wordmark tightens its gap.

Grid tracks around the experiment and inventory use `minmax(0, …)` to avoid intrinsic-width overflow. Text containers grow vertically. No navigation or control is fixed over the content. The 390 × 844 first screen contains the product, main action, and complete drawing. Reflow was checked at 320, 390, 720, 992, and 1440 CSS pixels; 200% root text enlargement was checked separately from native browser zoom.

## Elevation & Depth

A deliberately flat system: no shadows, gradients, overlays, nested cards, or sticky chrome. Single 1px rules identify the header, condition strip, inventory rows, and footer. A quieter surface fill groups the captain’s note without another border. The drafting circle belongs to the illustration. Only the focused skip link needs a stacking layer (`z-index: 2`).

## Shapes

Buttons have a restrained 3px radius. Material swatches use a 1px radius. The status dot and entry number are circular. The hull is clipped to an original SVG path; this clips the artwork, never page text. Decorative SVG icons have consistent thin strokes. No general-purpose card component is implied by the captain’s note.

## Components

- **Header and footer:** semantic HTML repeated in the two page sources, with shared CSS. `.brand` is the home link. Navigation uses `aria-current="page"`; selected navigation has an underline. Every navigation/footer target has a 44px minimum height.
- **Primary action:** `.button.button-primary`, `#replace`. A native 52px minimum-height button with a nearby explanation via `aria-describedby`. Starts disabled in static HTML and is enabled by successful initialization. After six repairs it is disabled with a visible explanation and two recovery controls below.
- **Secondary actions:** `.button.button-secondary` for undo and `.text-button` for reset. Both are native buttons, disabled when there is nothing to reverse. Reset and the final undo restore focus to the primary control. The reset affects only this low-stakes experiment.
- **Ship figure:** `.ship-figure` and `#ship-drawing` in `src/index.html`. Six `data-plank` rectangles are changed by `ship.js`; patterns distinguish replacement materials. The SVG’s title and description update with the visible inventory. A quiet visible caption gives the identity verdict.
- **Condition strip and inventory:** `.condition`, `.plank-list`, and `.material-swatch`. Numbers and material labels report actual local state. The designation deliberately stays “Still a ship.” The absurd claim is part of the fiction, not a technical status.
- **Status announcement:** the stable, initially empty `#repair-announcement` has `role="status"`. Repairs, undo, and reset update it politely. No focus or urgent alert is used for ordinary feedback.
- **Local state:** `src/assets/state.js` owns the six material definitions and validated save format; `ship.js` owns DOM updates. Storage access and writes are guarded. A truthful inline notice appears when storage is unavailable; the current experiment remains usable in memory. Another tab’s storage event refreshes the view. No data is sent anywhere.
- **Changelog entry:** `.log-entry` is an article with an ordinal, machine-readable date, descriptive heading, prose, and one quotation in the ship’s voice. Link directly to `#entry-1`. Future entries should reuse this structure.

Buttons use a 150ms press transition to `scale(.96)`; plank fills also use 150ms transitions. Hover changes are guarded by `(hover: hover)`. No animation runs on page load or loops. Reduced motion removes transitions, animations, and the press scale. All controls get a 2px ink focus outline with 5px offset. Forced colors use system `Highlight` for focus and preserve button boundaries. Forms, dialogs, asynchronous loading, account states, and dark mode are absent by design.

## Do’s and don’ts

- Start another page with `.page-shell`, the shared header/footer markup, one `main`, one `h1`, and existing relative asset references.
- Keep the repair action visible before supporting explanation on small screens. Give ordinary controls plain, verb-first names; reserve the humor for the ship and editorial copy.
- Use semantic colors for UI and material patterns only for the ship/inventory. Keep the accent’s single filled primary action.
- Preserve spaces around responsive line breaks, allow header/metadata wrapping, and check enlarged text after changing display copy.
- Add website revisions as numbered changelog articles. Do not turn a visitor’s repairs into fake shared history or silently reset the version log.
- Keep required assets local, retain the actual directory export for `/changelog/`, and use relative links for gateway subpaths. Do not add external fonts, scripts, analytics, requests, or wallet prompts.

Review evidence and limitations are in [artifacts/validation.md](artifacts/validation.md). Guidance attribution and retained licenses are in [artifacts/design-guidance-licenses.txt](artifacts/design-guidance-licenses.txt).
