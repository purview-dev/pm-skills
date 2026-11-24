# Engineering file and pm-engineering skill (R-034)

- Item: R-034 Engineering file and pm-engineering skill (slice 1 of 4)
- Serves: V5, Milestone M4 Recorded technical decisions
- Brief: `planning/briefs/2026-11-20-technology-and-engineering-principles.md`
- ADRs: writes ADR-009 Engineering file records state, ADRs reasons (proposed); follows ADR-001 ADRs live in the PM root
- Branch: `feat/r-034-engineering-file-and-pm-engineering-skill`

## Intent

A repository's adopted technology and its engineering principles are decided once and then lost, so agents build items that break them. This slice gives them a home in PM state, `<PM root>/ENGINEERING.md`, and an owner, `pm-engineering`. Later slices fill it by inference (R-035), cite it in plans and check it at done (R-036), and export and show it (R-037).

## Done when

`pm-engineering add` writes a linted entry to `planning/ENGINEERING.md` (`## Technology` and `## Principles`, each entry citing its `Source`), and the skill is listed in the README, managed-section, `pm-setup`, and `pm-help` tables with `just validate` and `just test` passing.

## Goals

- A fixed file format, defined once in the managed section's Shared definitions and enforced by `pm-lint`.
- `pm-engineering` with `view`, `add`, `change`, and `remove`.
- `pm-init` writes the empty file on a fresh install; a missing file is empty everywhere else.

## Non-goals (later slices)

- `infer` from manifests, config, agent files, or code (R-035).
- `pm-init` filling entries from its stack question, and `pm-setup` offering inference on upgrade (R-035).
- Plan-handoff citation, the done check that runs `Check` commands, and the `pm-purview` handoff to `add` (R-036).
- `planning.json` field and the docs-site Engineering view (R-037; it needs `schemaVersion` 6 or later, because 5 is taken by `adrs`).

## Anti-goals

- A second record of why a technology was chosen. The reason beyond one line lives in an ADR (ADR-009).
- A new mid-workflow write. Technology chosen during design is recorded with `pm-adr new` and reaches this file later.
- Any value read from config or env files (names and versions only).

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Model on `pm-risk` and `RISKS.md`: Shared definition, `pm-init` template, a new `engineering` kind in `structure.ts`, rules and tests, the skill | Some code mirrors the risks checks | Chosen: proven shape, smallest change |
| A generic register engine shared with `RISKS.md` | Rewrites working, tested code for one new file | Rejected |
| Free-text file, no schema | No lint; R-036's done check has no structured `Check` to read | Rejected |

On the ADR relationship the user chose: the file records current state and points to ADRs (ADR-009). Rejected: entries carry their own full reasons; principles only, with technology in ADRs alone.

## File format

`<PM root>/ENGINEERING.md`, written only by `pm-engineering`. Sections in this order: `## Technology`, `## Principles`, `## Removed`.

```markdown
# Engineering

## Technology

### Bun

- Kind: runtime | framework | library | tool | service
- Version: <version or range | none>
- Reason: <one line>
- Decision: <ADR-NNN | none>
- Source: <file and heading, URL, or user (<YYYY-MM-DD>)>
- Added: <YYYY-MM-DD>

## Principles

### EP-001 TypeScript for every script

- Rule: <one or two sentences>
- Applies to: <comma-separated globs | all>
- Check: `<command>` | review
- Decision: <ADR-NNN | none>
- Source: <file and heading, URL, or user (<YYYY-MM-DD>)>
- Added: <YYYY-MM-DD>

## Removed

- <YYYY-MM-DD> <Name | EP-NNN title>. Reason: <reason>.
```

- **Technology** blocks are keyed by name, unique case-insensitively within the section, ordered alphabetically. The name is the identity; renaming is `remove` plus `add`.
- **Principle IDs:** `EP-NNN` (at least 3 digits), separate from the other ID kinds. A new ID is the highest `EP` number in `## Principles` and `## Removed`, plus 1. Never reused. Principles are ordered by ID.
- `Kind` is free text; the list is the suggested set (like ADR `Category`).
- `Source` is required on every entry and is never empty; `user (<date>)` means the user stated it.
- `## Removed` is newest first.

## Shared definitions (managed section)

Add to `skills/pm-setup/references/AGENTS-section.md`, after the ADR entries:

- **Engineering file** (the format above, written only by `pm-engineering`).
- **Principle IDs** (`EP-NNN`).
- **Optional files:** `ENGINEERING.md` may be missing in projects initialised before version 21; a missing file is empty.
- A named reference for a principle: `EP-NNN <title>`; a technology is named by its name.
- Skills table row: `pm-engineering` | Show, add, change, or remove one technology or principle in the engineering file | User asks (view only during a workflow).
- Non-interruption rule 3: add `pm-engineering` (`view`) to the read-only exceptions.
- Upgrade notes: append a `Version 21 also adds` paragraph for `ENGINEERING.md` and `pm-engineering`; no setting is added.

Version: `package.json` is `21.0.0-pre.8` and `v21.0.0` is untagged, so this skills change stays on rules 21 with `just bump prerelease` (AGENTS.md, unreleased prerelease line). No marker bump.

## The skill: `skills/pm-engineering/SKILL.md`

Structure follows `pm-risk`: frontmatter, Modes table, Guard, Steps, Output templates.

| Mode | Trigger | Writes |
| --- | --- | --- |
| `view [technology | principles | <name or EP-NNN>]` | "show the engineering file", "what do we use", "show EP-002" | nothing |
| `add technology <name>` / `add principle <title>` | "we use X", "record a principle", "adopted zod" | one block |
| `change <name or EP-NNN> <field> <value>` | "bump Bun to 1.3", "EP-002 applies to src/**" | the named fields |
| `remove <name or EP-NNN> <reason>` | "we dropped Jest" | removes the block, adds one `## Removed` line |

- **Guard:** `add`, `change`, `remove` refuse during an active workflow (Non-interruption rule 4 question); `view` runs any time. Missing PM root: `Run pm-init.` Missing file: `view` reports empty; writes create it from the `pm-init` template.
- **add:** asks only for the fields the words do not give, drafting 2 or 3 answers from the repository (for example `Version` from `package.json`, `Source` as the file it read). Applies Challenge protocol checks 1, 2, and 5 (size S rule); a duplicate name, or a principle that contradicts an accepted ADR or another principle, is a choice question. When `Decision` names an ADR, that ADR must exist. Confirm, then write.
- **change:** shows the one change line (`EP-002 Applies to: all -> src/**`), asks one confirmation, writes. Changing `Decision` to a superseded ADR is refused with the superseding ID named.
- **remove:** confirmation question naming the entry; writes the `## Removed` line.
- Every write ends with one PM commit (Committing PM state), message `docs(pm): <add|change|remove> <name or EP-NNN> engineering`.

## pm-init

- This repository's own `planning/ENGINEERING.md` is not written in this slice (my call; the user had no preference): R-035's `infer` seeds it from `AGENTS.md` and the manifests with proper `Source` citations, so no hand-made copy of the Repository conventions drifts in the meantime.
- New template `skills/pm-init/templates/ENGINEERING.md`: the three headings and an HTML comment with the block formats, like `RISKS.md`.
- `pm-init` writes it with the other files; the file list in its SKILL.md and the lint test's fresh-install check include it.

## pm-lint

- `structure.ts`: `"ENGINEERING.md": "engineering"` in the kind map, `KEYS.technology` and `KEYS.principle`, and `checkEngineering`, reading the ADR IDs from the decisions folder in the context (as ADR links already do).
- Rules, in `rules.md` (Scope row plus an `### engineering` table) and the catalogue in `rules.ts`, each with a test in `lint.test.ts`:

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `engineering/sections` | error | no | `ENGINEERING.md` has `## Technology`, `## Principles`, and `## Removed`, in that order. |
| `engineering/technology` | error | no | A technology is `### <Name>` with Kind, Version, Reason, Decision, Source, and Added, in that order; its name is unique in the section. |
| `engineering/principle` | error | no | A principle is `### EP-NNN <Title>` (title at most 8 words) with Rule, Applies to, Check, Decision, Source, and Added, in that order. |
| `engineering/values` | error | no | Check is a backticked command or `review`; Decision is none or an existing ADR ID; Source is not empty; Added is YYYY-MM-DD. |
| `engineering/id-unique` | error | no | A principle ID appears once across Principles and Removed. |
| `engineering/order` | error | yes | Technology is alphabetical, Principles by ID, Removed newest first. |
| `engineering/removed` | error | no | A removed line is `- YYYY-MM-DD <Name or EP-NNN title>. Reason: <reason>.` |
| `engineering/decision-current` | warning | no | A `Decision` ADR is not superseded or deprecated (the fix is `pm-engineering change`). |

Superseded decisions (my call): `add` and `change` refuse a superseded or deprecated ADR and name its successor. An entry whose ADR is superseded later is a lint **warning**, not an error, so a `pm-adr supersede` commit never fails on a file `pm-adr` does not write. `pm-adr` is unchanged in this slice.

## Verifying the Done when

My call: `add` is not run against this repository's `planning/` during R-034's own execute stage (the guard refuses it, and rule 3 gains no exception). The Done when is verified by a rehearsal in a scratch directory: copy the `pm-init` templates, follow `pm-engineering add technology` and `add principle` by their steps, and run `bun skills/pm-lint/scripts/lint.ts check --root <scratch>` clean. The rehearsal's transcript and lint output go in the plan's final task. `lint.test.ts` pins the same entries.

## Tables and diagnosis

- `README.md` skills table, the managed-section table, the `pm-setup` inventory, and the `pm-help` skill guide (row: purpose, example triggers "we use zod", "show the principles", "remove Jest", writes `ENGINEERING.md`).
- `pm-help` diagnosis: none in this slice. The file is optional and has nothing to infer yet; R-035 adds `ENGINEERING.md missing on an existing repository -> pm-engineering infer`.
- `pm-status` and `pm-export` are unchanged.

## Docs site

Surfaced by R-037 Export and docs-site view (an Engineering view in `packages/pm-docs-site`), which already carries it. Until then the file is not exported, by design: the export reads only the files it names.

## Left to the builder

- Wording of the skill's Output templates, following `pm-risk`.
- Test fixtures for the lint rules (inline strings in `lint.test.ts`, as the risk tests do).
- Whether `scripts/__fixtures__/repo/` gets an `ENGINEERING.md`; it must still lint clean and leave the export test unchanged.
