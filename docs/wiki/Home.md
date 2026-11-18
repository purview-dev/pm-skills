# pm-skills

Project-management skills for a solo developer using AI coding agents: they decide **which** feature is
worked on, and a development workflow skill set decides **how** it is built.

The skills sit above a workflow skill set, such as
[Superpowers](https://github.com/obra/superpowers). They are designed for
literal, predictable, low-friction output: one next action, an explicit
"done when", and fixed templates.

## What the skills do

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
  file without writing. A bundled Bun script does the export, the schema
  validation, the staleness check, and queries (`get`, `find`, `summary`),
  so every project gets the same output. The Markdown stays the source of
  truth.
- **One file format:** `pm-lint` checks every PM file against the format
  rules: the Markdown layout, each file's fields and values, and the
  references between files. It fixes the layout ones, runs before every PM
  commit, and prints a lefthook, husky, or git pre-commit hook that runs
  `check --staged`.
- **The plan as a site:** `pm-docs-site` plans a local Astro and Starlight
  site that renders `planning.json` as Home, Board, Roadmap, Log, and Risks pages,
  with Milestones and Features (one page per milestone and per item), Now,
  Inbox, Briefs, and Strategy by default, and site search over all of them,
  then builds it from shipped templates inside that item's workflow.
  Optional modules add the repository's `docs/` pages, LikeC4 architecture
  views, and an Aspire AppHost resource. It reads the export only. The
  same site is becoming an npm package, `@purview-dev/pm-docs-site`, so a
  site is three files and one pinned dependency instead of a copy of the
  templates (in prerelease on npm; see
  [The docs-site package](guide/Docs-Site-Package.md)).
- **Purview fit:** for .NET projects, `pm-purview` recommends
  [Purview](https://purview.dev/) tools only where they remove real work.
  For an empty project it asks first what you are building and at what
  scale. Non-.NET projects get no suggestions.
- **Memory across sessions and compaction:** every decision is written to
  a file the moment it is made. `pm-resume` restores the state afterwards.
  `pm-rejoin` puts a session back on the lifecycle after the thread is
  lost. `pm-pause` saves the session's position, and `pm-resume` continues
  from it.
- **Commits without the chore:** the skill that writes the planning files
  commits them, on the branch you plan on; a completion record is committed
  on the item's branch so it rides the item's pull request. The default is
  automatic, set in `config.md` (`ask` or `never` instead), and the same
  commit refreshes `planning.json` when it exists.
- **Questions use the agent's question UI:** choices with a recommended
  option and free text. You are never asked to type `yes` or `a`/`b`/`c`.

## Where to go next

| Page | Answers |
| -- | -- |
| [Installation](guide/Installation.md) | How to install the skills and run them the first time |
| [The loop](guide/The-Loop.md) | How one item moves from claim to merge, and when every other skill runs |
| [Non-interruption guarantee](guide/Non-Interruption.md) | What a PM skill may do during an active workflow |
| [Using a different workflow framework](guide/Other-Workflow-Frameworks.md) | How to hand off to something other than Superpowers |
| [Upgrading](guide/Upgrading.md) | How to update the skills and the shared rules |
| [The docs-site package](guide/Docs-Site-Package.md) | How a site uses `@purview-dev/pm-docs-site`: its options, commands, and versions |
| [Planning files](reference/Planning-Files.md) | What `pm-init` creates and what each file holds |
| [Version history](reference/Version-History.md) | What each rules version changed |
| [Development](contributing/Development.md) | How to work on this repository |
| [Repository layout](contributing/Repository-Layout.md) | Where each file lives |

Every skill, with its purpose and when it runs, is listed in the
[README](../../README.md#skills).
