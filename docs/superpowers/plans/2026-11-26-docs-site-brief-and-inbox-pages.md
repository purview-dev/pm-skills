# Brief and inbox pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The docs-site package builds one page per brief and one per inbox file, each showing the whole file, with links and a Linked from list.

**Architecture:** `pm-export` adds an ordered `sections` list to each brief and inbox entry (`schemaVersion` 6, ADR-016). The package renders those sections once per build in `brief-sections` and `inbox-sections` content collections, the same way as `adr-sections` (ADR-012, ADR-015, ADR-017). `src/lib/references.ts` makes both kinds link targets and sources, so every page's links and its Linked from list come from one place.

**Tech Stack:** Bun, TypeScript, Astro 5 content loaders, Starlight, `bun:test`.

**Spec:** `docs/superpowers/specs/2026-11-26-docs-site-brief-and-inbox-pages-design.md`

## Global Constraints

- Export `schemaVersion` moves `5` → `6`; the package reads `[6]` only (`SUPPORTED_SCHEMA_VERSIONS`).
- Package version `0.1.0-pre.6` → `0.1.0-pre.7`; `skills/pm-docs-site/SKILL.md`: `Minimum package version: \`0.1.0-pre.7\`` and `This skill reads schemaVersion 6.`
- Rules stay 21: `just bump prerelease` (`21.0.0-pre.14` → `21.0.0-pre.15`); `v21.0.0` is not tagged.
- Schema, `planning.example.json`, the `pm-export` SKILL.md field map, and `planning.ts` change in the same commit (AGENTS.md).
- Records are read from `planning.json` only; only image files beside a brief or inbox file are read from disk (ADR-017).
- URLs: `/plan/briefs/<slug>/`, `/plan/inbox/<slug>/`, `<slug>` = `briefAnchor(path)` (file name without `.md`, lower case).
- Brief pages exist only with the `briefs` view, inbox pages only with the `inbox` view; with the view off, the target's `href` is `null`.
- An empty section renders `None recorded.`; no heading in the file is dropped.
- Commit messages follow commitlint: lower-case subject, e.g. `feat(pm-export): export brief and inbox sections (R-052)`.
- Principles: none (no `planning/ENGINEERING.md`).

## Review Focus

- A heading inside a fenced code block (` ```\n## not a heading\n``` `) in a brief: it stays in the previous section's Markdown, not a new section. Pinned in Task 1.
- A brief or inbox file with no level-2 sections (title and header only): `sections` is `[]` and the page shows only its facts and Linked from. Pinned in Task 1 (export) and Task 4 (page builds).
- A relative image in a brief section that is missing on disk fails the build naming the file; with the `briefs` view off it does not. Pinned in Task 4.
- An inbox file path mentioned in prose on another page (e.g. a brief's `Origin: planning/inbox/<file>.md`) links to the inbox page and appears in its Linked from. Pinned in Task 3.
- Two files whose slugs differ only in case cannot exist (file names are lower-case by convention); a duplicate slug would overwrite a page. Pinned in Task 2 (`sectionsLoader` throws on a duplicate entry id).

---

### Task 1: Export ordered sections (ADR-016) and move to schemaVersion 6

**Files:**
- Modify: `skills/pm-export/scripts/planning.ts` (brief and inbox builders near lines 651-694; a new exported helper beside `sectionText` near line 172)
- Modify: `skills/pm-export/references/planning.schema.json` (`schemaVersion` const, `$defs.brief`, `$defs.inboxEntry`, new `$defs.section`)
- Modify: `skills/pm-export/references/planning.example.json`
- Modify: `skills/pm-export/SKILL.md` (line 125 `schemaVersion` row; lines 202-209 field map)
- Modify: `skills/pm-export/scripts/__fixtures__/repo/planning/briefs/R-007-tenant-billing.md` (add a fenced block with an HTML comment and a `## ` line inside it, under `## Proposal`)
- Modify: `skills/pm-export/scripts/export.test.ts`
- Modify: `packages/pm-docs-site/lib/schema-version.ts` (`[5]` → `[6]`), `packages/pm-docs-site/src/lib/planning-types.ts` (`Brief`, `InboxEntry`), `packages/pm-docs-site/test/fixtures/planning.json`, `packages/pm-docs-site/package.json` (version), `skills/pm-docs-site/SKILL.md` (lines 28, 30), `packages/pm-docs-site/test/schema-version.test.ts` if it pins `5`

**Interfaces:**
- Produces: `export interface RecordSection { heading: string; markdown: string }` and `export function recordSections(text: string): RecordSection[]` in `planning.ts`; `sections: RecordSection[]` as the last key of each `briefs[]` and `inbox[]` entry (schema `properties` order: after `revisions` / `idea`); package types `Brief.sections` and `InboxEntry.sections` of type `{ heading: string; markdown: string }[]`.

- [ ] **Step 1: Write the failing tests** in `export.test.ts`, describe `build`:

```ts
it("exports every brief and inbox section in file order, whole (ADR-016)", () => {
  const brief = doc.briefs.find((entry: any) => entry.id === "R-007");
  expect(brief.sections.map((s: any) => s.heading)).toEqual([
    "Problem", "Who and evidence", "Original idea", "Proposal", "Alternatives considered", "Challenges and answers",
    "Ramifications", "Done when", "Size and slicing", "Open questions", "Decision", "Revisions",
  ]);
  expect(brief.sections[0]).toEqual({ heading: "Problem", markdown: "A tenant cannot see what they owe." });
  // A `## ` line and a comment inside a fence stay in Proposal's Markdown.
  expect(brief.sections[3].markdown).toContain("## not a heading");
  expect(brief.sections[3].markdown).toContain("<!-- kept -->");
  const bug = doc.inbox.find((entry: any) => entry.file.endsWith("invoice-total-wrong.md"));
  expect(bug.sections.map((s: any) => s.heading)).toEqual(["Idea", "Reproduction"]);
  expect(bug.sections[1].markdown).toBe("1. Pause one seat.\n2. Open the invoice.");
});

it("recordSections: no level-2 heading is an empty list; an empty section is ''", () => {
  expect(recordSections("# Title\n\n- Status: x\n")).toEqual([]);
  expect(recordSections("# T\n\n## A\n\n## B\n\nb\n")).toEqual([{ heading: "A", markdown: "" }, { heading: "B", markdown: "b" }]);
  expect(recordSections("# T\n\n## A\n\n<!-- gone -->\ntext\n")).toEqual([{ heading: "A", markdown: "text" }]);
});
```

Add `recordSections` to the import from `./planning.ts`. Add to the fixture brief, under `## Proposal` after its line:

````markdown
```text
<!-- kept -->
## not a heading
```
````

- [ ] **Step 2: Run to verify they fail**

Run: `bun test skills/pm-export/scripts/export.test.ts`
Expected: FAIL (`recordSections` is not exported; `sections` undefined).

- [ ] **Step 3: Implement `recordSections(text: string): RecordSection[]`** in `planning.ts`: `sections(stripCommentsOutsideCode(text), 2).slice(1)`, each body trimmed as `sectionText` does (leading blank lines, trailing whitespace). Read the inbox and brief files raw (`folder("inbox", true)`, `folder("briefs", true)`) and apply `stripComments` yourself for the existing fields, so only `sections` keeps comments inside code. Append `sections: recordSections(text)` to both entries.

- [ ] **Step 4: Schema, example, field map.** Add `$defs.section` `{ type: object, additionalProperties: false, required: [heading, markdown], properties: { heading: {type: string}, markdown: {type: string} } }`; add `sections: { type: array, items: { $ref: "#/$defs/section" } }` last in `brief` and `inboxEntry` `properties` and `required`; `schemaVersion` const `6`. Give every brief and inbox entry in `planning.example.json` a `sections` array, and set `schemaVersion: 6`. In `skills/pm-export/SKILL.md`, row `schemaVersion` reads `6`, and append to both field-map bullets: `` `sections[]` is `{heading, markdown}` for every `##` section after the header, in file order, the Markdown verbatim with HTML comments removed outside code (ADR-016). ``

- [ ] **Step 5: Package reads 6.** `SUPPORTED_SCHEMA_VERSIONS = Object.freeze([6])`; add `sections` to `Brief` and `InboxEntry`; in `test/fixtures/planning.json` set `schemaVersion` 6 and give each brief and inbox entry `sections` — `2026-11-09-invoice-export.md` gets `Problem`, `Proposal` (with a two-column Markdown table naming `R-012`), `Decision`, and an empty `Open questions` (`""`); `2026-11-07-referrals.md` gets `[]`; `2026-11-08-1010-csv-encoding.md` gets `Idea` and `Reproduction` (`1. Export R-012.\n2. Open it in Excel.`); `2026-11-09-0900-yearly-export.md` gets `Idea`. Package `version` `0.1.0-pre.7`; `skills/pm-docs-site/SKILL.md` lines 28 and 30 as in Global Constraints. Update any test that pins `5`.

- [ ] **Step 6: Verify**

Run: `bun test skills/pm-export/scripts/export.test.ts` → PASS.
Run: `just validate` → exit 0 (schema, example, docs-site fixture, supported versions, minimum package version agree).

- [ ] **Step 7: Commit**

```bash
git add skills/pm-export skills/pm-docs-site/SKILL.md packages/pm-docs-site/lib/schema-version.ts packages/pm-docs-site/src/lib/planning-types.ts packages/pm-docs-site/test packages/pm-docs-site/package.json
git commit -m "feat(pm-export): export brief and inbox sections, schemaVersion 6 (R-052)"
```

### Task 2: Section collections for briefs and inbox files (ADR-017)

**Files:**
- Create: `packages/pm-docs-site/src/loaders/sections.ts` (shared render helper)
- Create: `packages/pm-docs-site/src/loaders/records.ts` (`briefSectionsLoader`, `inboxSectionsLoader`)
- Modify: `packages/pm-docs-site/src/loaders/adrs.ts` (use the helper; behaviour unchanged)
- Modify: `packages/pm-docs-site/src/content.config.ts`
- Test: `packages/pm-docs-site/test/adrs-loader.test.ts`, new `packages/pm-docs-site/test/records-loader.test.ts`

**Interfaces:**
- Consumes: `Brief.sections`, `InboxEntry.sections` (Task 1).
- Produces:
  - `recordFile(planningPath: string, folder: 'decisions' | 'briefs' | 'inbox', recordPath: string): string` — `join(dirname(planningPath), folder, basename(recordPath))`; `adrFile` becomes `recordFile(p, 'decisions', a)`.
  - `type RecordSectionData = { record: string; index: number; heading: string }` (`record` = the brief's `path` or the inbox entry's `file`).
  - `recordSectionId(slug: string, index: number): string` → `` `${slug}/${index}` ``.
  - Collections `'brief-sections'` and `'inbox-sections'`, filled only when `config.views.briefs` / `config.views.inbox`, one entry per section with non-blank Markdown, `filePath` and `assetImports` set as `adr-sections` does. A duplicate entry id throws `Duplicate <collection> entry <id>`.

- [ ] **Step 1: Write the failing tests** in `test/records-loader.test.ts`:

```ts
it('recordFile resolves a brief and an inbox file beside planning.json', () => {
  expect(recordFile('/r/planning/planning.json', 'briefs', 'planning/briefs/2026-11-09-invoice-export.md')).toBe(join('/r/planning', 'briefs', '2026-11-09-invoice-export.md'));
  expect(recordFile('/r/planning/planning.json', 'inbox', 'planning/inbox/a.md')).toBe(join('/r/planning', 'inbox', 'a.md'));
});
it('recordSectionId is slug/index', () => {
  expect(recordSectionId('2026-11-09-invoice-export', 3)).toBe('2026-11-09-invoice-export/3');
});
it('recordEntries skips blank sections and throws on a duplicate id', () => {
  // recordEntries(records, slugOf) is the pure step the loaders call: [{ id, record, index, heading, markdown }]
  expect(recordEntries([{ key: 'p/a.md', sections: [{ heading: 'A', markdown: '' }, { heading: 'B', markdown: 'b' }] }]).map((e) => e.id)).toEqual(['a/1']);
  expect(() => recordEntries([{ key: 'p/a.md', sections: [{ heading: 'A', markdown: 'x' }] }, { key: 'q/A.md', sections: [{ heading: 'A', markdown: 'y' }] }])).toThrow('Duplicate');
});
```

`recordEntries(records: { key: string; sections: { heading: string; markdown: string }[] }[]): { id: string; record: string; index: number; heading: string; markdown: string }[]` lives in `sections.ts`; the slug is `briefAnchor(key)`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd packages/pm-docs-site && bun test test/records-loader.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `sections.ts` (`recordFile`, `recordSectionId`, `recordEntries`, and `renderSection(renderMarkdown, markdown, file)` returning the `store.set` fields `rendered`, `filePath`, `assetImports`, with `siteRoot` as `adrSectionsLoader` computes it); `records.ts` loaders; register both in `content.config.ts` with one comment each, naming ADR-017. Refactor `adrSectionsLoader` onto `renderSection` and `recordFile`.

- [ ] **Step 4: Verify**

Run: `bun test test/records-loader.test.ts test/adrs-loader.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/src/loaders packages/pm-docs-site/src/content.config.ts packages/pm-docs-site/test/records-loader.test.ts
git commit -m "feat(pm-docs-site): brief and inbox section collections (R-052)"
```

### Task 3: Brief and inbox targets and backlinks

**Files:**
- Modify: `packages/pm-docs-site/src/lib/references.ts`
- Modify: `packages/pm-docs-site/src/lib/site-refs.ts`
- Modify: `packages/pm-docs-site/src/lib/planning.ts` (add `briefHref`, `inboxHref`)
- Test: `packages/pm-docs-site/test/references.test.ts`

**Interfaces:**
- Consumes: `'brief-sections'`, `'inbox-sections'` and `RecordSectionData` (Task 2).
- Produces:
  - `briefHref(path: string): string` → `/plan/briefs/<slug>/`; `inboxHref(file: string): string` → `/plan/inbox/<slug>/`.
  - `TargetKind` gains `'inbox'`; inbox target `{ kind: 'inbox', key: entry.file, href: views.inbox ? inboxHref(entry.file) : null, label: entry.title }`; brief target `href: views.briefs ? briefHref(brief.path) : null`.
  - `linkify` matches inbox file paths as it matches brief paths (longest first).
  - `references(planning, views, adrKeys?, recordKeys?)` where `recordKeys: Map<string, Set<string>>` is keyed by brief `path` / inbox `file`; `siteRefs()` fills it from the two collections' `rendered.html` through `linkHtml`, as for ADRs (ADR-015).
  - Brief page sources (when `views.briefs`): `prose(status)`, `prose(origin)`, `link(brief.id, 'listed')`, then `recordKeys` keys as `mentions` (without `recordKeys`, `prose` each section's Markdown). Inbox page sources (when `views.inbox`): `prose(affects, 'affects')`, `prose(context)`, each `related` `link(id, 'related')`, `link(brief, 'brief')`, then section keys as `mentions`. The Briefs list page adds `link(brief.path, 'listed')`; the Inbox list page adds `link(entry.file, 'listed')`.

- [ ] **Step 1: Write the failing tests** in `references.test.ts`, using the fixture planning:

```ts
it('a brief links to its page and an inbox file is a target', () => {
  const known = targets(planning, ALL_VIEWS);
  expect(known.get('planning/briefs/2026-11-09-invoice-export.md')?.href).toBe('/plan/briefs/2026-11-09-invoice-export/');
  expect(known.get('planning/inbox/2026-11-08-1010-csv-encoding.md')).toMatchObject({ kind: 'inbox', href: '/plan/inbox/2026-11-08-1010-csv-encoding/', label: 'CSV from R-012 opens garbled in Excel' });
  expect(targets(planning, { ...ALL_VIEWS, inbox: false }).get('planning/inbox/2026-11-08-1010-csv-encoding.md')?.href).toBeNull();
});
it('an inbox page lists in the Linked from of the item it relates to, and a brief section mention is a backlink', () => {
  const back = references(planning, ALL_VIEWS);
  // The fixture entry has `Affects: R-012` and `Related: R-012`.
  expect(back.get('R-012')).toContainEqual({ href: '/plan/inbox/2026-11-08-1010-csv-encoding/', label: 'CSV from R-012 opens garbled in Excel', relation: 'affects' });
  expect(back.get('R-012')).toContainEqual({ href: '/plan/inbox/2026-11-08-1010-csv-encoding/', label: 'CSV from R-012 opens garbled in Excel', relation: 'related' });
  expect(back.get('R-012')).toContainEqual({ href: '/plan/briefs/2026-11-09-invoice-export/', label: 'Invoice export', relation: 'listed' });
});
it('an inbox path in prose links to the inbox page', () => {
  const runs = linkify('from planning/inbox/2026-11-08-1010-csv-encoding.md today', targets(planning, ALL_VIEWS));
  expect(runs.map((run) => run.target?.kind ?? null)).toEqual([null, 'inbox', null]);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/references.test.ts` → FAIL.

- [ ] **Step 3: Implement** the Interfaces above.

- [ ] **Step 4: Verify**

Run: `bun test test/references.test.ts test/link-html.test.ts test/planning.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/src/lib packages/pm-docs-site/test/references.test.ts
git commit -m "feat(pm-docs-site): brief and inbox link targets and backlinks (R-052)"
```

### Task 4: Brief and inbox pages

**Files:**
- Create: `packages/pm-docs-site/src/routes/plan/briefs/[slug].astro`, `packages/pm-docs-site/src/routes/plan/inbox/[slug].astro`
- Modify: `packages/pm-docs-site/lib/index.ts` (routes for the `inbox` and `briefs` views)
- Modify: `packages/pm-docs-site/src/routes/plan/briefs.astro`, `packages/pm-docs-site/src/routes/plan/inbox.astro` (link each entry to its page; Briefs keeps its section `id` anchors)
- Modify: `packages/pm-docs-site/test/fixtures/expected-pages.txt`, `packages/pm-docs-site/test/links.test.ts` (`TARGET_PAGE` adds `briefs|inbox`), `packages/pm-docs-site/test/integration.test.ts`

**Interfaces:**
- Consumes: Task 2 collections, Task 3 `briefHref`, `inboxHref`, `siteRefs()`.
- Produces: pages at `/plan/briefs/<slug>/` and `/plan/inbox/<slug>/`, following `src/routes/plan/decisions/[id].astro`: `<ExportStamp kind="Brief" | "Inbox" />`, a back link (`All briefs` → `/plan/briefs/`, `Inbox` → `/plan/inbox/`), a `plan-facts` list (brief: Status, Origin, Updated, File; inbox: Captured, Source, Kind, Severity, Affects, Context, Discuss, Related, Brief, Reviewed, File, each present value only, prose through `LinkedText`, IDs through `RefLink`), each section as `<h2>{heading}</h2>` with its `render()`ed `Content` in `<LinkedHtml>`, or `<p>None recorded.</p>` when blank, then `<LinkedFrom ref={key} />`. Title: brief `` `${brief.id} ${brief.title}` `` when it has an ID, else the title; inbox: its title.

- [ ] **Step 1: Write the failing tests.** In `links.test.ts`, change `TARGET_PAGE` to `/^\/plan\/(features|milestones|risks|decisions|briefs|inbox)\/[^/]+\/$/` (the existing Linked from tests now cover both kinds). Add `describe('brief and inbox pages')`:

```ts
it('a brief page renders its section table and links IDs inside it', () => {
  const page = html('plan/briefs/2026-11-09-invoice-export/index.html');
  expect(page).toContain('<table');
  expect(page).toContain('href="/plan/features/r-012/"');
  expect(page).toContain('None recorded.');
});
it('a brief with no sections still has its facts and Linked from', () => {
  const page = html('plan/briefs/2026-11-07-referrals/index.html');
  expect(page).toContain('data-linked-from');
});
it('an inbox page renders Reproduction as a list', () => {
  const page = html('plan/inbox/2026-11-08-1010-csv-encoding/index.html');
  expect(page).toMatch(/<h2[^>]*>Reproduction<\/h2>/);
  expect(page).toContain('<ol>');
});
```

Add the four pages to `expected-pages.txt`. In `integration.test.ts`, add `appendToRecord(dir, kind: 'briefs' | 'inbox', key: string, heading: string, markdown: string)` beside `appendToAdr`, and in `describe('ADR images ...')`'s style add:
- `a brief section with a relative image builds to a resolved img`: append `![a](x.png)` to `2026-11-09-invoice-export.md`'s `Proposal`, write `briefs/x.png` beside `planning.json`; assert as the ADR test does on `plan/briefs/2026-11-09-invoice-export/index.html`.
- `a brief section with a missing relative image fails the build`: `![a](missing.png)`; expect exit non-zero and `missing.png` in the output.
- `a missing brief image does not fail the build when the Briefs view is off`: options with `views` omitting `briefs`; expect exit 0 and no `plan/briefs/` page directory.

- [ ] **Step 2: Run to verify they fail**

Run: `bun test test/links.test.ts test/integration.test.ts` → FAIL (pages not built).

- [ ] **Step 3: Implement** the two pages, the routes in `lib/index.ts` (`inbox: [['/plan/inbox', ...], ['/plan/inbox/[slug]', 'plan/inbox/[slug].astro']]`, same for `briefs`), and the list-page links (`RefLink` on the brief title and the inbox card title, `label="full"`). `getStaticPaths` returns `[]` when the export has no briefs / inbox entries, so an empty collection is never looked up.

- [ ] **Step 4: Verify**

Run: `bun test test/links.test.ts test/integration.test.ts test/build.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/src/routes packages/pm-docs-site/lib/index.ts packages/pm-docs-site/test
git commit -m "feat(pm-docs-site): a page per brief and per inbox file (R-052)"
```

### Task 5: Docs, upgrade note, versions, and full verification

**Files:**
- Modify: `packages/pm-docs-site/README.md` (the Briefs and Inbox views: one page per brief and per inbox file, whole, with Linked from; relative images beside the file)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (new upgrade paragraph after the last `Version 21 also` paragraph) and the installed copy at the end of `AGENTS.md`
- Modify: `package.json` via `just bump prerelease`
- Modify: `examples/demo/planning/planning.json` (regenerated)

- [ ] **Step 1: Upgrade note.** Append to the managed section reference, and to the same place in `AGENTS.md` (the installed copy has no `version=` in its marker):

```markdown
Version 21 also moves the export to `schemaVersion` 6 (ADR-016): each brief
and inbox entry carries its `sections`, every `##` section in file order,
and the docs site gives each brief and inbox file its own page. Run
`pm-export`, and `pm-docs-site upgrade` for an installed site;
`@purview-dev/pm-docs-site` reads `schemaVersion` 6 from `0.1.0-pre.7`. No
setting is added.
```

- [ ] **Step 2: README** of the package: document both pages under the Briefs and Inbox views.

- [ ] **Step 3: Versions and the demo.**

Run: `just bump prerelease` → `package.json` is `21.0.0-pre.15`.
Run: `bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/` → `wrote: ...`.

- [ ] **Step 4: Full verification** (the item's `Done when`)

Run: `just validate` → exit 0.
Run: `just test` → all pass.
Run: `just package-test` → all pass (package tests, browser tests, demo site).
Run: `just docs-check` → exit 0. This repository's `planning/planning.json` must be `schemaVersion` 6 first: `bun skills/pm-export/scripts/export.ts write --root . --pm-root planning/` (the PM commit in `pm-checkpoint` refreshes it again).
Run: `just lint-check` → exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/pm-docs-site/README.md skills/pm-setup/references/AGENTS-section.md AGENTS.md package.json examples/demo/planning/planning.json
git commit -m "docs(pm-docs-site): brief and inbox pages, schemaVersion 6 note (R-052)"
```

`planning/planning.json` is PM state: leave it for `pm-checkpoint` to commit.
