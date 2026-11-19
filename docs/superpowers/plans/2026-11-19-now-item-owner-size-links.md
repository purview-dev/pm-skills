# R-018 Now item owner, size, and links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `NOW.md` carries the claimed item's `Serves`, `Owner`, `Size`, `Depends on`, and `Revisits`; the export (schemaVersion 4) publishes them on `now.item`; the board's Now card and the R-012 graph use them.

**Architecture:** `pm-next` copies the five roadmap fields into `NOW.md`; `planning.ts` reads them into a new `nowItem` schema def; the docs-site templates and the package read `now.item`. `pm-setup` backfills an item claimed before rules 20. The package and graph part runs after R-012 merges.

**Tech Stack:** Bun + TypeScript (`bun:test`), JSON Schema (dependency-free validator in `skills/pm-export/scripts/schema.ts`), Astro/Starlight templates, React islands in `packages/pm-docs-site`.

**Spec:** `docs/superpowers/specs/2026-11-19-now-item-owner-size-links-design.md`

## Global Constraints

- New `NOW.md` fields, in this order, after `Milestone` and before `Spec`: `Serves`, `Owner`, `Size`, `Depends on`, `Revisits`.
- They are optional: a `NOW.md` with the rules 19 field list lints clean and exports.
- `now.item` is `nowItem | null`, `nowItem` = `{id, title, serves, owner, size, dependsOn, revisits}`, `additionalProperties: false`, all required. `serves` and `dependsOn` are ID lists (empty when missing), `owner` `agent | user | both | null`, `size` `S | M | L | null`, `revisits` an ID or `null`. `itemRef` is unchanged.
- `schemaVersion` 3 -> 4 everywhere it appears (schema const, `planning.ts` `SCHEMA_VERSION`, example, `pm-export` SKILL.md, `scripts/validate.ts`, docs-site templates, fixture, manifest, the `pm-docs-site` SKILL.md sentence).
- Rules 19 -> 20 with `just bump major`. Every skills change ships in this bump.
- `packages/pm-docs-site/package.json` keeps its version (nothing publishes). The package reads schemaVersion 4 only.
- `NOW.md`'s `## Done when` holds checks only. `pm-checkpoint switch` joins its bullets with a semicolon and a space into the one-line roadmap `Done when`.
- Never hand-edit `planning/` outside a `pm-*` skill (AGENTS.md). Commits follow commitlint (`feat(pm-export): ...`, `docs(pm-next): ...`).
- Never set a shell in the `justfile`; TypeScript only.

## Review Focus

- A `NOW.md` from rules 19 (no new fields) while active: export gives `serves: []`, `owner: null`, `size: null`, `dependsOn: []`, `revisits: null`, with one `Assumption:` per missing `Owner`/`Size`, and lint is clean. Test in Task 1 and Task 2.
- `Depends on: none` and `Revisits:` empty export `[]` and `null`, not `["none"]`. Test in Task 1.
- Idle `NOW.md` with the five keys present and empty lints clean (`now/idle`), and the export gives `item: null`. Test in Task 2.
- An active `NOW.md` with `Owner: someone` or `Size: XL` gives a lint error (new rule `now/item`) and an export assumption, not a crash. Test in Task 1 and Task 2.
- The active node's `dependsOn` naming a done item or an unknown ID behaves in the graph like any other node's (done chip, missing chip). Test in Task 6.

---

### Task 1: Export schemaVersion 4 with `nowItem`

**Files:**

- Modify: `skills/pm-export/references/planning.schema.json` (`schemaVersion` const, new `$defs/nowItem`, `$defs/now.properties.item`)
- Modify: `skills/pm-export/scripts/planning.ts:343-379` (NOW.md read), `:488-490` (Now card), `SCHEMA_VERSION`
- Modify: `skills/pm-export/references/planning.example.json` (`schemaVersion`, `now.item`, `board.columns.now[0]`)
- Modify: `skills/pm-export/SKILL.md:124,131,165` (field map)
- Modify: `scripts/validate.ts:148` (const 3 -> 4)
- Modify: `skills/pm-export/scripts/__fixtures__/repo/planning/NOW.md`
- Test: `skills/pm-export/scripts/export.test.ts`

**Interfaces:**

- Produces: `doc.now.item: { id: string; title: string; serves: string[]; owner: "agent"|"user"|"both"|null; size: "S"|"M"|"L"|null; dependsOn: string[]; revisits: string|null } | null`; `board.columns.now[0].owner/size` equal `now.item.owner/size`. `SCHEMA_VERSION = 4` exported from `planning.ts`.

- [x] **Step 1: Add the fields to the fixture `NOW.md`** after `- Milestone: M1`:

```markdown
- Serves: V1
- Owner: both
- Size: M
- Depends on: R-006
- Revisits:
```

- [x] **Step 2: Write the failing tests** in `export.test.ts`. Replace the `now.item` assertion in "reads NOW.md, its checkpoint, ..." and add one `it` under `describe("build")`:

```ts
expect(doc.now.item).toEqual({ id: "R-007", title: "Tenant billing", serves: ["V1"], owner: "both", size: "M", dependsOn: ["R-006"], revisits: null });
expect(doc.schemaVersion).toBe(4);

it("exports a rules 19 NOW.md without the item fields as nulls, with assumptions", () => {
  // copy FIXTURE to a temp dir (cpSync, as the export.ts tests do), strip the five lines from NOW.md
  const { document, assumptions } = build({ root: stripped, ...fixed });
  expect(document.now.item).toEqual({ id: "R-007", title: "Tenant billing", serves: [], owner: null, size: null, dependsOn: [], revisits: null });
  expect(document.board.columns.now[0]).toMatchObject({ owner: null, size: null });
  expect(assumptions.filter((a) => a.startsWith("NOW.md has no Owner") || a.startsWith("NOW.md has no Size"))).toHaveLength(2);
  expect(validate(document, schema)).toEqual([]);
});

it("flags an invalid Owner or Size in NOW.md", () => {
  // temp copy with `- Owner: someone` and `- Size: XL`
  expect(document.now.item).toMatchObject({ owner: null, size: null });
  expect(assumptions.some((a) => a.includes('Owner "someone"'))).toBe(true);
  expect(assumptions.some((a) => a.includes('Size "XL"'))).toBe(true);
});
```

In "builds the board columns", add `expect(columns.now[0]).toMatchObject({ owner: "both", size: "M" });`.

- [x] **Step 3: Run to verify they fail**

Run: `bun test skills/pm-export/scripts/export.test.ts`
Expected: FAIL on the `now.item` `toEqual` and `schemaVersion` 4.

- [x] **Step 4: Implement.** In the schema add `$defs/nowItem` (properties in the order `id, title, serves, owner, size, dependsOn, revisits`; reuse `#/$defs/idList`, `#/$defs/id`, and the `card` enums), point `now.item` at it, set the `schemaVersion` const to 4. In `planning.ts`, build `nowDoc.item` from `nowFields` using the existing helpers (`list` for `serves`, `ids` for `depends on`, `ids(...)[0] ?? null` for `revisits`, lowercase `owner`, uppercase `size`). A value outside `OWNERS`/`SIZES` exports `null` with an assumption in the roadmap's wording (`R-007 Owner "someone" is not agent, user, or both.`). A missing `Owner` or `Size` on an active item exports `null` with the assumption `NOW.md has no Owner; now.item.owner is null.` (same for Size). The Now card copies `owner` and `size` from `nowDoc.item`. Set `SCHEMA_VERSION = 4`. Update the example (`schemaVersion: 4`, a full `now.item`, matching Now card), the SKILL.md rows (`schemaVersion` `4`; `now` `item{id, title, serves, owner, size, dependsOn, revisits}`; replace line 165's "`owner` and `size` are `null`: `NOW.md` holds neither." with "`owner` and `size` come from `now.item`."), and `scripts/validate.ts:148`.

- [x] **Step 5: Run to verify they pass**

Run: `bun test skills/pm-export/scripts/export.test.ts`
Expected: PASS. (`just validate` still fails on the docs-site templates until Task 5.)

- [x] **Step 6: Commit**

```bash
git add skills/pm-export scripts/validate.ts
git commit -m "feat(pm-export): export the active item's owner, size, and links (schemaVersion 4)"
```

### Task 2: Lint the new `NOW.md` and stack fields; template

**Files:**

- Modify: `skills/pm-lint/scripts/structure.ts:57,65,430-467` (`KEYS.now`, `KEYS.stack`, `checkNow`)
- Modify: `skills/pm-lint/scripts/rules.ts:63` and add `now/item`
- Modify: `skills/pm-lint/references/rules.md:132` and add the `now/item` row
- Modify: `skills/pm-init/templates/NOW.md` (fields and active example)
- Test: `skills/pm-lint/scripts/lint.test.ts`

**Interfaces:**

- Consumes: the field order from Global Constraints.
- Produces: rule `now/item` (error, not fixable): "When active, Serves lists V IDs from VISION.md, Owner is agent, user, or both, Size is S, M, or L, Depends on lists existing IDs or none, and Revisits is one existing ID or empty."

- [x] **Step 1: Write the failing tests** in `lint.test.ts`, using the existing `repo({...})` helper and `rulesOf`:

```ts
it("accepts NOW.md with or without the item fields", async () => {
  expect(await rulesOf(repo({}))).toEqual([]); // the export fixture now has them (Task 1)
  const without = repo({ "NOW.md": (t) => t.replace("- Serves: V1\n- Owner: both\n- Size: M\n- Depends on: R-006\n- Revisits:\n", "") });
  expect(await rulesOf(without)).toEqual([]);
});

it("checks the item fields of an active NOW.md", async () => {
  const root = repo({ "NOW.md": (t) => t.replace("- Owner: both", "- Owner: someone").replace("- Size: M", "- Size: XL").replace("- Depends on: R-006", "- Depends on: R-404") });
  expect(await rulesOf(root)).toContain("now/item");
});

it("keeps the item fields empty when idle", async () => {
  const idle = (owner: string) => `# Now\n\n- Status: idle\n- Item:\n- Session:\n- Stage:\n- Brief:\n- Milestone:\n- Serves:\n- Owner:${owner}\n- Size:\n- Depends on:\n- Revisits:\n- Spec:\n- Plan:\n- Started:\n\n## Done when\n\n## Checkpoint\n`;
  expect((await rulesOf(repo({ "NOW.md": () => idle("") }))).filter((r) => r.startsWith("now/"))).toEqual([]);
  expect(await rulesOf(repo({ "NOW.md": () => idle(" agent") }))).toContain("now/idle");
});
```

- [x] **Step 2: Run to verify they fail**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: FAIL (`now/fields` on the fixture, no `now/item`).

- [x] **Step 3: Implement.** `KEYS.now` becomes the 14-field list; `checkNow` accepts the keys when they equal either the 9-field list (the rules 19 shape: the 14 minus the five) or the 14-field list, and the `now/fields` message names both. Add the `now/item` checks for an active `NOW.md` when the keys are present (reuse the roadmap's owner and size regexes and the `Serves`/`Depends on`/`Revisits` lookups `checkRoadmap` uses). Add the five keys to `KEYS.stack` after `Milestone`; `stack/entry`'s required keys are unchanged. Update `rules.ts`, `rules.md` (`now/fields` text names the optional five; new `now/item` row), and the `pm-init` NOW.md template (empty fields, and the five in the active example).

- [x] **Step 4: Run to verify they pass**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: PASS, including the catalogue-equals-`rules.md` test and the fresh `pm-init` install test.

- [x] **Step 5: Commit**

```bash
git add skills/pm-lint skills/pm-init/templates/NOW.md
git commit -m "feat(pm-lint): check the active item's fields in NOW.md"
```

### Task 3: Skills write and carry the fields

**Files:**

- Modify: `skills/pm-next/SKILL.md` (step 7)
- Modify: `skills/pm-checkpoint/SKILL.md` (steps 5, 6, 7, 8)
- Modify: `skills/pm-revise/SKILL.md:113`
- Modify: `skills/pm-setup/SKILL.md` (Step 5 new item 5, Step 6 item 2, Output)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (Stack file definition, Non-interruption rule 6, `Version 20` upgrade note after the `Version 19` note at line 915)

**Interfaces:**

- Consumes: the field order and the switch join rule from Global Constraints.

- [x] **Step 1: `pm-next` step 7.** After `Milestone (from the item, or empty)` add: `Serves`, `Owner` (from the item, or `agent`), `Size`, `Depends on` (from the item, or `none`), and `Revisits` (from the item, or empty). Add: `## Done when` holds the item's checks only; a held `Note:` goes on the item, never under `## Done when`.

- [x] **Step 2: `pm-checkpoint`.** `done`: the LOG line's `Owner` is `NOW.md`'s `Owner` (`agent` when missing). `switch`: the restored block gets `Serves`, `Owner`, `Size`, `Depends on`, `Revisits` from `NOW.md` and `Done when` from `## Done when`, its bullets joined with a semicolon and a space; omit a field `NOW.md` does not have. `push`: the stack entry template gains the five fields after `Milestone`. `pop`: writes them back to `NOW.md`.

- [x] **Step 3: `pm-revise:113`.** Add the five fields to its `NOW.md` field list in the same order.

- [x] **Step 4: `pm-setup`.** Add Step 5 item 5 **Active item fields (version 20)**: when `<PM root>/NOW.md` is active and lacks `Owner`, find the claim commit with `git log --format=%H --grep="^docs(pm): claim <ID>" -1 <Session branch>`, read `git show <commit>^:<PM root>/ROADMAP.md`, take that item's `Serves`, `Owner`, `Size`, `Depends on`, `Revisits`, and write them to `NOW.md` after `Milestone`. When the commit or block is missing, ask one choice question per missing `Owner`, `Size`, `Serves` (options drawn from the allowed values, the `V` lines in `VISION.md` for Serves), with `Depends on: none` and `Revisits:` empty. Show the five values. `pm-setup` does not commit; the next PM commit carries `NOW.md`, like the `Rules version` line. Step 6 item 2 and the Output diff-check line also allow those `NOW.md` lines.

- [x] **Step 5: Rules section.** Non-interruption rule 6: `pm-setup` may also write the item fields of an active `NOW.md` during an upgrade (pm-setup Step 5, item 5). Stack file definition: the entry also holds the item's `Serves`, `Owner`, `Size`, `Depends on`, and `Revisits`. Add the `Version 20` note with the spec's wording (section 5).

- [x] **Step 6: Lint the Markdown**

Run: `bunx markdownlint-cli2 skills/pm-next/SKILL.md skills/pm-checkpoint/SKILL.md skills/pm-revise/SKILL.md skills/pm-setup/SKILL.md skills/pm-setup/references/AGENTS-section.md`
Expected: `0 issues`.

- [x] **Step 7: Commit**

```bash
git add skills/pm-next skills/pm-checkpoint skills/pm-revise skills/pm-setup
git commit -m "feat(pm-next): carry the claimed item's fields in NOW.md"
```

### Task 4: Rules 20, installed here, R-018 backfilled

**Files:**

- Modify (by `just bump major`): `package.json`, `skills/pm-setup/references/AGENTS-section.md` marker, `skills/pm-init/templates/config.md`
- Modify (by `pm-setup`): `AGENTS.md` managed section, `planning/config.md` `Rules version`, `planning/NOW.md` (backfill)

- [x] **Step 1: Bump**

Run: `just bump major`
Expected: `package.json` `20.0.0`, marker `version=20`.

- [x] **Step 2: Run `pm-setup`** (upgrade). Expected output: `upgraded to v20`, `Rules version: v20 recorded in planning/config.md`, and the backfill showing `Serves: V4`, `Owner: agent`, `Size: M`, `Depends on: none`, `Revisits:` (empty) for R-018, read from the parent of `ea9ea0d docs(pm): claim R-018 ...`.

- [x] **Step 3: Verify the live export**

Run: `bun skills/pm-export/scripts/export.ts write; bun skills/pm-export/scripts/export.ts get now.item; bun skills/pm-export/scripts/export.ts get board.columns.now`
Expected: `now.item` has `owner: "agent"`, `size: "M"`, `serves: ["V4"]`; the Now card shows `owner: "agent"`, `size: "M"`.

- [x] **Step 4: Verify**

Run: `just pm-lint; bun test`
Expected: `pm-lint: clean`, tests pass. (`just validate` still fails on the templates until Task 5.)

- [x] **Step 5: Commit** the code files, then the PM files as a PM commit:

```bash
git add package.json skills/pm-setup/references/AGENTS-section.md skills/pm-init/templates/config.md AGENTS.md
git commit -m "chore(release): rules 20 for the active item's fields"
git add -A -- planning
git commit -m "docs(pm): record rules 20 and backfill R-018 fields" -- planning
```

### Task 5: Docs-site templates read schemaVersion 4

**Files:**

- Modify: `skills/pm-docs-site/templates/site/src/lib/planning.ts:16,251-267`
- Modify: `skills/pm-docs-site/templates/site/src/lib/planning-types.ts:1,10,150,170`
- Modify: `skills/pm-docs-site/templates/site/src/lib/__fixtures__/planning.json`
- Modify: `skills/pm-docs-site/SKILL.md:24,82` and any other `schemaVersion 3` in it
- Modify: `docs-site/pm-docs-site.json` `schemaVersion` if it records one
- Test: `skills/pm-docs-site/templates/site/src/lib/planning.test.ts`

**Interfaces:**

- Consumes: `nowItem` from Task 1.
- Produces: `export interface NowItem extends ItemRef { serves: string[]; owner: Owner | null; size: Size | null; dependsOn: string[]; revisits: string | null }`; `Planning['now']['item']: NowItem | null`.

- [x] **Step 1: Write the failing test** in the template's `planning.test.ts`:

```ts
it("gives the Now feature the item's owner, size, serves, and links", () => {
  const now = features(loadPlanning(FIXTURE)).find((f) => f.state === 'now')!;
  expect(now).toMatchObject({ id: 'R-012', owner: 'agent', size: 'M', serves: ['V1'], dependsOn: ['R-008'], revisits: null });
});
```

Set the fixture to `schemaVersion: 4`, `now.item` = `{ id: "R-012", title: "Invoice export", serves: ["V1"], owner: "agent", size: "M", dependsOn: ["R-008"], revisits: null }` (use a `V` and a Done or roadmap `R-008` that already exist in the fixture; adjust the IDs to ones it holds), and the Now card's `owner`/`size` to match.

- [x] **Step 2: Run to verify it fails**

Run: `cd skills/pm-docs-site/templates/site && bun test src/lib/planning.test.ts`
Expected: FAIL on `dependsOn` / `SCHEMA_VERSION`.

- [x] **Step 3: Implement.** `SCHEMA_VERSION = 4`, the types and the `schemaVersion: 4;` literal, and in `features()` take `owner`, `size`, `serves`, `dependsOn`, `revisits` from `planning.now.item` instead of the board card. Update the `pm-docs-site` SKILL.md sentence to "This skill reads schemaVersion 4." and its manifest example.

- [x] **Step 4: Re-render and verify**

Run: `bun skills/pm-docs-site/scripts/site.ts write docs-site; just validate; just docs-check; just lint-check`
Expected: all pass.

- [x] **Step 5: Commit**

```bash
git add skills/pm-docs-site docs-site
git commit -m "feat(pm-docs-site): read schemaVersion 4 and the Now item's links"
```

### Task 6: Package and graph (after R-012 merges)

**Files:**

- Modify: `packages/pm-docs-site/lib/schema-version.ts:4` (`[3]` -> `[4]`)
- Modify: `packages/pm-docs-site/src/lib/planning-types.ts`, `src/lib/planning.ts` (`SCHEMA_VERSION`, `features()` Now entry)
- Modify: `packages/pm-docs-site/src/lib/graph.ts:36,73,143,163,194`, `src/components/graph/GraphNodes.tsx:38`, `src/routes/plan/graph.astro:74`, `README.md:130,150`
- Modify: `packages/pm-docs-site/test/fixtures/planning.json`, `test/cli.test.ts:99,111`, `test/graph.test.ts:65,168`, `test/graph-layout.test.ts:39,44`, `test/planning.test.ts`

**Interfaces:**

- Consumes: `NowItem` (same shape as Task 5).
- Produces: graph nodes and rows without `linksNotExported`.

- [x] **Step 1: Gate on R-012.**

Run: `git fetch origin --prune; git branch -r --merged origin/main | Select-String r-012`
Expected: `origin/feat/r-012-docs-site-package-dependency-graph`. If it is not listed, run `pm-checkpoint pause` with `Open question: R-012's pull request has not merged; Task 6 waits for it.` and stop.

- [x] **Step 2: Bring `main` in.**

Run: `git merge origin/main`
Expected: a merge without conflicts, or conflicts only in `planning/` resolved in favour of this branch's `NOW.md` and `main`'s `LOG.md`/`ROADMAP.md`, then `just pm-lint` clean.

- [x] **Step 3: Write the failing tests.** In `test/graph.test.ts` replace the `linksNotExported` assertions:

```ts
expect(nodeById.get('R-012')).toMatchObject({ active: true, section: 'now' });
expect(edges).toContainEqual(expect.objectContaining({ from: 'R-008', to: 'R-012' })); // use the edge shape graph.ts defines
expect(rowById.get('R-012')).not.toHaveProperty('linksNotExported');
```

Add one case where the Now item depends on a done ID and one on an unknown ID: the row shows the done chip and the missing chip, as for a roadmap item. In `test/cli.test.ts` the supported line becomes `schemaVersion 4` and the too-new export is 5 (`has schemaVersion 5; this site reads schemaVersion 4`). Update `test/fixtures/planning.json` as in Task 5.

- [x] **Step 4: Run to verify they fail**

Run: `cd packages/pm-docs-site && bun test`
Expected: FAIL on the edge into R-012 and the CLI text.

- [x] **Step 5: Implement.** `SUPPORTED_SCHEMA_VERSIONS = [4]`, types and `SCHEMA_VERSION` as in Task 5, `features()` reads the five fields from `planning.now.item`, remove `linksNotExported` from `graph.ts` types and builders, the `GraphNodes.tsx` note, the `graph.astro` paragraph (and its `plan-deps__links` style if unused), the README paragraph at line 150, and update README line 130's version. Leave `package.json`'s version unchanged.

- [x] **Step 6: Verify**

Run: `cd packages/pm-docs-site && bun test && bun run check && bun run build; cd ../..; just lint-check; just version-check`
Expected: all pass; `version-check` reports the package version unchanged.

- [x] **Step 7: Commit**

```bash
git add packages/pm-docs-site
git commit -m "feat(pm-docs-site): draw the active item's links in the graph"
```

- [ ] **Step 8: Check every Done when line** in `planning/NOW.md` against this evidence: Task 4 Step 3 (owner and size live), Task 6 Step 6 (edges, notice removed, tests), Task 5 Step 4 (fixtures agree). Then `pm-checkpoint done`.
