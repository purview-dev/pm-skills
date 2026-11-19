# R-012 Docs-site package: dependency graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Graph` page to `@purview-dev/pm-docs-site` that draws every open item, its done prerequisites, and every `Depends on` and `Revisits` link, laid out at build time, with lane and done-chip switches and click-to-trace.

**Architecture:** A pure module, `src/lib/graph.ts`, derives nodes and edges from `features()`, lays out four variants with dagre in the page's frontmatter (build time only), and owns the URL state and chain tracing. A React Flow island, `src/components/graph/Graph.tsx`, renders the chosen precomputed layout with pan, zoom, fit, and selection. A server-rendered `Dependencies` list under the graph carries the same links as text. `graph` is a new optional view. One refinement of the spec: edges are not routed at build time; node positions are, and React Flow draws each edge as a bezier between two fixed node handles, which needs no layout work in the browser.

**Tech Stack:** TypeScript, Astro 7 + Starlight, React 19 islands, `@xyflow/react` 13.0.2 (client), `@dagrejs/dagre` 3.1.3 (build time only), `bun test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-docs-site-package-dependency-graph-design.md`

All paths below are relative to `packages/pm-docs-site/` unless they start with `docs/`, `planning/`, or `skills/`.

## Global Constraints

- TypeScript only (`.ts`, `.tsx`). React, not Preact.
- The export is read through `loadPlanning()` only; `schemaVersion` stays 3. No change to `pm-export`, its schema, or anything under `skills/**` (no rules bump).
- The package `version` in `package.json` does not change.
- Dependencies are exact-pinned: `"@xyflow/react": "13.0.2"`, `"@dagrejs/dagre": "3.1.3"`.
- dagre is imported only by `src/lib/graph.ts`'s layout function, which only page frontmatter calls. The island must not import it, directly or through `graph.ts` (split the module if bundling pulls it in; Task 5 checks the client bundle).
- Colours come from Starlight CSS variables (light and dark themes); the island's root has `not-content`.
- Deterministic output: inputs sorted by ID before layout, coordinates rounded to whole pixels; two runs give identical JSON.
- URL keys: `lanes=off`, `done=off`, `focus=<ID>`. Defaults write no key; every other parameter and the hash are kept; written with `history.replaceState`.
- Pending mark: `data-graph-pending` on `<html>`, with the same 3s reveal fallback as the Board and timeline.
- Default view: lanes on, done chips on.
- Exact copy: page title `Graph`; switches `Milestone lanes`, `Show done prerequisites`; buttons `Zoom out`, `Zoom in`, `Fit`; chips `✓ R-008` (done), `✗ R-003` (dropped, struck through), `? R-099 not found` (missing); node count line `✓ <n> done`; active-node notice `Own links not exported yet`; tray label `No links`; list heading `Dependencies`; lane label `<ID> <name>` plus `Focus`, and `No milestone`.

## Review Focus

- **A dependency cycle** (R-A depends on R-B, R-B on R-A, or an item on itself): the page must still build and render both edges; `chainOf` must terminate. Tests in Tasks 2, 3, and 4.
- **The same ID listed twice in one `Depends on`**: both entries are edges, and every edge ID is unique (React keys). Test in Task 2.
- **No open items at all** (idle, empty roadmap): the page builds and shows `No open items` instead of an empty canvas. Test in Task 3 (empty layouts); Task 5 renders the `No open items` branch.
- **Features view off**: no node, chip, or list entry links to a missing `/plan/features/` page. Test in Task 2 (hrefs null) and the existing `links.test.ts` crawl.
- **A focus link to an ID that is not visible in the layout** (`?focus=R-010&done=off`): no selection, and the key is removed. Tests in Tasks 4 and 6.

---

### Task 1: The `graph` view

**Files:**
- Modify: `lib/types.ts` (`ViewName`), `lib/options.ts` (`VIEW_NAMES`), `lib/sidebar.ts`, `lib/index.ts` (`VIEW_ROUTES`)
- Create: `src/routes/plan/graph.astro` (a stub: `StarlightPage` titled `Graph` with `ExportStamp`; Task 5 fills it)
- Modify: `test/fixtures/expected-pages.txt` (add `plan/graph/index.html`), `README.md` (the `views` row and the views list)
- Modify tests: `test/options.test.ts`, `test/sidebar.test.ts`, and every `ALL_VIEWS` / views object in `test/board-data.test.ts`, `test/links.test.ts`, `test/references.test.ts`, `test/timeline.test.ts` (add `graph: true`)

**Interfaces:**
- Produces: `ViewName` includes `'graph'`; `VIEW_NAMES` is `['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy']`; route `/plan/graph` → `plan/graph.astro`.

- [ ] **Step 1: Update the failing tests**

`test/options.test.ts`: `expect(VIEW_NAMES).toEqual(['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy'])`; defaults give seven `true` values; `views: ['now']` gives `graph: false`; rename the test to "lists the seven optional views". `test/sidebar.test.ts`: the full list has `link('Graph', 'graph')` right after `link('Roadmap', 'roadmap')`; the `views: ['now']` case is unchanged.

- [ ] **Step 2: Run them and see them fail**

Run: `bun test test/options.test.ts test/sidebar.test.ts`
Expected: FAIL on the view list and the sidebar items.

- [ ] **Step 3: Implement**

Add `'graph'` to `ViewName` and `VIEW_NAMES` (order above), `views.graph && { label: 'Graph', link: '/plan/graph/' }` after `Roadmap` in `buildSidebar`, `graph: [['/plan/graph', 'plan/graph.astro']]` in `VIEW_ROUTES`, the stub page, `plan/graph/index.html` in `expected-pages.txt` (sorted position), `graph: true` in the test view objects, and `graph` in the README's `views` row ("all seven") and view descriptions (one line: "Graph: open items and their Depends on and Revisits links, by milestone").

- [ ] **Step 4: Run the suite and the type check**

Run: `bun test && bun run check`
Expected: all pass, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A packages/pm-docs-site
git commit -m "feat(pm-docs-site): add the graph view (R-012)"
```

### Task 2: Graph data

**Files:**
- Create: `src/lib/graph.ts`
- Modify: `test/fixtures/planning.json`
- Create: `test/graph.test.ts`

**Interfaces:**
- Consumes: `features(planning)`, `Feature` (`src/lib/planning.ts`); `Target` and `targets(planning, views)` (`src/lib/references.ts`) for hrefs in tests.
- Produces (all exported from `src/lib/graph.ts`):

```ts
export type GraphNodeKind = 'item' | 'done' | 'dropped' | 'missing';
export interface GraphNode {
	id: string;
	kind: GraphNodeKind;
	title: string | null;          // null for 'missing'
	href: string | null;           // from known.get(id)?.href ?? null
	milestone: string | null;      // items only; chips null
	size: Size | null;
	section: 'now' | 'next' | 'later' | null;
	owner: string | null;
	blocked: boolean;              // label === 'blocked' || status?.value === 'blocked'
	active: boolean;               // section === 'now'
	donePrerequisites: number;     // Depends on + Revisits IDs that are done or dropped
	linksNotExported: boolean;     // true for the active item (spec: The active item's own links)
}
export interface GraphEdge {
	id: string;                    // `${source}>${target}:${kind}:${n}`, n counts repeats from 0
	source: string;                // the prerequisite or the original
	target: string;                // the waiting item or the revision
	kind: 'depends' | 'revisits';
	fromChip: boolean;             // source is a done, dropped, or missing node
}
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }
export interface DependencyRow { id: string; title: string; href: string | null; waitsOn: Ref[]; waitedOnBy: Ref[]; revisits: Ref | null; revisedBy: Ref[]; linksNotExported: boolean }
export interface Ref { id: string; label: string; href: string | null }   // label: `<ID> <title>`, or `<ID> not found`
export function graphData(planning: Planning, known: Map<string, Pick<Target, 'href'>>): GraphData;
export function dependencyRows(data: GraphData): DependencyRow[];
```

Nodes are ordered: items in `features()` order (Now, Next, Later), then chips sorted by ID. Chips exist only for IDs an open item names.

- [ ] **Step 1: Extend the fixture**

In `test/fixtures/planning.json`, changing only these fields: `R-013` `dependsOn` → `["R-010", "R-021"]` (a chain R-021 M1 → R-013 M2 → R-014 M2); `R-021` `dependsOn` → `["R-009"]` (a dropped prerequisite); `R-020` `dependsOn` → `["R-099"]` (unknown ID) and `revisits` → `"R-025"` (done); `R-023` `label` → `"blocked"` and `status` → `{ "value": "blocked", "reason": "Waiting for legal", "since": "2026-11-10" }`. Run `bun test` and fix any existing expectation the new links change (feature pages, board labels, links), keeping each test's intent.

- [ ] **Step 2: Write the failing tests** (`test/graph.test.ts`, fixture loaded like `timeline.test.ts`, `known` from `targets(planning, ALL_VIEWS)`)

- `graphData` gives item nodes exactly `['R-012', 'R-013', 'R-014', 'R-021', 'R-022', 'R-023', 'R-024', 'R-020']`, then chips `R-009` (`dropped`), `R-010` (`done`), `R-025` (`done`), `R-099` (`missing`, `title: null`, `href: null`); no node for `R-003` or `R-011`.
- edges: `R-010>R-013:depends`, `R-021>R-013:depends`, `R-013>R-014:depends`, `R-009>R-021:depends`, `R-022>R-024:depends`, `R-099>R-020:depends`, `R-025>R-020:revisits` — exactly these seven, `fromChip` true for the R-010, R-009, R-099, and R-025 edges.
- `R-012` has `active: true`, `linksNotExported: true`; `R-023` has `blocked: true`; `R-014` (`waiting`) has `blocked: false`; `R-013` has `donePrerequisites: 1`, `R-020` has `1` (R-025; the missing R-099 is not done).
- with views `features: false`, every `href` is `null`.
- an item whose `dependsOn` is `["R-010", "R-010"]` gives two edges with distinct IDs ending `:0` and `:1`.
- an item that depends on itself gives one edge with `source === target` and no chip.
- `dependencyRows` gives one row per item node in node order; `R-013` `waitsOn` labels `['R-010 <title>', 'R-021 <title>']` and `waitedOnBy` `['R-014 <title>']`; `R-020` `revisits.label` is `R-025 <title>` and `waitsOn` has `R-099 not found`; `R-012` has `linksNotExported: true`.

- [ ] **Step 3: Run and see them fail**

Run: `bun test test/graph.test.ts`
Expected: FAIL, `graph.ts` exports missing.

- [ ] **Step 4: Implement `graphData` and `dependencyRows` in `src/lib/graph.ts`**

Open items are features with state `now`, `next`, or `later`. For each `dependsOn` entry and the `revisits` value, add an edge and, when the ID is not an open item, a chip of kind `done`/`dropped` from its feature state, or `missing` when `features()` has no such ID.

- [ ] **Step 5: Run the tests**

Run: `bun test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A packages/pm-docs-site
git commit -m "feat(pm-docs-site): derive the dependency graph (R-012)"
```

### Task 3: Build-time layouts

**Files:**
- Modify: `package.json` (add `"@dagrejs/dagre": "3.1.3"` to `dependencies`; `bun install` from the repository root updates `bun.lock`)
- Create: `src/lib/graph-layout.ts` (kept apart from `graph.ts` so the island never pulls dagre in)
- Create: `test/graph-layout.test.ts`

**Interfaces:**
- Consumes: `GraphData`, `GraphNode` from Task 2; `milestoneSummaries(planning)` for lane order, `name`, and `isFocus`.
- Produces:

```ts
export type LayoutKey = 'lanes-done' | 'lanes-open' | 'flow-done' | 'flow-open';
export interface Box { x: number; y: number; width: number; height: number }   // top-left, whole pixels
export interface Lane { key: string; label: string; isFocus: boolean; y: number; height: number }  // key: milestone ID or 'none'
export interface GraphLayout { boxes: Record<string, Box>; lanes: Lane[]; tray: { y: number } | null; width: number; height: number }
export const SIZES: { item: { width: 220; height: 64 }; chip: { width: 120; height: 28 } };
export function graphLayouts(data: GraphData, planning: Planning): Record<LayoutKey, GraphLayout>;
```

A node absent from `boxes` is hidden in that layout; an edge is drawn only when both ends have boxes. `*-open` layouts drop `done` and `dropped` chips (and so their edges); `missing` chips stay in all four.

- [ ] **Step 1: Write the failing tests** (`test/graph-layout.test.ts`, on the Task 2 fixture data)

- every layout: no two boxes overlap; for every drawn edge with `source !== target`, `boxes[source].x + boxes[source].width <= boxes[target].x`.
- `lanes-done`: lane keys `['M1', 'M2', 'none']` in that order, `M2` has `isFocus: true` and label `M2 Billing`, `none` has label `No milestone`; each item box lies inside its milestone's lane band; chip `R-010` lies in lane `M2` (its first dependant R-013's lane), `R-009` in `M1`, `R-099` and `R-025` in `none`; every linked node has the same `x` in `lanes-done` as in `flow-done` (one ranking, so columns line up across lanes).
- `lanes-open` and `flow-open`: no box for `R-009`, `R-010`, `R-025`; a box for `R-099`.
- `flow-done`: `lanes` is empty and `tray` is set; the isolated items are `R-012` and `R-023`, their boxes have `y >= tray.y`, and no linked node is below `tray.y`.
- a two-item cycle and a self-dependency lay out without throwing, with both nodes boxed.
- empty data (no nodes) gives four layouts with no boxes, no lanes, `width` and `height` 0.
- `JSON.stringify(graphLayouts(data, planning))` is identical across two calls, and every coordinate is an integer.

- [ ] **Step 2: Run and see them fail**

Run: `bun test test/graph-layout.test.ts`
Expected: FAIL, module missing.

- [ ] **Step 3: Implement `graphLayouts`**

One dagre run per done-variant over the drawn nodes (sorted by ID, `rankdir: 'LR'`, `nodesep: 24`, `ranksep: 80`, item and chip sizes from `SIZES`) gives each node's column `x` and an ordering `y`; dagre returns centres, convert to top-left and round. Flow layouts use dagre's positions for linked nodes and put isolated items (no drawn edge) in a tray row below, in node order, wrapping at the linked graph's width (or 4 per row when there is none). Lane layouts keep dagre's `x`, assign each node to its lane (items by `milestone`; chips by the lane of their first dependant in lane order), and within each lane and column stack nodes in dagre's `y` order; a lane's height is its tallest column plus a 32px label band and padding, and lanes stack in `milestoneSummaries` order, dropping lanes with no node. Edges are not routed here: React Flow draws a bezier between the fixed node handles, which is drawing, not layout.

- [ ] **Step 4: Run the tests**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/pm-docs-site bun.lock
git commit -m "feat(pm-docs-site): lay out the dependency graph at build time (R-012)"
```

### Task 4: URL state and chain tracing

**Files:**
- Modify: `src/lib/graph.ts`
- Modify: `test/graph.test.ts`

**Interfaces:**
- Consumes: `GraphEdge` (Task 2), `LayoutKey`, `GraphLayout` (types only, `import type` from Task 3).
- Produces:

```ts
export interface GraphState { lanes: boolean; done: boolean; focus: string | null }
export function parseGraphQuery(search: string): GraphState;
export function graphQuery(state: GraphState, search: string): string;   // returns '' or '?…'
export function layoutKey(state: Pick<GraphState, 'lanes' | 'done'>): LayoutKey;
export function resolveFocus(focus: string | null, layout: GraphLayout): string | null;
export function chainOf(edges: GraphEdge[], id: string, layout: GraphLayout): Set<string>;  // node IDs and edge IDs, drawn ones only, including id
```

- [ ] **Step 1: Write the failing tests**

- `parseGraphQuery('')` → `{ lanes: true, done: true, focus: null }`; `'?lanes=off&done=off&focus=R-013'` → `{ lanes: false, done: false, focus: 'R-013' }`; `'?lanes=no'` → lanes `true`.
- `graphQuery({ lanes: true, done: true, focus: null }, '?x=1&lanes=off')` → `'?x=1'`; `graphQuery({ lanes: false, done: true, focus: 'R-013' }, '?x=1')` → `'?x=1&lanes=off&focus=R-013'`.
- `layoutKey` maps the four combinations to the four keys.
- `resolveFocus('R-010', layouts['flow-open'])` → `null`; `resolveFocus('R-010', layouts['flow-done'])` → `'R-010'`; `resolveFocus('R-777', …)` → `null`.
- `chainOf(edges, 'R-013', layouts['lanes-done'])` contains `R-010`, `R-021`, `R-009`, `R-014` and their four edge IDs, not `R-022`; with `lanes-open` it has no `R-010` or `R-009`.
- `chainOf` on a two-item cycle returns both nodes and terminates.

- [ ] **Step 2: Run and see them fail**

Run: `bun test test/graph.test.ts`
Expected: FAIL, exports missing.

- [ ] **Step 3: Implement** the five functions; `graphQuery` builds on `URLSearchParams`, deleting `lanes`, `done`, `focus` and re-adding only non-defaults in that order. `chainOf` walks upstream and downstream separately (a visited set each).

- [ ] **Step 4: Run the tests**

Run: `bun test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A packages/pm-docs-site
git commit -m "feat(pm-docs-site): graph URL state and chain tracing (R-012)"
```

### Task 5: The Graph island and page

**Files:**
- Modify: `package.json` (add `"@xyflow/react": "13.0.2"`), `bun.lock`
- Create: `src/components/graph/Graph.tsx` (island), `src/components/graph/GraphNodes.tsx` (item, chip, and lane node components), `src/components/graph/useGraphUrlState.ts`
- Create: `src/styles/graph.css`
- Modify: `src/routes/plan/graph.astro`

**Interfaces:**
- Consumes: `graphData`, `dependencyRows`, `parseGraphQuery`, `graphQuery`, `layoutKey`, `resolveFocus`, `chainOf` (`graph.ts`); `graphLayouts`, `GraphLayout`, `LayoutKey` (`graph-layout.ts`, frontmatter only; types elsewhere); `siteRefs().known`.
- Produces: `<Graph client:load nodes={GraphNode[]} edges={GraphEdge[]} layouts={Record<LayoutKey, GraphLayout>} />`; DOM hooks for Task 6: `.plan-graph__toolbar`, `[data-graph-node="<ID>"]` with `data-kind`, `data-selected`, `data-dimmed`, `.plan-graph__lane[data-lane="<key>"]`, `[data-graph-edge="<edge id>"]`, `.plan-graph` with `data-layout="<LayoutKey>"`.

- [ ] **Step 1: Write the page**

`graph.astro`: frontmatter loads planning, `known`, `graphData`, `graphLayouts`, `dependencyRows`; renders `ExportStamp`, the inline pending script (sets `document.documentElement.dataset.graphPending = ''` when the URL has `lanes=off` or `done=off`; comment that it must match `parseGraphQuery`), `<Graph client:load …/>` when there is at least one node, else `<p class="plan-empty">No open items</p>`, then `<h2>Dependencies</h2>` and one entry per `DependencyRow` (`<ID> <title>` link; `Waits on`, `Waited on by`, `Revisits`, `Revised by` lines of links, omitted when empty; the notice when `linksNotExported`). Imports `@xyflow/react/dist/style.css` and `../../styles/graph.css`.

- [ ] **Step 2: Write the island**

React Flow (`ReactFlow` from `@xyflow/react`) with `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable`, `fitView`, `minZoom={0.25}`, `maxZoom={2}`, and explicit `width`/`height` on every node from its `Box` so the server render matches hydration. Lanes are non-selectable nodes of type `lane` at `zIndex: -1`. Edges are `default` (bezier) between the fixed left and right handles; `revisits` edges get a dash and a `revisits` label; `fromChip` edges are muted. The toolbar has the two `role="switch"` buttons and `Zoom out` / `Zoom in` / `Fit` (React Flow's `useReactFlow` `zoomOut`, `zoomIn`, `fitView`). State comes from `useGraphUrlState` (reads `parseGraphQuery(location.search)` after mount, writes `graphQuery` via `replaceState`, deletes the pending mark once the first client layout is applied). Selection: click or Enter on a node selects it (sets `focus`); clicking the selected node again navigates to its `href`; the ID inside an item node is an `<a href>`; Escape or a pane click clears. With a focus, nodes and edges outside `chainOf` get `data-dimmed`. Switching to a layout where `resolveFocus` is `null` clears `focus`. The canvas is `height: 70vh; min-height: 24rem`.

- [ ] **Step 3: Write the styles**

`graph.css`: item, chip (dashed; dropped struck through; missing in the caution colour), active (accent ring like the Board's Now card), blocked (dashed border), dimmed (`opacity: 0.25`), lane bands and labels, the `Focus` badge, and `:root[data-graph-pending] .plan-graph { visibility: hidden; animation: plan-graph-reveal 0s 3s forwards; }` with its keyframes, all from `--sl-color-*` variables.

- [ ] **Step 4: Check the build and the bundle**

Run: `bun test && bun run check && bun run build`, then build the fixture site with `node test/browser/serve.ts` stopped after the build (or `node lib/cli.ts build <scratch copy>` as `serve.ts` does) and search its `dist/_astro/*.js` for `dagre`.
Expected: all pass; `dagre` appears in no client file.

- [ ] **Step 5: Commit**

```bash
git add -A packages/pm-docs-site bun.lock
git commit -m "feat(pm-docs-site): the Graph page (R-012)"
```

### Task 6: Browser tests

**Files:**
- Create: `test/browser/graph.browser.ts`

**Interfaces:**
- Consumes: the DOM hooks in Task 5's Produces block; the Task 2 fixture.

- [ ] **Step 1: Write the tests** (helpers like `timeline.browser.ts`: `openGraph(page, query)` waits for `.plan-graph__toolbar`)

- every item node's ID link has `href` `/plan/features/<id>/`; chips `R-010` and `R-025` link to their feature pages; `R-099` has no link and reads `? R-099 not found`.
- default: `.plan-graph` has `data-layout="lanes-done"`, lanes `M1`, `M2`, `none` in order, `M2` shows `Focus`.
- `Milestone lanes` off writes `?lanes=off` (keeping `?x=1` and the hash), sets `flow-done`, shows `No links`; `Show done prerequisites` off writes `done=off`, removes the `R-010` node, and `R-013` reads `✓ 1 done`.
- opening `?lanes=off&done=off` shows `flow-open` with no frame of `lanes-done` (sample `data-layout` on the first frame via `page.evaluate` in a `requestAnimationFrame` after `domcontentloaded`, as the timeline test does).
- clicking `R-013` sets `focus=R-013`, `R-014` and `R-021` are not dimmed, `R-022` is dimmed; clicking it again navigates to `/plan/features/r-013/`; Escape clears `focus`.
- `?focus=R-010&done=off` opens with no selection and no `focus` key.
- `Zoom in` changes the viewport transform; `Fit` restores it.
- the wheel over the page outside the canvas scrolls the page.
- at 320px width the document has no horizontal overflow.

- [ ] **Step 2: Run them**

Run: `bun run test:browser -- --project chromium test/browser/graph.browser.ts`
Expected: PASS (fix the island, not the assertions, when a test exposes a gap in the spec's behaviour).

- [ ] **Step 3: Commit**

```bash
git add packages/pm-docs-site/test/browser/graph.browser.ts
git commit -m "test(pm-docs-site): browser tests for the Graph page (R-012)"
```

### Task 7: Full verification

- [ ] **Step 1: Package suite**

Run (in `packages/pm-docs-site`): `bun test && bun run check && bun run build && bun run test:browser`
Expected: all pass, both Playwright projects.

- [ ] **Step 2: Repository checks**

Run (repository root): `just lint-check` and `just docs-check`
Expected: pass; `docs-site/` unchanged.

- [ ] **Step 3: Check the Done when on this repository's own plan**

`docs-site/` does not use the package until R-013, so build a scratch site the way `test/browser/serve.ts` does, with the repository's `planning/planning.json` in place of the fixture, and open `/plan/graph/`: one node per open item (R-012 plus the 7 roadmap items), an edge for every `Depends on` in `planning/ROADMAP.md`, R-012 showing `Own links not exported yet`, and each node linking to its feature page. Record the result in the `NOW.md` checkpoint.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A packages/pm-docs-site
git commit -m "fix(pm-docs-site): <what the verification found> (R-012)"
```
