---
name: pm-lint
description: Use when the user asks to lint, validate, check, or fix the formatting or structure of the PM files (planning/ Markdown, the roadmap, log, risks, inbox, briefs, or planning.json), asks for the PM format rules, or wants a pre-commit hook (lefthook, husky, or a git hook) that checks them. Checks every PM file against the Markdown formatting and per-file schema rules in references/rules.md with a bundled Bun script, fixes what can be fixed without changing meaning, and prints hook configuration.
---

# pm-lint

Keep every file in the PM root in the one format the `pm-*` skills write:
the Markdown formatting, each file's fields, sections, and values, the
references between files, and the export's schema. The rules are in
`references/rules.md` in this skill's folder; `scripts/lint.ts` runs them.

Follow the Non-interruption rules, Shared definitions, Committing PM state,
Asking the user, and Communication contract in the pm-skills section of the
agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM
state directory` setting (default `planning/`).

## Modes

| Mode | Kind | When | Effect |
| --- | --- | --- | --- |
| `check [<path>...]` | Read-only | Default: "lint the plan", "are the PM files valid?", or during a workflow | Report every finding; write nothing |
| `fix [<path>...]` | PM | "fix the PM formatting", or `check` reported fixable findings | Apply the fixable rules; one PM commit |
| `rules` | Read-only | "what are the PM format rules?" | List the rules |
| `hook [lefthook \| husky \| git]` | Read-only | "add a pre-commit hook", "check the plan before each commit" | Print the hook configuration for the user to add |

Every PM commit also runs `fix` and then `check` on the files it commits
(rules: Committing PM state). That run is part of the skill that commits.

## Script

`scripts/lint.ts` needs Bun (`bun --version`). It reads the PM root from
the agent instructions file, or `--pm-root`.

| Command | Effect |
| --- | --- |
| `bun <skill>/scripts/lint.ts check [<path>...] [--root <dir>]` | Read-only. One line per finding (`<file>:<line>  <severity>  <rule>  <message>`), then a summary. Exits 1 on an error, 0 otherwise |
| `bun <skill>/scripts/lint.ts check --staged` | As `check`, for the staged PM files, read from the git index. Exits 0 when none is staged. The form a pre-commit hook runs |
| `bun <skill>/scripts/lint.ts check --format json` | The findings as JSON: `[{file, line, severity, rule, message, fixable}]` |
| `bun <skill>/scripts/lint.ts check --strict` | Warnings fail too |
| `bun <skill>/scripts/lint.ts fix [<path>...] [--staged]` | Apply the fixable rules in place (`fixed: <path>`), then check |
| `bun <skill>/scripts/lint.ts rules` | List every rule with its severity and whether `fix` repairs it |
| `bun <skill>/scripts/lint.ts hook <lefthook \| husky \| git>` | Print the pre-commit configuration with this script's path |

Paths outside the PM root are ignored, so a hook may pass every staged
file. `--no-export` skips the export rules; they also skip themselves when
`pm-export` is not installed beside this skill.

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If `bun --version` fails: reply `Bun is required: https://bun.sh.` Then,
  for `check`, review the files by hand against `references/rules.md`
  and report what you find with `Checked by hand: Bun is not installed.`
- `check`, `rules`, and `hook` are read-only and may run during a workflow
  (Non-interruption rule 3). `fix` writes PM state: during an active
  workflow apply Non-interruption rule 4.
- **Fix only what a rule marks `Fix: yes`.** Never edit a value, add or
  remove a field, move an item between sections, or delete a line to make
  a finding go away. A finding that is not fixable is corrected by the
  skill that owns the file (table below), with the user.
- When `NOW.md` belongs to another session (Non-interruption rule 7), `fix`
  leaves it alone: pass every other path.
- Never write a hook file. Hook configuration (`lefthook.yml`, `.husky/`,
  `.git/hooks/`) is outside the PM root (Non-interruption rule 6): `hook`
  prints it for the user, or for a workflow step that edits the repository.

## Owners of unfixable findings

| Rule group | Fix it with |
| --- | --- |
| `config/*` | `pm-setup` (missing settings), or the user (a value they chose) |
| `vision/*`, `strategy/*` | `pm-strategy` |
| `now/*` | `pm-rejoin` (locate, then repair), or `pm-checkpoint` |
| `roadmap/*` | `pm-item edit <ID>`, `pm-roadmap` (order), `pm-review` |
| `log/*` | `pm-item` (an item's Done line); the user for an older line |
| `risks/*` | `pm-risk update <RK-NNN>` |
| `inbox/*`, `title/length` | `pm-park` (append a note), `pm-review` (triage) |
| `brief/*` | `pm-shape` |
| `stack/*`, `pause/*` | `pm-checkpoint` (`pop`), `pm-pause` |
| `export/*` | The rule group named in the message, then `pm-export` |
| `format/*`, `fields/*` | `pm-lint fix` for the fixable ones; the owning skill otherwise |

## Steps (check)

1. Run `bun <skill>/scripts/lint.ts check --format json`, with the paths
   the user named, if any.
2. Group the findings by file. For each file, list each error and warning
   as `<line> <rule> <message>`, with the owner from the table above.
3. When any finding is fixable and no workflow is active, ask one choice
   question: `Fix the <n> fixable findings?` with `Fix them (recommended)`
   (run `fix`) and `Leave them`. During a workflow, report and resume the
   step in progress.

## Steps (fix)

1. Run `bun <skill>/scripts/lint.ts fix`, with the paths the user named, if
   any. It prints `fixed: <path>` per file it changed, then the remaining
   findings.
2. **Commit** the PM state (rules: Committing PM state) with
   `docs(pm): lint <n> PM files`. Nothing changed means no commit.
3. Show the output, with the remaining findings and their owners.

## Steps (rules)

1. Run `bun <skill>/scripts/lint.ts rules`, or read the tables in
   `references/rules.md` when the user asks about one group.
2. Print the rules asked for. Write nothing.

## Steps (hook)

1. Detect the hook manager: `lefthook.yml`, `.lefthook.yml`, or
   `.config/lefthook.yml` is lefthook; `.husky/` is husky; otherwise plain
   git. With more than one, or when the user names one, use theirs.
2. Run `bun <skill>/scripts/lint.ts hook <manager>` from the repository
   root and print its output in a fenced block, with the file it goes in.
   When the script prints that the skill is installed outside the
   repository, keep that note: the path works on this machine only.
3. Write nothing. The `Note` says which file to edit and that `check
   --staged` exits 0 for a commit that stages no PM file.

## Output (check, fix)

```markdown
## PM lint <YYYY-MM-DD>

- Files: <n> checked, <n> fixed
- Findings: <n> errors, <n> warnings (<n> fixable)
- PM state: <commit result | unchanged>

## Findings

| File | Line | Rule | Finding | Fix with |
| --- | --- | --- | --- | --- |
| <path> | <n> | <rule> | <message> | <pm-lint fix or owner> |

## Do this next

1. <one action>
   - Start with: <skill or command>
   - Done when: `bun <skill>/scripts/lint.ts check` prints `pm-lint: clean`
```

Omit `## Findings` when there are none.

## Output (rules, hook)

```markdown
## PM lint <rules | hook for <manager>>

<the script's output, in a fenced block>

## Note

- <the file the hook configuration goes in, or the rules file path>
```
