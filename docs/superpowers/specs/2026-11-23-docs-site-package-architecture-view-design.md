# Docs-site package: architecture view (R-045): design

- Date: 2026-11-23
- Item: R-045 Docs-site package: architecture view (agent, M), branch `feat/r-013-docs-site-package` (claimed there at the user's request)
- Brief: `planning/briefs/2026-11-17-docs-site-package.md`
- Approved: 2026-11-23 (user)
- ADRs: writes ADR-007 LikeC4 markers render through astroc4 (proposed, Item R-045); follows ADR-005 Docs sites consume the pm-docs-site package (proposed, R-013) and ADR-006 Mermaid renders at build time with Pele (proposed, R-013)

## Intent

R-013 deletes the docs-site templates. Before it can, the template's `architecture` module (LikeC4 through `@purview-dev/astroc4`) needs a home in the package, so no architecture site is left without a path. The user also wants **LikeC4 everywhere, with Mermaid as the fallback**. The wiki's diagrams are already written as diagram pairs: a `<!-- purview:likec4 … -->` marker around a Mermaid fence. purview.dev renders the LikeC4 view; GitHub shows the Mermaid. The docs site should render the LikeC4 view too.

## Decisions made with the user (2026-11-23)

1. **LikeC4 everywhere.** Markers render as their LikeC4 view; the Mermaid between them is the fallback.
2. **Marker support lives in astroc4** (approach 2 below), so purview.dev and the docs site can share one implementation.
3. **The agent does the astroc4 part in this item.** That means a branch in `P:\GitHub\purview-dev\astroc4`, the option and tests under astroc4's own AGENTS.md, and a prerelease that the user publishes by merging its PR.

## Goals

- astroc4 gains a `markers` option. Each marker block in a `.md` page becomes the LikeC4 view the marker names.
- `pmDocsSite({ architecture: { … } })` turns on LikeC4. Markers render, ```` ```likec4 ```` fences render, and with a project folder, one page per view folder at `/architecture/<group>/` (the template's pages).
- A site without `architecture` builds without astroc4 installed.
- `examples/demo/` builds with a LikeC4 model, and `just package-test` passes.

## Non-goals

- Moving purview.dev's sync onto astroc4's markers. Park it as a follow-up.
- Rendering Mermaid with Pele (R-013, ADR-006). Until R-013, a fallback Mermaid fence stays a code block, as today.
- Turning architecture on in this repository's `docs-site/`. `docs-site/` is not on the package until R-013, whose `astro.config.ts` then sets `architecture: {}`.
- Pages for a single-file model. View-folder pages need a LikeC4 project folder; a single `.c4` file such as `docs/wiki/diagrams/pm-skills.c4` is reached only through markers and fences.

## Anti-goals

- A broken or unreadable model hiding the diagram. When a marker cannot be drawn, the Mermaid fallback shows with a warning that names the page, line, and reason. That is the spec's behaviour, so a marker never fails the build.
- astroc4 being loaded, or required, by a site that did not ask for it.
- A second marker syntax. The marker is exactly purview.dev's (`skills/purview-site-docs/references/diagrams.md` in the purview.dev repository).

## Approaches

| Approach | Trade-off |
| --- | --- |
| 1. A marker plugin in `pm-docs-site` | Ships in this repository only, with no outside release, but purview.dev keeps its own implementation of the same marker. |
| 2. Marker support in astroc4 (chosen) | purview.dev and the docs site can share one implementation. R-045 waits on an astroc4 prerelease. |
| 3. Client-side rewrite | Breaks build determinism (R-013) and adds JavaScript. Rejected without discussion. |

## Design

### Part A: astroc4 (`P:\GitHub\purview-dev\astroc4`)

This work happens on a branch `feat/likec4-markers` from `main`, under astroc4's AGENTS.md. It uses conventional commits, keeps the wiki in step with the code, logs through Astro's logger, and uses `.ts` specifiers.

- **Option.** Add `markers?: boolean | { root?: string }` (default `true`) to `LikeC4IntegrationOptions` (`src/integration.ts`) and forward it from `StarlightLikeC4Options` (`src/index.ts:56-61`).
  - Markers are on by default, so a page written for purview.dev just works. Setting `false` leaves the comments untouched.
  - **`root` (agent's call, from the builder check)** is the **repository root**. A `/`-rooted marker `file` resolves against it, and every marker model must stay inside it.
  - The spec makes the model's location "anywhere in the repository, including outside the docs folder". The Astro root is usually a subfolder, as with `docs-site/` here, so site-root containment would send every wiki marker to the fallback.
  - The default is the nearest ancestor of the Astro root that holds `.git`, else the Astro root. Plain ```` ```likec4 file= ```` fences keep their current site-root containment, so existing behaviour does not change.
  - Tests include a fixture whose page and model both sit outside the Astro root, in the playground or a unit fixture.
- **Where.** Inside the `likec4Fences` plugin entry (`src/fences.ts`), not as a second plugin. Its early return (`fences.ts:239`, which skips a source without ```` ```likec4 ````) widens to also match `purview:likec4`.
- **The spec, followed exactly:**
  - **Opening marker:** `<!-- purview:likec4 … -->` alone on its line, which arrives as an `html` mdast node. The closing marker `<!-- /purview:likec4 -->` is also alone on its line.
  - **Attributes:**
    - `file` is required. It is relative to the page, or `/`-rooted at the repository root, which is `markers.root` above.
    - `view` defaults to the model's first view.
    - `title`, `description`, `height` (default `420`), `collapsible`, and `defaultOpen` are optional.
  - **Code fences:** markers inside code fences are ignored. They are `code` nodes, not `html`, so this holds by construction.
  - **Transform:** the whole block, from the opening to the closing marker inclusive, is replaced by the placeholder a ```` ```likec4 file=… view=… ```` fence produces, through the same path as `file=` fences (`readFenceFile`, `layoutSource`, `fencePlaceholder`). `collapsible` and `defaultOpen` map onto the diagram shell's existing options. If the shell has none, add them; verify in `DiagramShell.astro`.
  - **Fallback:** when the model cannot be read, the view is not declared, or the page has no `fileURL` (content rendered without a file), remove the two marker nodes and keep what is between them. Then warn through the logger with page, line, and reason. Markers never throw, whatever `validation` says, because the spec defines the fallback.
  - **Malformed blocks:** an opening marker with no closing marker before the end of its parent, or nested markers. Warn, and leave the nodes as they are.
  - **MDX:** `.mdx` does not accept `<!-- -->`, so markers are `.md` only. Say so in the docs.
- **Port the reference.** purview.dev's `src/src/lib/docs/diagrams.ts` (`parseDiagramOptions`, `findDiagramBlocks`, `resolveDiagramPath`, `declaredViews`) and its tests (`src/tests/unit/docs-diagrams.test.ts`) are the behaviour to match. Port their cases to vitest in `src/__tests__/markers.test.ts`, then adapt them from string rewriting to mdast nodes.
- **Playground.** Add a `markers.md` page with one valid pair, one with an undeclared view, and one inside a code fence, under `playground/src/content/docs/`. Then extend `scripts/smoke.ts` (or `test-site.ts`) to assert the valid one renders a diagram and the invalid one shows the Mermaid code.
- **Docs, kept together** (astroc4 AGENTS.md):
  - the README option table;
  - `docs/wiki/guide/Configuration-Reference.md` (add `markers`, and the missing `validation` row);
  - `docs/wiki/guide/Fences.md` (a Markers section);
  - `docs/wiki/contributing/Architecture.md`;
  - `skills/purview-astroc4-plugin/SKILL.md`.
- **Release.** Bump `package.json` to `1.0.0-prerelease.9` and add a `CHANGELOG.md` `## [1.0.0-prerelease.9] - <date>` entry with `### Added`. Verify with `bun run test && bun run check && bun run build` and the smoke test. Push the branch and open its PR. **The user merges it**, which publishes under the `prerelease` dist-tag.

### Part B: pm-docs-site (`packages/pm-docs-site/`)

- **Option** (`lib/types.ts`, `lib/options.ts`): `architecture?: { project?: string; highlighting?: boolean }`.
  - Its presence turns LikeC4 on: markers and ```` ```likec4 ```` fences in repository docs.
  - `project` is a LikeC4 project folder (one with a LikeC4 config and a `views/` folder), relative to the site root. When set, the package also renders the template's view-folder pages.
  - `highlighting` is passed through to astroc4 (default `true`).
  - The option name is the one R-013's spec, sections 3 and 4, consumes. `upgrade` maps the template manifest's `LIKEC4_DIR` to `project`.
- **Loading.** `@purview-dev/astroc4` is an **optional peer dependency**, with its peers `likec4`, `@likec4/core`, `shiki`, and `@astrojs/markdown-satteri`. The package already has `react`, `react-dom`, and `@astrojs/react`.
  - `lib/index.ts` imports astroc4 with a dynamic `import()` only when `architecture` is set.
  - A missing install throws one error naming the `bun add` command. The README and the R-013 skill rewrite carry the same command.
  - It adds astroc4 as a Starlight plugin through the package's `starlight()` call, with `projects: { architecture: <project> }` when `project` is set, `fences: true`, and `markers: { root: <resolved docs.root, else the site root> }`.
  - For this repository, `docs.root` is `..`, the repository root, so `docs/wiki/diagrams/pm-skills.c4` is inside it.
  - Add a demo or package fixture whose docs root sits outside the site root and holds a model, so the out-of-site case is tested.
- **Processor order.** astroc4 appends to an existing Sätteri processor (`integration.ts:256-265`). R-013's Pele processor is set by `pmDocsSite` before astroc4 runs, so the two compose. No change is needed in R-045; R-013 verifies it.
- **Page location.**
  - `src/loaders/repo-docs.ts:42` already passes `fileURL: pathToFileURL(file)` to `renderMarkdown`, so `file=` paths resolve against the real page. Verify only; nothing to build.
  - ADR sections (`src/loaders/adrs.ts`) have no page file, so markers there fall back to Mermaid. Agent's call: ADRs are exported text (ADR-002), so their markers cannot name a path relative to a page.
- **View-folder pages.** Port `templates/architecture/src/lib/architecture.ts` (`viewsIn`, `viewGroups`) and its test, plus `src/pages/architecture/[group].astro`, into the package.
  - The route is injected only when `project` is set, and the views directory comes from the resolved option, not a placeholder.
  - Add an "Architecture" sidebar group or link when pages exist. Builder's call where it sits.
  - Link only the parts that exist: the view-folder pages' internal links, and links from `index` if it lists views.
- **Demo.** Add a LikeC4 project to `examples/demo/` (for example `examples/demo/architecture/likec4/`, with a `likec4.config.json` and `views/` with two folders). Add one marker pair in a demo docs page, plus the dependencies (`@purview-dev/astroc4@1.0.0-prerelease.9`, exact, and its peers).
  - `examples/demo/expected-pages.txt` gains the `/architecture/<group>/` pages.
  - `scripts/check-demo.ts` asserts the marker page holds a LikeC4 placeholder and no `mermaid` code block.
- **No-architecture build.** A package test builds a fixture site without `architecture` and without astroc4 resolvable. The existing pack-and-install test already has no astroc4, so assert it still passes and that its output has no astroc4 script.
- **Package version.** Stays `0.1.0-pre.3`. R-013 publishes `0.1.0-pre.4` with R-045 in it (R-013 spec, decision 1).
- **Docs.** The package README and `docs/wiki/guide/Docs-Site-Package.md` gain an Architecture section: the option, the install command, the marker (linking the spec), and the fallback.

### Order and dependency

1. Part A is built, its PR opened, and **merged by the user**. `1.0.0-prerelease.9` is then on npm.
2. Part B develops against the local astroc4 build. Agent's call: `bun link`, or `file:` temporarily, never committed.
3. Before the R-045 checks run, Part B's demo and package pin `1.0.0-prerelease.9` from npm.
4. If Part A's PR is not merged when Part B is otherwise done, R-045 stops at `execute` with an open question for the user. It does not close.

## Testing

- **astroc4:** marker unit tests ported from purview.dev, a playground build, and the smoke assertions; `bun run test`, `check`, and `build` pass.
- **pm-docs-site:** `viewsIn` and `viewGroups` unit tests (ported); option resolution tests (`architecture` absent, `{}`, and `{ project }`); the missing-astroc4 error test; the no-architecture build. `just package-test` passes with the demo's LikeC4 project and marker.
- **Repository:** `just validate`, `just lint-check`, and `just version-check` pass. A change under `packages/**` needs no rules bump, but this branch already carries R-013's planned rules work. R-045 touches nothing under `skills/` except the templates it reads.

## Left to the builder

- astroc4 internals: how the marker step shares `likec4Fences`'s node helpers, and the warning wording.
- The demo model's content (a small system with two view folders).
- Where the Architecture link sits in the sidebar.

## Ramifications

- **Cross-repository:** R-045 depends on an astroc4 release the user merges. astroc4's `markers` default `true` changes nothing for pages without markers.
- **Dependencies:** consumers who turn on `architecture` install astroc4 and LikeC4, which adds weight only for them.
- **Follow-up to park:** purview.dev adopts astroc4's `markers` instead of its sync-time rewrite.
