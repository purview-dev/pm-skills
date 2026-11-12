---
name: pm-docs-site
description: Use when the user asks for a project documentation site, a docs site, or a local web page of the plan, board, roadmap, or log; asks to add a module (repository docs, LikeC4 architecture, Aspire resource) or a page to that site; asks whether the site is current; or pm-export's schemaVersion has moved past the site's. Plans the site as a roadmap item, builds or upgrades it from shipped Astro and Starlight templates inside that item's workflow, and checks an existing site against its spec (read-only).
---

# pm-docs-site

Build and maintain a local Astro and Starlight site that renders
`<PM root>/planning.json`: Home, Board, Roadmap, Log, and Risks, plus optional
modules. The site only reads the export. Changing the plan still goes
through the other `pm-*` skills, and a stale page is fixed with
`pm-export`.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Persistence, Committing PM state, Asking the
user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

Spec: `references/spec.md` in this skill's folder. Templates:
`templates/site/` (the core) and `templates/<module>/` with its
`MODULE.md`. This skill reads schemaVersion 3.

## Modes

| Mode | Kind | When | Effect |
| --- | --- | --- | --- |
| `plan [<module or extension>]` | PM | Default when no docs-site item is active: "add a docs site", "put the plan on a web page", "add the architecture views to the site" | Add one roadmap item; one PM commit |
| `check` | Read-only | "is the docs site current?", after `pm-export` reports a new schema, or during a workflow | Compare the site with the templates and the export; write nothing |
| `scaffold` | Build | The active docs-site item's plan step says to build the site | Write the core site and the modules named in the item |
| `extend <module>` | Build | The active item adds `repo-docs`, `architecture`, or `aspire` to an existing site | Add one module |
| `upgrade` | Build | `check` reports an older `SCHEMA_VERSION` or template drift, and the active item is the upgrade | Bring the site to the current templates and packages |

Modules: `repo-docs`, `architecture`, `aspire` (spec sections 9 and 10).
Extensions: `now`, `inbox`, `briefs`, `strategy` (spec section 12); they
have no templates and are only ever planned as items.

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
  | The active item's `Note` names `pm-docs-site` | `<ID> is not a docs-site item. Run pm-docs-site plan.` |
  | `NOW.md`'s stage is `execute` | `pm-docs-site builds in execute; <ID> is at <stage>.` |
  | The current branch is not the PM branch | `Build modes never write on the PM branch (<branch>).` |
  | `bun --version` succeeds | `Bun is required: https://bun.sh. Install it, then run pm-docs-site <mode> again.` |

- Build modes write only the site root, the `Docs` group in the
  `justfile`, and, for `aspire`, the files its `MODULE.md` lists. They
  never stage, commit, push, or create branches: the workflow commits.
- Never write template-owned files by hand: `scripts/site.ts` renders them
  from the manifest. Only the site-owned files (below) are edited by hand.
  Keep the MIT attribution comment in each `src/components/lib/` file.
  Never fill a page from anything but the export (spec rules 1 and 3), and
  never copy a `docs/` or PM file into the site (spec rule 6).
- Never invent a value for a placeholder. Derive it from the repository
  as the table says, or ask.

## Manifest and render script

Each site records how it was rendered in `<site root>/pm-docs-site.json`:

```json
{
  "schemaVersion": 3,
  "modules": ["repo-docs"],
  "values": { "SITE_TITLE": "...", "SITE_ROOT": "src/docs-site", "...": "..." }
}
```

`modules` lists any of `repo-docs`, `architecture`, `aspire`; `values`
holds every placeholder below except the `MODULE_*` ones. `scripts/site.ts`
in this skill's folder renders `templates/site/`, then each listed
module's files over it (a module file with the same path replaces the core
file; `MODULE.md` and `*.cs` are never rendered):

| Command | Effect |
| --- | --- |
| `bun <skill>/scripts/site.ts check <site root>` | Read-only. Prints `current`, or one `differs: <path>` line per template-owned file that is missing or different, and exits 1 |
| `bun <skill>/scripts/site.ts write <site root> [--keep <path>]...` | Writes every template-owned file that differs, except the kept ones, and each site-owned file that is missing |

Site-owned files are written once and never compared or overwritten:
`package.json` (Bun adds the dependencies) and, with `repo-docs`,
`src/docs-sources.ts` (the repository's Markdown sources). The `aspire`
module's AppHost files are outside the site and follow its `MODULE.md`.

## Placeholders

| Placeholder | Value |
| --- | --- |
| `{{SITE_TITLE}}` | `<Project name> project`, the name from the README's first heading or the repository folder |
| `{{SITE_DESCRIPTION}}` | `The plan for <Project name>, from <PM root>planning.json.`; add `, its docs and architecture views` per module |
| `{{PACKAGE_NAME}}` | `<project-slug>-docs-site` |
| `{{SITE_ROOT}}` | The site folder, repository-relative, no trailing slash (default `src/docs-site` when `src/` exists, else `docs-site`) |
| `{{SITE_TO_ROOT}}` | The repository root relative to the site root (`../..` for `src/docs-site`) |
| `{{PM_ROOT}}` | The PM root with its trailing slash (`planning/`) |
| `{{SPECS_DIR}}`, `{{PLANS_DIR}}` | `repo-docs` only: the design and plan output folders from the Handoffs table in `config.md`, relative to `docs/` (`superpowers/specs`, `superpowers/plans`) |
| `{{LIKEC4_DIR}}`, `{{LIKEC4_VERSION}}` | `architecture` module only: see its `MODULE.md` |
| `{{APPHOST_TO_SITE}}`, `{{RESOURCES_CLASS}}`, `{{KIT_NAMESPACE}}` | `aspire` module only: see its `MODULE.md` |
| `{{MODULE_REPO_DOCS}}`, `{{MODULE_ARCHITECTURE}}` | Set by `site.ts`: `true` when `modules` lists the module, else `false`. Never in `values` |

## Steps (plan)

1. **Find the site.** Search the repository, excluding `node_modules/`,
   for a `pm-docs-site.json`, or for a `src/lib/planning.ts` that contains
   `PlanningExportError` (a site built before the manifest). When one
   exists and the request is for the core site, reply `A docs site exists
   at <site root>.` and run `check` instead.
2. **Profile the repository.** Record, citing paths: the PM root; whether
   `<PM root>/planning.json` exists; the specs and plans folders from the
   Handoffs table; `docs/` and its `*.md` count; a LikeC4 model (`*.c4`
   files beside a `views/` folder); an Aspire AppHost (a project with
   `Sdk="Aspire.AppHost.Sdk"`) and whether it uses
   `Purview.Aspire.ResourceKit`; AppHost composition tests; a `justfile`;
   and whether `bun --version` succeeds.
3. **Ask** with the question tool, up to 4 at once:
   - The site root, with the default from the Placeholders table first,
     marked recommended.
   - For the core site, the modules to include: multi-select of the modules
     whose content exists from step 2. Omit the question when none exists.
   - The position: `Bottom of Later (recommended)`, `Bottom of Next`, with
     the `Show the roadmap` escape option.
4. **Challenge** the item (Challenge protocol). The core site is size `M`
   and needs every check; a module or an extension is `S` and needs checks
   1, 2, and 5. Use the profile as evidence: no `planning.json` yet means
   the item depends on running `pm-export` first.
5. **Add the item** (Roadmap order and edits: add), with:
   - Title: `Project docs site`, `Docs site: <module> module`, `Docs site:
     <extension> page`, or `Docs site: upgrade to schemaVersion <n>`.
   - `Serves` and `Milestone`: ask, offering the `V` lines and milestones
     the item fits, with the reference legend.
   - `Owner: agent`. `Size` from step 4.
   - `Done when`: the spec section 11 acceptance checks that apply, joined
     with `;`. For an extension, add `the page shows only export values`.
   - `Note: Build with pm-docs-site <scaffold | extend <module> | upgrade>
     at <site root> (modules: <list | none>). Spec: pm-docs-site
     references/spec.md.` For an extension: `Build from pm-docs-site
     references/spec.md section 12 (<extension>); no template exists.`
6. **Commit** the PM state (rules: Committing PM state) with
   `docs(pm): add <ID> docs site`.
7. Show the output.

## Steps (check)

1. **Find the site** as in plan step 1. If none exists, reply `No docs
   site. Run pm-docs-site plan.` Stop. If it has no `pm-docs-site.json`,
   reply `<site root> predates the manifest.` and recommend an upgrade
   item; stop.
2. **Versions.** Compare the manifest's `schemaVersion`, the
   `schemaVersion` of `<PM root>/planning.json` (if it exists), and this
   skill's (`This skill reads schemaVersion` above).
3. **Files.** Run `bun <skill>/scripts/site.ts check <site root>`. It
   writes nothing.
4. **Report** the first difference in one line, in this order of
   precedence:
   - `The site reads schemaVersion <n>; the export is <m>.` (the export is
     newer: upgrade; the export is older: run `pm-export`)
   - `The site reads schemaVersion <n>; pm-docs-site templates read <m>.`
   - `<path> differs from the template.` (the first `differs:` line, with
     the count of the others)
   - `current`.
5. Never run `bun install` or the build here. Recommend `just docs-check`
   (or the `bun` commands in spec section 8) for the build check.
6. If the site needs an upgrade and no workflow is active, ask one choice
   question: `Plan the docs-site upgrade?` with `Add an upgrade item
   (recommended)` (run `plan` with the upgrade title) and `Leave it`.

## Steps (scaffold)

1. Confirm the build-mode guard. Read the site root and modules from the
   active item's `Note`.
2. If the site root exists and is not empty, reply `<site root> exists.
   Run pm-docs-site check.` Stop.
3. **Manifest.** Resolve the core placeholder values (Placeholders) and
   write `<site root>/pm-docs-site.json` with this skill's
   `schemaVersion`, `"modules": []`, and the values. Modules are added in
   step 6, after the core installs.
4. **Render** with `bun <skill>/scripts/site.ts write <site root>`.
5. **Install** the latest packages, in the site root:

   ```bash
   bun add astro @astrojs/starlight
   bun add -d @astrojs/check typescript@6 vitest
   ```

   This writes `bun.lock`.
   Record each installed version for the output. TypeScript is the one
   pinned major: `astro check` refuses TypeScript 7 (verified with
   `@astrojs/check` 0.9.12). When `astro check` reports that it supports a
   newer TypeScript, drop the pin here and in `upgrade`.
6. **Modules.** For each module in the `Note`, run the `extend` steps 2
   to 4.
7. **Commands.** When a `justfile` exists, add the `Docs` group from spec
   section 8, with `<site root>` replaced. Never add or change its shell
   settings. Otherwise put the commands in
   the output `Note`.
8. **Verify:** `site.ts check` prints `current`, then in the site root
   `bun run test`, `bun run check`, and `bun run build`. When
   `planning.json` is missing from this checkout, `check` and `build` fail
   with `No plan export at <path>.` by design: report it as `Build: needs
   <PM root>planning.json in this checkout` and leave the acceptance check
   open.
9. Show the output. The workflow commits the files.

## Steps (extend)

1. Confirm the build-mode guard and that the site and its manifest exist.
   Otherwise reply `No docs site. Run pm-docs-site plan.` Stop.
2. Read `templates/<module>/MODULE.md`. If its **Applies when** fails,
   reply `<module>: <the missing content>.` Stop.
3. Run the module's **Install** (some values, such as the installed
   LikeC4 version, exist only after it), add the module and its **Values**
   to the manifest, then run `site.ts write <site root>`.
4. Apply the rest of its `MODULE.md`: adjust the site-owned
   `src/docs-sources.ts` to the repository (`repo-docs` **Sources**), or
   the AppHost (`aspire`). Run its **Check**, then the verify step of
   `scaffold`.
5. Show the output.

## Steps (upgrade)

1. Confirm the build-mode guard. A site without a manifest gets one first:
   recover the values from its files and ask for any that cannot be
   recovered. Set the manifest's `schemaVersion` to this skill's.
2. Run `site.ts check <site root>`. For each `differs:` file that has
   local changes (`git diff` against the last commit that `site.ts` wrote
   it, or a visible edit), show the difference and ask one choice question
   per file: `Replace <path> with the template?` with `Replace it
   (recommended)` and `Keep the local file`.
3. **Write** with `site.ts write <site root>`, passing `--keep <path>` for
   each kept file. Name kept files in the output `Note`; a kept file that
   no longer type-checks is reported, not fixed.
4. **Update** the packages to their latest versions, in the site root:
   `bun update --latest`, then `bun add -d typescript@6` to keep the pin
   from `scaffold` step 5.
5. **Verify** as in `scaffold` step 8, then show the output.

## Output (plan)

```markdown
## Docs site: <ID> <title>

- Site: <site root> (modules: <list | none>)
- Export: <PM root>planning.json <present | missing: run pm-export first>
- Roadmap: <ID> at <section> <position>
- PM state: <commit result>

## Do this next

1. <Run pm-export | Claim <ID>>
   - Start with: <pm-export | pm-next <ID>>
   - Done when: <observable check>

## Note

- <challenges and answers, assumptions>
```

## Output (check)

```markdown
## Docs site check

- Site: <site root>, schemaVersion <n> (templates: <m>, export: <k | none>)
- Modules: <list | none>
- Result: <current | first difference>

## Do this next

1. <one action>
   - Start with: <skill or command>
   - Done when: <observable check>
```

## Output (scaffold, extend, upgrade)

```markdown
## Docs site <scaffolded | extended with <module> | upgraded>: <ID>

- Site: <site root> (modules: <list | none>)
- Files: <n> written, <n> kept (<paths>)
- Packages: <name version, one per package installed or updated>
- Verify: tests <pass | fail>, astro check <0 errors | n errors>, build <pass | fail | needs planning.json>

## Do this next

1. <Continue the plan at its next step | Fix the first failure>
   - Start with: <the plan step or failing command>
   - Done when: <observable check>

## Note

- <kept files, commands for a repository without a justfile, the open acceptance checks>
```
