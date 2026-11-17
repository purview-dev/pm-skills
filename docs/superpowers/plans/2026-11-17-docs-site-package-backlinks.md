# R-009 Docs-site package: backlinks everywhere — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Every item, milestone, risk ID and brief path on the package site is a link, every item, milestone and risk page lists what links to it, Board and Roadmap cards open a detail popup, Board columns collapse and remember it, and every page uses the full width.

**Architecture:** One build-time module, `src/lib/references.ts`, turns `planning.json` into link targets, a prose tokenizer, and a backlink index; pages render links through three small components, so links and `Linked from` lists come from the same data. Board and Roadmap cards are real links followed by a hidden `<template>` with the item's summary; one Astro `<script>` turns a plain click into a native `<dialog>` and handles column collapse with `localStorage`. A build-wide link test (Bun `HTMLRewriter`) and Playwright browser tests prove it.

**Tech Stack:** Astro 7.4.8, Starlight 0.42.10, TypeScript 6, `bun:test`, `@playwright/test` (Chromium), Node 24 for builds.

**Spec:** `docs/superpowers/specs/2026-11-17-docs-site-package-backlinks-design.md`

## Global Constraints

- All work is inside `packages/pm-docs-site/`, plus the `package-test` recipe in `justfile` and the package job in `.github/workflows/ci.yml`. No change to `skills/**`, `docs-site/`, the root `package.json`, or the templates.
- No new runtime dependency. `@playwright/test` is a dev dependency pinned exactly (no `^` or `~`).
- Config-time code (`index.mjs`, `lib/*.mjs`) stays plain JavaScript with JSDoc; `src/` may be TypeScript.
- Tests that build a site run `node cli.mjs` (helpers `runCli`), never Bun, and scratch sites live in `test/.tmp/`.
- Each changed Astro Components Kit file (`src/components/lib/*.astro`) keeps its MIT attribution and names every change in its header comment.
- Plan data comes only from `planning.json`; never parse PM Markdown.
- Without JavaScript every card is a working link and every column is expanded.
- `justfile`: sh recipes only; never set a shell.
- Commit messages follow `commitlint.config.mts` (conventional commits, e.g. `feat(pm-docs-site): …`, `test(pm-docs-site): …`).

## Review Focus

- **A plan or spec path that is not a built docs page** (`docsHref` today links `docs/superpowers/plans/x.md` to `/superpowers/plans/x/`, which the fixture does not build): render it as `<code>`, not a dead link. Test in Task 6.
- **Look-alike IDs in prose** (`M10` when only `M1` exists, `R-0120`, `RK-002.` at a sentence end, `(R-012)`): only exact known IDs link, punctuation stays outside the link. Test in Task 1.
- **A view switched off** (`views: ['now']`): references to its pages render as plain text, never as links to pages that were not built. Test in Task 1 (targets) and Task 8 (a link test over the views-off build).
- **Popup content counted twice by search:** `<template>` content must not appear in Pagefind results; mark templates and `Linked from` lists `data-pagefind-ignore`. Test in Task 7.
- **`localStorage` unavailable or holding junk** (private mode, a hand-edited value): the Board renders every column expanded and throws nothing. Test in Task 10.

---

### Task 1: Targets and the prose tokenizer

**Files:**

- Create: `packages/pm-docs-site/src/lib/references.ts`
- Test: `packages/pm-docs-site/test/references.test.ts`
- Modify: `packages/pm-docs-site/test/fixtures/planning.json` (prose mentions, below)

**Interfaces:**

- Consumes: `Planning`, `Risk`, `Brief` from `src/lib/planning-types.ts`; `featureHref`, `milestoneHref`, `briefAnchor`, `features`, `milestoneSummaries` from `src/lib/planning.ts`; `ResolvedOptions['views']` from `index.d.ts`.
- Produces:
  - `type TargetKind = 'item' | 'milestone' | 'risk' | 'brief'`
  - `interface Target { kind: TargetKind; key: string; href: string | null; label: string }` (`key`: the ID, `none` for the No-milestone page, or the brief path)
  - `function targets(planning: Planning, views: Record<ViewName, boolean>): Map<string, Target>`
  - `type Run = { text: string; target?: Target }`
  - `function linkify(text: string, known: Map<string, Target>): Run[]`
  - `function riskHref(risk: { id: string }, removed?: boolean): string`

- [x] **Step 1: Add prose mentions to the fixture.** In `test/fixtures/planning.json`, set the `note` of roadmap item `R-013` to a sentence that names `RK-002`, `M2`, and an unknown `R-999`, and give the Now item's checkpoint `context` (or another prose field the Now page renders) a mention of `R-011`. Keep the file valid: `bun ../../skills/pm-export/scripts/export.ts validate test/fixtures/planning.json --schema ../../skills/pm-export/references/planning.schema.json` prints `valid:`.

- [x] **Step 2: Write the failing tests** in `test/references.test.ts`:

```ts
const planning = loadPlanning(FIXTURE);
const all = { now: true, milestones: true, features: true, inbox: true, briefs: true, strategy: true };
const known = targets(planning, all);

it('has one target per item, milestone, risk and brief', () => {
 expect(known.get('R-012')).toEqual({ kind: 'item', key: 'R-012', href: '/plan/features/r-012/', label: expect.stringStartingWith('R-012 ') });
 expect(known.get('M1')?.href).toBe('/plan/milestones/m1/');
 expect(known.get('none')?.href).toBe('/plan/milestones/none/');
 expect(known.get('RK-002')?.href).toBe('/plan/risks/rk-002/');
 expect(known.get('RK-001')?.href).toBe('/plan/risks/rk-001/'); // closed
 expect(known.get('RK-003')?.href).toBe('/plan/risks/#rk-003'); // removed
 expect(known.get('planning/briefs/2026-11-07-referrals.md')?.href).toBe('/plan/briefs/#2026-11-07-referrals');
});

it('drops the href of a target whose view is off; risks are core', () => {
 const off = targets(planning, { ...all, features: false, milestones: false, briefs: false });
 expect(off.get('R-012')?.href).toBeNull();
 expect(off.get('M1')?.href).toBeNull();
 expect(off.get('planning/briefs/2026-11-07-referrals.md')?.href).toBeNull();
 expect(off.get('RK-002')?.href).toBe('/plan/risks/rk-002/');
});

it('links only exact known IDs and brief paths', () => {
 const runs = linkify('See R-012, (RK-002). Not M10, R-0120 or R-999; brief planning/briefs/2026-11-07-referrals.md.', known);
 expect(runs.filter((run) => run.target).map((run) => run.text)).toEqual(['R-012', 'RK-002', 'planning/briefs/2026-11-07-referrals.md']);
 expect(runs.map((run) => run.text).join('')).toBe('See R-012, (RK-002). Not M10, R-0120 or R-999; brief planning/briefs/2026-11-07-referrals.md.');
});

it('returns one plain run for text with no known ID', () => {
 expect(linkify('nothing here', known)).toEqual([{ text: 'nothing here' }]);
});
```

- [x] **Step 3: Run** `bun test test/references.test.ts` — Expected: FAIL, `references` module not found.

- [x] **Step 4: Implement** `targets`, `linkify`, `riskHref` in `src/lib/references.ts`. Item targets come from `features(planning)` (every state, so done and dropped items link); milestone targets from `milestoneSummaries` (including `none` when present); risk targets from `risks.open`, `risks.closed`, and `risks.removed`; brief targets from `planning.briefs` by `path`. Labels: `<ID> <title>`, `<M> <name>`, `No milestone`, the brief's title. `linkify` uses one regex: the escaped brief paths, then `\b(?:RK-\d{3,}|R-\d{3,}|M\d+)\b`; a match whose text is not a key in `known`, or whose target has `href: null`, stays in a plain run. Adjacent plain text merges into one run.

- [x] **Step 5: Run** `bun test test/references.test.ts` — Expected: PASS. Also run `bun test` — Expected: every existing test still passes (the fixture change must not break `planning.test.ts`).

- [x] **Step 6: Commit**

```bash
git add src/lib/references.ts test/references.test.ts test/fixtures/planning.json
git commit -m "feat(pm-docs-site): link targets and a prose ID tokenizer"
```

### Task 2: The backlink index

**Files:**

- Modify: `packages/pm-docs-site/src/lib/references.ts`
- Test: `packages/pm-docs-site/test/references.test.ts`

**Interfaces:**

- Consumes: Task 1's `targets`, `linkify`, `Target`.
- Produces:
  - `type Relation = 'depends on' | 'revisits' | 'milestone' | 'affects' | 'mitigation' | 'related' | 'brief' | 'mentions' | 'listed'`
  - `interface Backlink { href: string; label: string; relation: Relation }`
  - `const RELATION_LABELS: Record<Relation, string>` (`listed` → `Listed on`, `mentions` → `Mentioned on`, others capitalised, e.g. `Depends on`)
  - `function references(planning: Planning, views: Record<ViewName, boolean>): Map<string, Backlink[]>` keyed by target key

The source pages and what each links, which Tasks 4 to 7 must render exactly (relation in brackets):

| Source page | Links |
| --- | --- |
| Feature `/plan/features/<id>/` | its depends-on items [depends on], revisits item [revisits], milestone [milestone], brief [brief], risks whose `affects` is it [affects], IDs in Done when, result, reason, note [mentions] |
| Milestone `/plan/milestones/<id>/` | its items [listed], IDs in exit criteria [mentions] |
| Risk `/plan/risks/<id>/` | `affects` target [affects], IDs in trigger and mitigation [mitigation for mitigation, mentions for trigger] |
| Board `/plan/board/` | every card's item and milestone [listed] |
| Roadmap `/plan/roadmap/` | every item and group milestone [listed] |
| Log `/plan/log/` | every done and dropped item and its milestone [listed], IDs in results and reasons [mentions] |
| Risks `/plan/risks/` | every risk [listed], `affects` [affects], IDs in mitigation [mitigation] |
| Features `/plan/features/` | every item and its milestone [listed] |
| Milestones `/plan/milestones/` | every milestone [listed] |
| Now `/plan/now/` | the Now item, its milestone and brief [listed], IDs in checkpoint fields [mentions] |
| Inbox `/plan/inbox/` | each entry's `affects` [affects], `related` [related], `brief` [brief], IDs in `idea` [mentions] |
| Briefs `/plan/briefs/` | each brief's `id` item [listed], IDs in problem, decision, Done when [mentions] |
| Strategy `/plan/strategy/` | focus milestone and milestones [listed], IDs in decisions, bets, assumptions [mentions] |

A source page whose view is off contributes nothing. Entries are deduplicated by `href` + `relation`, never include the target's own page, and keep the table's page order.

- [x] **Step 1: Write the failing tests:**

```ts
const back = references(planning, all);
const from = (key: string) => back.get(key)!.map((link) => `${link.relation} ${link.href}`);

it('lists every page that links an item, by relation', () => {
 expect(from('R-012')).toContain('listed /plan/board/');
 expect(from('R-012')).toContain('listed /plan/now/');
 expect(from('R-013')).toContain('affects /plan/risks/rk-002/'); // RK-002 affects R-013
});

it('records prose mentions', () => {
 expect(from('RK-002')).toContain('mentions /plan/features/r-013/');
 expect(from('M2')).toContain('mentions /plan/features/r-013/');
 expect(from('R-011')).toContain('mentions /plan/now/');
});

it('never lists a page as linking to itself, and lists each page once per relation', () => {
 for (const [key, links] of back) {
  const own = known.get(key)!.href;
  expect(links.map((link) => link.href)).not.toContain(own);
  expect(new Set(links.map((link) => `${link.relation} ${link.href}`)).size).toBe(links.length);
 }
});

it('leaves out source pages of views that are off', () => {
 const off = references(planning, { ...all, now: false });
 expect(off.get('R-012')!.map((link) => link.href)).not.toContain('/plan/now/');
});
```

- [x] **Step 2: Run** `bun test test/references.test.ts` — Expected: FAIL, `references` is not exported.

- [x] **Step 3: Implement** `references` and `RELATION_LABELS`. Mentions reuse `linkify(text, known)` so they match exactly what `<LinkedText>` will link. Every target key has an entry, empty when nothing links to it.

- [x] **Step 4: Run** `bun test test/references.test.ts` — Expected: PASS.

- [x] **Step 5: Commit** `feat(pm-docs-site): backlink index from planning.json`.

### Task 3: The page scanner

**Files:**

- Create: `packages/pm-docs-site/test/scan.ts`
- Test: `packages/pm-docs-site/test/scan.test.ts`

**Interfaces:**

- Produces:
  - `interface PageScan { unlinked: string[]; links: { href: string; derived: boolean }[]; ids: Set<string>; title: string }`
  - `async function scanPage(html: string, known: Set<string>): Promise<PageScan>` — uses Bun's global `HTMLRewriter`.

Rules: only text inside `<main>` counts; `unlinked` lists each known key (ID or brief path) found in text with no `<a>` ancestor, skipping the text of the page's `<h1>`; `links` are every `<a href>` inside `<main>` that starts with `/` (and its `#fragment` kept), with `derived: true` when it is inside an element with `data-linked-from` or inside `<template>`; `ids` are every `id` attribute on the page; `title` is the `<h1>` text. `<script>` and `<style>` text is ignored.

- [x] **Step 1: Write the failing tests** with inline HTML strings:

```ts
const known = new Set(['R-012', 'M1']);

it('finds an ID outside a link', async () => {
 const scan = await scanPage('<main><h1>Board</h1><p>R-012 and <a href="/plan/milestones/m1/">M1</a></p></main>', known);
 expect(scan.unlinked).toEqual(['R-012']);
});

it('exempts the h1 and ignores text outside main', async () => {
 const scan = await scanPage('<nav>R-012</nav><main><h1>R-012 Graph</h1></main>', known);
 expect(scan.unlinked).toEqual([]);
});

it('marks links in Linked from and templates as derived', async () => {
 const scan = await scanPage('<main><a href="/a/">x</a><section data-linked-from><a href="/b/">y</a></section><template><a href="/c/">z</a></template></main>', known);
 expect(scan.links).toEqual([{ href: '/a/', derived: false }, { href: '/b/', derived: true }, { href: '/c/', derived: true }]);
});

it('finds IDs inside templates too', async () => {
 expect((await scanPage('<main><template><p>M1</p></template></main>', known)).unlinked).toEqual(['M1']);
});
```

- [x] **Step 2: Run** `bun test test/scan.test.ts` — Expected: FAIL, module not found.
- [x] **Step 3: Implement** `scanPage`. If `HTMLRewriter` does not expose `<template>` children as elements, fall back to parsing the template's inner HTML with a second `scanPage` pass, and say so in a comment.
- [x] **Step 4: Run** `bun test test/scan.test.ts` — Expected: PASS.
- [x] **Step 5: Commit** `test(pm-docs-site): HTML scanner for the link test`.

### Task 4: Link components and risk pages

**Files:**

- Create: `packages/pm-docs-site/src/components/RefLink.astro`, `LinkedText.astro`, `LinkedFrom.astro`
- Create: `packages/pm-docs-site/src/pages/plan/risks/[id].astro`
- Modify: `packages/pm-docs-site/src/pages/plan/risks.astro`
- Modify: `packages/pm-docs-site/test/fixtures/expected-pages.txt`

**Interfaces:**

- Consumes: `targets`, `linkify`, `references`, `RELATION_LABELS`, `riskHref` (Tasks 1, 2); `config.views` from `virtual:pm-docs-site/config`.
- Produces (used by every later page task):
  - `<RefLink ref="R-012" />` — props `{ ref: string; label?: 'full' | 'id' }`; renders `<a href title>` with the target's label (`full`, default) or ID only, or plain text when the target has no `href` or is unknown.
  - `<LinkedText text={string | null} />` — renders `linkify` runs; known IDs become `<a href title={label}>ID</a>`.
  - `<LinkedFrom ref="R-012" />` — `<section data-linked-from data-pagefind-ignore>` with `<h2>Linked from</h2>`, one `<h3>` per relation (in `Relation` order) with a list of links, or `<p class="plan-empty">Nothing links here yet.</p>`.
  - The three components compute `targets` and `references` once per build through a memoised helper in `src/lib/references.ts`: `function siteRefs(): { known: Map<string, Target>; back: Map<string, Backlink[]> }` (reads `loadPlanning()` and `config.views`).

- [x] **Step 1: Write the failing parity change:** add `plan/risks/rk-001/index.html`, `plan/risks/rk-002/index.html`, `plan/risks/rk-004/index.html`, `plan/risks/rk-005/index.html` to `expected-pages.txt` (sorted).
- [x] **Step 2: Run** `bun test test/cli.test.ts -t "renders every page"` — Expected: FAIL, the four risk pages are missing.
- [x] **Step 3: Implement** the three components and `siteRefs`.
- [x] **Step 4: Implement** `src/pages/plan/risks/[id].astro`: `getStaticPaths` over open and closed risks (`params.id` lower-case). Content: `ExportStamp kind="Risk"`, RAG badge, a `plan-facts` list (likelihood, impact, RAG override, status, owner, raised, reviewed, closed), `Affects` through `<LinkedText>`, `Trigger` and `Mitigation` through `<LinkedText>`, then `<LinkedFrom ref={risk.id} />`. Frontmatter `title: '<RK-NNN> <title>'`, `tableOfContents: false`.
- [x] **Step 5: Update** `risks.astro`: each table row's risk ID and every matrix cell link to `riskHref(risk)` through `<RefLink label="id">`; `Affects` and `Mitigation` cells through `<LinkedText>`; removed risks keep `id={risk.id.toLowerCase()}` on their `<li>` so `/plan/risks/#rk-003` resolves; set `tableOfContents: false`.
- [x] **Step 6: Run** `bun test` and `bun run check` — Expected: PASS.
- [x] **Step 7: Commit** `feat(pm-docs-site): one page per risk, and link components`.

### Task 5: Feature and milestone pages

**Files:**

- Create: `packages/pm-docs-site/src/components/FeatureSummary.astro`
- Modify: `packages/pm-docs-site/src/routes/plan/features/[id].astro`, `src/routes/plan/milestones/[milestone].astro`

**Interfaces:**

- Consumes: `RefLink`, `LinkedText`, `LinkedFrom` (Task 4).
- Produces: `<FeatureSummary id="R-012" />` — the item's state badge, milestone (`RefLink`), `plan-facts` (owner, size, position, status, stage, started, plan steps, done/dropped date), Done when (`LinkedText`), depends on (`RefLink` + state badge), brief (`RefLink` on its path), risks (`RefLink`). Used by the feature page (Task 5) and the popup templates (Task 7).

- [x] **Step 1: Extract** the feature page's badge, facts, Done when, Related items, Brief, and Risks blocks into `FeatureSummary.astro`, replacing hand-built links (`linkTo`, inline `<a href>`) with `RefLink`, and prose with `LinkedText`. The feature page keeps Result/Plan, Reason, Serves, Note, Inbox around it, with Result, Reason, Note through `LinkedText` and inbox `affects`/`related` through `RefLink`, and ends with `<LinkedFrom ref={feature.id} />`. Set `tableOfContents: false`.
- [x] **Step 2: Update** the milestone page: every item through `RefLink`, exit criteria through `LinkedText`, `<LinkedFrom ref={summary.id ?? 'none'} />` last, `tableOfContents: false`.
- [x] **Step 3: Run** `bun test` and `bun run check` — Expected: PASS (the parity page set is unchanged).
- [x] **Step 4: Commit** `feat(pm-docs-site): link feature and milestone pages and list their backlinks`.

### Task 6: Index pages and docs links

**Files:**

- Modify: `src/pages/plan/log.astro`, `src/routes/plan/{now,inbox,briefs,strategy}.astro`, `src/routes/plan/features/index.astro`, `src/routes/plan/milestones/index.astro`, `src/pages/index.astro` (if it prints IDs), `src/components/FeatureTable.astro`, `src/components/lib/StatusTimelineFeed.astro` only if the Log uses it
- Modify: `src/lib/planning.ts` (`docsHref`)
- Test: `test/planning.test.ts`

**Interfaces:**

- Changes: `function docsHref(path: string | null, pages: Set<string>): string | null` — returns the URL only when it is in `pages`, the set of built repository docs URLs. Pages build that set from `getCollection('docs')` (empty when `config.docs` is null).

- [x] **Step 1: Write the failing test** in `test/planning.test.ts`:

```ts
it('links a docs path only when that page is built', () => {
 expect(docsHref('docs/guide/intro.md', new Set(['/docs/guide/intro/']))).toBe('/docs/guide/intro/');
 expect(docsHref('docs/superpowers/plans/x.md', new Set(['/docs/guide/intro/']))).toBeNull();
});
```

Confirm the URL shape against the fixture build first (`dist/docs/guide/intro/index.html` → `/docs/guide/intro/`) and use it in both the test and the function.

- [x] **Step 2: Run** `bun test test/planning.test.ts` — Expected: FAIL.
- [x] **Step 3: Implement** the new `docsHref` and update every caller.
- [x] **Step 4: Update** each index page so every ID and brief path follows the Task 2 table: listed IDs through `RefLink`, prose through `LinkedText`. Set `tableOfContents: false` on each plan page.
- [x] **Step 5: Run** `bun test` and `bun run check` — Expected: PASS.
- [x] **Step 6: Commit** `feat(pm-docs-site): link every ID on the index pages`.

### Task 7: Board and Roadmap links with popup templates

**Files:**

- Create: `packages/pm-docs-site/src/components/ItemDialog.astro`, `src/components/ItemDetail.astro`
- Modify: `src/components/lib/KanbanItemCard.astro`, `TaskKanbanCard.astro`, `StatusTimelineFeed.astro` (props and header comments)
- Modify: `src/pages/plan/board.astro`, `src/pages/plan/roadmap.astro`, `src/lib/planning.ts` (`roadmapGroups` events gain `id: string | null`)
- Test: `test/planning.test.ts` (events carry their item ID), `test/links.test.ts` (created here, Pagefind check only)

**Interfaces:**

- Consumes: `FeatureSummary` (Task 5), `RefLink` (Task 4).
- Produces (Task 10's script relies on these exact attributes):
  - Card title: `<a class="plan-item-link" href={featureHref(id)} data-item={id}>` — the only element with `data-item`.
  - `<ItemDetail id />` renders `<template data-item-detail={id} data-pagefind-ignore><FeatureSummary id /></template>`.
  - `<ItemDialog />`, once per page: `<dialog class="plan-dialog" data-item-dialog aria-labelledby="plan-dialog-title"><h2 id="plan-dialog-title"></h2><div data-item-dialog-body></div><a data-item-dialog-open href="">Open page</a><button type="button" data-item-dialog-close>Close</button></dialog>`.
  - Column wrapper: `<section class="plan-column" data-column={name}>` with `name` in `now | next | foryou | waiting | done`, and a header `<button type="button" class="plan-column__toggle" aria-expanded="true" aria-controls={`col-${name}-cards`}>`; the cards sit in `<div id={`col-${name}-cards`}>`.
  - Kit props: `KanbanItemCard` `href?: string`, `itemId?: string`, `tagHref?: string`; `TaskKanbanCard` `href?: string`, `itemId?: string`; `StatusTimelineFeed` event `href?: string`, `itemId?: string`. Each renders its title as the `plan-item-link` anchor when `href` is set, and the tag as `<a href={tagHref}>` when set.

- [x] **Step 1: Write the failing test** in `test/planning.test.ts`: `roadmapGroups(planning)` events each have `id` equal to their item's ID (and `null` for an event with none).
- [x] **Step 2: Run** it — Expected: FAIL. **Implement** the `id` field. Run — Expected: PASS.
- [x] **Step 3: Implement** the kit prop changes, adding to each header comment: `and the title (and tag) can be a link, for the site's item popup and backlinks`.
- [x] **Step 4: Implement** `ItemDetail`, `ItemDialog`, and the Board and Roadmap changes: every card with an ID gets `href`, `itemId`, and (Board) `tagHref` from the milestone target; group headings on the Roadmap link through `RefLink`; one `<ItemDetail>` after each linked card; one `<ItemDialog>` per page. Cards without an ID (log lines with none) stay plain.
- [x] **Step 5: Write the Pagefind test** in `test/links.test.ts`: after one fixture build (`runCli(['build', <scratch copy>])`), no file under `dist/pagefind/` fragment output contains the text of a Board popup's Done when that appears only inside a template. If Pagefind's fragments are compressed and not readable, assert instead that every `<template>` in `dist/plan/board/index.html` has `data-pagefind-ignore`.
- [x] **Step 6: Run** `bun test` and `bun run check` — Expected: PASS.
- [x] **Step 7: Commit** `feat(pm-docs-site): link Board and Roadmap cards, with popup templates`.

### Task 8: The build-wide link test

**Files:**

- Modify: `packages/pm-docs-site/test/links.test.ts`
- Modify: whatever pages the test finds unlinked IDs or dead links on

**Interfaces:**

- Consumes: `scanPage` (Task 3), `targets` (Task 1), `htmlPages`, `runCli`, `scratchFixture` (helpers).

- [x] **Step 1: Write the tests** (one build in `beforeAll` into a scratch copy, timeout `180_000`):

```ts
it('links every known ID and brief path on every page', () => {
 for (const page of pages) expect({ page, unlinked: scans[page].unlinked }).toEqual({ page, unlinked: [] });
});

it('resolves every internal link and anchor', () => {
 for (const page of pages) for (const link of scans[page].links) {
  const [path, fragment] = link.href.split('#');
  const file = urlToFile(path || urlOf(page)); // '/plan/x/' → 'plan/x/index.html'
  expect({ page, href: link.href, built: pages.includes(file) }).toEqual({ page, href: link.href, built: true });
  if (fragment) expect({ page, href: link.href, found: scans[file].ids.has(fragment) }).toEqual({ page, href: link.href, found: true });
 }
});

it('lists every non-derived link in the target page’s Linked from', () => {
 for (const page of pages) for (const link of scans[page].links.filter((l) => !l.derived)) {
  const target = targetPageOf(link.href); // item, milestone or risk page, else skip
  if (!target || target === page) continue;
  expect({ from: urlOf(page), to: target, listed: backlinksOn(target).has(urlOf(page)) }).toEqual({ from: urlOf(page), to: target, listed: true });
 }
});

it('gives every item, milestone and risk page a Linked from section', () => {
 for (const page of pages.filter((p) => /^plan\/(features|milestones|risks)\/[^/]+\/index\.html$/.test(p)))
  expect({ page, section: scans[page].hasLinkedFrom }).toEqual({ page, section: true });
});
```

`backlinksOn(target)` reads the hrefs inside `[data-linked-from]` on the built target page (add to `PageScan`: `linkedFrom: Set<string>` and `hasLinkedFrom: boolean`). Known keys come from `targets(loadPlanning(fixture), allViews)`.

- [x] **Step 2: Add** a views-off case: build with `views: ['now']` and assert the first two tests also pass there (no link points at a page that was not built).
- [x] **Step 3: Run** `bun test test/links.test.ts` — Expected: any failure names the page and the ID or link; fix each in the page that renders it (or in `references` when a backlink is missing) until it passes.
- [x] **Step 4: Run** `bun test` and `bun run check` — Expected: PASS.
- [x] **Step 5: Commit** `test(pm-docs-site): every ID linked, every link resolved, every backlink listed`.

### Task 9: Full width, with the Playwright harness

**Files:**

- Create: `packages/pm-docs-site/src/styles/width.css`
- Modify: `packages/pm-docs-site/index.mjs` (Starlight `customCss`), `src/pages/plan/board.astro` (drop its page-local width rule)
- Create: `packages/pm-docs-site/playwright.config.ts`, `test/browser/global-setup.ts`, `test/browser/serve.mjs`, `test/browser/width.browser.ts`
- Modify: `packages/pm-docs-site/package.json` (`@playwright/test` dev dependency, exact; script `"test:browser": "playwright test"`), `bun.lock`
- Modify: `test/integration.test.ts` (customCss assertion)

**Interfaces:**

- Produces: browser specs live in `test/browser/*.browser.ts` (`testMatch: '**/*.browser.ts'`), so `bun test` never runs them (Bun runs `*.test.*` and `*.spec.*`). `global-setup.ts` builds a scratch copy of the fixture with `node cli.mjs build` into `test/.tmp/browser/`; `serve.mjs` is a Node `http` static server for that `dist/` on port `4399`, started by `webServer` in the config. `baseURL: 'http://localhost:4399'`, Chromium only.

- [x] **Step 1: Install** `bun add -d -E @playwright/test` and `bunx playwright install chromium`.
- [x] **Step 2: Write the failing tests:** `integration.test.ts` asserts Starlight's options include `customCss` ending in `/src/styles/width.css`; `width.browser.ts` at viewport 1440×900 asserts the bounding width of `main .sl-markdown-content` (or Starlight's content container) is greater than `720` (45rem) on `/plan/roadmap/` and on `/docs/guide/intro/`.
- [x] **Step 3: Run** `bun test test/integration.test.ts` and `bun run test:browser` — Expected: FAIL on both.
- [x] **Step 4: Implement** `width.css` (`:root { --sl-content-width: 100%; }`), pass it as `customCss: [fileURLToPath(new URL('./src/styles/width.css', import.meta.url))]`, and remove the Board's `:root:has(.plan-columns)` rule.
- [x] **Step 5: Run** both — Expected: PASS. Run `bun test` — Expected: PASS.
- [x] **Step 6: Commit** `feat(pm-docs-site): use the full width on every page`.

### Task 10: Popup and collapsible columns

**Files:**

- Create: `packages/pm-docs-site/src/scripts/plan.ts`, `src/components/PlanInteractions.astro`
- Modify: `src/pages/plan/board.astro`, `src/pages/plan/roadmap.astro`, `src/styles/components.css`
- Create: `test/browser/board.browser.ts`, `test/browser/popup.browser.ts`
- Modify: `justfile` (`package-test`), `.github/workflows/ci.yml` (package job)

**Interfaces:**

- Consumes: Task 7's attributes (`data-item`, `data-item-detail`, `data-item-dialog*`, `data-column`, `.plan-column__toggle`).
- Produces: `const STORAGE_KEY = 'pm-docs-site:board:collapsed'` (value: JSON array of column names); a collapsed column has `data-collapsed` and its toggle `aria-expanded="false"`.

- [x] **Step 1: Write the failing browser tests:**
  - `board.browser.ts`: at widths 1440, 1024, 700 the five `[data-column]` elements share one `boundingBox().y` (within 1px); clicking `done`'s toggle sets `data-collapsed` and makes the column narrower than `64px`; after `page.reload()` it is still collapsed; clicking again and reloading restores it; with `localStorage` set to `'not json'` before load, the page shows five expanded columns and no `pageerror`.
  - `popup.browser.ts`: a plain click on the first Board `[data-item]` opens `dialog[open]` whose body contains that item's Done when and whose `Open page` `href` equals the card's `href`; `Escape` closes it and `document.activeElement` is the card link; the same for the first Roadmap `[data-item]`; a click with `modifiers: ['ControlOrMeta']` opens a new page (`context.waitForEvent('page')`) at the card's URL and no `dialog[open]`; clicking the card's milestone tag navigates to the milestone page with no dialog.
- [x] **Step 2: Run** `bun run test:browser` — Expected: FAIL.
- [x] **Step 3: Implement** `plan.ts` (click handler on `document` for `a[data-item]`: act only on `event.button === 0` with no ctrl, meta, shift, alt; copy the template's content into the dialog body, set the heading to the link text and `Open page` to the link's `href`, `showModal()`; on close, focus the link; toggles flip `data-collapsed`, `aria-expanded`, and storage, wrapping every storage access in `try`). `PlanInteractions.astro` loads it with `<script>import '../scripts/plan.ts';</script>` and adds an inline `is:inline` script that reads the key and sets `data-collapsed` before paint. Add the CSS: collapsed columns use a narrow grid track (`3rem`) with the name and count written vertically; `.plan-columns` sets its tracks from the columns' state (e.g. `grid-template-columns` built per column with `:has([data-collapsed])` or an inline custom property set by the script).
- [x] **Step 4: Run** `bun run test:browser` — Expected: PASS. Run `bun test` and `bun run check` — Expected: PASS.
- [x] **Step 5: Wire it up:** `justfile` `package-test` gains `bunx playwright install chromium` and `bun run test:browser` after `bun run check`; the CI package job gains `npx playwright install --with-deps chromium` and `bun run test:browser` steps.
- [x] **Step 6: Verify the whole item:** from the repository root, `just package-test`, `just lint-check`, and `just version-check` — Expected: all pass.
- [x] **Step 7: Commit** `feat(pm-docs-site): item popup and collapsible Board columns`.
