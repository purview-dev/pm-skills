# pm-skills

Project-management skills for a solo developer using AI coding agents.
They sit above a development workflow skill set, such as
[Superpowers](https://github.com/obra/superpowers), and decide **which**
feature is worked on. The workflow skills decide **how** it is built.

The skills are designed for literal, predictable, low-friction output: one
next action, an explicit "done when", and fixed templates. Ideas are
captured without derailing the current task.

## Install

Run this from the root of the target repository:

```bash
npx skills add https://github.com/kjldev/pm-skills -y
# or
bunx skills add https://github.com/kjldev/pm-skills -y
```

Skills install at project level by default. Add `-g` for a user-level
install, or `-a claude-code` to target a single agent. See the
[skills CLI](https://github.com/vercel-labs/skills) for all options.

Then, in your agent:

1. `run pm-setup` merges the rules into your existing `AGENTS.md` or
   `CLAUDE.md`, between `<!-- pm-skills:start -->` and
   `<!-- pm-skills:end -->` markers. Nothing outside the markers changes.
2. Commit, using the command `pm-setup` prints.
3. `run pm-init` writes `pm/VISION.md` and seeds the roadmap.

## Skills

| Skill | Purpose | When it runs |
| --- | --- | --- |
| [`pm-setup`](skills/pm-setup/SKILL.md) | Merge the rules into the agent file; check the install | User asks |
| [`pm-init`](skills/pm-init/SKILL.md) | Create `pm/`, write the vision, seed the roadmap | User asks, once per repo |
| [`pm-resume`](skills/pm-resume/SKILL.md) | Where you stopped and the one next action | Session start |
| [`pm-next`](skills/pm-next/SKILL.md) | Pick and claim the next item, hand off to design | No active item |
| [`pm-park`](skills/pm-park/SKILL.md) | Capture an off-task idea in one line | Any time |
| [`pm-checkpoint`](skills/pm-checkpoint/SKILL.md) | Save state, record stage changes, close finished items | Session or stage end |
| [`pm-review`](skills/pm-review/SKILL.md) | Triage the inbox, check scope, order Next | Weekly |

## The loop

```text
pm-resume -> pm-next -> [design -> plan -> execute -> finish] -> pm-checkpoint
                ^            |            |           |               |
                |       pm-checkpoint (stage updates)              close
                +--------------------------------------------------+
pm-park: any time, capture only.   pm-review: weekly.
```

## Non-interruption guarantee

The merged rules make an active workflow own the session. During a
workflow, only `pm-park` may run, and only to capture. Any other PM skill
waits until the workflow finishes, or until you say "pause". PM skills
write only to `pm/` in the main worktree. They never change specs, plans,
branches, or git state. Full rules:
[`skills/pm-setup/references/AGENTS-section.md`](skills/pm-setup/references/AGENTS-section.md).

## Files created by pm-init

| File | Holds |
| --- | --- |
| `pm/config.md` | Handoffs to workflow skills, limits, last review date |
| `pm/VISION.md` | v1 outcomes, out of scope, constraints |
| `pm/NOW.md` | The one active item and its checkpoint |
| `pm/ROADMAP.md` | Next (ordered, maximum 5) and Later |
| `pm/LOG.md` | Done, Dropped, Reviews |
| `pm/inbox/` | One file per parked idea |

## Using a different workflow framework

Edit the Handoffs table in `pm/config.md`. The skills refer to stages
(design, plan, execute, finish), not to Superpowers skill names.

## Upgrading

```bash
npx skills update
```

Then `run pm-setup` again. It replaces only the section between the markers
when its version has changed.

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
  pm-checkpoint/SKILL.md
  pm-review/SKILL.md
```
