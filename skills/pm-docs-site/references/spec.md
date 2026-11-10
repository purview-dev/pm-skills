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
      ExportStamp.astro       Export time, branch and commit
      lib/                    The copied Astro Components Kit components
        KanbanItemCard.astro
        TaskKanbanCard.astro
        StatusTimelineFeed.astro
    pages/
      index.astro             Home
      plan/board.astro        Board
      plan/roadmap.astro      Roadmap
      plan/log.astro          Log
    styles/components.css     Token mapping and board layout
    modules.ts                Which optional modules (section 9) are installed
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

### 4.2 Fields the site reads (schemaVersion 2)

Type only what the pages use (`planning-types.ts`); the full shape is
`<PM root>/planning.schema.json`.

| Field | Used by |
| --- | --- |
| `generatedAt`, `source.branch`, `source.head` | Export stamp |
| `strategy.focus.milestone`, `strategy.focus.whyNow` | Home, Roadmap (focus badge) |
| `strategy.milestones[]` `{id, name, status, exitCriteria}` | Roadmap groups and their order |
| `now` `{status, item{id,title}, stage, milestone, started}` | Home, Board (Now), Roadmap (active event) |
| `plan` `{path, checked, total}` or `null` | Board (Now card progress) |
| `roadmap.next[]`, `roadmap.later[]` (item objects) | Board (milestone tag), Roadmap (queued events), Home (claimable titles) |
| `board.columns` `{now, next, foryou, waiting, done}` | Board |
| `board.activity[]` `{date, kind, id, title, result}` | Log |
| `log.done[]` `{date, id, title, milestone, owner, plan, result}` | Roadmap (done events), Log (plan links) |
| `counts` `{next, nextMax, later, done, openInbox, blockers}` | Home figures |
| `checks.claimable[]` | Home "Ready to start" |

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

`roadmapGroups` returns one group per `strategy.milestones[]` entry, in that
order, then one `No milestone` group only if it has events. An entry belongs to
a milestone group when its `milestone` equals a known milestone ID;
otherwise it is unassigned. Each group's events, in this order:

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
It is placed at the top of every plan page.

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
2. **Figures:** a grid of five tiles: `In Next` (`<next> of <nextMax>`),
   `In Later`, `Done`, `Open ideas` (`openInbox`), `Blocked` (`blockers`).
3. **Ready to start:** `checks.claimable` as `<ID> <title>`, the title looked
   up in `roadmap.next`/`later`, or `Nothing in Next can be started.`
4. **Read on:** links to Board, Roadmap, Log, and any installed modules
   (`src/modules.ts`).

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

### 7.5 Sidebar

Built in `src/sidebar.ts` and passed to Starlight:

1. **Plan:** Board, Roadmap, Log.
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

# Test, type-check and build the project site (local only). Requires Bun.
[group('Docs')]
[working-directory('<site root>')]
docs-check:
    bun install --frozen-lockfile
    bun run test
    bun run check
    bun run build
```

`just docs` serves <http://localhost:4321>. `just docs-check` is the site's
build check: unit tests, `astro check` with 0 errors, and a full
`astro build`.

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

The site is done when:

1. `just docs-check` passes: all tests, `astro check` 0 errors, and the
   build completes.
2. `just docs` serves Home, Board, Roadmap, and Log with HTTP 200, each
   showing the export stamp.
3. The Board shows five columns in one row at 1440, 1024, and 700px widths.
4. Every value on a plan page can be found in `planning.json`, or comes from
   a section 5 derivation.
5. Deleting `planning.json` fails the build with `No plan export at <path>.`
6. With an AppHost: the `docs` resource is running with a working endpoint,
   and both composition tests pass.

## 12. Extensions (not in the templates)

These fit the rules, but no template renders them yet. Each is built only
as a roadmap item (`pm-docs-site plan <extension>`), following the rules
above, with its own derivations unit-tested.

- **`now`** (`/plan/now/`): `now.doneWhen[]`, `now.checkpoint`, and the
  plan's `plan.tasks[]` `{number, title, checked, total, steps[]}`, one
  `TaskKanbanCard` per task with `progress = round(checked / total * 100)`.
- **`inbox`** (`/plan/inbox/`): `inbox[]` `{title, kind, severity, captured,
  discuss}`, one `KanbanItemCard` per idea.
- **`briefs`** (`/plan/briefs/`): `briefs[]` `{id, title, status, updated,
  problem}`.
- **`strategy`** (`/plan/strategy/`): `strategy.bets[]`, `assumptions[]`,
  `notDoing[]`, `decisions[]`, and `vision`.

## 13. Not doing

- No editing of the plan from the site (no forms, no drag and drop):
  changes go through the `pm-*` skills.
- No deployment, hosting, search engine indexing, or authentication.
- No second data source for plan facts (no Markdown parsing, issue
  trackers, or git history).
- No runtime API: every page is built from the export at build or dev time.
