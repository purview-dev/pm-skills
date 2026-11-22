# R-033 ADR record, pm-adr, and design handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ADRs become PM state in `<PM root>/decisions/`, owned by a new `pm-adr` skill, linted by `pm-lint`, defined in the managed rules, and recorded by the design stage through `pm-next`'s handoff.

**Architecture:** Markdown skills plus the `pm-lint` Bun scripts. The ADR format and rules live in the managed section (`skills/pm-setup/references/AGENTS-section.md`); `pm-lint` gains an `adr` file kind and four `adr/*` rules; `pm-adr` is a new SKILL.md with no script. Export and the docs site are untouched (slice 2).

**Tech Stack:** Markdown, Bun + TypeScript (`bun:test`), just, markdownlint-cli2.

**Spec:** `docs/superpowers/specs/2026-11-22-adr-record-design.md`

## Global Constraints

- ADR path: `<PM root>/decisions/ADR-NNN-<slug>.md`; IDs `ADR-NNN`, at least 3 digits, never reused.
- ADR header fields, in order: `Status`, `Date`, `Category`, `Supersedes`, `Item`, `Source`; sections, in order: `Context`, `Decision`, `Alternatives`, `Consequences`.
- `Status`: `proposed | accepted | superseded by ADR-NNN | deprecated`. `Supersedes`: `ADR-NNN | none`. `Item`: `R-NNN | none`. `Date`: `YYYY-MM-DD`. `Category` and `Source`: non-empty text (`none` allowed for `Source`).
- `pm-adr` in a workflow (`new`, `supersede`, `accept`) writes, replies in one line `Recorded ADR-NNN <title> (<status>).`, never asks, never commits.
- PM skills write only inside the PM root. No export or `schemaVersion` change.
- Version: `just bump prerelease` to `21.0.0-pre.3`; rules marker stays `version=21`.
- A rule is added to `rules.ts`, `references/rules.md`, and a test together (AGENTS.md).
- Skill count in `pm-setup` moves from 25 to 26.
- Commit messages follow commitlint (`feat(pm-lint): ...`, `feat(pm-adr): ...`, `docs(...)`).

## Review Focus

- `decisions/README.md` must never be checked as an ADR (Task 1 test `ignores the decisions README`).
- A CRLF ADR file (Windows editors) passes like an LF one (Task 1 test `accepts a CRLF ADR`).
- A 4-digit ID (`ADR-1000`) is valid (Task 1 test in `accepts the default ADR format`).
- An `Item` naming a dropped or done item is valid, not only a roadmap item (Task 1 test `accepts Item IDs from LOG.md`).
- A one-sided supersede (old says `superseded by ADR-002`, new says `Supersedes: none`) fails `adr/links` (Task 1 test `checks ADR links`).

---

### Task 1: pm-lint ADR file kind and rules

**Files:**

- Modify: `skills/pm-lint/scripts/structure.ts` (`Kind` line 30, `kindOf` 45-53, `KEYS` 56-73, `FILE_KEYS` 76-87, `Context` ~195-206, `buildContext` 210-278, `checkStructure` checkers 285-297; new `checkAdr`)
- Modify: `skills/pm-lint/scripts/rules.ts` (add after the `risks/*` rules, line 105)
- Modify: `skills/pm-lint/references/rules.md` (Scope table near line 24; Rules table after `risks/removed`, line 178)
- Test: `skills/pm-lint/scripts/lint.test.ts` (new `describe("ADR rules")`)

**Interfaces:**

- Produces: `Kind` includes `"adr"`; `kindOf("decisions/ADR-001-x.md") === "adr"`, `kindOf("decisions/README.md") === "markdown"`; `KEYS.adr = ["Status", "Date", "Category", "Supersedes", "Item", "Source"]`; `Context.adrs: { id: string; rel: string; status: string; supersedes: string; n: number }[]`; rules `adr/header`, `adr/sections`, `adr/id`, `adr/links` (all `error`, not fixable).

- [ ] **Step 1: Write the failing tests** in `lint.test.ts`, using the existing `repo()` and `rulesOf()` helpers and this helper:

```ts
const adr = (id: string, title: string, fields: Partial<Record<string, string>> = {}, sections = ["Context", "Decision", "Alternatives", "Consequences"]) =>
  () => `# ${id} ${title}\n\n` +
    ["Status", "Date", "Category", "Supersedes", "Item", "Source"].map((k) => `- ${k}: ${fields[k] ?? { Status: "accepted", Date: "2026-11-22", Category: "architecture", Supersedes: "none", Item: "none", Source: "none" }[k]}`).join("\n") +
    "\n\n" + sections.map((s) => `## ${s}\n\nText.\n`).join("\n");

describe("ADR rules", () => {
  it("accepts the default ADR format", async () => {
    const root = repo({
      "decisions/ADR-001-use-bun.md": adr("ADR-001", "Use Bun", { Item: "R-008" }),
      "decisions/ADR-1000-big-id.md": adr("ADR-1000", "Big id"),
    });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("ignores the decisions README", async () => {
    const root = repo({ "decisions/README.md": () => "# Decisions\n\nFree text.\n" });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("accepts a CRLF ADR", async () => {
    const root = repo({ "decisions/ADR-001-use-bun.md": () => adr("ADR-001", "Use Bun")().replaceAll("\n", "\r\n") });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
  it("accepts Item IDs from LOG.md", async () => {
    // In the fixture's LOG.md, R-006 is in ## Done and R-004 in ## Dropped; neither is in ROADMAP.md.
    const root = repo({ "decisions/ADR-001-a.md": adr("ADR-001", "A", { Item: "R-006" }), "decisions/ADR-002-b.md": adr("ADR-002", "B", { Item: "R-004" }) });
    expect(await rulesOf(root)).not.toContain("adr/links");
  });
  it("checks the header and sections", async () => {
    const root = repo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "maybe", Date: "today", Item: "R-7" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B", {}, ["Context", "Decision", "Consequences"]),
    });
    const rules = await rulesOf(root);
    expect(rules).toContain("adr/header");
    expect(rules).toContain("adr/sections");
  });
  it("checks ADR IDs", async () => {
    const root = repo({
      "decisions/ADR-001-a.md": adr("ADR-002", "A"),
      "decisions/ADR-003-b.md": adr("ADR-003", "B"),
      "decisions/ADR-003-c.md": adr("ADR-003", "C"),
      "decisions/use-bun.md": adr("ADR-004", "D"),
    });
    expect((await rulesOf(root)).filter((r) => r === "adr/id").length).toBeGreaterThanOrEqual(3);
  });
  it("checks ADR links", async () => {
    const root = repo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "superseded by ADR-002" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B"), // one-sided: Supersedes none
      "decisions/ADR-003-c.md": adr("ADR-003", "C", { Supersedes: "ADR-009" }),
      "decisions/ADR-004-d.md": adr("ADR-004", "D", { Item: "R-999" }),
    });
    expect((await rulesOf(root)).filter((r) => r === "adr/links").length).toBeGreaterThanOrEqual(3);
  });
  it("accepts a two-sided supersede", async () => {
    const root = repo({
      "decisions/ADR-001-a.md": adr("ADR-001", "A", { Status: "superseded by ADR-002" }),
      "decisions/ADR-002-b.md": adr("ADR-002", "B", { Supersedes: "ADR-001" }),
    });
    expect((await rulesOf(root)).filter((r) => r.startsWith("adr/"))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test skills/pm-lint/scripts/lint.test.ts -t "ADR rules"`
Expected: FAIL (no `adr/*` findings; `rules.md` test may also fail once rules are referenced).

- [ ] **Step 3: Implement in `structure.ts`**
  - `kindOf`: `if (folder === "decisions") return "adr";` inside the existing one-level, non-README guard.
  - `KEYS.adr` as in Interfaces; `FILE_KEYS.adr = KEYS.adr`.
  - `buildContext`: collect `adrs` from docs of kind `adr`: `id` from the H1 (`/^(ADR-\d{3,})\b/`), `status` and `supersedes` from the header fields, `rel`, `n` = H1 line.
  - `checkAdr(doc: Doc, add: Add, context: Context): void`, registered as `adr: checkAdr`:
    - `adr/header`: H1 is `ADR-NNN <title>`; the fields before the first `##` are exactly `KEYS.adr` in order (reuse `checkBlockFields` with exact order, as other kinds do) with the Global Constraints' value patterns.
    - `adr/sections`: the `##` headings are exactly `Context`, `Decision`, `Alternatives`, `Consequences`, in order.
    - `adr/id`: the file name matches `^ADR-(\d{3,})-[a-z0-9-]+\.md$` and its ID equals the H1's; report on every file whose ID another file also has.
    - `adr/links`: `Supersedes: X` needs X in `context.adrs` with `status === "superseded by <this>"`; `superseded by X` needs X with `supersedes === <this>`; `Item` must be in roadmap items, `now`, `done`, or `dropped`.
- [ ] **Step 4: Add the four rules** to `rules.ts` with these summaries, and the same rows (fuller wording allowed) to `rules.md`, plus a Scope row `| decisions/ADR-*.md | **ADR** (Shared definitions) | format, header, sections, IDs, links |`:
  - `adr/header`: "An ADR starts `# ADR-NNN <Title>` with Status, Date, Category, Supersedes, Item, and Source, in order, with allowed values."
  - `adr/sections`: "An ADR has `## Context`, `## Decision`, `## Alternatives`, and `## Consequences`, in order."
  - `adr/id`: "An ADR file is `ADR-NNN-<slug>.md`, its ID matches its heading, and no two ADRs share an ID."
  - `adr/links`: "Supersedes and superseded by name existing ADRs and agree, and Item names a known item ID."
- [ ] **Step 5: Run the pm-lint tests**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: PASS, including `rules.md documents every rule` and `clean PM state`.

- [ ] **Step 6: Commit**

```bash
git add skills/pm-lint
git commit -m "feat(pm-lint): check ADR files in the decisions folder"
```

### Task 2: The ADR in the managed rules, and pm-next's handoff

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md` (Shared definitions: after **Risk IDs** ~line 215; **Named reference** ~105; **Reference legend**; **Optional files** ~112; Non-interruption rules 2 and 3 ~419-450; Committing PM state "never commits" bullet ~751; skill table after `pm-risk` line 29; `Version 21` upgrade note)
- Modify: `skills/pm-next/SKILL.md` step 10 (lines 130-137)
- Modify: `AGENTS.md` (the installed managed section, between the markers)

**Interfaces:**

- Consumes: the format and rules from Task 1 (field order, rule names).
- Produces: Shared definitions named **Decisions folder**, **ADR IDs**, **ADR** (with the decision split, read-before-deciding, and every-design-handoff sentences) that Tasks 3 and 4 cite by name.

- [ ] **Step 1: Write the Shared definitions** exactly as the spec's Design section 1 gives them (format block verbatim), and add `ADR-NNN <title> (<status>)` to **Named reference** and an ADR's title and status to **Reference legend**. Add `decisions/` to **Optional files** ("in projects initialised before version 21").
- [ ] **Step 2: Non-interruption rules.** Rule 2: add a bullet "when the workflow records or accepts a technical decision (`pm-adr` `new`, `supersede`, `accept`)". Rule 3: add `pm-adr` (`new`, `supersede`, `accept`) to the permitted mid-workflow writes with the one-line reply from Global Constraints, no questions, no commit; add `pm-adr` (`view`, `check`) to the read-only exceptions. Committing PM state: "`pm-park` never commits, `pm-risk` never commits in capture mode, and `pm-adr` never commits during a workflow".
- [ ] **Step 3: Skill table row** after `pm-risk`: `| \`pm-adr\` | Record, supersede, accept, deprecate, view, check, or import architecture decision records in the decisions folder | Any time (new, supersede, accept, view, and check during a workflow), user asks |`
- [ ] **Step 4: `Version 21` upgrade note:** append "Version 21 also adds `pm-adr` and the decisions folder (`<PM root>/decisions/`, optional): technical decisions are ADRs, the design stage records them with `pm-adr`, and `pm-adr import <folder>` brings an existing ADR folder in. No setting is added."
- [ ] **Step 5: `pm-next` step 10:** append the spec's section 4 instruction: list the accepted and proposed ADRs as named references (or "no ADRs"), tell the design skill to read the ones its decision touches before proposing approaches, record each architecture decision with `pm-adr new` (or `supersede`), and name the ADR IDs in the spec.
- [ ] **Step 6: Reinstall** the section into `AGENTS.md`: replace the text between `<!-- pm-skills:start -->` and the end marker with the reference's text between its markers (the reference's start marker carries `version=21`; the installed one has no version).
- [ ] **Step 7: Verify**

Run: `just validate`
Expected: exits 0 except for `pm-adr` missing from skill tables (fixed in Task 3) — if validate fails only on that, continue; any other failure is fixed here.

- [ ] **Step 8: Commit**

```bash
git add skills/pm-setup/references/AGENTS-section.md skills/pm-next/SKILL.md AGENTS.md
git commit -m "feat(pm-setup): define ADRs and let pm-adr write during the design stage"
```

### Task 3: The pm-adr skill and the four tables

**Files:**

- Create: `skills/pm-adr/SKILL.md`
- Modify: `README.md` (skills table, after `pm-risk` line 44)
- Modify: `skills/pm-setup/SKILL.md` (inventory list ~line 69; counts `25` to `26` at lines 146, 284, 296)
- Modify: `skills/pm-help/SKILL.md` (skill guide row after `pm-risk` line 47)

**Interfaces:**

- Consumes: Shared definitions **Decisions folder**, **ADR IDs**, **ADR** (Task 2); rule names `adr/*` (Task 1).

- [ ] **Step 1: Write `skills/pm-adr/SKILL.md`** following `skills/pm-risk/SKILL.md`'s layout (frontmatter `name: pm-adr` and a "Use when ..." description naming ADRs, architecture decisions, technical decisions, supersede, and import; then Guard, Modes table, Steps per mode, Output). Content from the spec's section 2:
  - Modes `new`, `supersede <ADR-NNN>`, `accept <ADR-NNN>`, `deprecate <ADR-NNN>`, `view [<ADR-NNN>]`, `check`, `import <folder>`, each with its effect and whether it runs during a workflow.
  - New ID: the highest `ADR` number in `<PM root>/decisions/` file names plus 1; create the folder on the first write.
  - In a workflow: no questions, no Challenge, no commit, the one-line reply.
  - Outside a workflow: `new` and `supersede` apply Challenge protocol checks 3 and 7 into `## Alternatives`; one PM commit `docs(pm): record ADR-NNN <slug>` (or `supersede`, `accept`, `deprecate`, `import <n> ADRs`).
  - `check`: run `bun <pm-lint skill>/scripts/lint.ts check <PM root>/decisions --root .` when Bun is installed; otherwise check the format by reading.
  - `import <folder>`: one confirmation question listing the files; for each, new ID in source order (numeric order of the source file names), header from field bullets, MADR YAML frontmatter (`status`, `date`, `category`), or a `## Status` section's first line; missing `Category` is `uncategorised`, missing `Date` is the file's first commit date (`git log --diff-filter=A --format=%as -- <file>`), `Source` is the original path, the body verbatim under the four sections (unmatched source headings go under `## Context`); the originals are left in place.
  - Output template: `## ADR` (`- ADR: ADR-NNN <title> (<status>)`, `- Category`, `- Path`), `## Do this next` (one action), `## Note` (commit result); `view` prints a table grouped by category then status.
- [ ] **Step 2: Add the table rows**
  - README:

    ```markdown
    | [`pm-adr`](skills/pm-adr/SKILL.md) | Record, supersede, accept, deprecate, view, check, or import architecture decision records | Any time (record and view mid-task) |
    ```

  - pm-help guide:

    ```markdown
    | `pm-adr` | A technical decision to record, or the ADRs to see or check: new, supersede, accept, deprecate, view, check, import | "record an ADR for using Bun", "show the ADRs", "import docs/adr" | `decisions/ADR-NNN-<slug>.md` |
    ```

  - pm-setup: add `` `pm-adr` `` to the inventory list and change the three `25`s to `26`.
- [ ] **Step 3: Verify**

Run: `just validate; bunx markdownlint-cli2 skills/pm-adr/SKILL.md README.md skills/pm-setup/SKILL.md skills/pm-help/SKILL.md`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add skills/pm-adr README.md skills/pm-setup/SKILL.md skills/pm-help/SKILL.md
git commit -m "feat(pm-adr): record, supersede, view, check, and import ADRs"
```

### Task 4: pm-init and pm-setup set up the decisions folder

**Files:**

- Create: `skills/pm-init/templates/decisions-README.md`
- Modify: `skills/pm-init/SKILL.md` (template table ~lines 36-46; step 2 or after step 3; output Note)
- Modify: `skills/pm-setup/SKILL.md` (step 4, PM config check: the import Note)

**Interfaces:**

- Consumes: **Decisions folder** and **ADR** (Task 2); `pm-adr import` (Task 3).

- [ ] **Step 1: Write `decisions-README.md`**: `# Decisions` (level-1 heading first, PM file format), what an ADR is, the decision split, that `pm-adr` writes them, and the ID and file-name rule, in at most 15 lines.
- [ ] **Step 2: `pm-init`:** add the row `| decisions-README.md | <PM root>/decisions/README.md (new project only) |`; copy it only when step 3 finds no substantial code (move that finding before the copy, or copy after step 3 — state which in the step). When an outside ADR folder exists (`docs/adr/`, `docs/decisions/`, `doc/adr/`, `docs/architecture/decisions/`), add the output Note `Existing ADRs in <folder>. Run pm-adr import <folder> to bring them in.`
- [ ] **Step 3: `pm-setup` step 4:** when the PM root exists, has no `decisions/` folder, and an outside ADR folder exists, add the same Note to the output. No question, no write.
- [ ] **Step 4: Verify**

Run: `bun test skills/pm-lint/scripts/lint.test.ts -t "clean PM state"; just validate`
Expected: PASS (the fresh install, now with `decisions/README.md` via `initRoot`, lints clean); validate exits 0.

- [ ] **Step 5: Commit**

```bash
git add skills/pm-init skills/pm-setup/SKILL.md
git commit -m "feat(pm-init): decisions folder for new projects and an import note"
```

### Task 5: Version, dogfood, and full verification

**Files:**

- Modify: `package.json` (via `just bump prerelease`)
- Create: `planning/decisions/README.md`, `planning/decisions/ADR-001-adrs-live-in-the-pm-root.md` (through `pm-adr new`, as the workflow would)

- [ ] **Step 1: Bump**

Run: `just bump prerelease`
Expected: `package.json` version `21.0.0-pre.3`.

- [ ] **Step 2: Dogfood `pm-adr new`** in this repository, following `skills/pm-adr/SKILL.md` (`new` during a workflow: no question, no commit): ADR-001 "ADRs live in the PM root", `Status: accepted`, `Category: architecture`, `Item: R-033`, `Source: none`, with Context, Decision, Alternatives (the three rows of the spec's Approaches table), and Consequences from the spec. Copy `skills/pm-init/templates/decisions-README.md` to `planning/decisions/README.md`.

Run: `just pm-lint`
Expected: no errors.

- [ ] **Step 3: Rehearse supersede and import in a scratch copy** (not committed): copy `planning/` to `$env:CLAUDE_JOB_DIR/tmp/adr-rehearsal/planning/`, run `pm-adr supersede ADR-001` there per the skill (expect ADR-002 with `Supersedes: ADR-001` and ADR-001 `Status: superseded by ADR-002`); create `docs/adr/` in the scratch root with one field-bullet ADR, one MADR file (YAML frontmatter), and one Nygard file (`## Status` section), then run `pm-adr import docs/adr/` per the skill (expect ADR-003 to ADR-005 with `Source` set).

Run: `bun skills/pm-lint/scripts/lint.ts check --root "$env:CLAUDE_JOB_DIR/tmp/adr-rehearsal"`
Expected: no `adr/*` errors, five ADRs in the scratch `planning/decisions/`.

- [ ] **Step 4: Full checks**

Run: `just validate; just test; just lint-check`
Expected: all exit 0.

- [ ] **Step 5: Commit the version only**

```bash
git add package.json
git commit -m "chore(release): 21.0.0-pre.3"
```

`planning/decisions/` is PM state written by `pm-adr` during the workflow, so it is not committed here: `pm-checkpoint` (`done`) sweeps it into the completion commit (Committing PM state: leftovers are swept in). Record the Step 3 rehearsal result in the `NOW.md` checkpoint or the done output's Note.
