# PM docs site: specification

The specification for the project documentation site that `pm-docs-site`
builds, extends, checks, and upgrades in a repository managed with the
`pm-*` skills. The site renders the project plan from
`<PM root>/planning.json` with Astro, Starlight, and components from the
Astro Components Kit, and, when the repository has an Aspire AppHost, runs
as a Vite app resource in it.

The templates in this skill's `templates/` folder implement every rule
below unless it is marked **Extension**. Paths below use the defaults: PM
root `planning/` and site root `src/docs-site`.

## 1. Rules (mandatory)

1. **`planning.json` is the only source of plan data.** Every plan fact on
   every page comes from `<PM root>/planning.json`, written by the `pm-export`
   skill. The site never parses `NOW.md`, `ROADMAP.md`, `LOG.md`,
   `STRATEGY.md`, `VISION.md`, the inbox, or the briefs, and never holds a
   plan value typed by hand.
2. **The site never writes PM state.** It never writes `planning.json`, its
   schema, or any file in the PM root. A stale export is fixed by running
   `pm-export`, not by the site.
3. **Values are shown, not judged.** Show what the export holds: IDs, titles,
   dates, counts, `Done when`, results. No invented priorities, scores,
   percentages of anything the export does not count, or prose summaries.
   The only derived values are those in section 5, each a fixed mapping.
4. **Staleness is visible.** Every plan page shows when the export was
   generated and from which branch and commit (section 6.1).
5. **Fail loudly on a bad export.** A missing file, invalid JSON, or a
   `schemaVersion` the site does not read fails the build with a message
   that names the file and says to run `pm-export`.
6. **Read in place.** Content outside the site folder (the PM root, `docs/`)
   is read where it lives, relative to the site root. Nothing is copied into
   the site, so a page can never drift from its source.
7. **Local only.** The site is a local reading aid. It is not deployed, has
   no authentication, and is not part of CI unless the repository's CI has
   Bun.

## 2. Stack

| Part | Choice | Tested with |
| --- | --- | --- |
| Site framework | Astro | `astro` 7.4.8 |
| Documentation theme | Starlight | `@astrojs/starlight` 0.42.10 |
| Plan components | Astro Components Kit (astrocomponents.dev), copied in | MIT, manual-install source |
| Package manager and runtime | Bun | 1.4.4 |
| Unit tests | Vitest | 5.1.0 |
| Type check | `@astrojs/check` + TypeScript | 0.9.12, 6.0.3 (TypeScript is pinned to major 6) |
| Architecture module | `@purview-dev/astroc4`, `@astrojs/react`, `likec4` | 1.0.0-prerelease.7, 7.1.5, 1.60.0 |
| Aspire hosting (only with an AppHost) | `Aspire.Hosting.JavaScript` `AddViteApp` | Aspire 13.6 |
| Resource composition (only with ResourceKit) | `Purview.Aspire.ResourceKit` | as the AppHost pins |

`scaffold` and `upgrade` install the latest version of each package, except
TypeScript, which stays on major 6 because `astro check` refuses
TypeScript 7. The column records the versions the templates were last
verified with. The
package is ESM (`"type": "module"`), private, and has these scripts: `dev`
(`astro dev`), `build` (`astro build`), `preview` (`astro preview`), `check`
(`astro check`), `test` (`vitest run`). The lockfile (`bun.lock`) is
committed and every install after the first uses `--frozen-lockfile`.

## 3. Location and layout

The site lives in its own folder beside the application source, for
example `src/docs-site`, so the PM root is `../../planning` from the site
root. Relative paths are kept in one constant per file.

```text
<site root>/
  pm-docs-site.json           The manifest: schemaVersion, modules, placeholder values
  astro.config.mjs            Starlight + sidebar (+ module plugins)
  package.json, bun.lock, tsconfig.json, vitest.config.ts, .gitignore
  src/
    lib/
      planning-types.ts       Types for the part of planning.json the pages read
      planning.ts             loadPlanning(), SCHEMA_VERSION, and the fixed derivations (section 5)
      planning.test.ts        Tests against __fixtures__/planning.json
      __fixtures__/planning.json  A synthetic, schema-valid export
    components/
      ExportStamp.astro       Export time, branch and commit, and the page's search filters
      StateBadge.astro        An item's state or roadmap label
      FeatureTable.astro      A table of items of one state
      lib/                    The copied Astro Components Kit components
        KanbanItemCard.astro
        TaskKanbanCard.astro
        StatusTimelineFeed.astro
    pages/
      index.astro             Home
      plan/board.astro        Board
      plan/roadmap.astro      Roadmap
      plan/log.astro          Log
      plan/risks.astro        Risks
      plan/now.astro          Now (view `now`)
      plan/milestones/        Milestones and one page per milestone (view `milestones`)
      plan/features/          Features and one page per item (view `features`)
      plan/inbox.astro        Inbox (view `inbox`)
      plan/briefs.astro       Briefs (view `briefs`)
      plan/strategy.astro     Strategy (view `strategy`)
    styles/components.css     Token mapping, board layout, and RAG and state badges
    modules.ts                Which optional modules (section 9) are installed
    views.ts                  Which optional views (section 7) are rendered
    sidebar.ts                The sidebar
    docs-sidebar.ts           The repository Markdown's sidebar groups (none without repo-docs)
    content.config.ts         Starlight's docs collection
```

`.gitignore` covers `node_modules/`, `dist/`, and `.astro/`. Every file
except `package.json`, `bun.lock`, and `src/docs-sources.ts` is rendered
from the templates by `scripts/site.ts`, so a site never drifts from them
unnoticed: `site.ts check` lists any file that differs.

## 4. Data contract: `planning.json`

### 4.1 Loading

`loadPlanning(path?)` in `src/lib/planning.ts`:

- Default path: the PM root's `planning.json`, resolved from
  `process.cwd()`, which is the site root under `just docs`, `astro build`,
  and the Aspire resource.
- Reads the file synchronously at build or render time (every page is
  static).
- Throws `PlanningExportError` with one of these messages, each followed by
  `Run the pm-export skill to write <PM root>planning.json.`:
  - `No plan export at <path>.`
  - `<path> is not valid JSON (<parser message>).`
  - `<path> has schemaVersion <n>; this site reads schemaVersion <SCHEMA_VERSION>.`
- Returns the parsed object typed as `Planning`. No other validation: the
  schema is `pm-export`'s responsibility.

`SCHEMA_VERSION` equals the `schemaVersion` const of `pm-export`'s schema.
`scripts/validate.ts` in the pm-skills repository fails when they differ, so
a schema change ships with a template change and `pm-docs-site upgrade`
carries it to an installed site.

### 4.2 Fields the site reads (schemaVersion 4)

Type only what the pages use (`planning-types.ts`); the full shape is
`<PM root>/planning.schema.json`.

| Field | Used by |
| --- | --- |
| `generatedAt`, `source.branch`, `source.head` | Export stamp |
| `strategy.focus.milestone`, `strategy.focus.whyNow` | Home, Roadmap (focus badge) |
| `strategy.milestones[]` `{id, name, status, exitCriteria}` | Roadmap groups and their order |
| `now` `{status, item{id, title, serves, owner, size, dependsOn, revisits}, stage, milestone, started}` | Home, Board (Now), Roadmap (active event), Features (the Now feature's owner, size, serves, dependsOn, revisits) |
| `plan` `{path, checked, total}` or `null` | Board (Now card progress) |
| `roadmap.next[]`, `roadmap.later[]` (item objects) | Board (milestone tag), Roadmap (queued events), Home (claimable titles) |
| `board.columns` `{now, next, foryou, waiting, done}` | Board |
| `board.activity[]` `{date, kind, id, title, result}` | Log |
| `log.done[]` `{date, id, title, milestone, owner, plan, result}` | Roadmap (done events), Log (plan links) |
| `counts` `{next, nextMax, later, done, openInbox, blockers, openRisks, redRisks}` | Home figures |
| `counts` `{redRisks, amberRisks, greenRisks, openRisks}` | Risks figures |
| `checks.claimable[]` | Home "Ready to start" |
| `risks.open[]` (risk objects) | Home "Red risks", Risks (matrix and Open table) |
| `risks.closed[]` `{id, title, rag, closed}` | Risks (Closed table) |
| `risks.removed[]` `{date, id, title, reason}` | Risks (Removed list) |
| `now` `{session, brief, spec, plan, doneWhen[], checkpoint}`, `plan.tasks[]` | Now, the active item's Features page |
| `roadmap.*[]` `{serves, dependsOn, status, brief, note, revisits}`, `log.dropped[]` | Features, Milestones |
| `strategy.milestones[]` `{serves, target}`, `vision.outcomes[]` | Milestones, Features (Serves) |
| `inbox[]` | Inbox, Features (entries that name the item) |
| `briefs[]` | Briefs, Features (the item's brief) |
| `vision`, `strategy` `{bets, assumptions, notDoing, decisions}` | Strategy |
| `counts` `{openInbox, discuss, shapingBriefs}`, `checks.lastReview` | Inbox, Briefs |

A risk object is `{id, title, likelihood, impact, rag, ragOverride, status,
owner, affects, trigger, mitigation, raised, reviewed, closed}`. The site
shows `rag` as written; it never recomputes a risk's RAG.

Column order and membership on the board are the export's
`board.columns`, which mirror the `pm-board` skill. The site never
recomputes which item belongs in which column.

### 4.3 Enumerations

- `owner`: `agent | user | both`; a missing owner means `agent`.
- `size`: `S | M | L`.
- `now.stage`: `design | plan | execute | finish`, or `null` when idle.
- `item.label`: `next | later | blocked | waiting`.
- `item.status.value`: `ready | paused | blocked`.
- `activity.kind`: `done | dropped | review`.
- `risk.likelihood`, `risk.impact`: `low | medium | high`.
- `risk.rag`: `red | amber | green`.
- `risk.status`: `open | mitigating | accepted | closed`.

## 5. Fixed derivations

These are the only values the site derives. Each is a pure function in
`src/lib/planning.ts` with a unit test.

| Function | Input → output | Why |
| --- | --- | --- |
| `sizeToPriority(size)` | `L` → `high`, `M` → `medium`, `S` or `null` → `low` | The components need a priority; PM state has none, so size stands in |
| `initials(owner)` | `user` → `YOU`, `both` → `AG+U`, anything else → `AG` | The avatar badge on a card |
| `roadmapGroups(planning)` | Groups of timeline events (below) | The Roadmap page |
| `docsHref(path)` | `docs/<x>.md` → `/<x>/`; anything else → `null` | Links a done item's plan to its page |
| Board Now progress | `round(plan.checked / plan.total * 100)`, `0` when no plan or `total` is 0 | The task card's progress bar |
| `derivedRag(likelihood, impact)` | `low` 1, `medium` 2, `high` 3; product 6 or more → `red`, 3 or 4 → `amber`, else `green` | Colours a matrix cell; the same rule `pm-risk` applies |
| `riskMatrix(risks)` | 3 rows (impact `high`, `medium`, `low`) of 3 cells (likelihood `low`, `medium`, `high`), each `{likelihood, impact, rag, risks[]}` | The Risks matrix |
| `milestoneId(value, milestones)` | `M2` or `M2 <name>` → `M2` when M2 is a known milestone; anything else → `null` | Which milestone an item, entry, or focus names |
| `planProgress(plan)` | `round(checked / total * 100)`, `0` when `null` or `total` is 0 | Board Now card, Now task cards, Features |
| `severityToPriority(severity)` | `blocker` → `urgent`, `major` → `high`, `minor` → `medium`, else `low` | An inbox card's priority; the inbox has none |
| `sourceInitials(source)` | `agent (…)` → `AG`, anything else → `YOU` | An inbox card's avatar |
| `features(planning)` | One `Feature` per item ID (below) | Features, Milestones, cross-links |
| `dependents(features, id)` | The features whose `dependsOn` has `id` | Features (Needed by) |
| `briefOf(planning, feature)` | The brief whose `path` is the item's `brief`, else whose `id` is the item's | Features (Brief) |
| `milestoneSummaries(planning)` | One summary per milestone (below) | Milestones |
| `featureHref(id)`, `milestoneHref(id)`, `briefAnchor(path)` | `/plan/features/<id>/`, `/plan/milestones/<id or none>/`, the brief's file name, all lower-case | Links between the pages |

`features` lists every item with an ID once, in this order: the `now.item`
(`state: 'now'`), `roadmap.next[]` and `roadmap.later[]` (`next`, `later`),
`log.done[]` (`done`), and `log.dropped[]` (`dropped`); entries without an
ID are left out. Each `Feature` carries the fields its place holds (null
elsewhere): `milestone` resolved with `milestoneId`, `doneWhen` as a list,
`label`, `status`, `position`, `brief`, `note`, `revisits`, `stage`,
`started`, `date`, `result`, `plan`, `reason`. The `now.item` entry also
carries `owner`, `size`, `serves`, `dependsOn`, and `revisits` straight from
`now.item`, the same fields a `roadmap.next[]` or `roadmap.later[]` entry
carries from itself.

`milestoneSummaries` returns one summary per `strategy.milestones[]` entry,
in that order, then `No milestone` (slug `none`) only when a feature has no
milestone. Each holds the milestone's fields, `isFocus` (as for
`roadmapGroups`), its features in `features` order, and `progress {done,
total}`: done features against every feature that is not dropped.

`roadmapGroups` returns one group per `strategy.milestones[]` entry, in that
order, then one `No milestone` group only if it has events. An entry belongs to
a milestone group when `milestoneId` resolves its `milestone` to that
milestone; otherwise it is unassigned. Each group's events, in this order:

1. `log.done[]` entries (export order, newest first): `status: 'done'`,
   `title: '<id> <title>'`, `desc: result`, `time: date`.
2. The `now.item`, when present: `status: 'active'`, `time: 'Now'`,
   `desc: 'In progress: <stage>'`.
3. `roadmap.next[]` then `roadmap.later[]` items: `status: 'pending'`,
   `desc: doneWhen`, `time: 'Next'` or `'Later'`.

Each group also carries `progress {done, total}` (done events against all
events) and its milestone's `id, name, status, exitCriteria, isFocus`.
`isFocus` is true when `strategy.focus.milestone` equals the ID or starts
with the ID followed by a space (`M2 Billing` for `M2`).

## 6. Components

### 6.1 `ExportStamp.astro` (own)

One line, muted, `--sl-text-xs`:
`Plan exported <YYYY-MM-DD HH:MM> from <branch | a detached HEAD> at <head7> (<PM root>planning.json).`
It is placed at the top of every plan page, is left out of the search
index (`data-pagefind-ignore`), and carries the page's search filters as
hidden `data-pagefind-filter` spans (section 8.1): `Kind` (`Plan`, the
default; `Feature`; `Milestone`), and for an item `State` and `Milestone`.

### 6.1.1 `StateBadge.astro` and `FeatureTable.astro` (own)

`StateBadge` prints an item's state (`In progress`, `Next`, `Later`,
`Done`, `Dropped`) or its roadmap label (`blocked`, `waiting`) as a badge
(`.state`, `.state--<state>` in `styles/components.css`) that always shows
the word. `FeatureTable` is the table of one state's items on the Features
and milestone pages: Item (linked to its page), Position, Stage, or Date,
Milestone (left out on a milestone's page), Owner, Size, and Done when,
Result, or Reason.

### 6.2 Astro Components Kit (copied)

The three components come from their manual-install source at
astrocomponents.dev and ship in `templates/site/src/components/lib/`. They
keep the MIT attribution comment and the original props. The only changes:

- Hard-coded dark-theme colours become Starlight theme variables (with the
  original value as the fallback), so cards read in light and dark themes.
- `StatusTimelineFeed` fills its column instead of stopping at 440px.

The component tokens map onto Starlight in `src/styles/components.css`:

```css
:root {
    --c-primary: var(--sl-color-accent);
    --c-primary-light: var(--sl-color-accent-high);
    --c-text-1: var(--sl-color-white);
    --c-text-2: var(--sl-color-gray-2);
    --c-text-3: var(--sl-color-gray-3);
    --r-md: 10px;
    --sp-4: 0.9rem;
    --font-sans: var(--sl-font);
}
```

| Component | Source | Represents | Prop mapping |
| --- | --- | --- | --- |
| `TaskKanbanCard` | <https://astrocomponents.dev/docs/task-kanban-card/> | The active item (the task in progress) | `task` = `<id> <title>`; `date` = `now.started`; `assigneeInitials` = `initials(owner)`; `priority` = `sizeToPriority` mapped to `low \| med \| high`; `progress` = Board Now progress |
| `KanbanItemCard` | <https://astrocomponents.dev/docs/kanban-item-card/> | A roadmap item or a done entry (a project item) | `title` = `<id> <title>`; `tag` = the item's milestone or `No milestone`; `assignee` = `initials(owner)`; `dueDate` = card `detail` (Next, For you, Waiting) or entry `date` (Done); `priority` = `sizeToPriority(size)`, `low` for Done; `commentsCount` = 0; `attachmentsCount` = 0 |
| `StatusTimelineFeed` | <https://astrocomponents.dev/docs/status-timeline-feed/> | A milestone's timeline | `events` = a `roadmapGroups` group's events |

The PM state has no comments or attachments, so those counts are always
`0`. Never fill them from another source.

## 7. Pages

Every page is a static Astro page that wraps `StarlightPage` and imports
`styles/components.css`. Every plan page starts with `ExportStamp`.

### 7.1 Home: `/` (`pages/index.astro`)

Starlight `template: 'splash'`. Sections, in order:

1. **Focus:** `strategy.focus.milestone` (or `No focus set`), `whyNow` when
   present, then `Now: <id> <title> (<stage>)` or `Nothing is in progress.`
2. **Figures:** a grid of six tiles: `In Next` (`<next> of <nextMax>`),
   `In Later`, `Done`, `Open ideas` (`openInbox`), `Blocked` (`blockers`),
   `Red risks` (`<redRisks> of <openRisks>`).
3. **Ready to start:** `checks.claimable` as `<ID> <title>`, the title looked
   up in `roadmap.next`/`later`, or `Nothing in Next can be started.`
4. **Red risks:** each `risks.open` entry whose `rag` is `red`, as a RAG
   badge, `<id>` linked to its row on the Risks page, the title, and its
   mitigation (`none` when `null`), or `No open risk is red.`
5. **Read on:** links to Board, Roadmap, Log, Risks, each view that is on
   (`src/views.ts`), and any installed modules (`src/modules.ts`), then a
   line on search (`just docs-preview`).

### 7.2 Board: `/plan/board/` (`pages/plan/board.astro`)

Five columns in this fixed order: **Now, Next, For you, Waiting, Done**,
taken from `board.columns`. Each column header shows its card count; an
empty column shows `Nothing here`.

- Now: one `TaskKanbanCard` per card.
- Next, For you, Waiting: one `KanbanItemCard` per card. The milestone tag
  comes from the matching roadmap item.
- Done: one `KanbanItemCard` per `board.columns.done` entry. The `result` is
  not shown here (it can run to a paragraph; it is on the Log).

Layout rules:

- The board is always one row of five columns:
  `grid-template-columns: repeat(5, minmax(11rem, 1fr))`, with
  `overflow-x: auto` so a narrow window scrolls sideways. A column never
  wraps onto a new line.
- The wrapper has Starlight's `not-content` class, so prose spacing does not
  push columns down.
- `tableOfContents: false`, and the content width is widened only on
  this page: `:root:has(.plan-columns) { --sl-content-width: 100%; }`. Never
  apply it globally.

### 7.3 Roadmap: `/plan/roadmap/` (`pages/plan/roadmap.astro`)

One section per `roadmapGroups` group:

- Heading: `<ID> <name>`, or `No milestone`, with a `Focus` badge on the
  focus milestone.
- Meta line: the milestone `status`, `<done> of <total> done`, and the exit
  criteria.
- A native `<progress>` bar (`max` = total, `value` = done) when the group
  has events.
- `StatusTimelineFeed` with the group's events, or `No items`.

### 7.4 Log: `/plan/log/` (`pages/plan/log.astro`)

A table of `board.activity`, newest first, with the columns Date, Kind,
Item, and Result. `Kind` is a small badge (`done` green, `dropped` red,
`review` neutral). A `done` row whose `log.done` entry has a `plan` under
`docs/` links to that plan's page via `docsHref`, as `(plan)`.

### 7.5 Risks: `/plan/risks/` (`pages/plan/risks.astro`)

The risk register, in this order:

1. **Figures:** `Open risks: <openRisks>`, then four tiles: `Red`, `Amber`,
   `Green` (the `counts`), and `Closed` (`risks.closed` length).
2. **Likelihood × impact:** the `riskMatrix(risks.open)` grid, each cell
   coloured by its `rag` and listing its risk IDs, each linked to the risk's
   row. An empty cell shows `–`.
3. **Open:** a table of `risks.open` in export order with the columns RAG,
   Risk (`<id> <title>`, then `affects`, `trigger`, and `ragOverride` when
   present), Likelihood, Impact, Status, Owner, Mitigation (`none` when
   `null`), and Reviewed. Each row's `id` attribute is the lowercase risk
   ID, the target of the matrix and Home links. Empty: `No open risks.`
4. **Closed:** a table of `risks.closed` with RAG, Risk, and Closed. Empty:
   `No closed risks.`
5. **Removed:** `<date> <id> <title>. Reason: <reason>`, only when
   `risks.removed` has entries.

RAG is shown as a badge (`.rag`, `.rag--<rag>` in `styles/components.css`)
that always prints the word, so colour is never the only signal.

### 7.6 Views (on by default)

The pages below are the site's views. Each is rendered unless the
manifest's `views` list leaves it out (`src/views.ts` records which are
on), and a page links to another view's page only when that view is on.

#### Now: `/plan/now/` (view `now`)

`Nothing is in progress.` when idle. Otherwise: `<id> <title>` (linked to
its Features page), the Stage, Started, Session, and Plan steps
(`<checked> of <total> (<planProgress>%)`); the brief, spec, and plan
paths, each linked with `docsHref` when it is under `docs/`; `## Done
when` from `now.doneWhen`; `## Checkpoint <at>` with each non-null field of
`now.checkpoint`; and `## Plan tasks`, one `TaskKanbanCard` per
`plan.tasks[]` entry: `task` = `Task <number>: <title>`, `date` =
`<checked>/<total> steps`, `progress` = `planProgress(task)`, `priority`
and `assigneeInitials` from the Now card.

#### Milestones: `/plan/milestones/` and `/plan/milestones/<id>/` (view `milestones`)

The index is one card per `milestoneSummaries` entry: `<ID> <name>` linked
to its page, the `Focus` badge, status, target, `<done> of <total> done`
with a `<progress>` bar, the exit criteria, the V lines it serves, and its
item count per state. Empty: `No milestones.`

A milestone's page (`none` for the items with no milestone) shows the
status, target, progress, `## Exit criteria`, `## Serves` (each V line with
its text from `vision.outcomes`), one `FeatureTable` per state that has
items, and `## Risks` whose `affects` is the milestone ID.

#### Features: `/plan/features/` and `/plan/features/<id>/` (view `features`)

The index is one section per state, in `FEATURE_STATES` order (In
progress, Next, Later, Done, Dropped), each with its count and a
`FeatureTable`.

An item's page shows its state and label badges and its milestone (linked);
the facts its place holds (Owner, Size, Position, Status with reason and
date, Stage, Started, Plan steps, Done or Dropped date); `## Done when`;
`## Result` or `## Plan` (the plan path linked with `docsHref`); `##
Reason`; `## Serves`; `## Related items` (Depends on, each with its state;
Needed by, from `dependents`; Revisits; Revised by); `## Brief` from
`briefOf` (title, status, updated, problem, decision, path); `## Note`;
`## Inbox` (entries whose `affects` is the ID or whose `related` lists it);
and `## Risks` (open and closed risks whose `affects` is the ID). A section
with nothing to show is left out.

#### Inbox: `/plan/inbox/` (view `inbox`)

`<openInbox> open, <discuss> to discuss, <n> in all. Last review:
<lastReview>.`, then `To discuss` (`discuss: yes`) and `Parked`, each a grid
of `KanbanItemCard`: `title`; `tag` = `<kind or idea> · <affects>`;
`assignee` = `sourceInitials(source)`; `dueDate` = `captured`; `priority` =
`severityToPriority(severity)`; counts `0`; with the `idea` text below.

#### Briefs: `/plan/briefs/` (view `briefs`)

`<n> briefs, <shapingBriefs> still shaping.`, then one section per brief,
its `id` the `briefAnchor` of its path: `<id> <title>` (linked to the
item's page when it has one), status, updated, origin, path, then
Problem, Done when, Decision, and its revisions. Empty: `No briefs.`

#### Strategy: `/plan/strategy/` (view `strategy`)

`## Vision` (problem, customer, the V lines, out of scope, and the three
constraints), `## Focus` (linked to the milestone's page), then tables of
`## Bets`, `## Assumptions`, `## Not doing`, and `## Decisions` in export
order, each with its empty line.

### 7.7 Cross-links

With the `features` view on, Home's Ready to start entries, the Log's item
IDs, and every table row on the Milestones, Briefs, and Now pages link to
the item's page. With `milestones` on, the focus on Home and Strategy and
every milestone name link to its page.

### 7.8 Sidebar

Built in `src/sidebar.ts` and passed to Starlight:

1. **Plan:** Now, Board, Roadmap, Milestones, Features, Log, Risks, Inbox,
   Briefs, Strategy, leaving out each view that is off. One page per item
   or milestone is reached from the lists, and from search, not the
   sidebar.
2. Each installed module (section 9), as one group or link.

## 8. Commands

When the repository has a `justfile`, add a `Docs` group. `[working-directory]`
and one command per line keep the recipes free of `cd` and `&&`, so they
run under whatever shell the `justfile` uses. Never add or change a
`set shell` or `set windows-shell` setting: the system default keeps the
`justfile` cross-platform.

```just
# Serve the project site at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs:
    bun install --frozen-lockfile
    bun run dev

# Build the project site with its search index, then serve the build at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs-preview:
    bun install --frozen-lockfile
    bun run build
    bun run preview

# Test, type-check and build the project site (local only). Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs-check:
    bun install --frozen-lockfile
    bun run test
    bun run check
    bun run build
```

`just docs` serves <http://localhost:4321> with live reload. `just
docs-preview` serves the built site, where search works. `just docs-check`
is the site's build check: unit tests, `astro check` with 0 errors, and a
full `astro build`, which also writes the search index.

### 8.1 Search

Search is Starlight's built-in Pagefind search; there is nothing to
install or configure. `astro build` indexes every page into
`dist/pagefind/`, so search works on the built site (`just
docs-preview`), not under `astro dev`, where the search box says so.

- Every plan page, every item and milestone page, and with `repo-docs`
  every Markdown page is indexed. Searching an ID (`R-012`) or words from
  a title, `Done when`, result, or brief finds the item's page first,
  because its title is `<id> <title>`.
- Filters: each plan page sets `Kind` (`Plan`, `Feature`, `Milestone`); an
  item's page also sets `State` (In progress, Next, Later, Done, Dropped)
  and `Milestone` (`<ID> <name>` or `No milestone`); a milestone's page
  sets `Milestone`. The search dialog lists them beside the results.
- The export stamp is not indexed, so every page does not match its date.
- Nothing leaves the machine: the index is static files in `dist/`.

## 9. Optional modules (not plan data)

Outside the core; each is added only when the repository has the content.
The templates and the install steps are in `templates/<module>/MODULE.md`.

- **`repo-docs`:** the repository's Markdown as Starlight's `docs`
  collection, read in place by a custom loader (`src/loaders/repo-docs.ts`)
  from the sources in the site-owned `src/docs-sources.ts`: each a folder,
  globs, an optional URL prefix and index file, and one sidebar group. The
  default reads `docs/`, with the specs and plans (the Handoffs output
  folders) newest first, which also makes `docsHref` links from the Log
  resolve. The title comes from frontmatter `title`, else the first
  level-1 heading (removed from the body), else frontmatter `name`, else the file
  name. Rendering passes `fileURL` so Markdown plugins can name the page.
- **`architecture`:** when the repository has a LikeC4 model, one page per
  views folder, `/architecture/<group>/`, rendered with
  `@purview-dev/astroc4` (`projects: { architecture: '<path to model>' }`,
  `<LikeC4View project="architecture" viewId=… />`). Astroc4 also renders
  ` ```likec4 ` fences in `.md` pages (1.0.0-prerelease.7 or later for
  `astro dev`).
- **`aspire`:** section 10.

## 10. Aspire resource (only when an AppHost exists)

Skip this section when the repository has no Aspire AppHost.

### 10.1 With Purview.Aspire.ResourceKit

When the AppHost composes resources with `[HostKit]` and
`[ResourceDefinition<T>]` kits, add one kit:

- Package: `Aspire.Hosting.JavaScript` in the AppHost project.
- Resource name constant: `public const string DocsSite = "docs";` in the
  host's resource-name class, with an XML doc comment.
- Kit, in the folder with the other resource kits:
  `templates/aspire/DocsSiteKit.cs`, a `[ResourceDefinition<ViteAppResource>]`
  whose `BuildResource` returns
  `builder.AddViteApp(Name, "<site root from the AppHost>").WithBun(installArgs: ["--frozen-lockfile"])`
  and whose `IsResourceEnabled` is `builder.ExecutionContext.IsRunMode`.

The generated `AddAspireResourceKit()` registers the kit; no `Program.cs`
change is needed. The resource has no references, waits, or environment
variables: it reads only files.

### 10.2 Without ResourceKit

In the AppHost's program, guarded by run mode:

```csharp
if (builder.ExecutionContext.IsRunMode)
{
    builder.AddViteApp("docs", "../../docs-site").WithBun(installArgs: ["--frozen-lockfile"]);
}
```

### 10.3 Tests

Add two AppHost composition tests:

- `AppHost_InRunMode_HasTheDocsSiteWithAnHttpEndpoint`: the `docs`
  resource exists and has an `http` `EndpointAnnotation`.
- `AppHost_InPublishMode_HasNoDocsSite`: no resource named `docs`.

Leave any artefacts the AppHost regenerates on build (for example an
`.aspirec4/` folder) changed, for the workflow to commit.

## 11. Tests and acceptance

Unit tests (Vitest, against a synthetic `__fixtures__/planning.json`; never
real project data) cover:

- `loadPlanning`: reads a valid export; each of the three failure messages.
- `sizeToPriority` and `initials`: every input.
- `roadmapGroups`: milestone order with `No milestone` last, milestones with
  no items kept, event status (done, active, pending), `progress`, `isFocus`.
- `docsHref`: a `docs/` path, a non-`docs/` path, `null`.
- `derivedRag`: all nine likelihood and impact pairs.
- `riskMatrix`: row and column order, each cell's derived RAG (not a
  risk's override), and each risk in its cell.
- `milestoneId`: an ID, an ID and name, an unknown ID, `none`, `null`.
- `features`: the order of states, the fields of each place, and
  `dependents` and `briefOf`.
- `milestoneSummaries`: strategy order with `No milestone` last, progress
  without dropped items, and its features.
- `planProgress`, `severityToPriority`, `sourceInitials`, `featureHref`,
  `milestoneHref`, `briefAnchor`: every input.

The site is done when:

1. `just docs-check` passes: all tests, `astro check` 0 errors, and the
   build completes.
2. `just docs` serves Home, Board, Roadmap, Log, Risks, and every view that
   is on (one item page and one milestone page at least) with HTTP 200,
   each showing the export stamp.
3. The Board shows five columns in one row at 1440, 1024, and 700px widths.
4. Every value on a plan page can be found in `planning.json`, or comes from
   a section 5 derivation.
5. Deleting `planning.json` fails the build with `No plan export at <path>.`
6. After `just docs-check`, `dist/pagefind/pagefind-entry.json` exists, and
   on `just docs-preview` searching an item's ID lists its item page first.
7. With an AppHost: the `docs` resource is running with a working endpoint,
   and both composition tests pass.

## 12. Extensions (not in the templates)

A page that fits the rules but has no template is an extension. Each is
built only as a roadmap item (`pm-docs-site plan <extension>`), following
the rules above, with its own derivations unit-tested, and is specified
here before it is built. The `now`, `inbox`, `briefs`, and `strategy`
pages started here and are now views (section 7.6).

- None at present.

## 13. Not doing

- No editing of the plan from the site (no forms, no drag and drop):
  changes go through the `pm-*` skills.
- No deployment, hosting, search engine indexing, or authentication. Site
  search is the local Pagefind index only (section 8.1).
- No second data source for plan facts (no Markdown parsing, issue
  trackers, or git history).
- No runtime API: every page is built from the export at build or dev time.
