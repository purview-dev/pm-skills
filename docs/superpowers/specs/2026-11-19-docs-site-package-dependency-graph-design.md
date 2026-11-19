# R-012 Docs-site package: dependency graph — design

- Item: R-012 Docs-site package: dependency graph
- Serves: V4 (M1 Reproducible docs site)
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Branch: feat/r-012-docs-site-package-dependency-graph
- Date: 2026-11-19

## Intent

`@purview-dev/pm-docs-site` shows the plan as a board, a roadmap with a
milestone timeline, and per-item feature pages. None of them shows how items
depend on each other: the links exist only as `Depends on` and `Revisits`
lines on each feature page. R-012 adds a graph page that answers three
questions at once (the user, 2026-11-19: "all of those"):

- what is blocking what;
- the order the work has to happen in;
- how each area (milestone) hangs together.

It is the fourth of the four views the brief's user chose (backlinks, board
filters and swimlanes, timeline, dependency graph), and like every docs-site
view it is a rich interactive React island in TypeScript (inbox
`2026-11-18-0911-brief-static-first-superseded.md`; React was chosen over
Preact so this view could use React Flow).

## Done when (from the roadmap item)

The graph page shows one node per open item and one edge per `Depends on`
and `Revisits`, each node links to its feature page, and the layout is
computed at build time.

The design draws done prerequisites as well (below), so the page shows more
than "one node per open item": every open item is still exactly one node,
and done items appear as small chips only so that every link has two ends.
Today 7 of the 9 `Depends on` links point at done items, so without them the
graph would be 8 nodes and 2 edges.

## Goals

- A page at `/plan/graph/`, titled `Graph`, with one graph island and a
  toolbar.
- **Nodes.** One node per open item (feature state `now`, `next`, or
  `later`). Each shows the ID and title (the title truncates with an
  ellipsis; the full title is in the node's accessible name), milestone,
  size, section (`Now`, `Next`, `Later`), and owner. The active item is
  highlighted like on the Board. An item that is explicitly blocked
  (`label === 'blocked'` or `status.value === 'blocked'`) has a dashed
  border; a `waiting` item does not, because its unmet prerequisites are
  already visible as incoming edges (builder's call). The fixture gains a
  blocked item.
- **Done chips.** A done or dropped item that an open item depends on or
  revisits is drawn as a small dashed chip, `✓ R-008` (dropped: `✗ R-003`,
  struck through), linking to its feature page. One chip per item, never
  merged, so every link is its own edge. A done item no open item points at
  is not drawn.
- **Edges.** One per `Depends on` entry, drawn from the prerequisite to the
  item that waits for it, and one per `Revisits`, drawn from the original to
  the revision in a second style (a different dash and a `revisits` label),
  so the two kinds never look alike. Edges into done chips are muted.
- **Unknown IDs.** A `Depends on` or `Revisits` ID that matches no feature is
  drawn as a warning chip, `? R-099 not found`, with its edge, so broken PM
  state is visible rather than silently dropped (builder's call). Warning
  chips stay visible when done prerequisites are off, because they are not
  done items.
- **Two switches** in the toolbar (the user, 2026-11-19: keep all three
  mockups as one graph):

  | | Show done prerequisites: on | off |
  | --- | --- | --- |
  | **Milestone lanes: on** | default (mockup B) | lanes, no chips |
  | **Milestone lanes: off** | one flow (mockup A) | open items only (mockup C) |

  With done prerequisites off, no chip and no edge to a done item is drawn;
  each node with done prerequisites shows `✓ <n> done` instead.
- **Lanes.** With lanes on, each milestone is a horizontal band labelled
  with its ID, name, and `Focus` when it is `strategy.focus.milestone`, in
  `strategy.milestones` order, then `No milestone` last. A milestone with no
  open item has no lane. Every chip (done, dropped, or warning) sits in the
  lane of the first item, in lane order, that points at it; a chip's own
  milestone is not used, since dropped items have none. Columns line up across lanes, so the order
  of work reads left to right across the whole page; an edge between lanes
  stands out.
- **No lanes.** With lanes off, nodes with no edge are placed in a `No
  links` tray below the connected graph, in roadmap order, instead of being
  scattered through the first column.
- **Flow direction.** Left to right: an item is always right of everything
  it waits on.
- **Click to trace.** Clicking a node or a chip (or pressing Enter on it) selects it
  and highlights its whole chain: everything it waits on, transitively, and
  everything that waits on it, transitively, with the edges between them.
  The rest fades. Clicking the selected node again, or its ID link inside
  the node, opens its feature page. Escape, or clicking the background,
  clears the selection.
- **Pan and zoom.** Drag the background to pan; wheel, trackpad pinch, and
  `−`, `+`, `Fit` buttons to zoom. The graph fits the view on load.
- **URL state**, like the Board and the Roadmap timeline: `lanes=off`,
  `done=off`, and `focus=<ID>` (the selection). Defaults write no key, and
  every other parameter is kept. A shared link opens the same view with the
  same chain highlighted.
- **A text list for search and screen readers.** Below the graph, a
  `Dependencies` section lists each open item, in roadmap order, with what
  it waits on and what waits on it, as links. It is plain server-rendered
  HTML, so Pagefind indexes it and the page has content with JavaScript off
  (builder's call; the graph itself is not searchable text).
- **An optional view.** `graph` joins `VIEW_NAMES` (default on), its page
  lives in `src/routes/plan/graph.astro` and is injected only when the view
  is on, and the sidebar lists `Graph` after `Roadmap`.

## Non-goals

- Dragging nodes, editing links, or saving a custom layout. The graph is
  read-only, like every view.
- Done items with no open dependant, or a history graph of finished work.
- Any change to `planning.json`, its schema (`schemaVersion` stays 3), or
  `pm-export`.
- Changing the Board, Roadmap, or feature pages. The feature pages already
  list dependencies and dependants (not who revisits an item; that gap is
  not part of R-012).
- A minimap. React Flow has one; with today's 8 nodes it adds noise
  (builder's call; it can follow if roadmaps grow).

## Anti-goals (a failure even if it technically works)

- Layout work in the browser: no layout library in the client bundle, and no
  layout computed on hydration. Switching lanes or done chips swaps to a
  layout computed at build time.
- Two builds from the same `planning.json` giving different positions (R-013
  requires byte-identical HTML).
- A blank graph before hydration, or a `?lanes=off` link that flashes the
  lanes layout first.
- Overlapping nodes, or an edge drawn into the wrong lane.
- Wheel over the page scrolling being swallowed by the graph so the page
  cannot be scrolled past it.
- A Depends on or Revisits link in `planning.json` that is not drawn.

## The active item's own links (the user, 2026-11-19)

`planning.json` (schemaVersion 3) does not carry the active item's own
`Depends on` or `Revisits`: `now.item` is an `ItemRef` (ID and title), and
`features()` gives the Now feature empty links. Links from other items to the
active item are drawn as usual. R-012 does not change the export. Instead:

- The active node shows `Own links not exported yet` beneath its meta line,
  so it does not look like an item with no prerequisites, and the
  `Dependencies` list says the same for it.
- R-018 Export the Now card's owner and size is widened (through `pm-item`,
  after R-012's design) to export the active item's `Depends on` and
  `Revisits` too. The graph reads them from `features()`, so when R-018
  fills them in, the edges appear and R-018 removes the notice.

## Approaches

| Approach | Trade-off | Decision |
| --- | --- | --- |
| A. React Flow (`@xyflow/react`) for rendering, pan, zoom, fit, and selection; `@dagrejs/dagre` for the layout, run only at build time in the page's frontmatter | Pan, zoom, fit, and keyboard support come ready-made; dagre's crossing reduction keeps arrows readable as graphs grow; both MIT; React Flow adds client JavaScript, which is what choosing React was for; dagre never ships to the browser | **Chosen** (agent's pick; the user said "Go", 2026-11-19) |
| B. React Flow with an own layered layout (longest-path ranks, barycentre ordering) | No layout dependency, and lanes are natural; but crossing reduction is code to write, test, and keep, and it gets harder exactly when graphs grow | Rejected |
| C. Hand-drawn SVG island, own layout, own pan and zoom | Smallest bundle and no dependency; pan, zoom, fit, and keyboard handling written by hand again, as the timeline's zoom was | Rejected |
| D. ELK (`elkjs`) for layout | Best layouts, with native partitions for lanes; licensed EPL-2.0 or GPL-3.0, a poor fit for an MIT package, and an 8 MB dependency | Dropped |

## Decided parts of the how

The user's decisions:

- All three layouts, as one graph with two switches. Lanes on, done chips
  on (mockup B) is the default.
- The page answers blocking, order, and area at once.

The agent's calls, stated to the user and not objected to:

- Approach A.
- Click to trace the chain; a second click or the ID link opens the
  feature page.
- Switches and selection in the URL.
- `graph` is an optional view, after `Roadmap` in the sidebar.

These follow from the brief, R-010, and R-011 and are not reopened:

- The view is a React island (`client:load`) in TypeScript, rendered on the
  server, with its state in the URL written by `history.replaceState`.
- Colours come from Starlight variables, so light and dark themes work, and
  Starlight prose styles do not apply inside it (`not-content`).

### Derivation (`src/lib/graph.ts`, pure)

- `graphData(planning, known)` returns the nodes, chips, and edges from
  `features()`: open features become nodes; each `dependsOn` and `revisits`
  ID becomes an edge, and a chip when its feature is done or dropped, or a
  warning chip when it matches none. Node data holds only what the node
  renders: ID, title, href (from `known`, so it is `null` when the features
  view is off), milestone, size, section, owner, `blocked`, `active`, and
  its done-prerequisite count.
- `graphLayouts(data, milestoneOrder)` returns four layouts keyed
  `lanes|flow` × `done|open`. Each holds positions only (node ID → `x`,
  `y`), the lane bands (ID, label, `y`, height) when lanes are on, the tray
  when lanes are off, and each edge's points. Node data is sent once, not
  four times, to keep the island's props small (inbox
  `2026-11-18-1222-r-010-deferred-board-polish.md`: the Board's props
  roughly doubled its page).
- Node and chip sizes are fixed per kind, because text cannot be measured at
  build time; titles truncate to fit.
- Layout runs dagre with `rankdir: 'LR'`. With lanes on, columns must line
  up across lanes and each lane must be a band that no other lane's node
  enters; how dagre is driven to get that (one global ranking, then ordering
  within each lane) is the builder's call.
- The output is deterministic: inputs are sorted by ID before layout, and
  coordinates are rounded to whole pixels.

### URL state (`src/lib/graph.ts`)

- `parseGraphQuery(search)` returns `{ lanes: boolean, done: boolean,
  focus: string | null }`. `lanes=off` and `done=off` turn those off;
  anything else, or a missing key, leaves them on. `focus` is kept only when
  it names a node or chip in the current layout. Turning done
  prerequisites off while a done chip is selected clears the selection and
  removes `focus` (builder's call).
- `graphQuery(state, search)` returns the search string with those keys set
  or removed, keeping every other parameter.
- Before paint, an inline script in the graph page sets a pending mark on
  `<html>` when the URL has `lanes=off` or `done=off`. While it is set the
  graph is hidden until the island has applied the layout, with the same 3s
  reveal fallback as the Board and the timeline.

### Component (`src/components/graph/Graph.tsx`)

- Toolbar: `Milestone lanes` and `Show done prerequisites` as switches
  (`role="switch"`, `aria-checked`); `Zoom out`, `Zoom in`, and `Fit`.
- React Flow with `nodesDraggable`, `nodesConnectable`, and
  `elementsSelectable` set for a read-only graph, custom node types for an
  item, a chip, and a lane band, and a custom edge that draws the build-time
  points.
- The canvas has a fixed height (about 70vh, at least 24rem) so the page
  scrolls past it; the wheel zooms only while the pointer is over the
  canvas, as React Flow does by default.
- The server render uses the default layout at the fitted view, so the first
  render matches hydration. `@xyflow/react`'s stylesheet is imported once by
  the page.
- `src/routes/plan/graph.astro` loads the planning data, runs the
  derivation and layout in its frontmatter, and renders `<Graph client:load
  ...>` below `ExportStamp`, then the `Dependencies` list.

### Dependencies

- `@xyflow/react` (13.0.2 at the time of writing) and `@dagrejs/dagre`
  (3.1.3), exact-pinned like every dependency in the package. dagre is
  imported only by `src/lib/graph.ts` and the page frontmatter, never by the
  island, so it stays out of the client bundle.

### Tests

- `test/graph.test.ts` (bun test):
  - one node per open feature, none for done or dropped;
  - one edge per `dependsOn` entry and per `revisits`, with the right
    direction and kind;
  - chips only for done or dropped items an open item points at; a warning
    chip for an unknown ID;
  - with done off, no chip and no edge to a done item, and the right `✓ n
    done` count;
  - lanes follow `strategy.milestones`, `No milestone` last, empty
    milestones have none, and every node sits inside its lane's band;
  - columns line up across lanes; an item is always right of its
    prerequisites; no two nodes overlap in any of the four layouts;
  - two runs give identical output;
  - `parseGraphQuery` and `graphQuery`, keeping other parameters, and
    dropping an unknown `focus`.
- The fixture (`test/fixtures/planning.json`) gains a `Revisits` link, a
  chain of at least three open items across two milestones, a dependency on
  a dropped item, and an unknown ID, so every node, chip, and edge kind
  renders. `test/fixtures/expected-pages.txt` gains `/plan/graph/`.
- `test/options.test.ts` and `test/sidebar.test.ts` cover the `graph` view:
  on by default, off removes the page and the sidebar link.
- `test/browser/graph.browser.ts` (Playwright):
  - each node links to its feature page;
  - each switch changes the layout and writes or removes its key;
  - a `?lanes=off&done=off` link renders that layout with no frame of the
    default;
  - clicking a node highlights its chain and writes `focus`, a second click
    navigates, Escape clears;
  - `Fit`, `+`, and `−` change the zoom;
  - the page scrolls past the graph with the wheel outside it;
  - at 320px the page has no page-level horizontal overflow.

## Constraints

- TypeScript only (`.ts`, `.tsx`). React, not Preact.
- The export is read through `loadPlanning()` only; `schemaVersion` stays 3.
- The package version does not change (brief, 2026-11-18: releases are held
  until R-013).
- `skills/**` does not change, so there is no rules bump. `docs-site/` is not
  migrated to the package until R-013.
- The package's `bun test`, `bun run check`, `bun run test:browser`, and
  `bun run build`, and `just docs-check` on `docs-site/`, must pass.
- The README's view list and the `views` option docs name `graph`.

## Left to the builder

- Node, chip, and lane dimensions, spacing, and edge styling.
- How dagre is driven to produce aligned columns inside lanes, as long as
  the tests above hold.
- Whether a node with no feature page (features view off) is a plain node
  or opens the item dialog the Roadmap uses.
- The file split inside `src/components/graph/`.
