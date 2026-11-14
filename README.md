# pm-skills

Project-management skills for a solo developer using AI coding agents.
They sit above a development workflow skill set, such as
[Superpowers](https://github.com/obra/superpowers), and decide **which**
feature is worked on. The workflow skills decide **how** it is built.

Ideas are captured in one line at any time, shaped and challenged before
they reach the roadmap, and every decision is written to a planning file
the moment it is made, so a new or compacted session resumes from the
files. Output is literal and predictable: one next action, an explicit
"done when", and fixed templates.

The full documentation starts at [`docs/wiki/Home.md`](docs/wiki/Home.md).

## Install

Run this from the root of the target repository:

```bash
npx skills add https://github.com/purview-dev/pm-skills -y
```

Then, in your agent, `run pm-setup` to merge the rules into your
`AGENTS.md` or `CLAUDE.md`, and `run pm-init` to create the planning files.
`pm-help` explains every skill and recommends the next one. The workflow
skill set, other install options, and the first run are in
[Installation](docs/wiki/guide/Installation.md).

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
| [`pm-pause`](skills/pm-pause/SKILL.md) | Write the session's position (step in progress, open question, next action) for `pm-resume` to continue and then delete | You stop mid-task, with or without an active item |
| [`pm-review`](skills/pm-review/SKILL.md) | Triage the inbox, check roadmap health, order Next | Weekly |
| [`pm-item`](skills/pm-item/SKILL.md) | Add, edit, drop, block, move or insert at a position, reassign, or complete one item | User asks |
| [`pm-board`](skills/pm-board/SKILL.md) | Task board; move, add, insert, or close one card | User asks |
| [`pm-roadmap`](skills/pm-roadmap/SKILL.md) | Full roadmap by milestone; move, add, or insert one item | User asks |
| [`pm-status`](skills/pm-status/SKILL.md) | Summary or your queue (read-only) | User asks |
| [`pm-export`](skills/pm-export/SKILL.md) | Write the whole plan as `planning.json` plus its schema, or check them (read-only) | User asks, or a tool needs the plan as JSON |
| [`pm-docs-site`](skills/pm-docs-site/SKILL.md) | Plan, build, extend, upgrade, or check the local site that renders `planning.json` | User asks; builds run inside the site item's workflow |
| [`pm-help`](skills/pm-help/SKILL.md) | Explain each skill, find what is missing, recommend the next skill (read-only) | Any time you are unsure |

## How it fits together

`pm-resume` reads where work stopped, `pm-next` claims an item on its own
branch and hands it to the workflow's design, plan, execute, and finish
stages, and `pm-checkpoint` records each stage and closes the item on its
branch before the pull request opens. The diagram and the role of every
other skill are in [The loop](docs/wiki/guide/The-Loop.md).

## Documentation

- [Installation](docs/wiki/guide/Installation.md)
- [The loop](docs/wiki/guide/The-Loop.md)
- [Non-interruption guarantee](docs/wiki/guide/Non-Interruption.md)
- [Using a different workflow framework](docs/wiki/guide/Other-Workflow-Frameworks.md)
- [Upgrading](docs/wiki/guide/Upgrading.md)
- [Planning files](docs/wiki/reference/Planning-Files.md) and the
  [version history](docs/wiki/reference/Version-History.md)
- [Development](docs/wiki/contributing/Development.md) and the
  [repository layout](docs/wiki/contributing/Repository-Layout.md)

## License

MIT. See [`LICENSE.md`](LICENSE.md).
