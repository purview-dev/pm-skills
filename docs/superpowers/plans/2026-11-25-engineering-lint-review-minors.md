# Engineering lint review minors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the nine R-055 review findings in `pm-lint`'s engineering checks, the rule docs, the managed section, and `pm-engineering`.

**Architecture:** Small, local fixes. `rules.md` wording becomes the single source for every rule summary and the drift test asserts exact equality. Lint fixes stay in `skills/pm-lint/scripts/structure.ts`, each pinned by a test in `lint.test.ts`.

**Tech Stack:** TypeScript on Bun (`bun test`), Markdown.

**Spec:** `docs/superpowers/specs/2026-11-25-engineering-lint-review-minors-design.md`

## Global Constraints

- Work on `feat/r-055-engineering-lint-and-skill-review-minors`; create no branch.
- Rules stay version 21; `package.json` moves `21.0.0-pre.11` → `21.0.0-pre.12` with `just bump prerelease`.
- No change to the `ENGINEERING.md` format, no new lint rule, no docs-site change.
- Commit subjects are conventional commits, lower-case subject (`commitlint.config.mts`).
- `just lint-check` passes at the end.

## Review Focus

- A Principles section mixing numbered and unnumbered headings: `pm-lint fix` must sort numbered ones by ID and leave unnumbered ones last, in their original order (Task 2).
- A Technology heading that starts with `EP-NNN`: it is a distinct name from the same title without the prefix (Task 2).
- `Decision: None` / `NONE`: accepted like `none` (Task 2).
- A non-ASCII technology name (`Émile`): sorted with English collation, before `Zod`, on any host (Task 2).
- `pm-lint rules` output: prints the longer `rules.md` wording without breaking its column layout (Task 1, manual check).

---

### Task 1: Rule text has one source

**Files:**

- Modify: `skills/pm-lint/scripts/rules.ts` (header comment, 52 summaries, `title/length`)
- Modify: `skills/pm-lint/references/rules.md` (`engineering/principle`, `title/length` rows)
- Test: `skills/pm-lint/scripts/lint.test.ts` (`describe("rules.md")`, ~line 490)

**Interfaces:**

- Produces: `RULES[i].summary` equals the description cell of that rule's row in `rules.md`, exactly.

- [ ] **Step 1: Write the failing test** — add to `describe("rules.md")`:

```ts
it("states every rule in the same words as rules.md", () => {
  const doc = readFileSync(join(import.meta.dir, "..", "references", "rules.md"), "utf8");
  for (const rule of RULES) {
    const row = doc.split(/\r?\n/).find((line) => line.startsWith(`| \`${rule.id}\` |`));
    const description = row?.split(" | ").slice(3).join(" | ").replace(/ \|$/, "");
    expect({ id: rule.id, text: description }).toEqual({ id: rule.id, text: rule.summary });
  }
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `bun test skills/pm-lint/scripts/lint.test.ts -t "same words"`
Expected: FAIL on the first differing rule (`format/tabs`).

- [ ] **Step 3: Fix the two engineering rows in `rules.md`**
  - `engineering/principle`: remove `(title at most 8 words)`.
  - `title/length`: `An inbox file's, a risk's, or a principle's title is at most 8 words.`

- [ ] **Step 4: Copy every `rules.md` description into its `rules.ts` summary** (52 rules differ, plus the two above). Escape only what a TypeScript string needs. Change the header comment to: `references/rules.md documents the same rules; each summary is that file's description, word for word, and the tests keep the two equal.`

- [ ] **Step 5: Run the tests**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: PASS. Then `bun skills/pm-lint/scripts/lint.ts rules` prints 92 lines.

- [ ] **Step 6: Commit**

```bash
git add skills/pm-lint/scripts/rules.ts skills/pm-lint/references/rules.md skills/pm-lint/scripts/lint.test.ts
git commit -m "fix(pm-lint): state each rule in the words of rules.md (R-055)"
```

### Task 2: Engineering check and fix edge cases (findings 1, 4, 5, 6)

**Files:**

- Modify: `skills/pm-lint/scripts/structure.ts:764-862` (`EngineeringBlock`, `engineeringBlocks`, `techKey`, `checkEngineeringValues`, `checkEngineering`), `:1040-1056` (engineering fix)
- Test: `skills/pm-lint/scripts/lint.test.ts` (`describe("engineering rules")`, helpers `tech`, `principle`, `engineering`, `engRules`, `engFindings`, `fixStructure`)

**Interfaces:**

- Produces: new `EngineeringBlock` field `name: string` (the full heading text after `###`); `techKey(block) = block.name.toLowerCase()`.

- [ ] **Step 1: Write the failing tests** in `describe("engineering rules")`:

```ts
it("fixes principle order with an unnumbered heading present", () => {
  const text = engineering([], [principle("EP-002", "B"), principle("", "Loose rule"), principle("EP-001", "A")]);
  const fixed = fixStructure("ENGINEERING.md", text);
  expect(fixed.indexOf("### EP-001")).toBeLessThan(fixed.indexOf("### EP-002"));
  expect(fixed.indexOf("### EP-002")).toBeLessThan(fixed.indexOf("### Loose rule"));
});
it("keys a technology on its whole heading", async () => {
  expect(await engRules(engineering([tech("Bun"), tech("EP-001 Bun")], []))).not.toContain("engineering/technology");
});
it("accepts Decision none in any case", async () => {
  expect(await engRules(engineering([tech("Bun", { Decision: "None" }), tech("Zod", { Decision: "NONE" })], []))).not.toContain("engineering/values");
});
it("orders technology with English collation", async () => {
  const text = engineering([tech("Zod"), tech("Émile")], []);
  expect(await engRules(text)).toContain("engineering/order");
  const fixed = fixStructure("ENGINEERING.md", text);
  expect(fixed.indexOf("### Émile")).toBeLessThan(fixed.indexOf("### Zod"));
  expect(await engRules(fixed)).not.toContain("engineering/order");
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `bun test skills/pm-lint/scripts/lint.test.ts -t "engineering rules"`
Expected: the four new tests FAIL (the collation test may pass on an `en` host; it must pass after Step 3 regardless).

- [ ] **Step 3: Implement**
  - `engineeringBlocks`: add `name: block.heading!.text` to each block; `techKey` uses `name`; the duplicate message in `checkEngineering` uses `block.name`.
  - `checkEngineeringValues`: treat `Decision` as none when `/^none$/i` matches.
  - Technology order, in the check (`:824`) and the fix (`:1045`): `techKey(a).localeCompare(techKey(b), "en")`.
  - Principles fix comparator (`:1046`): unnumbered blocks after numbered ones; numbered by `idNumber`; ties `0` (stable sort keeps unnumbered order):

```ts
(a, b) => Number(!a.id) - Number(!b.id) || (a.id && b.id ? idNumber(a.id) - idNumber(b.id) : 0)
```

- [ ] **Step 4: Run the tests**

Run: `bun test skills/pm-lint/scripts/lint.test.ts`
Expected: PASS, including the existing `checks and fixes order`.

- [ ] **Step 5: Commit**

```bash
git add skills/pm-lint/scripts/structure.ts skills/pm-lint/scripts/lint.test.ts
git commit -m "fix(pm-lint): engineering order, heading key, and none case (R-055)"
```

### Task 3: Fresh-install test checks pm-init's file table (finding 7)

**Files:**

- Test: `skills/pm-lint/scripts/lint.test.ts:67-69`

- [ ] **Step 1: Extend the test** `writes ENGINEERING.md on a fresh install`:

```ts
const init = readFileSync(join(import.meta.dir, "..", "..", "pm-init", "SKILL.md"), "utf8");
expect(init).toMatch(/^\s*\| `ENGINEERING\.md` \| `<PM root>\/ENGINEERING\.md` \|/m);
```

- [ ] **Step 2: Prove it bites** — temporarily rename the row in `skills/pm-init/SKILL.md:44`, run `bun test skills/pm-lint/scripts/lint.test.ts -t "fresh install"`, expect FAIL, restore the row, expect PASS.

- [ ] **Step 3: Commit**

```bash
git add skills/pm-lint/scripts/lint.test.ts
git commit -m "test(pm-lint): check pm-init's ENGINEERING.md row (R-055)"
```

### Task 4: Challenge protocol names pm-engineering (finding 8)

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md:706-712`
- Modify: `AGENTS.md` (the same sentence in the managed section)
- Modify: `package.json` (via `just bump prerelease`)

- [ ] **Step 1: Edit the sentence** in both files: `...\`pm-risk\` (add, re-rating, and mitigate), \`pm-engineering\` (add and change), and \`pm-docs-site\` (plan).` Re-wrap the paragraph to the existing width; keep the two copies identical.

- [ ] **Step 2: Bump**

Run: `just bump prerelease`
Expected: `package.json` version `21.0.0-pre.12`; the marker stays `version=21`.

- [ ] **Step 3: Validate**

Run: `just validate` then `just version-check`
Expected: both pass (installed section equals the reference; skills change allowed on the unreleased 21 prerelease line).

- [ ] **Step 4: Commit**

```bash
git add skills/pm-setup/references/AGENTS-section.md AGENTS.md package.json
git commit -m "fix(pm-setup): challenge protocol applies in pm-engineering (R-055)"
```

### Task 5: pm-engineering follows the supersede chain (finding 9)

**Files:**

- Modify: `skills/pm-engineering/SKILL.md:58-64` (step 1)

- [ ] **Step 1: Rewrite step 1's supersede sentence** to: follow `superseded by` from ADR to ADR until an ADR that is not superseded (stop and refuse with `ADR-NNN: the superseded by chain loops at ADR-KKK.` when an ID repeats, and `ADR-KKK has no file in <PM root>/decisions/.` when a link is missing). When the last ADR is accepted or proposed, ask `ADR-NNN <title> (<status>) is superseded; the current decision is ADR-MMM <title> (<status>). Use it instead?` with `Use ADR-MMM (recommended)` and `Set Decision: none`. When the last ADR is deprecated, offer the deprecated choices that follow.

- [ ] **Step 2: Lint**

Run: `bunx markdownlint-cli2 skills/pm-engineering/SKILL.md`
Expected: 0 issues.

- [ ] **Step 3: Commit**

```bash
git add skills/pm-engineering/SKILL.md
git commit -m "fix(pm-engineering): follow the whole superseded-by chain (R-055)"
```

### Task 6: Verify Done when

- [ ] **Step 1:** Run `just lint-check`. Expected: pass.
- [ ] **Step 2:** Confirm each finding (1–9) maps to a commit above; none is won't-fix.
