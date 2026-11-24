# Engineering file and pm-engineering skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the optional PM file `<PM root>/ENGINEERING.md`, its `pm-lint` schema and rules, its `pm-init` template, its managed-section definitions, and the `pm-engineering` skill (`view`, `add`, `change`, `remove`).

**Architecture:** Mirror `pm-risk` and `RISKS.md`: a new `engineering` file kind in `skills/pm-lint/scripts/structure.ts` with a checker and fixable ordering, a template copied by `pm-init`, Shared definitions in `skills/pm-setup/references/AGENTS-section.md`, and a Markdown skill. Entries point to ADRs for their reasons (ADR-009).

**Tech Stack:** Markdown skills, Bun + TypeScript (`bun:test`), `just`, markdownlint-cli2.

**Spec:** `docs/superpowers/specs/2026-11-24-engineering-file-and-pm-engineering-skill-design.md`

## Global Constraints

- Sections in order: `## Technology`, `## Principles`, `## Removed`.
- Technology fields, in order: `Kind`, `Version`, `Reason`, `Decision`, `Source`, `Added`. Heading `### <Name>`.
- Principle fields, in order: `Rule`, `Applies to`, `Check`, `Decision`, `Source`, `Added`. Heading `### EP-NNN <Title>` (at least 3 digits, title at most 8 words).
- `Decision` is `none` or one `ADR-NNN`. `Check` is a backticked command or `review`. `Source` is never empty. `Added` is `YYYY-MM-DD`.
- Removed line: `- YYYY-MM-DD <Name or EP-NNN title>. Reason: <reason>.`; Removed is newest first.
- No `planning/ENGINEERING.md` in this repository in this item (R-035 seeds it). No change to `pm-export`, `pm-adr`, `pm-status`, or the docs site.
- Version stays on rules 21: `just bump prerelease` (`21.0.0-pre.8` -> `21.0.0-pre.9`). No marker bump.
- All scripts TypeScript on Bun; no shell set in the justfile.
- PM files under `planning/` are changed only by `pm-*` skills, never by these tasks.

## Review Focus

1. A CRLF `ENGINEERING.md` lints exactly like its LF copy (users on Windows; the ADR tests already pin CRLF).
2. Two technology blocks differing only in case (`### Bun`, `### bun`) are a duplicate (`engineering/technology`).
3. `Decision: ADR-001` where ADR-001 is superseded is a **warning** (`engineering/decision-current`), never an error; an unknown `ADR-009` is an error (`engineering/values`).
4. An EP ID that appears in both `## Principles` and `## Removed` is `engineering/id-unique`.
5. The empty template (headings and an HTML comment only) lints clean, and an unbackticked `Check: bun test` is `engineering/values`.

Each line has its test in Task 1, Step 1.

---

### Task 1: pm-lint `engineering` kind and rules

**Files:**

- Modify: `skills/pm-lint/scripts/structure.ts` (`Kind`, `TOP_FILES`, `KEYS`, `FILE_KEYS`, `checkStructure` checkers, new `engineeringBlocks` and `checkEngineering`, `fixStructure`)
- Modify: `skills/pm-lint/scripts/rules.ts` (8 `rule(...)` entries after the `risks/` group)
- Modify: `skills/pm-lint/references/rules.md` (Scope row for `ENGINEERING.md`; `### engineering` table after `### risks`)
- Test: `skills/pm-lint/scripts/lint.test.ts` (new `describe("engineering rules", ...)`)

**Interfaces:**

- Consumes: `Context.adrs` (`{ id, status }[]`), `requireSections`, `checkBlockFields`, `findSection`, `sections`, `fields`, `fieldMap`, `sortByDate`, `trimBlank`, `idNumber`, `isDate` (all existing in `structure.ts`).
- Produces: `KEYS.technology`, `KEYS.principle` (readonly string tuples as in Global Constraints); `export function engineeringBlocks(lines: Line[], section: Section): EngineeringBlock[]` with `interface EngineeringBlock { id: string; title: string; heading: number; start: number; end: number; fields: Map<string, Field>; list: Field[] }` (`id` is `EP-NNN` or `""`, `title` is the rest of the heading or the whole heading for technology).

- [ ] **Step 1: Write the failing tests**

Add to `lint.test.ts`, using `repo()` (the fixture has ADR-001 `superseded by ADR-002` and ADR-002 `accepted`):

```ts
const tech = (name: string, f: Partial<Record<string, string>> = {}) =>
  `### ${name}\n\n` + ["Kind", "Version", "Reason", "Decision", "Source", "Added"].map((k) => `- ${k}: ${f[k] ?? { Kind: "runtime", Version: "1.3", Reason: "Fast scripts", Decision: "ADR-002", Source: "package.json", Added: "2026-11-24" }[k]}`).join("\n") + "\n";
const principle = (id: string, title: string, f: Partial<Record<string, string>> = {}) =>
  `### ${id} ${title}\n\n` + ["Rule", "Applies to", "Check", "Decision", "Source", "Added"].map((k) => `- ${k}: ${f[k] ?? { Rule: "Scripts are TypeScript.", "Applies to": "scripts/**", Check: "`bun test`", Decision: "none", Source: "AGENTS.md Repository conventions", Added: "2026-11-24" }[k]}`).join("\n") + "\n";
const engineering = (technology: string[], principles: string[], removed: string[] = []) =>
  () => `# Engineering\n\n## Technology\n\n${technology.join("\n")}\n## Principles\n\n${principles.join("\n")}\n## Removed\n${removed.length ? "\n" + removed.join("\n") + "\n" : ""}`;
const engRules = async (file: () => string) => (await lint({ root: repo({ "ENGINEERING.md": file }), pmRoot: "planning/", noExport: true })).filter((f) => f.rule.startsWith("engineering/") || f.rule === "title/length");
```

Tests (one `it` each):

- `accepts a valid file`: `engineering([tech("Bun"), tech("Zod", { Kind: "library", Decision: "none" })], [principle("EP-001", "TypeScript for every script"), principle("EP-002", "Reviewed docs", { Check: "review" })], ["- 2026-11-24 Jest. Reason: replaced by bun test."])` -> `[]`.
- `accepts a CRLF file`: same text with `\n` -> `\r\n` -> `[]`.
- `checks sections`: a file with `## Principles` before `## Technology` and no `## Removed` -> rules contain `engineering/sections`.
- `checks technology blocks`: `### Bun` and `### bun` -> `engineering/technology`; a block missing `Reason` -> `engineering/technology`; fields out of order -> `engineering/technology`.
- `checks principle blocks`: heading `### Use TypeScript` (no ID) -> `engineering/principle`; `EP-1` -> `engineering/principle`; 9-word title -> `title/length`.
- `checks values`: `Check: bun test` -> `engineering/values`; `Decision: ADR-009` -> `engineering/values`; `Decision: ADR-002, ADR-001` -> `engineering/values`; `Source:` (empty) -> `engineering/values`; `Added: today` -> `engineering/values`.
- `warns on a superseded decision`: `tech("Bun", { Decision: "ADR-001" })` -> exactly one finding, rule `engineering/decision-current`, severity `warning`.
- `checks principle IDs across Principles and Removed`: `principle("EP-001", ...)` plus removed `- 2026-11-20 EP-001 Old rule. Reason: dropped.` -> `engineering/id-unique`.
- `checks removed lines`: `- Jest removed` -> `engineering/removed`.
- `checks and fixes order`: technology `Zod` before `Bun`, principles `EP-002` before `EP-001`, removed `2026-11-01` before `2026-11-20` -> `engineering/order`; then `fixStructure("ENGINEERING.md", text)` re-linted -> no `engineering/order`, and the fixed text has `### Bun` before `### Zod`.
- `passes for the empty template`: covered by the existing `passes for a fresh pm-init install` once Task 2 adds the template; here, `engineering([], [])` -> `[]`.

Also extend the `rules.md` catalogue test only if it enumerates groups by name (it compares `RULES` with `rules.md`, so Step 3's edits keep it green).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun test skills/pm-lint/scripts/lint.test.ts -t "engineering"`
Expected: FAIL (no `engineering/` findings; `ENGINEERING.md` is linted as plain Markdown).

- [ ] **Step 3: Implement**

- `structure.ts`: add `"engineering"` to `Kind`, `"ENGINEERING.md": "engineering"` to `TOP_FILES`, `KEYS.technology` and `KEYS.principle`, `FILE_KEYS.engineering = [...KEYS.technology, ...KEYS.principle]`, `engineering: checkEngineering` in the checkers map.
- `engineeringBlocks` parses `###` blocks like `riskBlocks`, matching `/^(EP-\d{3,})\s+(.+)$/`.
- `checkEngineering(doc, add, context)`:
  - `requireSections(doc, add, "engineering/sections", [["Technology", /^Technology/i], ["Principles", /^Principles/i], ["Removed", /^Removed/i]], true)`.
  - Technology: `checkBlockFields(list, KEYS.technology, add, heading, "engineering/technology")`; duplicate names compared lowercased.
  - Principles: no ID -> `engineering/principle` and skip; `checkBlockFields(..., KEYS.principle, ..., "engineering/principle")`; title over 8 words -> `title/length`.
  - Values (both kinds): `Check` matches `` /^`[^`]+`$|^review$/ ``; `Decision` is `none` or matches `/^ADR-\d{3,}$/` and is in `context.adrs`; `Source` non-empty; `Added` passes `isDate`.
  - `engineering/decision-current`: `Decision`'s ADR status starts with `superseded` or is `deprecated`; message names the successor when the status is `superseded by ADR-NNN`.
  - `engineering/id-unique`: EP IDs from principle headings and from Removed lines (`/^\d{4}-\d{2}-\d{2} (EP-\d{3,})\b/`).
  - `engineering/removed`: each Removed bullet matches `/^\d{4}-\d{2}-\d{2} .+\. Reason: .+\.$/`.
  - `engineering/order`: technology by `localeCompare` of the lowercased name, principles by `idNumber`, Removed newest first.
- `fixStructure`: for `kind === "engineering"`, reorder Technology and Principles blocks (as the Open risks reorder, bottom section first so line numbers stay valid) and `sortByDate` the Removed section.
- `rules.ts`: the 8 rules, `engineering/order` fixable, `engineering/decision-current` severity `warning`, the rest `error`; texts as the spec's table.
- `rules.md`: Scope row `| \`ENGINEERING.md\` | **Engineering file** (Shared definitions) | format, fields, engineering |` after `RISKS.md`; the`### engineering` table copied from the spec.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: PASS, including the `rules.md` catalogue test.

- [ ] **Step 5: Commit**

```bash
git add skills/pm-lint
git commit -m "feat(pm-lint): engineering file schema and rules (R-034)"
```

### Task 2: pm-init template

**Files:**

- Create: `skills/pm-init/templates/ENGINEERING.md`
- Modify: `skills/pm-init/SKILL.md:36-47` (file table row after `RISKS.md`), `:148` (the `Created:` line)
- Test: existing `passes for a fresh pm-init install` in `lint.test.ts`; add `it("writes ENGINEERING.md on a fresh install")` asserting `existsSync(join(initRoot(), "planning", "ENGINEERING.md"))` (add `existsSync` to the `node:fs` import).

- [ ] **Step 1: Write the failing test** (the `existsSync` assertion above).
- [ ] **Step 2: Run** `bun test skills/pm-lint/scripts/lint.test.ts -t "fresh"` — Expected: FAIL on the new test.
- [ ] **Step 3: Write the template**: `# Engineering`, an HTML comment in the `RISKS.md` template's style stating "Written only by pm-engineering. A missing file is empty. Reasons beyond one line live in ADRs (Decision). Principle IDs are EP-NNN and never reused, including removed ones.", both block formats from Global Constraints, then the three empty `##` sections. Add the `ENGINEERING.md` row (destination `<PM root>/ENGINEERING.md`) and `ENGINEERING.md` to the `Created:` line after `RISKS.md`.
- [ ] **Step 4: Run** `bun test skills/pm-lint/scripts/lint.test.ts` and `just validate` — Expected: PASS (validate checks template placeholders).
- [ ] **Step 5: Commit**: `git add skills/pm-init skills/pm-lint/scripts/lint.test.ts` then `git commit -m "feat(pm-init): engineering file template (R-034)"`.

### Task 3: Managed section

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md`
- Modify: `AGENTS.md` (the installed section between the markers, kept equal to the reference minus `version=`)

**Interfaces:**

- Produces: the names Task 4's skill cites: **Engineering file**, **Principle IDs**, the `pm-engineering` table row.

- [ ] **Step 1: Edit the reference**, each item from the spec's "Shared definitions" section:
  - after the **ADR** entries: **Engineering file** (format block from Global Constraints; written only by `pm-engineering`; reasons beyond one line in an ADR) and **Principle IDs** (`EP-NNN`, highest in Principles and Removed plus 1, never reused);
  - **Optional files**: `ENGINEERING.md` may be missing in projects initialised before version 21;
  - **Named reference**: add `EP-NNN <title>` for a principle; a technology is named by its name;
  - **Reference legend**: a principle's title, `Check`, and `Applies to`;
  - skills table row after `pm-adr`: `| \`pm-engineering\` | Show, add, change, or remove one technology or principle in the engineering file | User asks (view only during a workflow) |`;
  - Non-interruption rule 3 read-only exceptions: add `pm-engineering` in `view` mode;
  - upgrade notes: one `Version 21 also adds` paragraph after the last one: the engineering file and `pm-engineering`; a missing file is empty; `pm-lint` checks it; no setting is added.
- [ ] **Step 2: Install the section here**: replace the text between `<!-- pm-skills:start -->` and `<!-- pm-skills:end -->` in `AGENTS.md` with the reference body (marker without `version=`).
- [ ] **Step 3: Run** `just validate` — Expected: FAIL only on `pm-engineering` missing from the README, `pm-setup`, and `pm-help` (Task 4), or on the skill folder missing; no managed-section drift error.
- [ ] **Step 4: Commit**: `git add skills/pm-setup/references/AGENTS-section.md AGENTS.md` then `git commit -m "feat(pm-setup): engineering file in the managed rules (R-034)"`.

### Task 4: The pm-engineering skill and its table rows

**Files:**

- Create: `skills/pm-engineering/SKILL.md`
- Modify: `README.md` (skills table, after `pm-adr`), `skills/pm-setup/SKILL.md:68-72` (inventory list), `skills/pm-help/SKILL.md` (skill guide row after `pm-adr`)

**Interfaces:**

- Consumes: Task 3's definitions by name; Task 1's rule IDs for the output Note.

- [ ] **Step 1: Run** `just validate` — Expected: FAIL (`pm-engineering` tables).
- [ ] **Step 2: Write `SKILL.md`** in `skills/pm-risk/SKILL.md`'s structure: frontmatter (`name: pm-engineering`; description starting "Use when the user asks to show, add, change, or remove the project's technology or engineering principles ..."), the follow-the-rules paragraph, Modes table, Guard, Steps, Output templates (one for writes, one for `view`). Behaviour exactly as the spec's "The skill" section, plus:
  - New principle ID: Task 3's **Principle IDs** rule.
  - `add`/`change` refuse a `Decision` ADR that is superseded or deprecated: `ADR-NNN <title> (<status>) is superseded by ADR-MMM <title>. Use it instead?` as a choice question.
  - Technology blocks are inserted alphabetically, principles by ID, Removed newest first.
  - Every write runs one PM commit with `docs(pm): <add|change|remove> <name or EP-NNN> engineering`.
- [ ] **Step 3: Add the rows**: README `| [\`pm-engineering\`](skills/pm-engineering/SKILL.md) | Show, add, change, or remove the technology and engineering principles | User asks (view mid-task) |`;`pm-engineering` in the `pm-setup` inventory list after `pm-adr`;`pm-help` row: purpose, triggers `"we use zod"`,`"show the principles"`,`"remove Jest"`, writes`ENGINEERING.md`.
- [ ] **Step 4: Run** `just validate` and `bunx markdownlint-cli2 skills/pm-engineering/SKILL.md README.md skills/pm-help/SKILL.md skills/pm-setup/SKILL.md` — Expected: PASS.
- [ ] **Step 5: Commit**: `git add skills/pm-engineering README.md skills/pm-setup/SKILL.md skills/pm-help/SKILL.md` then `git commit -m "feat(pm-engineering): engineering file skill (R-034)"`.

### Task 5: Rehearsal, version, full check

- [ ] **Step 1: Rehearse `add`** in a scratch directory outside the repository: copy `skills/pm-init/templates/*` into `<scratch>/planning/` (the `-README.md` files into their folders, as `initRoot` does), add `planning/decisions/ADR-001-use-bun.md` in the ADR format, then follow `pm-engineering add technology Bun` (`Decision: ADR-001`, `Source: package.json`) and `add principle TypeScript for every script` (`Check: review`, `Source: user (2026-11-24)`) by the skill's steps, writing the blocks by hand as the skill specifies.
- [ ] **Step 2: Run** `bun skills/pm-lint/scripts/lint.ts check --root <scratch> --pm-root planning/` — Expected: `pm-lint: clean`. Paste the two blocks and the output into the final report.
- [ ] **Step 3: Bump**: `just bump prerelease` — Expected: `package.json` `21.0.0-pre.9`.
- [ ] **Step 4: Run** `just lint-check` and `just version-check` — Expected: PASS.
- [ ] **Step 5: Commit**: `git add package.json` then `git commit -m "chore: bump version to 21.0.0-pre.9 (R-034)"`.
