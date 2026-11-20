# R-026 pm-checkpoint keeps every item field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** an item's `Note` (and every other roadmap field) survives `pm-next` claim, `pm-checkpoint` `switch`, and `push` then `pop`.

**Architecture:** `Note` becomes an optional `NOW.md` field after `Revisits` and an optional stack-entry field; `pm-lint` accepts it; the skills that write `NOW.md`, the stack, or the roadmap block from `NOW.md` carry it. A test ties the carried field list to `KEYS.item` and to the `push` template.

**Tech Stack:** Markdown skills, Bun + TypeScript (`bun:test`) for `pm-lint`.

**Spec:** `docs/superpowers/specs/2026-11-20-checkpoint-keeps-item-fields-design.md`

## Global Constraints

- `NOW.md` field order: `Status, Item, Session, Stage, Brief, Milestone, Serves, Owner, Size, Depends on, Revisits, Note, Spec, Plan, Started`; `Note` is optional and written only when the item has one.
- Stack entry: `Note` after `Revisits`, optional.
- No export change: `schemaVersion` stays 4; `skills/pm-export/` and `docs-site/` are untouched.
- `done` is unchanged.
- A skills change: rules major 21 → 22, with a `Version 22` upgrade note.
- `rules.ts` and `rules.md` rule text change together (`lint.test.ts` compares them).
- Commits follow commitlint (`fix(pm-checkpoint): ...`, `test(pm-lint): ...`, `chore(release): ...`).

## Review Focus

- An item with no `Note`: `pm-next` must not write an empty `- Note:` line; the rules-20 shape stays valid (Task 1 test `accepts NOW.md with or without the item fields` keeps passing).
- `Note` on an idle `NOW.md` must be reported by `now/idle` (Task 1 test).
- `Note` out of position (before `Revisits`) fails `now/fields` (Task 1 test).
- A stack entry written by rules 21 (no `Note`) and by rules 19 (no item fields) still lints clean (Task 1 test).
- A held `pm-next` note appended to an existing `Note` keeps the original text verbatim (Task 2 wording: `<existing> <YYYY-MM-DD>: <held note>`).

---

### Task 1: pm-lint accepts `Note` in NOW.md and stack entries

**Files:**

- Modify: `skills/pm-lint/scripts/structure.ts:56-65` (`KEYS.now`, `KEYS.stack`), `:113-115` (shapes), `checkNow` `:486-491`
- Modify: `skills/pm-lint/scripts/rules.ts:63`, `skills/pm-lint/references/rules.md:132`
- Modify: `skills/pm-init/templates/NOW.md` comment (lines 12-13)
- Test: `skills/pm-lint/scripts/lint.test.ts` (`describe("structure rules")`, next to `accepts NOW.md with or without the item fields`)

**Interfaces:**

- Produces: `KEYS.now` includes `"Note"` after `"Revisits"`; `KEYS.stack` includes `"Note"` after `"Revisits"`. `now/fields` accepts exactly three key sequences: `KEYS.now`, `KEYS.now` without `Note`, and `NOW_LEGACY_FIELDS` (no item fields, no `Note`).

- [x] **Step 1: Write the failing tests** in `lint.test.ts`:
  - `it("accepts a Note after Revisits in NOW.md")`: `repo({ "NOW.md": t => t.replace("- Revisits:\n", "- Revisits:\n- Note: Started as is: only item in Next.\n") })` → rules (minus `roadmap/later-order`) equal `[]`.
  - `it("rejects a Note out of place in NOW.md")`: insert `- Note: x\n` before `- Serves: V1` → rules contain `now/fields`.
  - `it("reports a Note on an idle NOW.md")`: use the existing `idle` helper's output plus `- Note: x` in the field list → rules contain `now/idle`.
  - `it("accepts stack entries with and without Note")`: add `STACK.md` with two entries in the `pm-checkpoint` push format, one with `- Note: kept` after `- Revisits:`, one with none of the six item fields → no `stack/*` or `fields/unknown` findings.

- [x] **Step 2: Run** `bun test skills/pm-lint/scripts/lint.test.ts` — expected: the Note-accepting tests FAIL (`now/fields`, `fields/unknown`).

- [x] **Step 3: Implement.** Add `"Note"` to `KEYS.now` and `KEYS.stack` after `"Revisits"`. Define `NOW_NOTE = "Note"`, keep `NOW_ITEM_FIELDS` as the five, `NOW_LEGACY_FIELDS = KEYS.now` minus the five and `Note`, and accept the three sequences in `checkNow`. Update the `now/fields` message and the rule text in `rules.ts` and `rules.md` identically: `NOW.md lists Status, Item, Session, Stage, Brief, Milestone, Spec, Plan, and Started, in that order, optionally with Serves, Owner, Size, Depends on, and Revisits after Milestone, and then an optional Note.` In the `pm-init` `NOW.md` comment add: `Note: optional; the claimed item's Note, written only when it has one.`

- [x] **Step 4: Run** `bun test skills/pm-lint/scripts/lint.test.ts` — expected: PASS (including the catalogue/`rules.md` and fresh-`pm-init` tests).

- [x] **Step 5: Commit** `fix(pm-lint): accept the item Note in NOW.md and stack entries (R-026)`.

### Task 2: the skills carry `Note`, and the field list is tested

**Files:**

- Modify: `skills/pm-next/SKILL.md` steps 3, 7, 8
- Modify: `skills/pm-checkpoint/SKILL.md` steps 6 (switch), 7 (push template and group paragraph), 8 (pop)
- Modify: `skills/pm-rejoin/SKILL.md` step 3 (`:132-141`), `skills/pm-revise/SKILL.md` rewind keep-list (`:111-113`)
- Test: `skills/pm-lint/scripts/lint.test.ts` (new `describe("item fields ride NOW.md and the stack")`)

**Interfaces:**

- Consumes: `KEYS` from `./structure.ts` (Task 1).

- [x] **Step 1: Write the failing test** `it("carries every roadmap item field through NOW.md and the push template")`:
  - `carried = KEYS.item.filter(k => !["Status", "Paused checkpoint"].includes(k))`.
  - Every `carried` key except `"Done when"` is in `KEYS.now`; every `carried` key is in `KEYS.stack`.
  - Read `skills/pm-checkpoint/SKILL.md`; take the fenced block that starts with `### <ID> <Title>` in step 7; its `- <Key>:` keys contain every `carried` key, and `Note` follows `Revisits`.

- [x] **Step 2: Run** `bun test skills/pm-lint/scripts/lint.test.ts` — expected: FAIL, `Note` missing from the push template.

- [x] **Step 3: Edit `pm-checkpoint`.**
  - Step 7 template: add `- Note: <Note in NOW.md>` after `Revisits`. Replace the group paragraph's `now/fields` citation: copy the five as a group so `pop` restores a `NOW.md` that `now/fields` accepts. Copy `Note` when `NOW.md` has it; omit it otherwise.
  - Step 8 (pop): restore `Note` when the entry has it; add the sentence `These fields land after Milestone and before Spec, with Note after Revisits, matching pm-next step 7.`
  - Step 6 (switch): add `Note` to the kept list. Add: when `NOW.md` lacks `Serves`, `Owner`, or `Size`, recover them as `pm-setup` Step 5 item 5 does (the item block from `git show <claim commit>^:<PM root>/ROADMAP.md`, `Owner` `agent` and `Depends on` `none` by default), and ask one choice question per still-missing required value (`Serves`, `Size`) before writing the roadmap block, so `roadmap/item` passes.

- [x] **Step 4: Edit `pm-next`.** Step 7 writes `Note` (from the item) after `Revisits`, only when the item has one. Steps 3 and 5 hold their `Note:`, and step 7 writes it as the `Note`. When the item already has one, the held note is appended as `<existing> <YYYY-MM-DD>: <held note>`. Step 8 drops "apply the writes held from steps 3 to 5" for the `Note:` (split items still apply).

- [x] **Step 5: Edit `pm-rejoin` step 3** (write `Note` from the item, when it has one, after `Revisits`) and the **`pm-revise` rewind keep-list** (add `Note`).

- [x] **Step 6: Run** `bun test skills/pm-lint/scripts/lint.test.ts` and `bunx markdownlint-cli2 skills/pm-next/SKILL.md skills/pm-checkpoint/SKILL.md skills/pm-rejoin/SKILL.md skills/pm-revise/SKILL.md` — expected: PASS, 0 errors.

- [x] **Step 7: Commit** `fix(pm-checkpoint): keep the item Note through claim, switch, and pop (R-026)`.

### Task 3: rules 22

**Files:**

- Modify (by script): `package.json`, `skills/pm-setup/references/AGENTS-section.md` marker, `skills/pm-init/templates/config.md`
- Modify: `skills/pm-setup/references/AGENTS-section.md` upgrade notes; `AGENTS.md` managed section; `planning/config.md` `Rules version`

- [x] **Step 1: Run** `just bump major` — expected: `package.json` `22.0.0`, marker `version=22`.
- [x] **Step 2:** In `AGENTS-section.md`, after the `Version 21` note, add: `Version 22 carries the claimed item's Note: pm-next writes it to NOW.md after Revisits, pm-checkpoint push and pop carry it through STACK.md, and switch writes it back to ROADMAP.md. switch recovers missing item fields from the claim commit before it writes the roadmap block. The export stays at schemaVersion 4. No setting is added.` In the `Shared definitions` stack-entry definition, add `note` to the held fields list (`... depends on, revisits, and note ...`).
- [x] **Step 3:** Install the section as `pm-setup` would: replace the text between the markers in `AGENTS.md` with the reference minus `version=22`, and set `- Rules version: 22` in `planning/config.md`.
- [x] **Step 4: Run** `just lint-check` and `just version-check` — expected: both pass.
- [x] **Step 5: Commit** `chore(release): rules 22 for the item Note (R-026)`, without `planning/`: the `Rules version` line is PM state, and the next PM commit (`pm-checkpoint` `done`) carries it, as after `pm-setup`.
