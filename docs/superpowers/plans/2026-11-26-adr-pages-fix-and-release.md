# R-058 ADR pages: fix and release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four ADR-page findings (26, 28, 29, 30) in `packages/pm-docs-site` and release it as `0.1.0-pre.6`.

**Architecture:** `linkHtml` copies script and style bodies whole. The `adrs` loader stops rendering; `adr-sections` is the only render, and `siteRefs()` reads its `rendered.html` for Linked from keys (ADR-015, superseding ADR-011). Two tests pin the Decisions list and remote images.

**Tech Stack:** TypeScript, Bun (`bun test`), Astro content layer, Starlight.

**Spec:** `docs/superpowers/specs/2026-11-26-adr-pages-fix-and-release-design.md`

## Global Constraints

- Paths below are relative to `packages/pm-docs-site/` unless they start with the repository root.
- Package version is exactly `0.1.0-pre.6`.
- No change to the export, `planning.json`, or its schema (ADR-002).
- Mermaid still renders at build time through the site's Markdown processor (ADR-006); relative ADR images still resolve through `adr-sections` (ADR-012).
- Commit messages follow `commitlint.config.mts`: lower-case subject, no sentence case.

## Review Focus

- An uppercase `<SCRIPT>` or `<Style>` tag: its body is still copied unchanged (Task 1 test).
- A script that never closes: the rest of the input is copied unchanged, no throw (Task 1 test).
- A section that is whitespace only: the ADR page still says `None recorded.` (Task 3 keeps `trim() === ''` as empty; existing `adr-004` test in `test/links.test.ts` covers the empty case).
- An ADR ID only inside an image alt or a link: still no Linked from entry, because keys still come from rendered HTML (existing ADR-003 tests in `test/links.test.ts`).
- Decisions view off: `adr-sections` is empty and `siteRefs()` reads no ADR keys (existing "Decisions view is off" integration test).

---

### Task 1: Script and style bodies in linkHtml (finding 26)

**Files:**
- Modify: `src/lib/link-html.ts`
- Test: `test/link-html.test.ts`

**Interfaces:**
- Produces: `linkHtml(html: string, known: Map<string, Target>): LinkedHtml`, signature unchanged.

- [ ] **Step 1: Write the failing tests** in `describe('linkHtml')`:

```ts
it('copies a script body to its close tag, so a raw < never opens a tag', () => {
	const result = linkHtml("<script>if (a<b) x='R-012'</script><p>R-013</p>", known);

	expect(result.html).toBe("<script>if (a<b) x='R-012'</script><p><a href=\"/plan/features/r-013/\">R-013</a></p>");
	expect([...result.keys]).toEqual(['R-013']);
});

it('matches the close tag in any case, for style too', () => {
	expect(linkHtml('<STYLE>a<b{}</Style><p>R-013</p>', known).html).toBe('<STYLE>a<b{}</Style><p><a href="/plan/features/r-013/">R-013</a></p>');
});

it('copies an unclosed script to the end', () => {
	expect(linkHtml('<p>R-013</p><script>a<b R-012', known).html).toBe('<p><a href="/plan/features/r-013/">R-013</a></p><script>a<b R-012');
});
```

- [ ] **Step 2: Run** `bun test test/link-html.test.ts`. Expected: the three new tests FAIL.
- [ ] **Step 3: Implement.** Replace the `split(TAG)` loop with a scan: on a `script` or `style` open tag (not self-closing), find the next `</script` or `</style` case-insensitively (`/<\/script\b[^>]*>/i`), append the body and close tag verbatim, and continue after it (or append the rest when none). `a` keeps the existing open-stack handling. Update the header comment.
- [ ] **Step 4: Run** `bun test test/link-html.test.ts`. Expected: all PASS.
- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/src/lib/link-html.ts packages/pm-docs-site/test/link-html.test.ts
git commit -m "fix(pm-docs-site): copy script and style bodies whole in linkHtml (R-058)"
```

### Task 2: Pin the Decisions list and remote ADR images (findings 28, 29)

**Files:**
- Modify: `test/links.test.ts:192-196`
- Modify: `test/integration.test.ts:410-434`

- [ ] **Step 1: Decisions list.** In "the Decisions page" test "shows every row without JavaScript", keep the noscript assertion and add, for every `planning.adrs` ID (the fixture: ADR-001 to ADR-004):

```ts
for (const adr of planning.adrs) expect(page).toContain(`data-adr="${adr.id}"`);
```

with `const page = html('plan/decisions/index.html');`.
- [ ] **Step 2: Remote image.** In "an ADR section with a relative image builds to a resolved img", change the appended text to `'R-013 ![a](x.png) ![r](https://example.com/r.png)'` and add:

```ts
const remote = html.match(/<img\b[^>]*\balt="r"[^>]*>/)?.[0] ?? '';
expect(remote).toContain('src="https://example.com/r.png"');
```

- [ ] **Step 3: Run** `bun test test/links.test.ts test/integration.test.ts -t "Decisions page|relative image builds"`. Expected: PASS (both pin current behaviour).
- [ ] **Step 4: Commit**

```bash
git add packages/pm-docs-site/test/links.test.ts packages/pm-docs-site/test/integration.test.ts
git commit -m "test(pm-docs-site): pin the decisions rows and remote adr images (R-058)"
```

### Task 3: One render per ADR section (finding 30, ADR-015)

**Files:**
- Modify: `src/loaders/adrs.ts`
- Modify: `src/lib/site-refs.ts`
- Modify: `src/routes/plan/decisions/[id].astro`
- Create: `test/adrs-loader.test.ts`

**Interfaces:**
- Produces: `adrsLoader()` stores `{ id, data: Adr }` (no `html`). `RenderedAdr` is removed; `[id].astro` and `site-refs.ts` use `Adr` from `../lib/planning-types`. `ADR_SECTIONS`, `adrSectionId`, `adrFile`, `AdrSectionData`, `adrSectionsLoader` unchanged.

- [ ] **Step 1: Write the failing test** in `test/adrs-loader.test.ts`, following `test/repo-docs.test.ts`'s stub context (`test/setup.ts` already points the config at the fixture, Decisions view on):

```ts
it('the adrs loader renders nothing; adr-sections renders each non-empty section once', async () => {
	const context = () => ({ config: { root: pathToFileURL(join(FIXTURES, 'site', '/')) }, store: { set: mock(), clear: mock(), delete: mock() }, parseData: async ({ data }: { data: unknown }) => data, renderMarkdown: mock(async () => ({ html: '' })), generateDigest: () => 'digest', logger: { info: mock() } });
	const adrs = context();
	const sections = context();

	await adrsLoader().load(adrs as never);
	await adrSectionsLoader().load(sections as never);

	const nonEmpty = loadPlanning().adrs.flatMap((adr) => ADR_SECTIONS.filter(({ key }) => adr[key] !== null && adr[key]!.trim() !== ''));
	expect(adrs.renderMarkdown).not.toHaveBeenCalled();
	expect(sections.renderMarkdown).toHaveBeenCalledTimes(nonEmpty.length);
	expect(adrs.store.set.mock.calls[0][0].data).not.toHaveProperty('html');
});
```

Imports: `FIXTURES` from `./helpers`, `loadPlanning` from `../src/lib/planning`, and `ADR_SECTIONS`, `adrsLoader`, `adrSectionsLoader` from `../src/loaders/adrs`.

- [ ] **Step 2: Run** `bun test test/adrs-loader.test.ts`. Expected: FAIL (`adrsLoader` calls `renderMarkdown`).
- [ ] **Step 3: Loader.** In `src/loaders/adrs.ts`, `adrsLoader` stores `parseData({ id, data: adr })`; drop `RenderedAdr` and the `renderMarkdown` use; update the header comment to cite ADR-015.
- [ ] **Step 4: Page.** In `[id].astro`, type `adr` as `Adr`; a section with `adr[key] === null` is left out, one with `adr[key].trim() === ''` gets `Content: null` (`None recorded.`), otherwise `getEntry('adr-sections', adrSectionId(adr.id, key))` as now.
- [ ] **Step 5: siteRefs.** In `src/lib/site-refs.ts`, under the same guard, loop `await getCollection('adr-sections')`: for each entry with `entry.rendered?.html`, add `linkHtml(entry.rendered.html, known).keys` to the set for `(entry.data as AdrSectionData).adr` (create the set per ADR ID; set an empty set for every `planning.adrs` ID first, so an ADR with no sections still has an entry, as before). Update the header comment: ADR-015.
- [ ] **Step 6: Run** `bun test test/adrs-loader.test.ts test/link-html.test.ts test/links.test.ts`. Expected: all PASS, including the ADR-003 and ADR-004 page tests (links and Linked from still agree).
- [ ] **Step 7: Type-check** `bun run check` in `packages/pm-docs-site`. Expected: 0 errors.
- [ ] **Step 8: Commit**

```bash
git add packages/pm-docs-site/src/loaders/adrs.ts packages/pm-docs-site/src/lib/site-refs.ts "packages/pm-docs-site/src/routes/plan/decisions/[id].astro" packages/pm-docs-site/test/adrs-loader.test.ts
git commit -m "perf(pm-docs-site): render each adr section once (R-058, ADR-015)"
```

### Task 4: Release 0.1.0-pre.6 and verify

**Files:**
- Modify: `package.json:3` (`"version": "0.1.0-pre.6"`)
- Modify: `README.md:34` (the pinned dependency to `0.1.0-pre.6`)

- [ ] **Step 1: Bump** both lines to `0.1.0-pre.6`. Run `bun install` in `docs-site/` only if `just docs-check` reports a lockfile mismatch.
- [ ] **Step 2: Validate** from the repository root: `just validate`. Expected: exit 0 (pinned versions, minimum package version, schema versions).
- [ ] **Step 3: Version check:** `just version-check`. Expected: exit 0 (package version moves forward and is untagged).
- [ ] **Step 4: Package tests:** `just package-test`. Expected: exit 0.
- [ ] **Step 5: Docs site:** `just docs-check`. Expected: exit 0.
- [ ] **Step 6: Full lint:** `just lint-check`. Expected: exit 0.
- [ ] **Step 7: Commit**

```bash
git add packages/pm-docs-site/package.json packages/pm-docs-site/README.md
git commit -m "chore(pm-docs-site): release 0.1.0-pre.6 (R-058)"
```
