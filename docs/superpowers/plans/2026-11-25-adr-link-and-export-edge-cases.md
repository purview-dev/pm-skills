# R-040 ADR link and export edge cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make ADR page links agree with Linked from entries, keep comments inside code through the export, export a mismatched ADR heading under its file-name ID, and pin the Decisions view's edge states with tests.

**Architecture:** `linkHtml` returns the keys it linked; a new async `siteRefs()` in `src/lib/site-refs.ts` reads the rendered `adrs` collection and passes those keys to the pure `references()` (ADR-011). The exporter strips HTML comments outside code only and takes the ADR ID from the file name. The Decisions view gains `none` and `unknown` statuses and drops a category filter that has no chip.

**Tech Stack:** TypeScript, Bun (`bun test`), Astro + Starlight, React islands, `@purview-dev/pm-docs-site`.

**Spec:** `docs/superpowers/specs/2026-11-25-adr-link-and-export-edge-cases-design.md`

## Global Constraints

- Branch: `feat/r-040-adr-link-export-edge-cases` (checked out; create no branch).
- ADRs: ADR-011 ADR page references come from rendered HTML (proposed); follows ADR-002 and ADR-005. Do not edit ADR files; `pm-checkpoint` (`done`) accepts ADR-011.
- No export schema or `schemaVersion` change. No new dependency.
- Tag pattern, verbatim: `<(?:"[^"]*"|'[^']*'|[^'">])*>`.
- Skills change stays on rules 21: `just bump prerelease` (21.0.0-pre.10 to 21.0.0-pre.11). Package: `packages/pm-docs-site/package.json` to `0.1.0-pre.5`. The pm-docs-site skill's minimum stays `0.1.0-pre.4`.
- TypeScript only (`.ts`/`.tsx`); never edit `planning/` by hand.
- Commit messages: conventional commits, lower-case subject (commitlint rejects an upper-case start, so write `(R-040)` at the end).

## Review Focus

1. A tag whose attribute holds `>` and an ID (`<img alt="a > R-012">`): the alt survives unchanged and no link is inserted into it (Task 1 test `attribute with >`).
2. An ADR ID inside `<script>` or `<style>` text in rendered HTML: never linked, never counted as a key (Task 1 test `script and style`).
3. A multi-line HTML comment outside code in an ADR section next to a fenced block that holds one: the outside one is stripped, the fenced one kept (Task 5 test `fence and comment`).
4. A shared URL `?status=none` on a site with no null-status ADRs: nothing shown, empty message reads `with status none` (Task 4 test `status none`).
5. A site with zero ADRs or with the Decisions view off: `siteRefs()` never calls `getCollection('adrs')` and every page builds (Task 2 step `no ADRs`).

---

### Task 1: `linkHtml` returns keys and splits tags safely

**Files:**

- Modify: `packages/pm-docs-site/src/lib/link-html.ts`
- Modify: `packages/pm-docs-site/src/routes/plan/decisions/[id].astro:87` (use `.html`)
- Test: `packages/pm-docs-site/test/link-html.test.ts`

**Interfaces:**

- Produces: `export interface LinkedHtml { html: string; keys: Set<string> }` and `export function linkHtml(html: string, known: Map<string, Target>): LinkedHtml`.

- [x] **Step 1: Update the existing tests to read `.html`, and add the failing tests**

```ts
it('attribute with >: never splits the tag', () => {
 const out = linkHtml('<p><img src="x.png" alt="a > R-012"> R-012</p>', known);
 expect(out.html).toBe('<p><img src="x.png" alt="a > R-012"> <a href="/plan/features/r-012/">R-012</a></p>');
 expect([...out.keys]).toEqual(['R-012']);
});
it('script and style: text inside is never linked', () => {
 const out = linkHtml('<script>R-012</script><style>/* ADR-002 */</style><p>x</p>', known);
 expect(out.html).toBe('<script>R-012</script><style>/* ADR-002 */</style><p>x</p>');
 expect(out.keys.size).toBe(0);
});
it('keys: every linked key, none from inside links or unknown IDs', () => {
 const out = linkHtml('<p><em>R-012</em> <a href="/x">ADR-002</a> R-099</p>', known);
 expect([...out.keys]).toEqual(['R-012']);
});
```

- [x] **Step 2: Run** `cd packages/pm-docs-site && bun test test/link-html.test.ts` — Expected: FAIL (`out.html` undefined).
- [x] **Step 3: Implement.** Split with the Global Constraints tag pattern (wrapped in a capture group), `SKIP = new Set(['a', 'script', 'style'])`, add `run.target.key` to `keys` for each linked run. Update the header comment. In `[id].astro`, use `linkHtml(...).html`.
- [x] **Step 4: Run** `bun test test/link-html.test.ts` — Expected: PASS.
- [x] **Step 5: Commit** `fix(pm-docs-site): link html tags safely and return linked keys (R-040)`.

### Task 2: References from rendered ADR HTML; async `siteRefs()`

**Files:**

- Modify: `packages/pm-docs-site/src/lib/references.ts` (remove `siteRefs`, its cache, and the `virtual:pm-docs-site/config` import; add the `adrKeys` parameter)
- Create: `packages/pm-docs-site/src/lib/site-refs.ts`
- Modify (`siteRefs()` to `await siteRefs()`, import from `site-refs`): `src/components/LinkedFrom.astro`, `src/components/LinkedText.astro`, `src/components/RefLink.astro`, `src/pages/plan/board.astro`, `src/pages/plan/log.astro`, `src/pages/plan/roadmap.astro`, `src/routes/plan/decisions.astro`, `src/routes/plan/decisions/[id].astro`, `src/routes/plan/graph.astro`, `src/routes/plan/now.astro`
- Test: `packages/pm-docs-site/test/references.test.ts`

**Interfaces:**

- Consumes: `linkHtml(...).keys` (Task 1); `RenderedAdr` and `ADR_SECTIONS` from `src/loaders/adrs.ts`.
- Produces: `references(planning: Planning, views: Views, adrKeys?: Map<string, Set<string>>): Map<string, Backlink[]>`; `export function siteRefs(): Promise<{ known: Map<string, Target>; back: Map<string, Backlink[]> }>` in `site-refs.ts`.

- [x] **Step 1: Write the failing test** in `references.test.ts`:

```ts
it('ADR keys replace the raw-Markdown pass for an ADR page', () => {
 const copy = structuredClone(planning);
 const adr = copy.adrs[0]!;
 const item = features(copy)[0]!.id;
 const fromAdr = (back: Map<string, Backlink[]>) => back.get(item)!.some((entry) => entry.href === adrHref(adr.id) && entry.relation === 'mentions');

 adr.context = `See ${item}.`;
 expect(fromAdr(references(copy, all))).toBe(true); // raw pass, no keys given
 expect(fromAdr(references(copy, all, new Map([[adr.id, new Set<string>()]])))).toBe(false);
 expect(fromAdr(references(copy, all, new Map([[adr.id, new Set([item])]])))).toBe(true);
});
```

- [x] **Step 2: Run** `bun test test/references.test.ts` — Expected: FAIL.
- [x] **Step 3: Implement `references`.** In the ADR loop: when `adrKeys` has `adr.id`, call `own.link(key, 'mentions')` for each key and `own.prose(adr.source)`; otherwise keep today's `prose()` over `source` and the four sections.
- [x] **Step 4: Implement `site-refs.ts`.** Cached promise. Load planning; `known = targets(...)`. Only when `planning.adrs.length > 0 && config.views.decisions` (**no ADRs** case): `await getCollection('adrs')`, and for each entry collect the union of `linkHtml(html, known).keys` over its non-null, non-empty sections into `adrKeys`. Return `{ known, back: references(planning, config.views, adrKeys) }`. Move the existing `siteRefs` comment here.
- [x] **Step 5: Update the 10 callers** to `const { ... } = await siteRefs();` from `../lib/site-refs` (relative path per file).
- [x] **Step 6: Run** `bun test` in `packages/pm-docs-site` — Expected: PASS (unit tests; the build tests run in Task 3).
- [x] **Step 7: Commit** `fix(pm-docs-site): build adr references from rendered html (R-040)`.

### Task 3: Built-site link test for the three Markdown constructs

**Files:**

- Modify: `packages/pm-docs-site/test/fixtures/planning.json` (ADR-003's `context`)
- Test: `packages/pm-docs-site/test/links.test.ts`

**Interfaces:**

- Consumes: Tasks 1 and 2.

- [x] **Step 1: Extend the fixture.** Append to ADR-003's `context` the paragraph `` Also _R-012_, [R-012](https://x), and ![a > R-012](x.png). `` Keep every other field. If the build fails resolving `x.png` as a local image, use `https://x/x.png` and note it in the commit body (the Done when check is about `alt`, not the path). Confirm `R-012` is an item in the fixture; otherwise use an item ID the fixture has and keep the same three constructs.
- [x] **Step 2: Add the failing test** to `links.test.ts`:

```ts
it('ADR-003 keeps the image alt and links emphasis, never the link text or alt', () => {
 const html = readFileSync(join(dist, 'plan/decisions/adr-003/index.html'), 'utf8');
 expect(html).toContain('alt="a > R-012"');
 expect(html).toMatch(/<em><a href="\/plan\/features\/r-012\/">R-012<\/a><\/em>/);
 expect(html).toMatch(/<a href="https:\/\/x\/?">R-012<\/a>/);
});
```

The existing "every link is in its target's Linked from" and "every known ID is a link" checks then cover the Linked from side.

- [x] **Step 3: Run** `cd packages/pm-docs-site && bun test test/links.test.ts` — Expected: PASS once Tasks 1 and 2 are in; if it fails, the failure names the mismatch to fix in Task 1 or 2's code.
- [x] **Step 4: Run** `cd ../.. && just validate` — Expected: the fixture still validates against the schema.
- [x] **Step 5: Commit** `test(pm-docs-site): pin adr link and linked-from agreement (R-040)`.

### Task 4: Decisions view edge states

**Files:**

- Modify: `packages/pm-docs-site/src/lib/decisions.ts`
- Modify: `packages/pm-docs-site/src/components/decisions/Decisions.tsx`
- Modify: `packages/pm-docs-site/src/routes/plan/decisions.astro`
- Test: `packages/pm-docs-site/test/decisions.test.ts`, `packages/pm-docs-site/test/links.test.ts` (built page)

**Interfaces:**

- Produces: `export type DecisionsStatus = AdrStatus | 'unknown'`; `export const DECISIONS_STATUSES: readonly DecisionsStatus[] = [...ADR_STATUSES, 'unknown']`; `DecisionsState.status: DecisionsStatus[]`; `DEFAULT_DECISIONS_STATE.status = ['proposed', 'accepted', 'deprecated', 'unknown']`; `Decisions` gets prop `hasUnknown: boolean`.

- [x] **Step 1: Write the failing tests** in `decisions.test.ts`:

```ts
it('status none: every chip off round-trips as ?status=none', () => {
 const state = { ...DEFAULT_DECISIONS_STATE, status: [] };
 expect(decisionsQuery(state)).toBe('?status=none');
 expect(parseDecisionsQuery('?status=none', categories).status).toEqual([]);
});
it('no status: an ADR with a null status is unknown and follows its chip', () => {
 const adr = { ...byId('ADR-002'), status: null };
 expect(matchesDecision(adr, DEFAULT_DECISIONS_STATE)).toBe(true);
 expect(matchesDecision(adr, { ...DEFAULT_DECISIONS_STATE, status: ['accepted'] })).toBe(false);
});
it('one category: the category parameter is dropped', () => {
 expect(parseDecisionsQuery('?category=data', ['data']).category).toEqual([]);
 expect(parseDecisionsQuery('?category=data', []).category).toEqual([]);
});
```

Keep the existing `?status=` test: an empty value still falls back to the default. Update tests that assert the old default list.

- [x] **Step 2: Run** `bun test test/decisions.test.ts` — Expected: FAIL.
- [x] **Step 3: Implement `decisions.ts`.** `parseDecisionsQuery`: `status=none` gives `[]`; fewer than 2 categories gives `category: []`. `decisionsQuery`: an empty status list writes `status=none`. `matchesDecision`: compare `adr.status ?? 'unknown'`. `groupDecisions` status keys use `DECISIONS_STATUSES` (already ends in `unknown`).
- [x] **Step 4: Implement the island and page.** `Decisions.tsx` maps `DECISIONS_STATUSES`, rendering the `unknown` chip only when `hasUnknown`. `decisions.astro` passes `hasUnknown={planning.adrs.some((adr) => adr.status === null)}` and adds, after the island: `<noscript><style>.decisions [hidden] { display: revert !important; }</style></noscript>`.
- [x] **Step 5: Add the built-page test** to `links.test.ts`: `plan/decisions/index.html` contains `<noscript><style>.decisions [hidden]`.
- [x] **Step 6: Run** `bun test test/decisions.test.ts test/links.test.ts` and `bun run check` in `packages/pm-docs-site` — Expected: PASS, no type errors.
- [x] **Step 7: Commit** `fix(pm-docs-site): pin decisions view edge states (R-040)`.

### Task 5: Export keeps comments in code and uses the file-name ID

**Files:**

- Modify: `skills/pm-export/scripts/planning.ts:47-48,161-189,669`
- Modify: `skills/pm-export/SKILL.md` (ADR field map: the two rules)
- Test: `skills/pm-export/scripts/export.test.ts`

**Interfaces:**

- Produces: `export const stripCommentsOutsideCode = (text: string) => string`; `parseAdr(file: string, text: string, pmRoot: string, assume?: (text: string) => void): Adr | null`.

- [x] **Step 1: Write the failing tests:**

```ts
it("stripCommentsOutsideCode: inline code and fences keep comments", () => {
  expect(stripCommentsOutsideCode("a `<!-- x -->` b <!-- y --> c")).toBe("a `<!-- x -->` b  c");
});
it("stripCommentsOutsideCode: fence and comment", () => {
  const text = "<!-- a\nb -->\n```md\n<!-- pm-skills:start -->\n```\n";
  expect(stripCommentsOutsideCode(text)).toBe("\n```md\n<!-- pm-skills:start -->\n```\n");
});
it("parseAdr: a section keeps a comment inside a code span", () => {
  const adr = parseAdr("ADR-005-x.md", "# ADR-005 X\n\n- Status: proposed\n\n## Context\n\nShow `<!-- x -->` here.\n", "planning/")!;
  expect(adr.context).toBe("Show `<!-- x -->` here.");
});
it("parseAdr: a mismatched heading exports under the file-name ID", () => {
  const seen: string[] = [];
  const adr = parseAdr("ADR-004-x.md", "# ADR-003 X\n\n- Status: proposed\n", "planning/", (text) => seen.push(text))!;
  expect(adr.id).toBe("ADR-004");
  expect(adr.title).toBe("X");
  expect(seen).toEqual(["planning/decisions/ADR-004-x.md is headed ADR-003; exported as ADR-004."]);
});
```

- [x] **Step 2: Run** `bun test skills/pm-export/scripts/export.test.ts` — Expected: FAIL.
- [x] **Step 3: Implement `stripCommentsOutsideCode`.** Normalise `\r\n`; split into fenced blocks (a line opening with 3+ backticks or tildes, up to the matching closing fence or end of text) and the rest; in the rest, replace with `` /(`+)[\s\S]*?\1|<!--[\s\S]*?-->/g ``, keeping the code-span matches and dropping the comments.
- [x] **Step 4: Implement `parseAdr`.** Header fields and heading from `stripComments(text)`; sections from `sections(stripCommentsOutsideCode(text), 2)`. `id` is `named[1]`; when `headed?.[1]` differs, call `assume?.(...)` with the exact text above. In `build` (line 669), pass `assume`.
- [x] **Step 5: Update `skills/pm-export/SKILL.md`** ADR field map: `id` is the file name's `ADR-NNN` (a differing heading is an assumption); sections keep HTML comments inside code.
- [x] **Step 6: Run** `just test` — Expected: PASS (export tests, fixture repo, lint tests).
- [x] **Step 7: Commit** `fix(pm-export): keep code comments and file-name ids in adrs (R-040)`.

### Task 6: Versions and full verification

**Files:**

- Modify: `package.json` (via `just bump prerelease`), `packages/pm-docs-site/package.json`

- [x] **Step 1: Run** `just bump prerelease` — Expected: `package.json` is `21.0.0-pre.11`; the marker stays `version=21`.
- [x] **Step 2: Set** `packages/pm-docs-site/package.json` `version` to `0.1.0-pre.5`.
- [x] **Step 3: Run** `just validate` — Expected: PASS; fix any pinned-version line it names in the package docs.
- [x] **Step 4: Run** `just version-check` — Expected: PASS.
- [x] **Step 5: Run** `just test`, `just package-test`, `just lint-check`, `just docs-check` — Expected: each exits 0.
- [x] **Step 6: Commit** `chore(release): bump to 21.0.0-pre.11 and pm-docs-site 0.1.0-pre.5 (R-040)`.
