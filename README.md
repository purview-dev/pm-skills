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
- **Brainstorming with challenge:** `pm-shape` interviews, challenges, and
  maps the ramifications of an idea before it reaches the roadmap.
  `pm-discover` analyses the existing code, history, and usage for
  evidence. Every idea, including the agent's own, is challenged.
- **Strategy, roadmap, and board:** `pm-strategy` sets milestones, bets,
  and focus, and generates the roadmap. `pm-status` renders a task board,
  a milestone roadmap, and your own queue. Items are owned by the agent,
  the user, or both.
- **Purview fit:** for .NET projects, `pm-purview` recommends
  [Purview](https://purview.dev/) tools only where they remove real work.
  For an empty project it asks first what you are building and at what
  scale. Non-.NET projects get no suggestions.
- **Memory across sessions and compaction:** every decision is written to
  a file the moment it is made. `pm-resume` restores the state afterwards.
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
| [`pm-next`](skills/pm-next/SKILL.md) | Check, claim, and hand off the next item to design | No active item |
| [`pm-park`](skills/pm-park/SKILL.md) | Capture an idea, bug, question, or inspiration in one line | Any time |
| [`pm-shape`](skills/pm-shape/SKILL.md) | Brainstorm and challenge one idea into a brief and a decision | No active workflow |
| [`pm-discover`](skills/pm-discover/SKILL.md) | Analyse code, history, and usage for evidence; answer product questions | No active workflow |
| [`pm-strategy`](skills/pm-strategy/SKILL.md) | Milestones, focus, bets, decisions; generate or re-plan the roadmap | User asks |
| [`pm-purview`](skills/pm-purview/SKILL.md) | Recommend [Purview](https://purview.dev/) .NET tools only where they add value | New project, or a matching .NET need |
| [`pm-checkpoint`](skills/pm-checkpoint/SKILL.md) | Save state and decisions, record stage changes, close finished items | Session or stage end, before compaction |
| [`pm-review`](skills/pm-review/SKILL.md) | Triage the inbox, check roadmap health, order Next | Weekly |
| [`pm-item`](skills/pm-item/SKILL.md) | Add, edit, drop, block, move, reassign, or complete one item | User asks |
| [`pm-status`](skills/pm-status/SKILL.md) | Summary, task board, milestone roadmap, or your queue (read-only) | User asks |
| [`pm-help`](skills/pm-help/SKILL.md) | Explain each skill, find what is missing, recommend the next skill (read-only) | Any time you are unsure |

## The loop

```text
pm-resume -> pm-next -> [design -> plan -> execute -> finish] -> pm-checkpoint
                ^            |            |           |               |
                |       pm-checkpoint (stage updates)              close
                +--------------------------------------------------+
pm-park: any time, capture only.   pm-review: weekly.
pm-shape / pm-discover / pm-strategy: think before building, no workflow active.
pm-item / pm-status: on request, when no workflow is active.
```

Ideas flow: `pm-park` (or `pm-discover`) -> inbox -> `pm-shape` -> brief
-> roadmap item -> `pm-next`. Strategy flows: `pm-strategy` -> milestones
and focus -> ordered Next -> `pm-status` board.

## Non-interruption guarantee

The merged rules make an active workflow own the session. During a
workflow, only `pm-park` may run, and only to capture. Any other PM skill
waits until the workflow finishes; the agent asks whether to run it after
the workflow or pause now. PM state skills
write only to the configured planning directory (default `planning/`) in
the main worktree. They never change specs, plans, branches, or git state.
`pm-setup` edits only the managed section in the selected agent
instructions file. Full rules:
[`skills/pm-setup/references/AGENTS-section.md`](skills/pm-setup/references/AGENTS-section.md).

## Files created by pm-init

The paths below use the default PM root; replace `planning/` with the
directory selected during `pm-setup`.

| File | Holds |
| --- | --- |
| `planning/config.md` | Handoffs to workflow skills, limits, last review date |
| `planning/VISION.md` | v1 outcomes, out of scope, constraints |
| `planning/STRATEGY.md` | Focus, milestones, bets, assumptions, not doing, decisions |
| `planning/NOW.md` | The one active item, its checkpoint, decisions, and context |
| `planning/ROADMAP.md` | Next (ordered, maximum 5) and Later, with owner and dependencies |
| `planning/LOG.md` | Done, Dropped, Reviews |
| `planning/inbox/` | The parking lot: one file per idea |
| `planning/briefs/` | One shaped idea per file: challenges, ramifications, decision |
| `planning/research/` | One `pm-discover` report per run |

Projects initialised before version 4 keep working. The new files are
created on first use; run `pm-strategy` to create `STRATEGY.md`.

## Using a different workflow framework

Edit the Handoffs table in `<PM root>/config.md`. The skills refer to stages
(design, plan, execute, finish), not to Superpowers skill names.

## Upgrading

```bash
npx skills update
```

Then `run pm-setup` again. It replaces only the section between the markers
when its version has changed.

## Development

Requires [`bun`](https://bun.sh) and, for the git hooks,
[`lefthook`](https://lefthook.dev/installation) and
[`just`](https://github.com/casey/just).

- `just validate` checks skill frontmatter, the README and managed-section
  tables, the `pm-setup` inventory, the section markers, and the template
  placeholders.
- `just lint-check` runs `just validate` and lints all Markdown.
- `just lint-fix` applies Markdown fixes.
- `just install` verifies the tools and installs the git hooks (commitlint
  on commit, `just lint-check` on push).

CI runs the same checks on every push and pull request to `main`. Adding a
skill means creating `skills/<name>/SKILL.md` and listing it in the README
table, the managed-section table, the `pm-setup` inventory, and the
`pm-help` skill guide; `just validate` fails otherwise. Full conventions
are in [`AGENTS.md`](AGENTS.md).

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
  pm-next/SKILL.md
  pm-park/SKILL.md
  pm-shape/SKILL.md
  pm-discover/SKILL.md
  pm-strategy/SKILL.md
  pm-purview/
    SKILL.md
    references/catalogue.md
  pm-checkpoint/SKILL.md
  pm-review/SKILL.md
  pm-item/SKILL.md
  pm-status/SKILL.md
  pm-help/SKILL.md
scripts/validate.ts
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
