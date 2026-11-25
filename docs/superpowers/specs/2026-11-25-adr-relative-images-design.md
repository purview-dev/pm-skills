# R-050 ADR relative images render unresolved: design

- Item: R-050 ADR relative images render unresolved (M4, serves V4, V5)
- Branch: `feat/r-050-adr-relative-images-render-unresolved`
- ADRs: follows ADR-002 ADR sections export as Markdown text, ADR-005 Docs
  sites consume the pm-docs-site package, ADR-006 Mermaid renders at build
  time with Pele, and ADR-011 ADR page references come from rendered HTML;
  writes ADR-012 (below).

## Intent

An ADR section with a relative image (`![a](x.png)`, the file beside the ADR
in `<PM root>/decisions/`) shows that image on its docs-site ADR page. Today
`renderMarkdown` in `src/loaders/adrs.ts` leaves an `__ASTRO_IMAGE_`
placeholder that only Astro's `render()` resolves, and
`src/routes/plan/decisions/[id].astro` prints the HTML with `set:html`, so the
`img` has no `src`. Why: M4's exit criteria require every ADR section to
render, including a relative image, so ADR support is complete.

## Goals, non-goals, anti-goals

- Goal: a relative image builds to an `img` with a resolved, hashed `src`, and
  the file is in the build output.
- Goal: remote images, Mermaid fences (ADR-006), and ID linking with Linked
  from entries (ADR-011) behave as today.
- Non-goal: images in briefs, inbox files, or other plan pages (they have no
  pages yet; R-052 Docs-site package: brief and inbox pages).
- Non-goal: any change to `planning.json`, its schema, or `pm-export`.
- Anti-goal: the site reading an ADR's text from its file, or any other PM
  state outside `planning.json` (ADR-002 stands for text).

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Astro's image pipeline: the loader renders each section with the ADR's file URL and stores it as a rendered entry; the page renders it with `render()` and links the captured HTML | Hashed, sized images and Astro's own missing-file error; more moving parts, and dev may need the folder allowed | Chosen by the user |
| Rewrite the placeholder to `/plan/decisions/files/<name>` and copy each file with a static route | Page pipeline untouched; no optimisation; our own missing-file and `../` handling | Rejected |
| Do nothing, or render the alt text only | Keeps ADR-002 strict; fails the item's Done when | Rejected |

## Design

1. **Where the image is.** An ADR file is `<PM root>/decisions/<file>` and the
   export is `<PM root>/planning.json`, so the loader takes the ADR file as
   `<dirname of the configured planning file>/decisions/<basename of adr.path>`.
   It never needs the repository root or the PM root's name. A relative image
   resolves against that file, as it does in any Markdown viewer.
2. **A rendered entry per section.** A new content collection, `adr-sections`,
   holds one entry per present, non-empty section: id `<adr id>/<section key>`
   (`adr-003/context`), `filePath` the ADR file relative to the site root,
   `rendered` from `renderMarkdown(markdown, { fileURL })`, and `assetImports`
   from `rendered.metadata.imagePaths` (as Astro's `glob` loader does). Astro
   then imports and processes the images.
3. **The `adrs` collection keeps `html`**, rendered the same way, so
   `siteRefs()` keeps reading its keys from it (ADR-011). The placeholder
   keeps the alt text in an attribute, and `linkHtml` never links attributes,
   so the page and Linked from still agree.
4. **The page** renders each section with `render()` inside a small component
   that captures its slot (`Astro.slots.render('default')`) and prints
   `linkHtml(html, known).html` with `set:html`. `None recorded.` and missing
   sections behave as today.
5. **A missing image file fails the build** with Astro's error, which names
   the file. A broken image in a decision record is a defect to fix, not to
   hide.

## ADR-012

Record with `pm-adr new` before the plan: "The site reads image files beside
an ADR". The docs site may read image files that an ADR section references
from `<PM root>/decisions/`, through Astro's image pipeline; it still reads
every PM record only from `planning.json`. Alternatives: the table above.
Follows ADR-002 and ADR-011.

## Done when

- An ADR section with `![a](x.png)` builds to an ADR page whose `img` has a
  resolved `src`.
- A test in `packages/pm-docs-site/test/integration.test.ts`, beside "an ADR
  section with a mermaid fence builds to svg", adds `![a](x.png)` to ADR-003
  in a scratch copy, writes `decisions/x.png` beside `planning.json`, builds,
  and asserts the `img` `src` points at a file present in `dist`.
- `just package-test` and `just docs-check` pass.

## Left to the builder

- Whether `vite.server.fs.allow` must include the decisions folder for
  `astro dev`; add it in the integration only if dev refuses the image.
- The capturing component's name and where it lives under
  `src/components/`.
- Whether `adrs.html` and `adr-sections` share one `renderMarkdown` call per
  section.
