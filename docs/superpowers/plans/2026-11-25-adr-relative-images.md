# R-050 ADR relative images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A relative image in an ADR section (`![a](x.png)`, the file in `<PM root>/decisions/`) builds to an `img` with a resolved, hashed `src` on its docs-site ADR page.

**Architecture:** The `adrs` loader also fills a new `adr-sections` collection: one rendered entry per present, non-empty section, with the ADR file's `filePath` and `assetImports`, so Astro imports and processes its images. The ADR page renders each section with `render()` inside a component that captures the slot HTML and runs `linkHtml` on it. The `adrs` collection keeps `html`, so `siteRefs()` (ADR-011) is unchanged.

**Tech Stack:** Astro 7 content layer (`renderMarkdown`, `render()`), Starlight, Bun test, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-25-adr-relative-images-design.md`

## Global Constraints

- The ADR file is `<dirname of config.planning>/decisions/<basename of adr.path>`; never the repository root or the PM root's name.
- The site reads image files only from there; every PM record still comes from `planning.json` (ADR-002, ADR-012).
- A missing image file fails the build with Astro's error.
- No change to `planning.json`, its schema, `pm-export`, or `skills/**`.
- Remote images, Mermaid fences (ADR-006), `None recorded.`, and ID linking with Linked from entries (ADR-011) behave as today.
- TypeScript only; tabs, as the package's files are written.
- The package version stays `0.1.0-pre.5` (untagged; `just version-check` passes without a bump).

## Review Focus

- An ADR with no relative image (every fixture ADR today): pages build byte-for-byte equivalent in their section HTML; the existing `links.test.ts` and integration tests pin this.
- A section with an ID beside an image (`R-013 ![a](x.png)`): the ID is still linked on the page; pinned in Task 2's test.
- A remote image (`https://x/x.png`, ADR-003 fixture): stays a plain `img` with that `src`; pinned by `links.test.ts` ADR-003 case.
- A missing relative image: the build fails and names the file; pinned in Task 2's test.
- A Mermaid fence in an ADR section: still an `svg`; pinned by the existing integration test.

---

### Task 1: Rendered section entries in the loader

**Files:**

- Modify: `packages/pm-docs-site/src/loaders/adrs.ts`
- Modify: `packages/pm-docs-site/src/content.config.ts`

**Interfaces:**

- Produces: `adrSectionsLoader(): Loader` in `src/loaders/adrs.ts`, a collection `adr-sections` in `content.config.ts`. Entry id `` `${adr.id.toLowerCase()}/${key}` `` (`adr-003/context`), data `{ adr: string; section: AdrSection }`, `filePath` the ADR file relative to the site root with `/` separators, `rendered` from `renderMarkdown(markdown, { fileURL: pathToFileURL(adrFile) })`, `assetImports: rendered.metadata?.imagePaths`.
- Produces: `adrFile(planningPath: string, adrPath: string): string` (absolute), exported from `src/loaders/adrs.ts`.
- `adrsLoader()` also passes `{ fileURL }` to `renderMarkdown`, so `html` and the section entries render alike.

- [x] **Step 1:** Implement `adrFile` as `join(dirname(planningPath), 'decisions', basename(adrPath))`, and `adrSectionsLoader` following `repoDocsLoader`'s `store.set` shape (`fileURLToPath(config.root)` for the site root). Skip a section whose Markdown is `null` or blank, as `html` does.
- [x] **Step 2:** Register `'adr-sections': defineCollection({ loader: adrSectionsLoader() })` in `content.config.ts`, with a one-line comment.
- [x] **Step 3:** Run `cd packages/pm-docs-site; bun test test/integration.test.ts test/links.test.ts`. Expected: PASS (nothing reads the new collection yet).
- [x] **Step 4:** Commit: `feat(pm-docs-site): rendered ADR section entries (R-050)`.

### Task 2: ADR page renders sections through Astro

**Files:**

- Create: `packages/pm-docs-site/src/components/LinkedHtml.astro`
- Modify: `packages/pm-docs-site/src/routes/plan/decisions/[id].astro`
- Test: `packages/pm-docs-site/test/integration.test.ts` (beside "an ADR section with a mermaid fence builds to svg")

**Interfaces:**

- Consumes: the `adr-sections` collection from Task 1.
- Produces: `LinkedHtml.astro`, props `{ known: Set<string> }` (the type `siteRefs()` returns for `known`), prints `linkHtml(await Astro.slots.render('default'), known).html` with `set:html`.

- [x] **Step 1: Write the failing tests** in `integration.test.ts`, using `scratchSite` as the Mermaid case does:

```ts
it('an ADR section with a relative image builds to a resolved img', () => {
 // ADR-003 context += '\n\nR-013 ![a](x.png)\n'; write a 1x1 PNG to join(dir, 'decisions', 'x.png')
 // build; read dist/plan/decisions/adr-003/index.html
 expect(result.code, result.stderr).toBe(0);
 expect(html).not.toContain('__ASTRO_IMAGE_');
 const src = html.match(/<img[^>]*alt="a"[^>]*src="([^"]+)"|<img[^>]*src="([^"]+)"[^>]*alt="a"/);
 expect(src).not.toBeNull();
 expect(existsSync(join(dir, 'site', 'dist', (src![1] ?? src![2]).replace(/^\//, '')))).toBe(true);
 expect(html).toContain('href="/plan/features/r-013/"');
}, BUILD);

it('an ADR section with a missing relative image fails the build', () => {
 // ADR-003 context += '\n\n![a](missing.png)\n'; no file written
 expect(result.code).not.toBe(0);
 expect(result.stdout + result.stderr).toContain('missing.png');
}, BUILD);
```

Write the PNG from a base64 1x1 literal with `Buffer.from(..., 'base64')`. The fixture builds a page for R-013 (`links.test.ts` asserts the same href form for R-012).

- [x] **Step 2:** Run `cd packages/pm-docs-site; bun test test/integration.test.ts -t "relative image"`. Expected: the first FAILS (`__ASTRO_IMAGE_` present), the second FAILS (build succeeds).
- [x] **Step 3:** Create `LinkedHtml.astro`. In `[id].astro`, read each section entry with ``getEntry('adr-sections', `${adr.id.toLowerCase()}/${key}`)``, then `const { Content } = await render(entry)`, and render `<LinkedHtml known={known}><Content /></LinkedHtml>` in place of the `set:html` fragment. Keep `None recorded.` for `''` and skip `null` as today. Update the file's header comment.
- [x] **Step 4:** Run `cd packages/pm-docs-site; bun test test/integration.test.ts test/links.test.ts`. Expected: PASS, including the ADR-003 remote image and Mermaid cases.
- [x] **Step 5:** Commit: `fix(pm-docs-site): resolve relative images in ADR sections (R-050)`.

### Task 3: Dev server, docs, and full verification

**Files:**

- Modify (only if Step 1 shows a 403): `packages/pm-docs-site/lib/index.ts` (add `dirname(config.planning)/decisions` to `vite.server.fs.allow`)
- Modify: `packages/pm-docs-site/README.md` (the Decisions view: relative images resolve from `<PM root>/decisions/`; a missing file fails the build)
- Modify: `planning/decisions/ADR-012-the-site-reads-image-files-beside-an-adr.md` only through `pm-adr` if the decision changes (it should not)

- [x] **Step 1:** In a scratch site from Task 2's setup, run `node packages/pm-docs-site/lib/cli.ts dev <scratch>/site --port <free port>` (as `test/cli.test.ts` does) and request the image URL from the ADR-003 page. Expected: 200. On 403, add the `fs.allow` entry and re-check.
- [x] **Step 2:** Add the README sentence.
- [x] **Step 3:** Run `just package-test`. Expected: PASS.
- [x] **Step 4:** Run `just docs-check` and `just lint-check`. Expected: PASS.
- [x] **Step 5:** Commit: `docs(pm-docs-site): ADR relative images (R-050)` (with the `lib/index.ts` change when made).
