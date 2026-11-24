---
name: pm-docs-site
description: Use when the user asks for a project documentation site, a docs site, or a local, searchable web page of the plan, board, roadmap, milestones, features, or log; asks to add a module (repository docs, LikeC4 architecture, Aspire resource), a view, or a page to that site; asks whether the site is current; or pm-export's schemaVersion has moved past the site's. Plans the site as a roadmap item, builds it on the @purview-dev/pm-docs-site package (four files) or migrates a template-built site onto it inside that item's workflow, and checks an existing site (read-only).
---

# pm-docs-site

Build and maintain a local Astro and Starlight site that renders
`<PM root>/planning.json`, on the `@purview-dev/pm-docs-site` package: Home,
Board, Roadmap, Log, and Risks; by default the Now, Milestones, Graph,
Features, Inbox, Briefs, Strategy, and Decisions views; site search over all
of them; and the optional modules. The site is four files (`package.json`,
`astro.config.ts`, `bun.lock`, `.gitignore`), and every page comes from the
package. The site only reads the export. Changing the plan still goes
through the other `pm-*` skills, and a stale page is fixed with `pm-export`.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Persistence, Committing PM state, Asking the
user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

Spec: `references/spec.md` in this skill's folder. The Aspire AppHost
snippets: `templates/aspire/MODULE.md`.

## Package

Minimum package version: `0.1.0-pre.4`

This skill reads schemaVersion 5.

The package's README (`node_modules/@purview-dev/pm-docs-site/README.md` in
the site root) documents every option and the CLI. The skill installs the
newest release and pins it exactly, so a build stays reproducible:

```bash
bun add @purview-dev/pm-docs-site --exact
```

A site whose installed version is below the minimum, or whose package does
not read the export's `schemaVersion`, is upgraded (`upgrade`).

`scripts/consumer.ts` in this skill's folder writes a package site, and
migrates a site the old templates rendered (it has `pm-docs-site.json`):

| Command | Effect |
| --- | --- |
| `bun <skill>/scripts/consumer.ts write <site root> --options '<json>'` | Writes `astro.config.ts` from the `pmDocsSite()` options, `package.json` (the CLI's scripts, no dependencies), and `.gitignore` when missing |
| `bun <skill>/scripts/consumer.ts inspect <site root>` | Read-only. Prints JSON: `listed` (template files present), `unlisted` (files that are not template files), `options` (mapped from the manifest), `extraConfig` (the site's `astro.config.mjs` when it holds more than the template's), `architectureDir` |
| `bun <skill>/scripts/consumer.ts migrate <site root> [--include-unlisted]` | Deletes the `listed` files and the manifest (last), writes `astro.config.ts` and `package.json`. With an unlisted file and no `--include-unlisted`, deletes nothing, lists the files, and exits 1 |

The template files are frozen in `references/template-files.md`; `migrate`
deletes only those paths.

## Modes

| Mode | Kind | When | Effect |
| --- | --- | --- | --- |
| `plan [<module or view>]` | PM | Default when no docs-site item is active: "add a docs site", "put the plan on a web page", "add the architecture views to the site", "add the features page" | Add one roadmap item; one PM commit |
| `check` | Read-only | "is the docs site current?", after `pm-export` reports a new schema, or during a workflow | Compare the site's package with the minimum and the export; write nothing |
| `scaffold` | Build | The active docs-site item's plan step says to build the site | Write the four files, the `Docs` group, and the modules named in the item |
| `extend <module or view>` | Build | The active item adds `repo-docs`, `architecture`, or `aspire`, or switches a view on or off | Change one option in `astro.config.ts`, or run the Aspire step |
| `upgrade` | Build | `check` reports a package below the minimum, an unsupported schema, or a template site, and the active item is the upgrade | Move the site to the newest package, or migrate a template site onto it |

Modules: `repo-docs` (the `docs` option), `architecture` (the
`architecture` option), `aspire` (the Aspire step; spec section 6). Views:
`now`, `milestones`, `graph`, `features`, `inbox`, `briefs`, `strategy`,
`decisions`. Every view is on unless the `views` option leaves it out.
Search is part of the package.

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- **Never write the PM root from a build mode**: not `planning.json`, its
  schema, or any other PM file (spec rule 2). A missing or stale export is
  fixed with `pm-export`.
- `plan` is a PM state run: Non-interruption rule 6 applies, and during an
  active workflow apply rule 4 and stop.
- `check` is read-only and may run during a workflow (Non-interruption
  rule 3). Resume the step in progress afterwards.
- **Build modes** (`scaffold`, `extend`, `upgrade`) follow Non-interruption
  rule 9. Before writing anything, confirm every condition and stop at
  the first that fails, with its reply:

  | Condition | Reply |
  | --- | --- |
  | `NOW.md` is active and its `Session` equals the current branch | `No docs-site item is active here. Run pm-docs-site plan.` |
  | The active item's `Note` names `pm-docs-site` | `<ID> <title> is not a docs-site item. Run pm-docs-site plan.` |
  | `NOW.md`'s stage is `execute` | `pm-docs-site builds in execute; <ID> <title> is at <stage>.` |
  | The current branch is not the PM branch | `Build modes never write on the PM branch (<branch>).` |
  | `bun --version` succeeds | `Bun is required: https://bun.sh. Install it, then run pm-docs-site <mode> again.` |

- Build modes write only the site root (its four files, and `bun add` of
  the package and the architecture peers there), the `Docs` group in the
  `justfile`, and the AppHost files the Aspire step edits on the user's
  yes. They never stage, commit, push, or create branches: the workflow
  commits.
- A package site has no pages, components, or `src/` folder: never add
  one. Edit only the `pmDocsSite()` options in `astro.config.ts` and the
  scripts in `package.json`; `upgrade` also adds, from `extraConfig`, the
  other integrations beside `pmDocsSite(...)` and the top-level options
  (`site`, `base`) in `defineConfig`, and nothing else. Never fill a page from anything but the export
  (spec rules 1 and 3), and never copy a `docs/` or PM file into the site
  (spec rule 6).
- Never invent an option value. Derive it from the repository as the steps
  say, or ask.

## Steps (plan)

1. **Find the site.** Search the repository, excluding `node_modules/`,
   for an `astro.config.ts` that imports `@purview-dev/pm-docs-site` (a
   package site), a `pm-docs-site.json` (a template site), or a
   `src/lib/planning.ts` that contains `PlanningExportError` (a template
   site built before the manifest). When one exists and the request is for
   the core site, reply `A docs site exists at <site root>.` and run
   `check` instead.
2. **Profile the repository.** Record, citing paths: the PM root; whether
   `<PM root>/planning.json` exists; the specs and plans folders from the
   Handoffs table; `docs/` and its `*.md` count; a LikeC4 model (a folder
   with a LikeC4 config file and a `views/` folder of `*.c4` files); an
   Aspire AppHost (a project with `Sdk="Aspire.AppHost.Sdk"`, or an
   `apphost.mts` or `apphost.ts` that imports Aspire) and whether a C#
   AppHost uses `Purview.Aspire.ResourceKit`; AppHost composition tests; a
   `justfile`; and whether `bun --version` succeeds.
3. **Ask** with the question tool, up to 4 at once:
   - The site root: `docs-site` (recommended) when `src/` does not exist,
     else `src/docs-site` (recommended); the other is the second option.
   - For the core site, the modules to include: multi-select of the modules
     whose content exists from step 2. Omit the question when none exists.
   - For the core site, the views: `Every view (recommended)` (Now,
     Milestones, Graph, Features, Inbox, Briefs, Strategy, Decisions) or
     `Core pages only` (Home, Board, Roadmap, Log, Risks); the free-text
     entry names a subset.
   - The position: `Bottom of Later (recommended)`, `Bottom of Next`, with
     the `Show the roadmap` escape option.
4. **Challenge** the item (Challenge protocol). The core site is size `M`
   and needs every check; a module or a view is `S` and needs checks 1, 2,
   and 5. Use the profile as evidence: no `planning.json` yet means the
   item depends on running `pm-export` first. A page that no package view
   renders is not a site item: reply `No @purview-dev/pm-docs-site view
   renders <page>. A new page is a package change; park it with pm-park.`
   and stop.
5. **Add the item** (Roadmap order and edits: add), with:
   - Title: `Project docs site`, `Docs site: <module> module`, `Docs site:
     <view> view`, or `Docs site: upgrade to the pm-docs-site package`.
   - `Serves` and `Milestone`: ask, offering the `V` lines and milestones
     the item fits, with the reference legend.
   - `Owner: agent`. `Size` from step 4.
   - `Done when`: the spec section 7 acceptance checks that apply, joined
     with `;`.
   - `Note: Build with pm-docs-site <scaffold | extend <module or view> |
     upgrade> at <site root> (modules: <list | none>; views: <all | list |
     none>). Spec: pm-docs-site references/spec.md.`
6. **Commit** the PM state (rules: Committing PM state) with
   `docs(pm): add <ID> docs site`.
7. Show the output.

## Steps (check)

1. **Find the site** as in plan step 1. If none exists, reply `No docs
   site. Run pm-docs-site plan.` Stop. A template site (a
   `pm-docs-site.json`, or a `src/lib/planning.ts` without one) reports
   `template site (run upgrade)`; go to step 4.
2. **Package version.** Read the `@purview-dev/pm-docs-site` dependency in
   `<site root>/package.json`. For a version, compare it with `Minimum
   package version` in SemVer order. For a `file:` path, read the
   `version` in that folder's `package.json` instead.
3. **Schema.** Read the `schemaVersion` of `<PM root>/planning.json` (if
   it exists) and `SUPPORTED_SCHEMA_VERSIONS` in the installed package's
   `lib/schema-version.ts`. When `<site root>/node_modules/` exists, run
   `bun run check` in the site root (`pm-docs-site check`: it reads the
   export and the docs sources and builds nothing). Never run `bun install`
   or the build here.
4. **Report** the first finding in one line, in this order of precedence:
   - `template site (run upgrade)`
   - `package below minimum (<installed> < <minimum>)`
   - `schema unsupported` (`The package reads schemaVersion <list>; the
     export is <k>.` An export older than the list: run `pm-export`.)
   - The first line `pm-docs-site check` printed, when it exited 1.
   - `current`.
5. Recommend `just docs-check` (or the `bun` commands in spec section 5)
   for the build check.
6. If the site needs an upgrade and no workflow is active, ask one choice
   question: `Plan the docs-site upgrade?` with `Add an upgrade item
   (recommended)` (run `plan` with the upgrade title) and `Leave it`, with
   the `Show the roadmap` escape option.

## Steps (scaffold)

1. Confirm the build-mode guard. Read the site root, modules, and views
   from the active item's `Note`.
2. If the site root exists and is not empty, reply `<site root> exists.
   Run pm-docs-site check.` Stop.
3. **Options.** Build the `pmDocsSite()` options:
   - `title`: `<Project name> project`, the name from the README's first
     heading, else the repository folder.
   - `description`: `The plan for <Project name>, from <PM
     root>planning.json.`; add `, its docs and architecture views` for each
     module that adds them.
   - `planning`: `<site to root>/<PM root>planning.json`, written only when
     it is not `../planning/planning.json`.
   - `docs`, with `repo-docs`: as in `extend` (repo-docs).
   - `views`: only when the `Note` names fewer than every view (`views:
     none` is `[]`).

   Put `title` and `description` in the output `Note` so the user can
   correct them.
4. **Write** with `bun <skill>/scripts/consumer.ts write <site root>
   --options '<the options as JSON>'`.
5. **Install** in the site root: `bun add @purview-dev/pm-docs-site
   --exact`. This writes `bun.lock`. Record the installed version; when it
   is below `Minimum package version`, stop with `@purview-dev/pm-docs-site
   <version> is below the minimum <minimum>.`
6. **Modules.** With `architecture` in the `Note`, run the `extend`
   architecture steps.
7. **Commands.** When a `justfile` exists, add the `Docs` group from spec
   section 5, with `<site root>` replaced. Never add or change its shell
   settings. Otherwise put the commands in the output `Note`.
8. **Verify** in the site root: `bun run check`, then `bun run build`. The
   build writes the search index: confirm `dist/pagefind/pagefind-entry.json`
   exists and report its `page_count` as `Search: <n> pages indexed`. When
   `planning.json` is missing from this checkout, both fail with `No plan
   export at <path>.` by design: report it as `Build: needs <PM
   root>planning.json in this checkout` and leave the acceptance check
   open. When `bun <pm-export skill>/scripts/export.ts check` reports the
   export stale, report it in the `Note`: the pages show the plan as last
   exported, and `pm-export` refreshes it (spec rule 2).
9. **Aspire.** Run the Aspire step.
10. Show the output. The workflow commits the files.

## Steps (extend)

1. Confirm the build-mode guard and that the site is a package site
   (`astro.config.ts` imports `@purview-dev/pm-docs-site`). A template site:
   reply `<site root> is a template site. Run pm-docs-site upgrade.` No
   site: reply `No docs site. Run pm-docs-site plan.` Stop.
2. Apply the one change:
   - **A view:** set the `views` option to the views the item names, and
     remove it when that is every view.
   - **`repo-docs`:** set `docs: { root: '<site to root>', sources: [...] }`.
     Each source has `label` (its sidebar group), `base` (a folder from the
     repository root), `include` globs, and optionally `prefix`,
     `indexFile`, `order: 'desc'` (date-named files), `collapsed`, and
     `hidden`. With `docs/`: `Overview` (`docs`, `*.md`), `Design records`
     and `Plans` (the specs and plans folders from the Handoffs table,
     `order: 'desc'`, `Plans` collapsed), then `More` (`docs`, `**/*.md`,
     `hidden: true`). Without `docs/`, list the Markdown the repository
     has (`{ label: 'Project', base: '.', include: ['README.md'], prefix:
     'project/' }`). Never move or copy a file to fit a source. A source
     that would give a page the ID `index` needs a `prefix`.
   - **`architecture`:** find the LikeC4 model folder (the one that holds
     `views/`). When it has no LikeC4 config file (`likec4.config.json`,
     `.likec4rc`, `likec4.config.ts`, or another name LikeC4 reads), reply
     `<folder>: no LikeC4 config file.` and stop; never create one. Set
     `architecture: { project: '<site to root>/<folder>' }`. In the site
     root, run `bunx pm-docs-site peers architecture` and run the command
     it prints there.
   - **`aspire`:** run the Aspire step, then show the output. Stop.
3. **Verify** as in `scaffold` step 8. With `architecture`, the build also
   writes one `architecture/<folder>/index.html` per folder under
   `views/`.
4. Show the output.

## Steps (upgrade)

1. Confirm the build-mode guard.
2. **A package site** (no `pm-docs-site.json`): in the site root, record
   the installed `@purview-dev/pm-docs-site` version from `package.json`,
   then run `bun add @purview-dev/pm-docs-site@latest --exact`. A `file:`
   dependency keeps its path: run `bun install` instead. Compare the
   installed version after the add with `Minimum package version` and with
   the version recorded before it, in SemVer order. Below either, restore
   `package.json` and `bun.lock` to their state before the add and stop
   with `package below minimum (<installed> < <minimum>)` or `latest is
   older than the installed version (<installed> < <previous>)`. With the
   `architecture` option set, run the command `bunx pm-docs-site peers
   architecture` prints. Go to step 9.
3. **A template site** without a manifest (a `src/lib/planning.ts` with
   `PlanningExportError`): write `pm-docs-site.json` first, with its
   `modules` and `values` (`SITE_TITLE`, `SITE_DESCRIPTION`,
   `SITE_TO_ROOT`, `PM_ROOT`, and `LIKEC4_DIR` with `architecture`)
   recovered from its files; ask for any that cannot be recovered.
4. **Inspect** with `bun <skill>/scripts/consumer.ts inspect <site root>`.
   When `unlisted` is not empty, list those paths, then ask one choice
   question: `<n> files in <site root> are not template files. How should
   upgrade continue?` with `Stop so I can move them (recommended)` and
   `Delete them too`, and the `Explain <ID>` escape option for the active
   item. On `Stop so I can move them`, reply `Upgrade stopped: <n> files
   are not template files; nothing was deleted.` and stop.
5. **Show** `extraConfig` when it is not `null`: the site's
   `astro.config.mjs` holds integrations or options the template did not.
   Print it before anything is deleted.
6. **Migrate** with `bun <skill>/scripts/consumer.ts migrate <site root>`,
   adding `--include-unlisted` on `Delete them too`. Then carry
   `extraConfig` into `astro.config.ts` by hand: other integrations go in
   `integrations` beside `pmDocsSite(...)`, and top-level options (`site`,
   `base`) in `defineConfig`. A Starlight option the template did not set
   cannot be carried, because the package configures Starlight: name it in
   the `Note`.
7. **Install** in the site root: record the installed
   `@purview-dev/pm-docs-site` version from `package.json`, when the
   template left one (otherwise there is none to compare), then run
   `bun add @purview-dev/pm-docs-site --exact`. Compare the installed
   version after the add with `Minimum package version` and, when one was
   recorded, with the version recorded before it, in SemVer order. Below
   either, restore `package.json` and `bun.lock` to their state before the
   add and stop with `package below minimum (<installed> < <minimum>)` or
   `latest is older than the installed version (<installed> < <previous>)`.
   When `architectureDir` is set, run the command `bunx pm-docs-site peers
   architecture` prints.
8. **Views and Aspire.** When the manifest listed `views`, the mapped list
   is kept; when it lacks `graph` or `decisions`, add the `Note` line
   `Views graph and decisions are off: the site's views list predates
   them. Add them to views in astro.config.ts to turn them on.` An AppHost
   that already runs the site keeps its snippet (the site folder and the
   `dev` script are unchanged). A site without one runs the Aspire step
   after step 9.
9. **Verify** as in `scaffold` step 8, then show the output. Pass on
   `migrate`'s `Note` lines: a hand edit to a removed template file is
   lost, and `git show HEAD:<path>` recovers it.

## Aspire step

Runs in `scaffold`, `extend aspire`, and the `upgrade` of a site without
an AppHost resource.

1. **Detect** the AppHost: a project with `Sdk="Aspire.AppHost.Sdk"`, or an
   `apphost.mts` or `apphost.ts` that imports Aspire. None found: skip, and
   put `Aspire: no AppHost found.` in the `Note`. An AppHost that already
   has a `docs` resource: skip, with `Aspire: already in <path>.`
2. **Ask** one choice question: `Add the docs site to the Aspire AppHost
   <path>?` with `Add it (recommended)` and `Leave the AppHost alone`, and
   the `Explain <ID>` escape option for the active item. Record the answer
   in the `Note` (`Aspire: added to <path>` or `Aspire: left alone at the
   user's request`). The AppHost edit is the record of a yes; a no is not
   stored.
3. **On yes, C#:** follow `templates/aspire/MODULE.md`, the ResourceKit or
   plain variant as its **Applies when** says.
4. **On yes, TypeScript:** in the AppHost file, after the other resources
   and before `build()`, in run mode only:

   ```ts
   // The project site: a local reading aid, so it runs only when the AppHost runs.
   const executionContext = await builder.executionContext.get();
   if (await executionContext.isRunMode.get()) {
       await builder.addViteApp('docs', '<site root from the AppHost folder>').withBun(true, ['--frozen-lockfile']);
   }
   ```

   Before editing, confirm the names against the AppHost's Aspire version:
   `aspire docs api get typescript/aspire.hosting.javascript/addviteapp`,
   `typescript/aspire.hosting.javascript/javascriptappresource/withbun`, and
   `typescript/aspire.hosting/distributedapplicationexecutioncontext` (or
   <https://aspire.dev>), and read properties the way the AppHost already
   does. Use the documented form when one differs, and name it in the
   `Note`. Never edit `.aspire/modules/`.
5. **Tests.** Only when the repository has AppHost composition tests, ask
   `Add the two AppHost tests?` with `Add them (recommended)` and `Skip the
   tests`, and the `Explain <ID>` escape option for the active item. On
   yes, add the two tests in `MODULE.md` **Tests**. Record the answer in
   the `Note`; with no composition tests, add none and say so.
6. **Check.** C# AppHost — as `MODULE.md` **Check** says. TypeScript
   AppHost — run the AppHost (`aspire run`) and confirm the `docs` resource
   serves the Home page, then stop it.

## Output (plan)

```markdown
## Docs site: <ID> <title>

- Site: <site root> (modules: <list | none>)
- Export: <PM root>planning.json <present | missing: run pm-export first>
- Roadmap: <ID> <title> at <section> <position>
- PM state: <commit result>

## Do this next

1. <Run pm-export | Claim <ID> <title>>
   - Start with: <pm-export | pm-next <ID>>
   - Done when: <observable check>

## Note

- <challenges and answers, assumptions>
```

## Output (check)

```markdown
## Docs site check

- Site: <site root>, @purview-dev/pm-docs-site <installed | file:<path> (<version>) | template site> (minimum: <minimum>)
- Schema: the package reads <list>; the export is <k | none>; this skill reads <n>
- Modules: <list | none>. Views: <all | list | none>
- Result: <current | package below minimum (<installed> < <minimum>) | schema unsupported | template site (run upgrade) | first pm-docs-site check line>

## Do this next

1. <one action>
   - Start with: <skill or command>
   - Done when: <observable check>
```

## Output (scaffold, extend, upgrade)

```markdown
## Docs site <scaffolded | extended with <module or view> | upgraded>: <ID> <title>

- Site: <site root> (modules: <list | none>; views: <all | list | none>)
- Files: <n> written, <n> removed (<paths, or the count of template files>)
- Packages: <name version, one per package installed or updated>
- Verify: pm-docs-site check <pass | fail>, build <pass | fail | needs planning.json>
- Search: <n pages indexed | not built>
- Aspire: <added to <path> | left alone | already in <path> | no AppHost found>

## Do this next

1. <Continue the plan at its next step | Fix the first failure>
   - Start with: <the plan step or failing command>
   - Done when: <observable check>

## Note

- <title and description, the Aspire and test answers, extra config carried or not, views left off, git show HEAD:<path> to recover a removed file, commands for a repository without a justfile, the open acceptance checks>
```
