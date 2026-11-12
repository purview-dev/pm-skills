# pm-skills

Project-management skills for a solo developer using AI coding agents.
They sit above a development workflow skill set, such as
[Superpowers](https://github.com/obra/superpowers), and decide **which**
feature is worked on. The workflow skills decide **how** it is built.

The skills are designed for literal, predictable, low-friction output: one
next action, an explicit "done when", and fixed templates.

- **Parking lot:** ideas, bugs, questions, and inspiration are captured in
  one line at any time, even mid-task, by you or the agent, and discussed
  later.
- **Bugs with the facts a fix needs:** `pm-bug` asks for the symptom,
  expected and actual, reproduction, severity, and evidence, checks for a
  duplicate, and routes the defect to a fix or the roadmap.
- **A risk register with RAG status:** `pm-risk` captures a risk in one
  line at any time, even mid-task, then adds, updates, re-rates, reviews,
  closes, or removes it in `planning/RISKS.md`. Each risk's red, amber, or
  green status is derived from its likelihood and impact, with a recorded
  override, and a mitigation can become a roadmap item.
- **Corrections, not pretences:** `pm-revise` handles built work that is not
  what you wanted. It rewinds the active item to an earlier stage, fixes it
  in place, or opens a revision item that revisits the original. It is the
  one PM skill allowed to interrupt an active workflow, and it writes the
  correction down first.
- **Brainstorming with challenge:** `pm-shape` interviews, challenges, and
  maps the ramifications of an idea before it reaches the roadmap.
  `pm-discover` analyses the existing code, history, and usage for
  evidence. Every idea, including the agent's own, is challenged.
- **Strategy, roadmap, and board:** `pm-strategy` sets milestones, bets,
  and focus, and generates the roadmap. `pm-roadmap` renders the full
  milestone roadmap, `pm-board` the task board, `pm-up-next` the ordered
  queue, and `pm-status` the summary and your own queue. Move, add, and
  insert items from the board or roadmap with the shared ordering rules.
  Items are owned by the agent, the user, or both.
- **The plan as data:** `pm-export` writes every roadmap item, board
  column, milestone, bug, brief, risk, and log entry to `planning/planning.json`
  in one fixed shape, with the JSON Schema that describes it, or checks the
  file without writing. The Markdown stays the source of truth.
- **The plan as a site:** `pm-docs-site` plans a local Astro and Starlight
  site that renders `planning.json` as Home, Board, Roadmap, Log, and Risks pages,
  then builds it from shipped templates inside that item's workflow.
  Optional modules add the repository's `docs/` pages, LikeC4 architecture
  views, and an Aspire AppHost resource. It reads the export only.
- **Purview fit:** for .NET projects, `pm-purview` recommends
  [Purview](https://purview.dev/) tools only where they remove real work.
  For an empty project it asks first what you are building and at what
  scale. Non-.NET projects get no suggestions.
- **Memory across sessions and compaction:** every decision is written to
  a file the moment it is made. `pm-resume` restores the state afterwards.
  `pm-rejoin` puts a session back on the lifecycle after the thread is
  lost.
- **Commits without the chore:** the skill that writes the planning files
  commits them, on the branch you plan on; a completion record is committed
  on the item's branch so it rides the item's pull request. The default asks
  first; `config.md` can make it automatic.
- **Questions use the agent's question UI:** choices with a recommended
  option and free text. You are never asked to type `yes` or `a`/`b`/`c`.

## Install

Run this from the root of the target repository:

```bash
npx skills add https://github.com/purview-dev/pm-skills -y
# or
bunx skills add https://github.com/purview-dev/pm-skills -y
```

Skills install at project level by default. Add `-g` for a user-level
install, or `-a claude-code` to target a single agent. See the
[skills CLI](https://github.com/vercel-labs/skills) for all options.

The skills hand design, planning, and execution to a workflow skill set,
by default [Superpowers](https://github.com/obra/superpowers). `pm-setup`
checks that every workflow skill is installed and prints the command when
one is missing:

```bash
npx skills add https://github.com/obra/superpowers -y
# or, in Claude Code
/plugin install superpowers@claude-plugins-official
```

Then, in your agent:

1. `run pm-setup` merges the rules into your existing `AGENTS.md` or
   `CLAUDE.md`, between `<!-- pm-skills:start -->` and
   `<!-- pm-skills:end -->` markers. Nothing outside the markers changes.
2. Commit, using the command `pm-setup` prints.
3. `run pm-init` writes `planning/VISION.md` by default and seeds the
   roadmap. `pm-setup` asks where to store the planning files before its
   other setup questions; choose a different repository-relative directory
   if needed.
4. Not sure what to run? `pm-help` explains every skill, lists what is
   missing in your setup, and recommends the next skill.

## Skills

| Skill | Purpose | When it runs |
| --- | --- | --- |
| [`pm-setup`](skills/pm-setup/SKILL.md) | Merge the rules into the agent file; check the install | User asks |
| [`pm-init`](skills/pm-init/SKILL.md) | Create the PM state directory, write the vision, seed the roadmap | User asks, once per repo |
| [`pm-resume`](skills/pm-resume/SKILL.md) | Where you stopped, the next action, and what is waiting for you | Session start, after compaction |
| [`pm-rejoin`](skills/pm-rejoin/SKILL.md) | Find the real position in the lifecycle and rejoin at the right stage | The thread is lost, or state and work disagree |
| [`pm-next`](skills/pm-next/SKILL.md) | Check, claim, and hand off the next item to design | No active item |
| [`pm-up-next`](skills/pm-up-next/SKILL.md) | Show the ordered queue and the one next action, without claiming | User asks |
| [`pm-park`](skills/pm-park/SKILL.md) | Capture an idea, bug, question, or inspiration in one line | Any time |
| [`pm-bug`](skills/pm-bug/SKILL.md) | Log a defect with the facts a fix needs, and route it | Any time |
| [`pm-risk`](skills/pm-risk/SKILL.md) | Capture a risk in one line; add, update, re-rate (RAG), review, mitigate, close, or remove risks | Any time (capture and view mid-task) |
| [`pm-revise`](skills/pm-revise/SKILL.md) | Correct built work: rewind a stage, fix in place, or open a revision item | Built work is wrong, even mid-workflow |
| [`pm-shape`](skills/pm-shape/SKILL.md) | Brainstorm and challenge one idea into a brief and a decision | No active workflow |
| [`pm-discover`](skills/pm-discover/SKILL.md) | Analyse code, history, and usage for evidence; answer product questions | No active workflow |
| [`pm-strategy`](skills/pm-strategy/SKILL.md) | Milestones, focus, bets, decisions; generate or re-plan the roadmap | User asks |
| [`pm-purview`](skills/pm-purview/SKILL.md) | Recommend [Purview](https://purview.dev/) .NET tools only where they add value | New project, or a matching .NET need |
| [`pm-checkpoint`](skills/pm-checkpoint/SKILL.md) | Save state and decisions, record stage changes, suspend or resume an operation, close finished items on their branch | Session or stage end, before compaction, an emergency pause |
| [`pm-review`](skills/pm-review/SKILL.md) | Triage the inbox, check roadmap health, order Next | Weekly |
| [`pm-item`](skills/pm-item/SKILL.md) | Add, edit, drop, block, move or insert at a position, reassign, or complete one item | User asks |
| [`pm-board`](skills/pm-board/SKILL.md) | Task board; move, add, insert, or close one card | User asks |
| [`pm-roadmap`](skills/pm-roadmap/SKILL.md) | Full roadmap by milestone; move, add, or insert one item | User asks |
| [`pm-status`](skills/pm-status/SKILL.md) | Summary or your queue (read-only) | User asks |
| [`pm-export`](skills/pm-export/SKILL.md) | Write the whole plan as `planning.json` plus its schema, or check them (read-only) | User asks, or a tool needs the plan as JSON |
| [`pm-docs-site`](skills/pm-docs-site/SKILL.md) | Plan, build, extend, upgrade, or check the local site that renders `planning.json` | User asks; builds run inside the site item's workflow |
| [`pm-help`](skills/pm-help/SKILL.md) | Explain each skill, find what is missing, recommend the next skill (read-only) | Any time you are unsure |

## The loop

```text
pm-resume -> pm-next -> [design -> plan -> execute -> finish]
                ^            |            |           |
                |     pm-checkpoint (stage updates)  pm-checkpoint (done, on the branch)
                |                                         |
                +-----------------------------------------+
                                                          |
                                          push branch -> one PR -> CI -> merge
pm-park: any time, capture only.   pm-review: weekly.
pm-risk: capture a risk any time; manage the register when no workflow is active.
pm-checkpoint push/pop: emergency suspension; the operation resumes at its checkpoint.
pm-shape / pm-discover / pm-strategy: think before building, no workflow active.
pm-item / pm-board / pm-roadmap / pm-status / pm-up-next: on request,
when no workflow is active (their read-only views also mid-workflow).
pm-rejoin: any time the position is unclear; it hands back to the stage.
pm-bug: a defect needs the facts a fix needs; it routes to a fix or the roadmap.
pm-revise: built work is wrong; it may interrupt to correct.
pm-export: a tool needs the plan as JSON, or the export needs checking.
pm-docs-site: plan the site as an item; its build modes run in execute.
```

Ideas flow: `pm-park` (or `pm-discover`, or `pm-bug` for a defect) -> inbox
-> `pm-shape` -> brief -> roadmap item -> `pm-next`. A defect can skip the
brief and become an item directly. Strategy flows: `pm-strategy` ->
milestones and focus -> ordered Next -> `pm-board`. Corrections flow:
`pm-revise` -> brief `## Revisions` (open item) or a revision item with
`Revisits` (done item) -> the stage skill. Data flows: `pm-export` writes
`planning/planning.json` from all of the above, and the `pm-docs-site`
site renders it.

## Non-interruption guarantee

The merged rules make an active workflow own the session. During a
workflow, only `pm-park` and `pm-risk` may write, and only to capture, and
`pm-checkpoint` (`push`, `pop`) may write one stack entry to suspend or
resume the operation when you ask; `pm-rejoin` may
report the position, `pm-help` may explain a skill, `pm-export` and
`pm-docs-site` may check without writing, and `pm-status`, `pm-board`, `pm-roadmap`,
`pm-up-next`, and `pm-risk` may show their read-only view when you ask. None of them may
move, add, insert, or close anything mid-workflow. `pm-revise` may
interrupt to correct built work when you say it is wrong: it records the
scope and pauses the item before anything else runs.
Any other PM skill waits until the workflow finishes; the agent asks
whether to run it after the workflow or pause now. PM state
skills write only to the configured planning directory (default
`planning/`), and never touch specs, plans, or code. A completion record is
the one PM write that happens outside the main worktree: the workflow runs
it at the end of the `execute` stage, and it is committed on the item's
branch so it rides the item's pull request, before CI runs.
The other exception is `pm-docs-site`'s build modes: the site is code, so
they run as a step of the site item's `execute` stage, on
its branch, and leave committing to the workflow.
The one git state change they make is the commit of those planning files,
plus the offered switch to the planning branch when the main worktree is on
another one. `pm-setup` edits only the managed section in the selected
agent instructions file, plus the `Rules version` line in `config.md`. Full
rules:
[`skills/pm-setup/references/AGENTS-section.md`](skills/pm-setup/references/AGENTS-section.md).

## Files created by pm-init

The paths below use the default PM root; replace `planning/` with the
directory selected during `pm-setup`.

| File | Holds |
| --- | --- |
| `planning/config.md` | Handoffs to workflow skills, limits, commit policy, rules version, last review date |
| `planning/VISION.md` | v1 outcomes, out of scope, constraints |
| `planning/STRATEGY.md` | Focus, milestones, bets, assumptions, not doing, decisions |
| `planning/NOW.md` | The one active item, its checkpoint, decisions, and context |
| `planning/ROADMAP.md` | Next (ordered, maximum 5) and Later, with owner and dependencies |
| `planning/LOG.md` | Done, Dropped, Reviews |
| `planning/STACK.md` | Suspended operations, newest first, with their checkpoints |
| `planning/RISKS.md` | The risk register: open, closed, and removed risks with likelihood, impact, and RAG |
| `planning/inbox/` | The parking lot: one file per idea |
| `planning/briefs/` | One shaped idea per file: challenges, ramifications, decision |
| `planning/research/` | One `pm-discover` report per run |

Projects initialised before version 4 keep working. The new files are
created on first use; run `pm-strategy` to create `STRATEGY.md`.

`planning/planning.json` and `planning/planning.schema.json` are written by
`pm-export` on first use. They are derived from the files above: never
hand-edit them, and never treat them as the state.

Version 5 adds the `Commits` section to `config.md`. Without it, a PM
commit asks before each commit and treats the main worktree's current
branch as the planning branch. Add the section to choose `always`, `ask`,
or `never`, and to name the branch.

Version 5 also adds the upgrade check. `pm-resume`, `pm-rejoin`, and
`pm-next` compare the installed rules version with the installed skills
version and offer `pm-setup` before any work resumes.

Version 6 moves that version of record out of the agent file: it is
`Rules version` in `planning/config.md`, so a merge, rewrite, or removed
marker in `AGENTS.md` cannot lose it. Installed markers therefore carry no
version, and `pm-setup` migrates an older `version=` marker into
`config.md` the next time it runs. If the section itself is dropped from
the agent file, the recorded version lets `pm-setup` reinstall or re-wrap
it instead of appending a second copy.

Version 7 splits the two views out of `pm-status`. `pm-board` owns the
task board, `pm-roadmap` owns the full milestone roadmap, and `pm-up-next`
shows the ordered queue without claiming anything. `pm-board`, `pm-roadmap`,
and `pm-item` can move, add, and insert items; the shared **Roadmap order
and edits** rules define positions, full-Next demotion, board-column
mapping, and confirmation. The read-only views may answer mid-workflow.
Done lines in `LOG.md` now record a `Milestone:` so roadmap progress can be
counted per milestone.

Version 8 makes every question show what it is about. A question that names
a milestone, item, bet, `V` line, or inbox file prints a
`## For this question` legend above it — each ID with the words needed to
decide it — and carries one escape option, `Explain <ID>`,
`Show the roadmap`, or `Show the board`, which prints the full block or runs
the read-only view and then asks the same question again. Neither the legend
nor the escape option changes state or counts as an answer.

Version 9 adds three skills and a derived state file. `pm-bug` logs a defect with
the facts a fix needs — symptom, expected and actual, reproduction,
severity, and evidence — in an inbox file with `Kind: bug`, then routes it
to a fix, the roadmap, shaping, or the parking lot. `pm-revise` corrects
work that is already built: it rewinds the active item to an earlier stage,
fixes it in place, or opens a revision item whose `Revisits` names the
original. It may interrupt an active workflow to correct it, and it records
the scope and pauses the item first. `pm-export` writes
`planning/planning.json` with `planning/planning.schema.json` in a fixed,
validated shape, or checks them without writing. Seed data comes from the
same files as before; bugs add `Severity`, `Affects`, and a
`## Reproduction` block to the inbox format, and revisions add an optional
`## Revisions` heading to a brief.

Version 10 adds `pm-docs-site` and Non-interruption rule 9. `plan` adds the
site, a module, or a page as a roadmap item; `check` compares an installed
site with the templates and the export, read-only, even mid-workflow; and
`scaffold`, `extend`, and `upgrade` build it inside that item's `execute`
stage. The site reads `planning/planning.json` only. When `pm-export`'s
`schemaVersion` moves, the site's build fails until `pm-docs-site upgrade`
runs, and `pm-help` reports the difference.

Version 11 makes completion ride the branch and adds the operation stack.
`pm-checkpoint` (`done`) writes the Completion record and commits it on the
item's branch, so the item's pull request carries it before CI runs; it is
never closed on the planning branch after the merge, and it never gets a
pull request of its own. When the last open item of a milestone closes, the
skill asks once and records the milestone as done in the same commit.
`pm-checkpoint` (`push`, `pop`) suspends and restores an operation through
`planning/STACK.md`, so an emergency never loses work and the interrupted
operation resumes at its checkpoint. `pm-rejoin` repairs a `merged-unclosed`
item whose completion missed its branch.

Version 12 adds the risk register and `pm-risk`. `planning/RISKS.md` holds
one block per risk with likelihood, impact, RAG, status, owner, trigger,
and mitigation; RAG is derived from likelihood × impact unless an override
records why. `pm-risk capture` may run mid-workflow like `pm-park`: it
writes one risk, replies in one line, and never commits. `pm-export` moves
to `schemaVersion` 3 with a `risks` key, and the docs site gains a Risks
page with a likelihood × impact matrix, a Red risks tile, and a Home list;
run `pm-docs-site upgrade` for an installed site.

## Using a different workflow framework

Edit the Handoffs table in `<PM root>/config.md`. The skills refer to stages
(design, plan, execute, finish), not to Superpowers skill names.

## Upgrading

```bash
npx skills update
```

Then `run pm-setup` again. It replaces only the section between the
markers, which now carry no version, and records the new `Rules version` in
`config.md`; `pm-setup` reports when it is missing. An older marker that
still carries `version=N` is migrated on that run.

You do not have to remember the order. The next `pm-resume`, `pm-rejoin`,
or `pm-next` compares the rules version with the installed skills version
and asks before work resumes; `pm-help` reports the same finding.

## Development

Requires [`bun`](https://bun.sh) and, for the git hooks,
[`lefthook`](https://lefthook.dev/installation) and
[`just`](https://github.com/casey/just).

- `just setup-skills` clears and re-links this repository's `skills/pm-*`
  into `.claude/skills/` and `.agents/skills/`, so the agents working here
  use the skills as they are being edited. `just setup-skills --cli` uses
  `bunx skills add ./ -y` instead, which copies them.
- `just validate` checks skill frontmatter, the README and managed-section
  tables, the `pm-setup` inventory, the section markers, the template
  placeholders, the export schema, the managed section installed in
  `AGENTS.md`, and that `docs-site/` still matches the `pm-docs-site`
  templates.
- `just docs` serves this repository's own project site (its plan from
  `planning/planning.json`, the README, and every skill) at
  <http://localhost:4321>; `just docs-check` tests, type-checks, and builds
  it.
- `just lint-check` runs `just validate` and lints all Markdown.
- `just lint-fix` applies Markdown fixes.
- `just install` verifies the tools and installs the git hooks (commitlint
  on commit, `just lint-check` on push).
- `just bump patch|minor|major` writes the next release version to
  `package.json`.

This repository manages itself with these skills: `planning/` is its live
PM state, and `docs-site/` is the site `pm-docs-site` builds from it.

CI runs the same checks on every push and pull request to `main`. A pull
request that changes anything under `skills/` must also bump the
`package.json` version to one that is not already tagged, and a change to
the managed rules must bump the rules version too, or `pm-setup` would never
install it. Pull requests that touch nothing under `skills/` (docs, CI,
scripts) merge without a bump. The repository-only `release` skill in
`.agents/skills/release/` picks the bump from the conventional commits since
the last tag and commits it; it is not installed into consuming projects.

Adding a skill means creating `skills/<name>/SKILL.md` and listing it in the
README table, the managed-section table, the `pm-setup` inventory, and the
`pm-help` skill guide; `just validate` fails otherwise. Full conventions are
in [`AGENTS.md`](AGENTS.md).

## Repository layout

```text
skills/
  pm-setup/
    SKILL.md
    references/AGENTS-section.md
  pm-init/
    SKILL.md
    templates/
  pm-resume/SKILL.md
  pm-rejoin/SKILL.md
  pm-next/SKILL.md
  pm-up-next/SKILL.md
  pm-park/SKILL.md
  pm-bug/SKILL.md
  pm-risk/SKILL.md
  pm-shape/SKILL.md
  pm-discover/SKILL.md
  pm-strategy/SKILL.md
  pm-purview/
    SKILL.md
    references/catalogue.md
  pm-checkpoint/SKILL.md
  pm-revise/SKILL.md
  pm-review/SKILL.md
  pm-item/SKILL.md
  pm-board/SKILL.md
  pm-roadmap/SKILL.md
  pm-status/SKILL.md
  pm-export/
    SKILL.md
    references/planning.schema.json
    references/planning.example.json
  pm-docs-site/
    SKILL.md
    references/spec.md
    scripts/site.ts          renders a site from its manifest; write or check
    templates/site/          the core site (Astro, Starlight, plan pages)
    templates/repo-docs/     module: the repository's Markdown, read in place
    templates/architecture/  module: LikeC4 views through Astroc4
    templates/aspire/        module: the AppHost resource
  pm-help/SKILL.md
planning/                  this repository's own PM state
docs-site/                 this repository's own project site
scripts/
  validate.ts
  setup-skills.ts
  bump-version.ts
.github/
  copilot-instructions.md
  workflows/
    ci.yml
    release.yml
package.json
LICENSE.md
```

## License

MIT. See [`LICENSE.md`](LICENSE.md).
