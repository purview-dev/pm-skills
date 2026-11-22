# ADR Export and Decisions View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export every ADR in `<PM root>/decisions/` whole into `planning.json` at `schemaVersion` 5, and show them in `@purview-dev/pm-docs-site` as a searchable Decisions view, one page per ADR, and a Decisions list on feature pages.

**Architecture:** `pm-export` parses each ADR file into an object whose four sections are Markdown strings (ADR-002). The package loads those strings into an `adrs` content collection whose loader calls `renderMarkdown`, so pages render HTML with the site's own Markdown processor. A pure `src/lib/decisions.ts` holds filter, search, group, and URL-state logic for a React island; `src/lib/references.ts` learns `ADR-NNN` so links and `Linked from` cover ADRs.

**Tech Stack:** TypeScript on Bun (`bun test`), Astro 7 and Starlight, React islands, Pagefind, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-22-adr-export-and-decisions-view-design.md`

## Global Constraints

- Work on `feat/r-038-adr-export-and-decisions-view`; create no branch or worktree.
- Follow ADR-001 (ADRs live in the PM root) and ADR-002 (sections export as Markdown text).
- `schemaVersion` is `5` everywhere it is `4` today; the package supports `[5]` only.
- No new dependency in `packages/pm-docs-site` (no `@astrojs/markdown-remark`).
- The docs site reads `planning.json` only; nothing in the package reads `decisions/`.
- TypeScript only (`.ts`/`.tsx`), React islands, never Preact; justfile recipes stay `sh`.
- ADR object keys: `id`, `path`, `title`, `status`, `supersededBy`, `date`, `category`, `supersedes`, `item`, `source`, `context`, `decision`, `alternatives`, `consequences`; a missing value is `null`; an empty section is `""`.
- `status` is one of `proposed`, `accepted`, `deprecated`, `superseded`.
- Superseded ADRs are hidden by default in the Decisions view.
- Commit messages follow `commitlint.config.mts` (lower-case subject start).

## Review Focus

1. An ADR missing a section or carrying an extra `##` heading (imported, unlinted): the export writes `null` for the missing key and ignores the extra; the page omits the section. Test: Task 1 `parseAdr` missing-section case; Task 5 page fixture.
2. A search with mixed case or Markdown punctuation (`**Bun**`, `` `astro` ``): it matches the plain words. Test: Task 3 `matchesDecision` search cases.
3. A shared URL with an unknown `status`, a category that no longer exists, or junk `group`: ignored, defaults kept, no crash. Test: Task 3 `parseDecisionsQuery` junk case.
4. An ID inside a code span, a fenced block, or an existing link in an ADR body: not linked (or not double-linked). Test: Task 4 `linkHtml` cases.
5. An ADR whose `Item` names an ID not in the export: rendered as plain text, no broken link, and no `Linked from` entry. Test: Task 4 `references` case.

---

### Task 1: Export ADRs at schemaVersion 5

**Files:**
- Modify: `skills/pm-export/scripts/planning.ts` (`SCHEMA_VERSION` L11 and header L1; new `parseAdr`; `adrs` in the document near L691)
- Modify: `skills/pm-export/references/planning.schema.json` (const L33; `adrs` in `required` and `properties`; `$defs/adr`)
- Modify: `skills/pm-export/references/planning.example.json` (`schemaVersion` 5; two ADRs)
- Modify: `skills/pm-export/SKILL.md` (`schemaVersion` row L125, an `adrs` row after `risks` L139, the ADR object after the risk object L209-216, `decisions/` in the `write` inputs L232)
- Create: `scripts/__fixtures__/repo/planning/decisions/README.md` (copy of `skills/pm-init/templates/decisions-README.md`), `ADR-001-use-bun-for-scripts.md`, `ADR-002-pin-the-astro-major.md` (contents in Step 1)
- Test: `skills/pm-export/scripts/export.test.ts`

**Interfaces:**
- Produces: `export interface Adr` (keys in Global Constraints; `status: "proposed" | "accepted" | "deprecated" | "superseded"`), `export function parseAdr(file: string, text: string, pmRoot: string): Adr | null` (returns `null` when `file` does not match `/^ADR-\d{3,}-.+\.md$/`), `export function sortAdrs(adrs: Adr[]): Adr[]` (by `Number(id.slice(4))`, a new array), and `planning.adrs: Adr[]` built with both.

- [ ] **Step 1: Write the fixture ADRs.** ADR-001 `Use Bun for scripts` (`Status: superseded by ADR-002`, `Category: tooling`, `Item: none`, an `## Alternatives` table) and ADR-002 `Pin the Astro major` (`Status: accepted`, `Supersedes: ADR-001`, `Item: R-001` or any item ID present in the fixture roadmap, `## Consequences` with `None recorded.`). Run `bun skills/pm-lint/scripts/lint.ts check --root scripts/__fixtures__/repo --pm-root planning/`; expected `pm-lint: clean`.

- [ ] **Step 2: Write the failing tests** in `export.test.ts`:

```ts
test("schemaVersion is 5", () => expect(doc.schemaVersion).toBe(5)); // replaces toBe(4) at L80
test("adrs come from decisions/, whole, by ID", () => {
  expect(doc.adrs.map((a) => a.id)).toEqual(["ADR-001", "ADR-002"]);
  const [old, cur] = doc.adrs;
  expect(old).toMatchObject({ status: "superseded", supersededBy: "ADR-002", category: "tooling", item: null, supersedes: null, source: null, path: "planning/decisions/ADR-001-use-bun-for-scripts.md", title: "Use Bun for scripts" });
  expect(old.alternatives).toContain("| --- |");
  expect(cur).toMatchObject({ status: "accepted", supersedes: "ADR-001", supersededBy: null });
  expect(cur.consequences).toBe("None recorded.");
});
test("parseAdr: missing section is null, extra heading ignored, non-ADR file skipped", () => {
  const text = "# ADR-010 Ten\n\n- Status: Accepted\n- Date: 2026-01-01\n- Category: Data\n- Supersedes: none\n- Item: none\n- Source: docs/adr/0003.md\n\n## Context\n\nWhy.\n\n## Notes\n\nExtra.\n\n## Decision\n\nDo it.\n";
  const adr = parseAdr("ADR-010-ten.md", text, "planning/")!;
  expect(adr).toMatchObject({ id: "ADR-010", status: "accepted", category: "data", source: "docs/adr/0003.md", context: "Why.", decision: "Do it.", alternatives: null, consequences: null });
  expect(parseAdr("README.md", "# Decisions\n", "planning/")).toBeNull();
});
test("sortAdrs orders by ID number", () => {
  const ids = sortAdrs([{ id: "ADR-010" }, { id: "ADR-002" }] as Adr[]).map((a) => a.id);
  expect(ids).toEqual(["ADR-002", "ADR-010"]);
});
```

- [ ] **Step 3: Run** `bun test skills/pm-export/scripts/export.test.ts`. Expected: FAIL (`parseAdr` not exported, `schemaVersion` 4).

- [ ] **Step 4: Implement** `parseAdr` and the `adrs` key. Use `folder("decisions")`, `stripComments`, `sections(text, 2)`, and `fields`; section bodies trimmed of surrounding blank lines, otherwise verbatim; `status` lower-cased, `superseded by ADR-NNN` split into `status: "superseded"` and `supersededBy`; `category` lower-cased; `none` becomes `null`; sort by `Number(id.slice(4))`. Set `SCHEMA_VERSION = 5`.

- [ ] **Step 5: Update the schema** (`$defs/adr` with `additionalProperties: false`, `id` pattern `^ADR-\\d{3,}$`, `supersedes`/`supersededBy` the same pattern or `null`, `item` `^R-\\d{3,}$` or `null`, `status` enum, the four sections `string | null`), the example (two ADRs, one superseding the other), and `SKILL.md`.

- [ ] **Step 6: Run** `bun test skills/pm-export/scripts/` and `bun skills/pm-export/scripts/export.ts validate skills/pm-export/references/planning.example.json`. Expected: PASS, `valid`.

- [ ] **Step 7: Commit** `feat(pm-export): export ADRs at schemaVersion 5 (R-038)`.

### Task 2: Templates, docs-site, and validate read schemaVersion 5

**Files:**
- Modify: `skills/pm-docs-site/templates/site/src/lib/planning.ts` (`SCHEMA_VERSION` L16), `planning-types.ts` (literal 5 at L158, header L1, optional `adrs?: Adr[]` with an `Adr` type matching Task 1), `__fixtures__/planning.json` (`schemaVersion` 5, `"adrs": []`)
- Modify: `skills/pm-docs-site/SKILL.md` (`This skill reads schemaVersion 5.`)
- Modify: `scripts/validate.ts` L149 (const must be 5)
- Modify: `docs-site/pm-docs-site.json` (`"schemaVersion": 5`, by hand)
- Regenerate: `docs-site/` with `bun skills/pm-docs-site/scripts/site.ts write docs-site`

**Interfaces:**
- Consumes: Task 1's schema (`required` includes `adrs`).

- [ ] **Step 1: Run** `just validate`. Expected: FAIL naming the schema const and the template version.
- [ ] **Step 2: Make the edits above**, then run the `site.ts write` command.
- [ ] **Step 3: Run** `just validate` and `bun test skills/pm-docs-site/templates/site/src/lib/planning.test.ts`. Expected: PASS.
- [ ] **Step 4: Commit** `feat(pm-docs-site): templates read schemaVersion 5 (R-038)`.

### Task 3: Package reads schemaVersion 5; decisions state, search, and grouping

**Files:**
- Modify: `packages/pm-docs-site/lib/schema-version.ts` L4 (`[5]`)
- Modify: `packages/pm-docs-site/src/lib/planning-types.ts` (literal 5, `Adr`, `AdrStatus`, `adrs: Adr[]` on `Planning`)
- Modify: `packages/pm-docs-site/test/fixtures/planning.json` (`schemaVersion` 5; four ADRs: two `architecture`, two `data`; one each of proposed, accepted, deprecated, superseded; one with an `item` that is a fixture feature, one with an `item` not in the export; one with a table in `alternatives`; one with `` `R-001` `` inside a code span in `context`)
- Modify: `packages/pm-docs-site/test/schema-version.test.ts` L13-30 and `test/cli.test.ts` L193-234 (supported 5, unsupported 6)
- Create: `packages/pm-docs-site/src/lib/decisions.ts`
- Test: `packages/pm-docs-site/test/decisions.test.ts`

**Interfaces:**
- Produces, in `src/lib/decisions.ts`:
  - `export const ADR_STATUSES: readonly AdrStatus[] = ['proposed', 'accepted', 'deprecated', 'superseded']` (also the group order)
  - `export type DecisionsGroup = 'category' | 'status' | 'none'`
  - `export interface DecisionsState { q: string; status: AdrStatus[]; category: string[]; group: DecisionsGroup }`
  - `export const DEFAULT_DECISIONS_STATE: DecisionsState = { q: '', status: ['proposed', 'accepted', 'deprecated'], category: [], group: 'category' }` (empty `category` means all)
  - `export function parseDecisionsQuery(search: string, categories: string[]): DecisionsState`
  - `export function decisionsQuery(state: DecisionsState): string` (`''` for the default; keys in order `q`, `status`, `category`, `group`; lists comma-joined in `ADR_STATUSES` or name order)
  - `export function adrSearchText(adr: Adr): string` (ID, title, category, and the four sections with Markdown syntax characters ``*_`#>|[]()`` replaced by spaces, lower-cased)
  - `export function matchesDecision(adr: Adr, state: DecisionsState): boolean` (every whitespace-separated word of `q`, lower-cased, appears in `adrSearchText`)
  - `export function groupDecisions(adrs: Adr[], group: DecisionsGroup): { key: string; label: string; adrs: Adr[] }[]` (category groups by name; status groups in `ADR_STATUSES` order; `none` one group keyed `all`; ADRs by ID inside a group)

- [ ] **Step 1: Write the failing tests** in `decisions.test.ts`, using the fixture ADRs:
  - `decisionsQuery(DEFAULT_DECISIONS_STATE) === ''`; a round trip of `{ q: 'astro pin', status: ['accepted', 'superseded'], category: ['data'], group: 'status' }` returns the same state.
  - `parseDecisionsQuery('?status=bogus,accepted&category=gone&group=x&q=', ['data', 'architecture'])` gives `status: ['accepted']`, `category: []`, `group: 'category'`.
  - `parseDecisionsQuery('?status=', cats).status` equals the default list.
  - Default state hides the superseded ADR and shows the others.
  - `matchesDecision` with `q: 'BUN'` matches an ADR whose context holds `**Bun**`, and `q: 'bun zebra'` does not.
  - `groupDecisions(adrs, 'status').map(g => g.key)` follows `ADR_STATUSES` order, skipping empty groups.
  - `schema-version.test.ts` and `cli.test.ts` assert 5 supported and 6 rejected.
- [ ] **Step 2: Run** `cd packages/pm-docs-site && bun test`. Expected: FAIL (module missing, version 4).
- [ ] **Step 3: Implement** the edits and `decisions.ts`.
- [ ] **Step 4: Run** `bun test` and `bun run check` in `packages/pm-docs-site`. Expected: PASS (no ADR pages exist yet, so `expected-pages.txt` is unchanged until Task 5).
- [ ] **Step 5: Commit** `feat(pm-docs-site): read schemaVersion 5 and filter ADRs (R-038)`.

### Task 4: ADR references, `adrsOf`, and links inside rendered HTML

**Files:**
- Modify: `packages/pm-docs-site/src/lib/planning.ts` (beside `dependents()` L344)
- Modify: `packages/pm-docs-site/src/lib/references.ts`
- Create: `packages/pm-docs-site/src/lib/link-html.ts`
- Test: `packages/pm-docs-site/test/references.test.ts`, `test/link-html.test.ts`

**Interfaces:**
- Consumes: `Adr` (Task 3).
- Produces:
  - `export function adrHref(id: string): string` → `/plan/decisions/<id lower-case>/` (in `planning.ts`)
  - `export function adrsOf(planning: Planning, itemId: string): Adr[]` (ADRs whose `item === itemId`, by ID)
  - `TargetKind` gains `'adr'`; `IDS` gains `String.raw\`ADR-\d{3,}\`` first; `targets()` adds each ADR with `href: views.decisions ? adrHref(id) : null`, label `ADR-NNN Title`
  - `Relation` gains `'decision'` (label `Decisions`) and `'supersedes'` (label `Supersedes`)
  - `export function linkHtml(html: string, known: Map<string, Target>): string` in `link-html.ts`: runs `linkify` over text between tags only, wrapping each linked run in `<a href="…">…</a>` (escaped), and leaves text inside `code`, `pre`, and `a` untouched
- `references()` sources (each page renders exactly these links):
  - `/plan/decisions/` (when `views.decisions`): every ADR `listed`; each ADR's `item` `listed`; each `supersededBy` `listed`.
  - Each ADR page: `item` as `decision`; `supersedes` and `supersededBy` as `supersedes`; the four sections as `prose` (`mentions`).
  - Feature pages, and `/plan/board/` and `/plan/roadmap/` for every item they render through `ItemDetail`: each of `adrsOf(item)` as `listed`.

- [ ] **Step 1: Write the failing tests:**
  - `link-html.test.ts`: `linkHtml('<p>See R-001 and ADR-002.</p>', known)` links both; `'<p><code>R-001</code></p>'` and `'<pre><code>ADR-002</code></pre>'` stay unchanged; `'<p><a href="/x">R-001</a></p>'` stays unchanged; `'<p>&lt;R-001&gt;</p>'` keeps its entities and links the ID.
  - `references.test.ts`: `targets()` has `ADR-002` with kind `adr` and href `/plan/decisions/adr-002/`; `linkify('ADR-002 and R-001', known)` gives two linked runs, and `R-001` is not found inside `ADR-001`; `references()` for the fixture item with an ADR holds `{ href: '/plan/decisions/adr-nnn/', relation: 'decision' }`, and that ADR's list holds the item's feature page as `listed`; the ADR whose `item` is not in the export adds no backlink and no error; with `views.decisions` false, ADR targets have `href: null`.
  - `planning.test.ts`: `adrsOf(fixture, '<fixture item>')` returns its ADR.
- [ ] **Step 2: Run** `bun test test/link-html.test.ts test/references.test.ts test/planning.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `views.decisions` comes from Task 5's `ViewName`; add `'decisions'` to `lib/types.ts` `ViewName` and `lib/options.ts` `VIEW_NAMES` (default on) in this task so `Views` type-checks.
- [ ] **Step 4: Run** the same tests and `bun run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(pm-docs-site): link ADRs across the site (R-038)`.

### Task 5: ADR pages, the Decisions view, and feature Decisions lists

**Files:**
- Create: `packages/pm-docs-site/src/loaders/adrs.ts` — `export function adrsLoader(): Loader` (name `adrs`): for each `loadPlanning().adrs` entry, `store.set({ id: adr.id.toLowerCase(), data: adr, rendered: … })` with one `renderMarkdown` call per non-null section, stored as `data.html: Record<'context' | 'decision' | 'alternatives' | 'consequences', string | null>`
- Modify: `packages/pm-docs-site/src/content.config.ts` (an `adrs` collection with that loader; schema `z.any()` or a passthrough)
- Create: `packages/pm-docs-site/src/routes/plan/decisions.astro` (StarlightPage `Decisions`, `ExportStamp kind="Decisions"`, an empty state `No ADRs yet. Record one with pm-adr new.` when `adrs` is empty, else `<Decisions client:load adrs={…} categories={…} />` inside a `data-pagefind-ignore` wrapper)
- Create: `packages/pm-docs-site/src/routes/plan/decisions/[id].astro` (from `getCollection('adrs')`; `ExportStamp kind="ADR"`; status badge; facts `Date`, `Category`, `Item`, `Supersedes`, `Superseded by`, `Source` through `RefLink`/`LinkedText`; each section `<h2>` + `set:html={linkHtml(html, known)}`; `null` omitted; `""` shows `None recorded.` without the `plan-empty` class; `LinkedFrom ref={adr.id}`)
- Create: `packages/pm-docs-site/src/components/decisions/Decisions.tsx` and `useDecisionsUrlState.ts` (like `components/board/useBoardUrlState.ts`: default on SSR, parse on mount, `history.replaceState`)
- Modify: `lib/index.ts` `VIEW_ROUTES` (`decisions: [['/plan/decisions', 'plan/decisions.astro'], ['/plan/decisions/[id]', 'plan/decisions/[id].astro']]`), `lib/sidebar.ts` (`views.decisions && { label: 'Decisions', link: '/plan/decisions/' }` after Risks)
- Modify: `src/components/FeatureSummary.astro` (a `Decisions` list from `adrsOf`, each `RefLink` and status, shown only when non-empty)
- Modify: `test/links.test.ts` (`ALL_VIEWS` gains `decisions`; `TARGET_PAGE` becomes `/(features|milestones|risks|decisions)/`), `test/sidebar.test.ts`, `test/fixtures/expected-pages.txt` (the Decisions page and one line per fixture ADR), `README.md` (view list)

**Interfaces:**
- Consumes: Tasks 3 and 4 (`decisions.ts` functions, `adrHref`, `adrsOf`, `linkHtml`, `siteRefs()`).
- Island props: `{ adrs: Array<Omit<Adr, 'context' | 'decision' | 'alternatives' | 'consequences'> & { text: string; itemLabel: string | null; itemHref: string | null; successorLabel: string | null } >; categories: string[] }` where `text` is `adrSearchText(adr)`.
- Island UI: search box (label `Search decisions`), status chips and category chips (toggle buttons with `aria-pressed`), a `Group by` select (`Category`, `Status`, `None`), a `Clear` button, rows `ADR-NNN Title` linked to `adrHref`, status badge, category, date, item named reference, `Superseded by ADR-NNN Title` when set; an empty result names the active filters.

- [ ] **Step 1: Update `expected-pages.txt`, `links.test.ts`, and `sidebar.test.ts`** with the new pages and view, then run `bun test`. Expected: FAIL (pages not built).
- [ ] **Step 2: Implement** the loader, collection, routes, island, view registration, sidebar, and `FeatureSummary`.
- [ ] **Step 3: Run** `bun test` and `bun run check` in `packages/pm-docs-site`. Expected: PASS, including `links.test.ts` (every rendered link in its target's `Linked from`) and the fixture ADR table rendered as a `<table>` (add that assertion to the page test that reads built HTML).
- [ ] **Step 4: Commit** `feat(pm-docs-site): decisions view and ADR pages (R-038)`.

### Task 6: Browser test for the Decisions view

**Files:**
- Create: `packages/pm-docs-site/test/browser/decisions.browser.ts`

- [ ] **Step 1: Write the test:** open `/plan/decisions/`; the superseded fixture ADR is not visible; type a word from one ADR's `context` into `Search decisions` and see only that row; press the `superseded` chip; reload; the search text, the chip's `aria-pressed="true"`, and the row list are the same; `Clear` restores the default and an empty query string.
- [ ] **Step 2: Run** `bun run test:browser -- decisions`. Expected: PASS (`bunx playwright install chromium` first if needed).
- [ ] **Step 3: Commit** `test(pm-docs-site): decisions view keeps its state in the url (R-038)`.

### Task 7: Demo ADRs

**Files:**
- Create: `examples/demo/planning/decisions/README.md` (from `skills/pm-init/templates/decisions-README.md`) and four ADRs across `architecture` and `data`, one per status, one superseding another, each `Item` a demo roadmap or done item, one with a table in `## Alternatives`, none with an empty section
- Modify: `examples/demo/expected-pages.txt` (the Decisions page and one line per ADR)
- Regenerate: `bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/`

- [ ] **Step 1: Write the ADRs** and run `bun skills/pm-lint/scripts/lint.ts check --root examples/demo --pm-root planning/`. Expected: `pm-lint: clean`.
- [ ] **Step 2: Regenerate the export** and update `expected-pages.txt`.
- [ ] **Step 3: Run** `just demo-check`. Expected: PASS. If `bun install --frozen-lockfile` fails because the package changed, run `bun install` in `examples/demo` and commit its `bun.lock`.
- [ ] **Step 4: Commit** `feat(pm-docs-site): demo ADRs (R-038)`.

### Task 8: Versions, upgrade note, and the full checks

**Files:**
- Modify: `packages/pm-docs-site/package.json` (`0.1.0-pre.3`)
- Modify: `package.json` via `just bump prerelease` (`21.0.0-pre.4`)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (append to the `Version 21` upgrade note: `Version 21 also moves the export to schemaVersion 5, which adds adrs: run pm-export, and pm-docs-site upgrade for an installed site.`) and the same text in the section installed in `AGENTS.md`
- Modify: `planning/planning.json` is refreshed by the next PM commit; do not hand-edit it

- [ ] **Step 1: Make the edits.**
- [ ] **Step 2: Run** `just lint-check`, `just docs-check`, `just package-test`, and `bun skills/pm-export/scripts/export.ts write --root . --pm-root planning/` followed by `bun skills/pm-export/scripts/export.ts check --root . --pm-root planning/`. Expected: all PASS; `planning/planning.json` holds ADR-001 and ADR-002 whole at `schemaVersion` 5. Leave the refreshed `planning/` files for the PM commit (`pm-checkpoint done`).
- [ ] **Step 3: Run** `just version-check`. Expected: PASS.
- [ ] **Step 4: Commit** `chore: version 21.0.0-pre.4 and pm-docs-site 0.1.0-pre.3 (R-038)` (exclude `planning/`).
