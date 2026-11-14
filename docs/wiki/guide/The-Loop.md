# The loop

How the skills follow one item from claim to merge, which skills run outside that loop, and how ideas,
strategy, corrections, and data flow between them.

On purview.dev each diagram is an interactive LikeC4 sequence: select a step to read what the skill
reads, writes, and commits. Every diagram comes from one model,
[`pm-skills.c4`](../diagrams/pm-skills.c4).

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="index" title="The loop" description="One item from claim to merge" height="760" -->
```mermaid
sequenceDiagram
  actor U as You
  participant R as pm-resume
  participant N as NOW.md
  participant X as pm-next
  participant RM as ROADMAP.md
  participant B as item branch
  participant D as design
  participant C as pm-checkpoint
  participant P as plan
  participant E as execute
  participant F as finish
  participant PR as one PR
  participant CI as CI
  participant M as PM branch
  U->>R: starts a session
  R->>N: reads NOW.md, ROADMAP.md, PAUSE.md
  R->>U: one next action: pm-next
  U->>X: start the next item
  X->>RM: challenges the first claimable item
  X->>B: pull latest, switch -c feat/r-nnn-slug
  X->>N: claims: NOW.md active, PM commit on the branch
  X->>D: hands off with the brief
  D->>C: spec written
  C->>P: hands the spec path to plan
  P->>C: plan written
  C->>E: hands the plan path to execute
  E->>C: every box checked, Done when passes
  C->>B: commits docs(pm): close R-NNN slug
  C->>F: hands off to the finish step
  F->>PR: pushes the branch, opens one PR
  PR->>CI: runs with the record inside the PR
  CI->>M: merge carries the record to main
  C->>U: start a new session before the next pm-next
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## Outside the loop

| Skill | When it runs |
| -- | -- |
| `pm-park` | Any time, capture only |
| `pm-review` | Weekly |
| `pm-risk` | Capture a risk any time; manage the register when no workflow is active |
| `pm-checkpoint` push/pop | Emergency suspension; the operation resumes at its checkpoint |
| `pm-shape`, `pm-discover`, `pm-strategy` | Think before building, no workflow active |
| `pm-item`, `pm-board`, `pm-roadmap`, `pm-status`, `pm-up-next` | On request, when no workflow is active (their read-only views also mid-workflow) |
| `pm-rejoin` | Any time the position is unclear; it hands back to the stage |
| `pm-bug` | A defect needs the facts a fix needs; it routes to a fix or the roadmap |
| `pm-revise` | Built work is wrong; it may interrupt to correct |
| `pm-export` | A tool needs the plan as JSON, or the export needs checking |
| `pm-docs-site` | Plan the site as an item; its build modes run in execute |

Captures, emergencies, and pauses during a workflow have their own diagrams in
[Non-interruption guarantee](Non-Interruption.md).

## Ideas

An idea reaches the roadmap in steps: `pm-park` (or `pm-discover`, or `pm-bug` for a defect) writes
the inbox, `pm-review` triages it, and `pm-shape` turns it into a brief and roadmap items. A defect can
skip the brief and become an item directly.

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="ideasFlow" title="Ideas" description="From one line to a roadmap item" height="760" -->
```mermaid
sequenceDiagram
  actor U as You
  participant PK as pm-park
  participant I as inbox/
  participant BG as pm-bug
  participant RM as ROADMAP.md
  participant DC as pm-discover
  participant RS as research/
  participant RV as pm-review
  participant SH as pm-shape
  participant BR as briefs/
  participant X as pm-next
  U->>PK: idea: export the board as CSV
  PK->>I: writes inbox/2026-11-14-0930-board-csv.md
  PK->>U: Parked: board CSV export
  U->>BG: add a bug: the board drops paused items
  BG->>I: writes Kind: bug with Severity and Reproduction
  BG->>RM: blocker or major: adds the fix to Next
  U->>DC: what do users struggle with?
  DC->>RS: writes the research report as findings arrive
  DC->>I: parks the opportunities you chose
  U->>RV: weekly review
  RV->>I: triages one file at a time, bugs by severity first
  RV->>RM: Add to Next: new R-NNN, inbox file deleted
  RV->>I: Shape it: Discuss: yes
  U->>SH: shape the board CSV export
  SH->>BR: writes the brief after every answer
  SH->>RM: Add to Next: one item per slice, Brief set
  U->>X: start the next item
  X->>RM: claims it and hands the brief to design
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## Strategy

`pm-strategy` sets milestones and focus, then re-plans the roadmap so Next is ordered by the focus
milestone; `pm-board` renders that order.

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="strategyFlow" title="Strategy" description="Milestones and focus to an ordered Next" height="640" -->
```mermaid
sequenceDiagram
  actor U as You
  participant S as pm-strategy
  participant L as LOG.md
  participant SF as STRATEGY.md
  participant RM as ROADMAP.md
  participant BD as pm-board
  participant X as pm-next
  U->>S: set the milestones and focus
  S->>L: reads V lines, throughput, inbox, research
  S->>U: Use these milestones? Focus on M1?
  U->>S: Use them, focus on M1
  S->>SF: writes milestones, focus, bets, Not doing
  S->>U: Re-plan the roadmap for this strategy now?
  U->>S: Re-plan it
  S->>RM: proposes Next: focus, then dependency, then risk
  U->>S: Accept this Next order
  S->>RM: rewrites ROADMAP.md, PM commit
  U->>BD: show the board
  BD->>RM: renders Now, Next, For you, Waiting, Done
  U->>X: start the next item
  X->>RM: claims the first claimable item in Next
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## Corrections

`pm-revise` writes the correction to the brief's `## Revisions` (an open item) or opens a revision
item with `Revisits` (a done item), then hands back to the stage skill.

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="reviseFlow" title="Corrections" description="Built work that is not what you wanted" height="560" -->
```mermaid
sequenceDiagram
  actor U as You
  participant RV as pm-revise
  participant BR as briefs/
  participant C as pm-checkpoint
  participant N as NOW.md
  participant E as execute
  U->>RV: the board should group by milestone, not owner
  RV->>BR: inspects: item, brief, spec, plan, checkbox counts
  RV->>U: What is wrong? Spec, plan, or code? How much is affected?
  U->>RV: the plan held, the code grouped by owner
  RV->>BR: writes Revisions: wrong, Must now, Mode, Supersedes
  RV->>U: How should R-NNN be corrected?
  U->>RV: fix-in-place
  RV->>C: pause
  C->>N: checkpoint, docs(pm): revise R-NNN in place
  RV->>E: hands back to execute with the revision
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

When CI fails, the completion record is already in the pull request but not merged, so it is
reversible and the fix goes on the same pull request.

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="ciFailure" title="CI fails on the item pull request" description="Fix it on the same pull request, never a new one" height="560" -->
```mermaid
sequenceDiagram
  participant CI as CI
  actor U as You
  participant RV as pm-revise
  participant L as LOG.md
  participant N as NOW.md
  participant E as execute
  participant C as pm-checkpoint
  participant B as item branch
  participant F as finish
  participant PR as one PR
  CI->>U: CI fails on the pull request
  U->>RV: fix the failing build
  RV->>L: finds docs(pm): close R-NNN, removes the Done line
  RV->>N: restores NOW.md from the parent commit, Stage: execute
  RV->>E: hands back to execute with the failure
  E->>C: boxes checked, Done when passes again
  C->>B: writes the record again, docs(pm): close R-NNN slug
  C->>F: hands off to the finish step
  F->>PR: pushes to the same pull request
  PR->>CI: runs again
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## Back on the loop

When a session loses its thread, `pm-rejoin` finds the true position from git and the planning files,
and repairs `NOW.md` only after you choose to rejoin.

<!-- purview:likec4 file="../diagrams/pm-skills.c4" view="rejoinFlow" title="Rejoin" description="Back on the loop after the thread is lost" height="520" -->
```mermaid
sequenceDiagram
  actor U as You
  participant RJ as pm-rejoin
  participant N as NOW.md
  participant B as item branch
  participant E as execute
  U->>RJ: where am I? NOW.md says idle
  RJ->>N: reads NOW.md, ROADMAP.md, STACK.md, config.md
  RJ->>B: current branch, merged branches, spec, plan, recent changes
  RJ->>U: Where you are: R-NNN unclaimed on feat/r-nnn-slug, at execute
  RJ->>U: Rejoin R-NNN at execute?
  U->>RJ: Rejoin at execute
  RJ->>N: repair: NOW.md active, checkpoint, docs(pm): rejoin
  RJ->>E: hands off with Done when and the Next action
```

[LikeC4 model](../diagrams/pm-skills.c4)
<!-- /purview:likec4 -->

## Data

`pm-export` writes `planning/planning.json` from all of the above, and the `pm-docs-site` site renders
it: see [Planning files](../reference/Planning-Files.md#the-export).
