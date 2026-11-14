# Planning files

The files `pm-init` creates in the PM root, what each one holds, and the derived export written beside
them.

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
| `planning/PAUSE.md` | The paused session's position, written by `pm-pause`; deleted once `pm-resume` continues it |
| `planning/RISKS.md` | The risk register: open, closed, and removed risks with likelihood, impact, and RAG |
| `planning/inbox/` | The parking lot: one file per idea |
| `planning/briefs/` | One shaped idea per file: challenges, ramifications, decision |
| `planning/research/` | One `pm-discover` report per run |

Projects initialised before version 4 keep working. The new files are
created on first use; run `pm-strategy` to create `STRATEGY.md`.

## Which skill writes which file

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="planningFiles" title="Planning files" description="Which skill writes which file, and what reads the export" height="760" -->
```mermaid
flowchart LR
  subgraph pmRoot[planning/]
    config[config.md]
    vision[VISION.md]
    strategyFile[STRATEGY.md]
    now[NOW.md]
    roadmap[ROADMAP.md]
    log[LOG.md]
    stack[STACK.md]
    pauseFile[PAUSE.md]
    risks[RISKS.md]
    inbox[inbox/]
    briefs[briefs/]
    research[research/]
    json[planning.json + schema]
  end
  resume[pm-resume] -- reads --> now
  resume -- continues and deletes --> pauseFile
  next[pm-next] -- claims from Next --> roadmap
  next -- writes the claim --> now
  checkpoint[pm-checkpoint] -- checkpoints, idles, restores --> now
  checkpoint -- writes the Done line --> log
  checkpoint -- push and pop --> stack
  park[pm-park] -- writes one file --> inbox
  bug[pm-bug] -- writes Kind: bug --> inbox
  bug -- routes a fix --> roadmap
  risk[pm-risk] -- writes --> risks
  discover[pm-discover] -- writes the report --> research
  discover -- parks opportunities --> inbox
  review[pm-review] -- triages --> inbox
  review -- adds and orders --> roadmap
  review -- logs the review --> log
  shapeSkill[pm-shape] -- writes after each answer --> briefs
  shapeSkill -- adds one item per slice --> roadmap
  strategy[pm-strategy] -- revises --> vision
  strategy -- writes each approved section --> strategyFile
  strategy -- re-plans --> roadmap
  item[pm-item] -- edits one item --> roadmap
  board[pm-board] -- renders and edits --> roadmap
  revise[pm-revise] -- writes Revisions --> briefs
  revise -- removes an unmerged Done line --> log
  pause[pm-pause] -- writes --> pauseFile
  pause -- checkpoints --> now
  rejoin[pm-rejoin] -- repairs --> now
  init[pm-init] -- creates --> config
  init -- writes --> vision
  setup[pm-setup] -- records Rules version --> config
  export[pm-export] -- writes --> json
  astro[Docs site] -- reads --> json
  docsSite[pm-docs-site] -- builds and checks --> astro
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## The export

`planning/planning.json` and `planning/planning.schema.json` are written by
`pm-export` on first use. They are derived from the files above: never
hand-edit them, and never treat them as the state. Once they exist, every
PM commit refreshes them first (`Export on commit` in `config.md`:
`if present` by default, or `always` or `never`).

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="exportFlow" title="From a Markdown edit to the docs site" description="Every PM commit refreshes the export, so the site never lags the Markdown" height="600" -->
```mermaid
sequenceDiagram
  actor U as You
  participant IT as pm-item
  participant RM as ROADMAP.md
  participant EX as pm-export
  participant J as planning.json + schema
  participant M as PM branch
  participant DS as Docs site
  participant PD as pm-docs-site
  U->>IT: add the board CSV export to Next
  IT->>RM: writes R-NNN under Next
  IT->>EX: PM commit: refresh the export
  EX->>RM: reads every PM file except STACK.md and PAUSE.md
  EX->>J: writes planning.json, copies the schema
  IT->>M: docs(pm): add R-NNN board CSV export
  U->>DS: just docs
  DS->>J: reads planning.json
  DS->>U: Board, Roadmap, Log, and Risks pages
  U->>PD: is the site current?
  PD->>DS: check: templates, schema version, build
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

What each version added to these files: [Version history](Version-History.md).
