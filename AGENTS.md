# Agent instructions

## Project structure and architecture

This repository packages project-management workflows as reusable agent
skills. Each `skills/pm-*/SKILL.md` defines a skill's trigger, guardrails,
steps, and output format. `pm-init` supplies the templates for the state
those skills manage in a consuming repository.

This repository dogfoods its own skills. `planning/` is its live PM state,
created by `pm-init` and changed only through the `pm-*` skills (rules
below, in the managed section); `skills/pm-init/templates/` stays the
consumer template. The managed section at the end of this file is
installed by `pm-setup` from `skills/pm-setup/references/AGENTS-section.md`,
and `docs-site/` is the project site that `pm-docs-site` builds from
`planning/planning.json`. Run `just setup-skills` once per clone so the
agents working here load `skills/pm-*` directly.

The skills form a lifecycle: `pm-setup` installs the shared rules,
`pm-init` creates project state, `pm-resume` reads it, `pm-next` claims an
item and hands off to a development workflow, `pm-checkpoint` records
progress, suspends and resumes an operation, commits the PM state, or
closes the item on its branch, and `pm-review`
triages the roadmap and inbox. `pm-rejoin` re-establishes the position
when a session drifts out of the lifecycle. `pm-park` captures ideas (from
the user or the agent) without interrupting active work. `pm-shape`
discusses and challenges one idea into a brief, `pm-discover` analyses the
existing product for evidence, and `pm-strategy` owns vision, milestones,
and roadmap generation. `pm-bug` logs a defect with the facts a fix needs
and routes it, `pm-risk` captures a risk at any time (like `pm-park`) and
manages the risk register (`RISKS.md`, RAG derived from likelihood and
impact), `pm-revise` corrects built work, and `pm-checkpoint`
`push`/`pop` suspends and resumes an operation, so an emergency never loses
work. `pm-export` writes the derived
`planning.json` and its schema inside the PM root or checks them.
`pm-purview` matches .NET projects to Purview tools using the dated
snapshot in `skills/pm-purview/references/catalogue.md`; refresh that
snapshot from `https://purview.dev/llms.txt` when Purview releases change.
`pm-export` owns `skills/pm-export/references/planning.schema.json`, the
contract for the `<PM root>/planning.json` it writes. The export is derived
output, so the schema, its `schemaVersion`, and
`skills/pm-export/references/planning.example.json` change together;
`scripts/validate.ts` fails when they drift.
`pm-docs-site` plans, builds, and checks a local Astro and Starlight site
that renders that export. Its spec is
`skills/pm-docs-site/references/spec.md`, and the site ships as templates
in `skills/pm-docs-site/templates/` (`site/` for the core, one folder per
module with a `MODULE.md`). The templates read one `schemaVersion`
(`SCHEMA_VERSION` in `templates/site/src/lib/planning.ts`, the
`planning-types.ts` literal, the fixture, and the SKILL.md sentence), and
`scripts/validate.ts` fails when it differs from the export schema, so a
schema change ships with the template change that reads it. It also checks
that every template placeholder is documented in the skill and that the
copied Astro Components Kit files keep their MIT attribution. The skill is
the one exception to the PM-root-only boundary: its build modes write the
site, as a step of the site item's `execute` stage (Non-interruption rule 9
in the managed section), and never commit.
`skills/pm-docs-site/scripts/site.ts` renders a site from its manifest
(`<site root>/pm-docs-site.json`) and the templates, and either writes the
template-owned files or checks them. `docs-site/` is rendered this way, so
`just validate` fails when a template changes without
`bun skills/pm-docs-site/scripts/site.ts write docs-site`. Edit only its
site-owned files by hand (`package.json`, `src/docs-sources.ts`). A
template change is verified by `just docs-check` on `docs-site/`, and, for
a module this site does not use (`architecture`, `aspire`) or the core
without `repo-docs`, by rendering into a scratch repository and running
`bun run test`, `bun run check`, and `bun run build` there.
`pm-item` edits single roadmap items; `pm-board` and `pm-roadmap` are the
task-board and full-roadmap views with move, add, and insert operations;
`pm-status` is a read-only summary or user-queue view; `pm-up-next` is a
read-only ordered queue. `pm-help` explains every skill and
diagnoses gaps in the install and PM state; when adding or changing a
skill, update its row in the `pm-help` skill guide and, if the skill
needs setup, a diagnosis check. Shared definitions (IDs, item fields,
owners, file formats, limits, session matching, timestamps), the Roadmap
order and edits rules, and the Challenge protocol, Persistence, and
Asking-the-user rules live in the managed section, and skills must not
redefine them.
The installed project's PM root (default `planning/`) contains `config.md`,
the source of truth for workflow handoffs. Keep skills framework-neutral
and change handoffs there rather than hardcoding a different framework into
the skills.

The shared rules merged by `pm-setup` are maintained in
`skills/pm-setup/references/AGENTS-section.md`. Its start/end markers bound
the section that setup replaces, and the version in that marker is the
skills version. Installed copies keep the same markers without a version,
because the version of record is `Rules version` in the consumer's
`config.md`: an agent file can be merged, rewritten, or stripped without
losing the record. Keep changes to the managed rules in this reference, not
in generated copies, and bump its marker version when the section changes;
`scripts/validate.ts` keeps `skills/pm-init/templates/config.md` equal to
it, and keeps the copy installed at the end of this file equal to it (run
`pm-setup`, or replace the section between the markers with the reference
minus the marker's `version=`). The rules and the skills carry the same version, and `pm-resume`,
`pm-rejoin`, and `pm-next` gate work on it: a consumer whose recorded rules
are older than its installed skills is asked to run `pm-setup` before work
resumes.

## Build, test, and lint

The skills have no build system; the docs site (`docs-site/`) is the one
built and unit-tested part. Validation, Markdown linting, and the docs-site
check run locally and in CI (`.github/workflows/ci.yml`, which runs the
same `bun` commands as the `just` recipes). Markdown is linted with
`markdownlint-cli2`, using `.markdownlint-cli2.jsonc` (default rules, with
`MD013` disabled, `node_modules/` ignored at any depth):

- Install git hooks (requires `bun` and `lefthook`): `just install`
- Link this repository's skills into `.claude/skills/` and
  `.agents/skills/` (clears the old `pm-*` entries first; the links are
  gitignored): `just setup-skills`. `just setup-skills --cli` uses
  `bunx skills add ./ -y` instead, which copies the skills, so edits to
  `skills/` go stale until it runs again.
- Serve the project site: `just docs` (<http://localhost:4321>). Check it
  matches the templates, then test, type-check, and build it:
  `just docs-check`.
- Lint all Markdown and validate skills: `just lint-check` (auto-fix
  Markdown: `just lint-fix`)
- Validate only (`scripts/validate.ts`: frontmatter, README, managed-section
  and setup inventory, markers, template placeholders, the export schema
  against its example, the docs-site templates against the schema, the
  section installed in this file, and `docs-site/` against the templates):
  `just validate`
- Lint one file: `bunx markdownlint-cli2 skills/pm-next/SKILL.md`
- Adding a shipped skill: create `skills/<name>/SKILL.md`, then list it in
  the README table, the managed-section table, the `pm-setup` inventory, and
  the `pm-help` skill guide. `just validate` fails otherwise.
- A repo-local skill that must not reach a consumer lives in
  `.agents/skills/<name>/SKILL.md` and sets `metadata.internal: true`, which
  hides it from the `skills` CLI. `just validate` checks its frontmatter and
  requires the flag; it is exempt from the four consumer tables.
- Bump the release version: `just bump patch|minor|major`
  (`scripts/bump-version.ts`).

Hooks are configured in `.config/lefthook.yml`: `commit-msg` runs
`bunx commitlint --edit {1}` (rules in `commitlint.config.mts`), and
`pre-push` runs `just lint-check`.

Releases are driven by the `version` field in `package.json`:

- `.github/workflows/release.yml` creates the `v{version}` tag and a GitHub
  release when `package.json` changes on `main`, and skips when the tag
  already exists.
- `.github/workflows/ci.yml` requires a `package.json` version bump in any
  pull request that changes `skills/**`, and refuses a version whose
  `v{version}` tag already exists. A pull request that touches nothing under
  `skills/` (docs, CI, scripts, this file) merges without a bump.
- A change to the managed section must also bump its `version=N` marker. CI
  fails a section change whose marker did not move, because `pm-setup` only
  replaces the section when the version changes; otherwise the fix never
  reaches a consumer. `scripts/validate.ts` keeps
  `skills/pm-init/templates/config.md` equal to the marker, and `pm-setup`
  writes it to the consumer's `Rules version`.
- `just bump patch|minor|major` (`scripts/bump-version.ts`) writes the next
  version and refuses one that is already tagged. The repository-only
  `release` skill (`.agents/skills/release/SKILL.md`) picks the part from
  the conventional commits since the last tag, bumps, and commits.
- The release version and the rules/skills version are independent: the
  rules/skills version is the `version=N` marker in the managed section
  (mirrored by `Rules version` in a consumer's `config.md`), bumped by hand
  when that section changes.

## Repository conventions

- Keep each skill's directory name, YAML frontmatter `name`, and skill
  references consistent. Put user-facing workflow behavior in its
  `SKILL.md`; put reusable initial project files in `skills/pm-init/templates/`.
- Skills should use explicit triggers and guards, ordered steps, and fixed
  output templates. Preserve the lifecycle's handoffs and safety rules
  when changing an individual skill.
- Preserve the PM state model used by the templates and skills: roadmap
  IDs are `R-NNN` and never reused; `NOW.md` in the configured PM root
  holds the single active item; `ROADMAP.md` separates ordered `Next` from
  `Later`; and parked ideas each have their own inbox file.
- Keep PM workflow actions bounded: PM skills operate on PM state in the
  main worktree, except a completion record on the item's branch, and commit
  only that PM root, as defined by *Committing PM state* in the managed
  section. They never commit code, specs, plans, or
  agent instruction files, and never push or merge. The only branch they
  create is the item's feature branch (`pm-next`), and they move between
  branches only as *Feature branches* in the managed section allows: pull
  first with `--ff-only`, and stay put when the user asks, during an
  interruption, or while a pull request is pending.
  `pm-docs-site`'s build modes are the only skill steps that write code;
  keep them bounded by Non-interruption rule 9.
- Markdown follows the repository's configured markdownlint defaults.
  Long lines are allowed (`MD013` is disabled).

<!-- pm-skills:start -->
<!-- Managed by pm-setup. Edit outside these markers; content inside is replaced on upgrade.
     Installed copies keep this marker without a version. The version of record is
     `Rules version` in the PM root config.md, so editing or merging this file cannot lose it. -->

## Project management layer (`pm-*` skills)

This repo uses a thin project-management layer that sits above the
development workflow skills (currently Superpowers). It decides **which**
feature is worked on, **why**, and **who** does it. The workflow skills
decide **how** it is built.

The PM state directory is selected during `pm-setup` (default: `planning/`)
and recorded here. In these instructions, **PM root** means that
repository-relative directory. All PM state paths are relative to the
repository root.

- PM state directory: `planning/`

| Skill | Purpose | When it may run |
| --- | --- | --- |
| `pm-setup` | Install or upgrade these skills and this section | User asks |
| `pm-init` | Create the PM root, write `VISION.md`, seed the roadmap | User asks |
| `pm-resume` | Show where work stopped and the next action for the agent and the user | Session start, after compaction, or user asks |
| `pm-rejoin` | Find the true position in the lifecycle from git and PM state, then rejoin at the right stage | Drifted or detached from the lifecycle, NOW.md disagrees with the work, user asks "where am I" |
| `pm-next` | Pick and claim the next claimable item on its own feature branch, hand off to design | No active item, user asks |
| `pm-park` | Capture an idea, bug, question, or inspiration without derailing | Any time (capture mode only during a workflow) |
| `pm-bug` | Capture a bug with the facts needed to fix it: symptom, expected and actual, reproduction, severity, and evidence | Any time (capture only during a workflow), user asks |
| `pm-risk` | Capture, add, update, re-rate, close, or remove one risk in the risk register, with its RAG status; turn a mitigation into a roadmap item | Any time (capture and view only during a workflow), user asks |
| `pm-shape` | Discuss, challenge, and flesh out one idea; decide park, roadmap, build, or drop | No active workflow, user asks |
| `pm-discover` | Analyse the existing product, its history and usage, or answer a product question | No active workflow, user asks |
| `pm-strategy` | Set vision, milestones, bets, and decisions; generate or re-plan the roadmap | User asks, or another PM skill recommends it |
| `pm-purview` | Recommend Purview (purview.dev) .NET tools only where they add value; ask about stack and scale for new projects | User asks, or `pm-init`, `pm-discover`, `pm-shape`, `pm-strategy` find a .NET need it covers |
| `pm-checkpoint` | Save state at a stopping point; suspend and resume an operation on the stack; close finished items on their branch | Session end, before compaction, stage end, user asks |
| `pm-revise` | Correct work that is not what the user wanted: rewind the active item, fix it in place, or open a revision item | User asks, or a `Done when` check fails, including mid-workflow |
| `pm-review` | Weekly triage of inbox and roadmap | User asks, or `pm-resume` says review is due |
| `pm-item` | Add, edit, drop, block, unblock, move (including position), reassign, or complete one roadmap item | User asks |
| `pm-board` | Show the task board; move, add, insert, or close one card | User asks |
| `pm-roadmap` | Show the full roadmap; move, add, or insert one item | User asks |
| `pm-status` | Show the summary or the user's queue (read-only) | User asks |
| `pm-export` | Write the machine-readable plan document and its schema, or check them against the schema | User asks, or a tool needs the plan as JSON (check only during a workflow) |
| `pm-docs-site` | Plan, build, extend, upgrade, or check the local project site that renders the export | User asks (check only during a workflow); its build modes run in the execute stage of a docs-site item (rule 9) |
| `pm-up-next` | Show the ordered queue and the one next action (read-only) | User asks |
| `pm-help` | Explain the skills, find what is missing in the setup, recommend the next skill (read-only) | User asks (explain mode only during a workflow) |

State lives in the PM root (see `config.md` there). Handoffs to workflow
skills are defined in the **Handoffs** table in that `config.md`. To change
frameworks, edit that table. Do not edit the skills.

## Shared definitions

Every `pm-*` skill uses these definitions. The skills do not redefine them.

- **Rules:** this section. It lives in `AGENTS.md` or `CLAUDE.md`. Where a
  skill says "the rules", it means this section.
- **Limits:** read them from the Limits list in `<PM root>/config.md`
  every time. Never hard-code them. If a limit is missing (older installs),
  use the default from the `pm-init` template and state it as an
  `Assumption:`. `NOW.md` holds one item, so only one item is active at a
  time.
- **Current session:** the output of `git branch --show-current`. The
  `Session` field in `NOW.md` starts with a branch name. The session matches
  when the current branch equals that name. Empty output (detached HEAD)
  never matches.
- **Item IDs:** `R-NNN` (at least 3 digits). A new ID is the highest number
  found in `ROADMAP.md`, `NOW.md`, and `LOG.md`, plus 1. IDs are never
  reused. Every `LOG.md` line about a roadmap item includes its ID.
- **Item fields:** `Serves`, `Done when`, `Size`, and `Status` are
  required. `Milestone`, `Owner`, `Depends on`, `Brief`, `Paused
  checkpoint`, `Note`, and `Revisits` are optional. A missing `Owner` means
  `agent`; a missing `Depends on` means `none`; a missing `Revisits` means
  the item is not a revision.
- **Owner:** `agent` (the agent builds it through the workflow), `user`
  (only the user can do it: decisions, accounts, purchases, reviews,
  content), or `both` (the agent builds it with user input). `agent` and
  `both` items are claimed with `pm-next`. `user` items are never claimed;
  the user does them and closes them with `pm-item done`.
- **Claimable:** an item in `## Next` whose `Status` is `ready` or
  `paused`, whose `Owner` is `agent` or `both`, and whose every
  `Depends on` ID appears in `## Done` in `LOG.md`.
- **Completion record:** the PM writes that close an item: its `## Done`
  line in `LOG.md`, `NOW.md` set to idle, its removal from `ROADMAP.md`, the
  brief's `Status: done`, and its milestone's `Status: done (<date>)` when
  it is the last open item of that milestone. `pm-checkpoint` (`done`)
  writes it for the active item; `pm-item` (`done`) for any other. It is
  committed on the item's branch, inside the item's pull request, before CI
  runs (rules: Committing PM state, **Completion rides the branch**).
- **Unmerged completion:** a **Completion record** whose branch has not been
  merged. It is reversible: `pm-revise` (`fix-in-place`) removes the
  `## Done` line and restores `NOW.md` at `execute`, and the fix re-runs the
  finish order on the same pull request.
- **Reference legend:** the short list of the IDs a question uses, each with
  the words needed to decide it: a milestone's name, whether it is the
  focus, and the items in it; a roadmap item's title, owner, size, and
  status; a risk's title, RAG, and status; a `V` line, bet, or inbox file's
  one-line text. A question that names IDs prints it (Asking the user).
- **Named reference:** an ID written with the words that identify it, so
  the user never has to look a bare ID up. In a list, board, roadmap, or
  status it is `<ID> <title>`; in a question, choice, or change line it is
  `<ID> <title> (owner, size, status)`, or `RK-NNN <title> (<RAG>)` for a
  risk. Every skill prints one wherever its output names an ID. A bare ID
  appears only in a literal command the user types (`pm-item done R-009`),
  a file line such as `LOG.md`, or a commit message.
- **Optional files:** `STRATEGY.md`, `briefs/`, and `research/` in the PM
  root may be missing in projects initialised before version 4, and
  `RISKS.md` in projects initialised before version 12. Skills that read
  them treat a missing file as empty. Skills that write them create them.
- **Inbox file:** one idea per file at
  `<PM root>/inbox/<YYYY-MM-DD-HHMM>-<slug>.md`, written by `pm-park` and
  `pm-discover`, in this format:

  ```markdown
  # <Short title, max 8 words>

  - Captured: <YYYY-MM-DD HH:MM>
  - Source: user | agent (<skill or item ID and stage>)
  - Kind: feature | bug | improvement | question | inspiration | tech-debt
  - Severity: blocker | major | minor | cosmetic
  - Affects: <R-NNN, component, or path | none>
  - Context: <active item ID and stage, or none>
  - Discuss: yes | no
  - Related: <IDs, inbox files, or briefs | none>
  - Brief: <path, once pm-shape has started one | none>
  - Reviewed: <YYYY-MM-DD, set when pm-review keeps it parked | never>

  ## Idea

  <the words as given, verbatim>

  ## Reproduction

  <steps, how often it happens, and the evidence: error text, log,
  screenshot, or failing test — bugs only>

  ## Links

  - <URLs, file paths, or screenshots given with the idea>

  ## Notes

  - <YYYY-MM-DD> <text appended later, verbatim>
  ```

  Older inbox files may lack fields; treat missing fields as `none`, `no`,
  or `never`. `Severity` and `## Reproduction` are written for `Kind: bug`
  only, by `pm-bug`.
- **Brief:** the persistent record of shaping one idea, at
  `<PM root>/briefs/<R-NNN or YYYY-MM-DD>-<slug>.md`, written by
  `pm-shape`. Headings, in order: `Problem`, `Who and evidence`,
  `Original idea`, `Proposal`, `Alternatives considered`, `Challenges and
  answers`, `Ramifications`, `Done when`, `Size and slicing`, `Open
  questions`, `Decision`. Its header lists `Status` (`shaping`, `parked`,
  `on roadmap (<ID>)`, `done`, `dropped`), `Origin`, and `Updated`. An
  optional `## Revisions` heading after `Decision` holds dated corrections
  written by `pm-revise`; a brief without one is complete.
- **Stack file:** `<PM root>/STACK.md`, the newest-first list of suspended
  operations written by `pm-checkpoint` (`push`, `pop`). Optional: a missing
  file is an empty stack. It is session memory, not a plan, so `pm-export`
  does not export it. A **stack entry** holds the item, its `Done when`, the
  branch, the stage, the brief, spec, plan, milestone, started date, the
  reason it was suspended, and its checkpoint block.
- **Bug:** an inbox file with `Kind: bug`, written by `pm-bug`, carrying
  `Severity`, `Affects`, and a `## Reproduction` block. It is triaged like
  any other inbox file (`pm-review`), shaped when the fix needs design
  (`pm-shape`), and closed like any item once its outcome is a roadmap
  item, at which point the inbox file is deleted. A bug is never a second
  state system. `Severity` drives the recommendation: `blocker` is fixed
  before the active item continues, `major` and `minor` are scheduled,
  `cosmetic` is parked.
- **Risk register:** `<PM root>/RISKS.md`, written only by `pm-risk`. It
  has three sections: `## Open` (ordered red, amber, green, then by ID),
  `## Closed` (newest first), and `## Removed` (one line per risk recorded
  in error, so its ID is never reused). Optional: a missing file is an
  empty register. A **risk** is one `### RK-NNN <Title>` block in this
  format:

  ```markdown
  ### RK-001 <Title, max 8 words>

  - Likelihood: low | medium | high
  - Impact: low | medium | high
  - RAG: red | amber | green
  - RAG override: <reason | none>
  - Status: open | mitigating | accepted | closed
  - Owner: agent | user | both
  - Affects: <R-NNN, milestone, component, or path | none>
  - Trigger: <the observable signal that it is happening | none>
  - Mitigation: <action, or the R-NNN item that carries it | none>
  - Raised: <YYYY-MM-DD> (<user | agent (<skill or item ID and stage>)>)
  - Reviewed: <YYYY-MM-DD | never>
  - Closed: <YYYY-MM-DD>: <reason> (closed risks only)
  ```

  A removed risk is `- <YYYY-MM-DD> RK-NNN <title>. Reason: <reason>.`
  under `## Removed`.
- **Risk IDs:** `RK-NNN` (at least 3 digits), separate from item IDs. A new
  ID is the highest `RK` number in `RISKS.md` (all three sections), plus 1.
  IDs are never reused.
- **RAG:** a risk's red, amber, or green status. It is derived from
  Likelihood and Impact, scored `low` 1, `medium` 2, `high` 3, by their
  product: 6 or more is `red`, 3 or 4 is `amber`, 2 or less is `green`. An
  override sets another value and records why in `RAG override`; without
  one, `RAG` always equals the derived value, and `pm-risk` recomputes it
  whenever Likelihood or Impact changes. `Status: accepted` and `closed` keep
  their RAG for the record.
- **Quick capture:** how `pm-park` (`capture`, `agent`) and `pm-risk`
  (`capture`) write during an active workflow, so the step in progress
  keeps its pace and its context. It never asks, never commits, and reads
  no PM file the write does not need.
  - **Fast path:** classify from the words alone. Take the active item ID
    and stage from the session, not from `NOW.md`. Write `Related: none`
    without searching; `pm-review` searches when it triages the file. A
    risk reads only `RISKS.md`, for its new ID and RAG position, right
    before it writes.
  - **Background:** when the agent can start a subagent or background task
    that does not block the turn (in Claude Code, the `Agent` tool), hand
    it the words verbatim, the mode, `Source`, and the active item ID and
    stage. Reply with the skill's background line and continue the step at
    once; the task writes on the fast path and reports back only a
    failure, which the agent prints as `Not saved: <reason>. <the words>`.
    A subagent that blocks the turn is no faster, so without a non-blocking
    one the fast path runs inline: one timestamp and one file write. Run
    one background risk capture at a time, so two never take the same ID.
  - A skill is never forked as a whole for this (for example `context:
    fork`), because its other modes ask the user questions.
- **Revision:** work that was built and is not what the user wanted.
  `pm-revise` records it in the brief's `## Revisions` and the `NOW.md`
  checkpoint while the item is open, or as a new roadmap item whose
  `Revisits` names the original once that item is in `## Done` in
  `LOG.md`. A revision never reopens a `Done` line, except an **Unmerged
  completion**, whose line is removed so the same pull request can finish.
- **Open inbox count:** inbox files, excluding `README.md`, whose
  `Reviewed` is `never` or older than the last review, plus files with
  `Discuss: yes`.
- **Timestamps:** local time. In bash or zsh, run
  `date "+%Y-%m-%d %H:%M"`. In PowerShell, run
  `Get-Date -Format "yyyy-MM-dd HH:mm"`. Use the one that matches the shell
  in use. For a date only, use the first 10 characters.
- **Review due:** true when the days since `Last review` are at least the
  review cadence, or the open inbox count is at least the inbox threshold.
  If `Last review` is `never`, only the inbox threshold applies.
- **Main worktree:** the first path in `git worktree list`. PM root paths
  are resolved inside it, and it holds the PM state when idle. A
  **Completion record** may instead be written in the worktree that holds
  the item's branch (rules: **Completion rides the branch**). Quote the
  path in commands, because it may contain spaces.
- **PM branch:** the branch named by `PM branch` in `<PM root>/config.md`.
  It is where PM state lands, normally the repository's default branch:
  by merging an item's branch, or by a PM commit when no item branch
  applies. Installs without the setting use the main worktree's current
  branch.
- **Remote:** the remote the PM branch tracks
  (`git rev-parse --abbrev-ref <PM branch>@{upstream}`), else `origin`
  when it exists. A repository with no remote skips every fetch and pull,
  and uses the local PM branch wherever these rules say
  `<remote>/<PM branch>`.
- **Item branch:** the branch named by the `Branch name pattern` in
  `<PM root>/config.md` for the item's ID and slug (for example
  `feat/r-007-tenant-billing`). It is where the item's work happens
  (rules: Feature branches).
- **Pull latest:** `git -C "<worktree>" fetch <remote> --prune`, then, when
  the checked-out branch has an upstream and is behind it,
  `git -C "<worktree>" pull --ff-only`. A pull that is not a fast-forward
  stops: print the git output and the branch's ahead and behind counts.
  Never merge, rebase, or stash to make it succeed.
- **PM base:** the latest committed PM branch, found after
  `git fetch <remote> --prune`: `<remote>/<PM branch>`, or the local PM
  branch when it is ahead of the remote (it holds PM commits not yet
  pushed). When the two have diverged, stop and print both ahead and behind
  counts. New branches and Completion records start from it.
- **Pending pull request:** a branch other than the PM branch that has an
  upstream and is not merged into `<remote>/<PM branch>`. The PM branch is
  never one, even when it holds PM commits not yet pushed. Its item waits for review; the session stays
  on it (rules: Feature branches).
- **Claimed on a branch:** an item that `NOW.md` holds active, or that
  `LOG.md` lists in `## Done`, on a local or remote branch whose name
  matches the `Branch name pattern` and that is not merged into
  `<remote>/<PM branch>`. Find the branches with
  `git branch -a --no-merged <remote>/<PM branch>`, then read each file
  with `git show <branch>:<PM root>/<file>`. The item is in progress or
  waiting for its pull request there, so it is not claimed again.
- **Uncommitted PM state:** the paths printed by
  `git -C <worktree> status --porcelain -- <PM root>`, with the main
  worktree as the default `worktree`.
- **Export file:** `<PM root>/planning.json`, written only by `pm-export`,
  either when it runs or as the export refresh of a PM commit (rules:
  Committing PM state). It is **derived**: the Markdown files are the
  state, and the export is a projection for other tools. Never hand-edit it
  and never read it as PM state; when the two disagree, the Markdown is
  correct. It is created on first use and committed like any other PM file.
- **Export schema:** `<PM root>/planning.schema.json`, the JSON Schema of
  the **Export file**, refreshed from `pm-export`'s
  `references/planning.schema.json` on every write. `schemaVersion` in the
  export and the schema's const change together when the format changes.
- **Docs site:** the optional local Astro site that `pm-docs-site` builds
  from its templates. It reads the **Export file** only, never writes the
  PM root, and is code, not PM state: its files are committed by the
  workflow that builds them. A site whose `SCHEMA_VERSION` is older than
  the export's `schemaVersion` fails its build until `pm-docs-site upgrade`
  runs.
- **Merged-unclosed:** an item whose Session branch is merged into the PM
  branch while `NOW.md` still holds it active. It means the **Completion
  record** did not ride the branch. `pm-rejoin` finds and repairs it.
- **Drift:** the PM state disagrees with the work in progress. Either
  `NOW.md` is idle while the current branch matches the `Branch name
  pattern`, `NOW.md` names another `Session` while this branch is the
  item's own branch, or `NOW.md` is active for a **Merged-unclosed** item.
  A **Pending pull request** whose `## Done` line is written is not drift:
  the session waits on it (rules: Feature branches). `pm-rejoin` locates
  drift and repairs it.
- **Rules version:** the installed version of this section, recorded as
  `Rules version` in the `Install` section of `<PM root>/config.md`. It is
  the only version of record, and it survives edits, merges, and rewrites
  of the agent instructions file.
- **Skills version:** the `N` in `<!-- pm-skills:start version=N -->` at the
  top of `references/AGENTS-section.md` in the installed `pm-setup` skill
  folder (locations: `pm-setup` step 2, item 4). The rules and the skills
  ship together, so equal numbers mean a current install.
- **Legacy version:** an install made before version 6 carries `version=N`
  in its start marker instead. Treat it as the **Rules version** when
  `config.md` has none; `pm-setup` migrates it and rewrites the marker
  without a version.

## Roadmap order and edits (mandatory)

`ROADMAP.md` has two sections: `## Next` (ordered, at most the max in
`config.md`) and `## Later` (grouped by milestone where one is set). An
item's position is the order of its `### <ID> <Title>` block in its
section. In `Later`, milestone groups follow the order in `STRATEGY.md`,
with `Unassigned` last. IDs never change and are never reused when an item
moves.

The edit skills `pm-board`, `pm-roadmap`, `pm-item`, `pm-review`,
`pm-strategy`, `pm-checkpoint`, `pm-next`, `pm-bug`, `pm-revise`,
`pm-risk` (mitigate), and `pm-docs-site` (plan) apply these operations. The
view skills `pm-status`, `pm-board`, `pm-roadmap`, and `pm-up-next` read
the same state and render it without changing the order or writing.

- **Position:** `top`, `bottom` (the default), `before <ID>`, or
  `after <ID>`. `before` and `after` name an item in the destination
  section.
- **move `<ID>` `<next|later>` [`<position>`]:** change section and
  position in one step. Keep every field, including `Status`; a plain
  `move` never unblocks an item or marks it ready. `unblock` is a separate
  operation, run by the board's `Waiting -> Next` column move. In `Later`,
  keep the item under its `Milestone` group.
- **add `<title>` [`<next|later>`] [`<position>`]:** create one item with a
  new ID, the required fields, and `Status: ready`. The default is the
  bottom of `Later`, under its milestone. Apply Challenge protocol checks
  1, 2, and 5.
- **insert `<ID>` `<before|after>` `<ID>`:** move an existing item within
  its section. It is a `move` that leaves the section unchanged.
- **Board columns:** `Next -> Now` is `pm-next` (claim);
  `Now -> Next` is `pm-checkpoint` (switch); `Next -> For you` and
  `For you -> Next` change `Owner`; `Next -> Waiting` is `block` or
  `depends`; `Waiting -> Next` is `unblock`; `-> Done` is `pm-checkpoint`
  done for the active item or `pm-item done` for a user task, and its
  Completion record is committed on the item's branch. `Done` is
  history in `LOG.md`: a done item returns only as a new item with a new
  ID.
- **Full Next:** when a move, insert, or add would put `Next` over the max,
  move the bottom item of `Next` to the top of `Later` in the same
  operation and name it in the output. Never exceed the max and never drop
  an item.
- **Active item:** the active item is in `NOW.md`, not in `ROADMAP.md`.
  Move it with `pm-checkpoint` (switch). No board or roadmap edit writes
  `NOW.md`.
- **Preserve fields:** keep every field the operation does not change,
  including `Brief`, `Paused checkpoint`, `Note`, and `Revisits`. Dependency
  and cycle checks apply whenever `Depends on` changes.
- **Confirm, then commit:** a view writes nothing. An edit shows one line
  (`R-012: Later -> Next top`), asks one choice question when it changes
  order, removes an item from `Next`, or adds an item, then applies it and
  makes one PM commit (rules: Committing PM state).

## Non-interruption rules (mandatory)

These rules override any general instruction to invoke skills eagerly,
including Superpowers' `using-superpowers` rule ("invoke any skill that
might apply"). That rule does **not** apply to `pm-*` skills, except
`pm-park` in capture mode.

1. **An active workflow owns the session.** A workflow is active when any
   skill in the Handoffs table, or `systematic-debugging`,
   `test-driven-development`, or `verification-before-completion`, has
   started and not finished. It stays active until it finishes or the user
   explicitly says "stop" or "pause".
2. **No PM skill starts automatically during an active workflow.** PM skills
   run only:
   - when the user names them or asks for what they do, or
   - at session start or after compaction (`pm-resume`), or
   - immediately after a design or plan handoff skill completes
     (`pm-checkpoint`, stage update only), or
   - as the item's completion step, after the execute stage passes its
     `Done when` checks and before the finish step pushes the branch
     (`pm-checkpoint`, `done` only), or
   - when the agent parks its own finding (`pm-park`, capture mode), or
   - when the user or the agent names a risk (`pm-risk`, capture mode).
3. **Mid-workflow, the only permitted PM writes are `pm-park` and
   `pm-risk` in capture mode, and `pm-checkpoint` (`push`, `pop`) when the
   user asks to suspend or resume an operation.** `pm-park` writes one inbox
   file and `pm-risk` one risk in `RISKS.md`, each replies with one line,
   then the exact step that was in progress resumes; `push` writes one
   stack entry, `pop` restores the top entry, and both reply in one line
   before the interrupted step resumes. No discussion, no evaluation, no
   follow-up questions for any of them. `pm-park` and `pm-risk` run as a
   **Quick capture** (Shared definitions), in the background when the
   agent can. A capture the user types while the agent works is handled
   between tool calls and never ends the step in progress. If the user wants to discuss the
   idea, set `Discuss: yes`; it is discussed later with `pm-shape`. A
   captured risk keeps `Reviewed: never` until `pm-risk` reviews it. The
   read-only exceptions: `pm-help` may answer a question about a skill in
   explain mode, without reading PM state; `pm-rejoin` may run in `locate`
   mode; `pm-export` and `pm-docs-site` may run in `check` mode; and
   `pm-status`, `pm-board`, `pm-roadmap`, `pm-up-next`, and `pm-risk`
   (`view`) may render their view when the user explicitly asks for it. None of them may add, move, insert, close,
   or reorder anything during a workflow. In every case the step in
   progress resumes afterwards. The PM write exceptions are rule 8
   (`pm-revise`), rule 10 (`pm-checkpoint` push and pop), the stage update in
   rule 2 (`pm-checkpoint` after a design or plan handoff), and the
   completion step in rule 2 (`pm-checkpoint` `done`, on the item's branch
   before the finish step); rule 9 covers the docs site, which is not PM
   state.
4. **If the user names another PM skill mid-workflow**, do not run it. Ask
   one choice question: `<skill> is at <step>. When should <pm-skill> run?`
   with the options `After <skill> finishes (recommended)` and `Pause now
   and run it`. If the user picks pause, run `pm-checkpoint` (pause), then
   the requested skill. Otherwise continue the step in progress.
5. **New ideas during a workflow go to `pm-park`, never to `brainstorming`
   or `pm-shape`.** Discussing an idea starts from `pm-shape`. Designing a
   feature starts only from `pm-next`.
6. **PM state skills write only inside the PM root.** They write in the
   main worktree, except a Completion record, which is written in the
   worktree that holds the item's branch (rules: **Completion rides the
   branch**). `pm-setup` may also edit only the managed section in the
   selected agent instructions file, and the `Rules version` line in
   `<PM root>/config.md`.
   PM state skills never:
   - edit source code, spec, or plan files,
   - create or remove worktrees, or create branches other than the **Item
     branch** that `pm-next` creates,
   - `stash`, `reset`, `merge`, `push`, `rebase`, or `cherry-pick`,
   - switch branches, except the moves that the Feature branches rules
     name,
   - stage or commit anything outside the PM root.

   The only state-changing git commands a skill runs are the `add` and
   `commit` of one PM commit (see **Committing PM state**), and the
   `fetch`, `pull --ff-only`, `switch`, and `switch -c` of a branch move
   (rules: Feature branches). Read-only git (`status`, `log`, `branch`,
   `worktree list`, `diff`, `show`, `rev-parse`, `rev-list`) is always
   allowed.
7. **Other sessions' claims are read-only.** If the `Session` in `NOW.md`
   does not match the current session, treat that item and its files as
   read-only. Inbox files are one-file-per-idea so parallel sessions never
   conflict.
8. **`pm-revise` may interrupt a workflow to correct it.** It is the only
   skill that may interrupt a workflow **to correct work**, and only when
   the user names the behaviour that is wrong or asks to revise it. The
   order is fixed: record the scope, then `pm-checkpoint` (`pause`), then
   correct. The interrupted step is never resumed silently; the user
   chooses `rewind`, `fix-in-place`, `new item`, or `park` (`pm-revise`).
   `pm-bug` and every other edit skill still follow rule 4.
9. **`pm-docs-site` build modes are a step of the workflow, not a PM
   skill.** `scaffold`, `extend`, and `upgrade` write the **Docs site**,
   which is code. They run only in the `execute` stage of the active item
   whose `Note` names `pm-docs-site`, in the session that owns it, on a
   branch other than the PM branch, when the plan step or the user names
   them; rule 4's question does not apply. They write only the site
   folder, the `Docs` group in the `justfile`, and the AppHost files their
   `aspire` module lists. They never write the PM root, and never stage,
   commit, push, or create branches: the workflow commits their files.
   `pm-docs-site` `plan` and `check` are PM skills and follow rules 2 to 6.
10. **`pm-checkpoint` push and pop suspend and restore an operation.** When
    the user asks to stack, suspend, pause-and-restore, or handle an
    emergency, `push` writes one stack entry and idles `NOW.md`; it may run
    mid-workflow. `pop` restores the top entry and hands back to its stage;
    it runs when the workflow that replaced the suspended operation has
    finished. Both write PM state and reply in one line. They do not
    correct work (rule 8) and do not capture ideas (`pm-park`). Only one
    item is active: `push` is how the session is freed for the emergency
    without losing the suspended operation.

## Bounded operations (mandatory)

One skill run is one operation. It writes only the files and fields its
mode names, and it never widens its scope to cover a problem it finds.

When a problem blocks the operation, do not widen it. Use the stack:
`pm-checkpoint` (`push`) suspends the operation, the problem is handled as
its own operation (`pm-bug`, `pm-revise`, or a workflow step), then `pop`
returns to the suspended operation at its checkpoint. Nothing is lost, and
the original operation finishes under its own scope. An emergency is never
a reason to skip the `Done when` check, the completion record, or a PM
commit.

## Feature branches (mandatory)

Item work happens on named feature branches, not on the PM branch, unless
the user asks to stay there (rule 2). The skills move the session to the
right branch; they do not leave it to the user to notice. PM edits made
while no item is active (`pm-item`, `pm-review`, `pm-strategy`) are not
item work: their PM commits land on the PM branch, or on the current
branch when it is a **Pending pull request** (rules: Committing PM state,
step 3).

1. **Every item gets its own branch.** `pm-next` fetches, creates the
   **Item branch** from the **PM base** with
   `git switch -c <Item branch> <PM base>`, and claims the item on it. When
   the **Item branch** already exists, it switches to it and runs **Pull
   latest** instead. The claim, the checkpoints, and the Completion record
   all ride that branch.
2. **Stay when the user says so.** When the user asks to stay on the
   current branch, no skill moves the session for the rest of that
   operation. `Session` records the current branch, and the output `Note`
   says `Stayed on <branch> at the user's request.`
3. **Interruptions stay on the current branch.** A request that interrupts
   the active item (update a package, fix a typo, answer a question, an
   emergency) is done on the branch that is checked out. No skill creates
   or switches a branch for it; `pm-checkpoint` (`push`) suspends the item
   on the same branch, and `pop` restores it there.
4. **Pull latest before every move.** Run **Pull latest** before creating
   a branch, after switching to an existing branch, and before a Completion
   record is built. A move needs a clean worktree outside the PM root: when
   another path is changed, ask one choice question: `<n> uncommitted files
   on <branch>. How should <operation> continue?` with the options `Stop so
   I can commit them (recommended)` and `Stay on <branch>`. Never stash,
   reset, or carry them across silently.
5. **Stay on a pending pull request.** After the finish step pushes the
   **Item branch**, it is a **Pending pull request**. Do not switch to the
   PM branch while it is pending, and never recommend it: the next
   `pm-next` creates its branch from the **PM base**, so no checkout of the
   PM branch is needed. Once the pull request has
   merged, a switch to the PM branch runs **Pull latest** first.

## Challenge protocol (mandatory)

Every idea, feature, roadmap item, vision line, milestone, bet, or priority
order is challenged before it is accepted. This applies equally to ideas
from the user and to the agent's own proposals. It applies in `pm-init`,
`pm-shape`, `pm-discover`, `pm-strategy`, `pm-purview`, `pm-review`,
`pm-item` (add and edit), `pm-board` and `pm-roadmap` (add),
`pm-next` (before claiming), `pm-bug` (duplicate, severity, and impact),
`pm-revise` (the scope of the rework), `pm-risk` (add, re-rating, and
mitigate), and `pm-docs-site` (plan). It never applies to `pm-park` or
`pm-risk` capture during a workflow.

1. **Problem:** what problem, for whom, and what evidence shows it exists
   (code, data, user reports, `LOG.md`). If there is none, say so.
2. **Fit:** which `V` line and milestone it serves. Flag any conflict with
   `Out of scope` in `VISION.md` or `Not doing` in `STRATEGY.md`, and any
   earlier drop in `LOG.md`.
3. **Alternatives:** at least two, always including "do nothing" and a
   smaller version. State which one wins and why.
4. **Ramifications:** data and migrations, security and privacy,
   performance, user experience, operations and cost, maintenance,
   dependencies on and from other items, and reversibility. Name the
   concrete effect or write `none found`.
5. **Cost:** size, and which item in Next it delays.
6. **Assumptions:** what must be true, and the signal that would show it
   is wrong.
7. **Agent proposals:** before recommending anything, state the strongest
   argument against it.

How to challenge:

- Make each challenge a concrete claim with evidence (`src/billing.ts`
  has no tenant column), not a vague doubt.
- Scale it: size `S` with a clear problem needs checks 1, 2, and 5 only;
  size `M`, `L`, and anything strategic needs all of them.
- Put each material challenge to the user as a choice question. Record the
  challenge, the answer, and the reason in the file being written.
- Accept the user's decision once it is made. Do not raise the same
  challenge again unless new evidence appears; then cite it.

## Persistence (mandatory)

PM files are the only memory that survives compaction and new sessions.

- **Write-through:** write every decision, answer, and status change to
  its PM file in the same turn it is made, before replying. Never hold PM
  decisions only in the conversation, and never batch them to the end of a
  discussion.
- **Every discussion has a file.** Shaping writes the brief after each
  answer. Discovery writes the research report as findings arrive.
  Strategy writes `STRATEGY.md` after each approved section.
- **Open questions are written down:** in the brief's `## Open questions`,
  or in the `Open question` line of the `NOW.md` checkpoint.
- **Files win.** At session start or after compaction, read the PM state
  (`pm-resume`) before acting on PM matters. If recalled conversation
  content contradicts the files, the files are correct.
- Before a session ends, or when context is about to be compacted, with an
  item active, run `pm-checkpoint` (pause).

## Context budget (mandatory)

One item is one feature or change, and one item is one context. The PM
files carry the state, so a session never needs the conversation that
built the previous item.

- **One item per context.** Claim the item with `pm-next` and finish it
  with `pm-checkpoint` (`done`) in the same context. That output ends with
  a new session (`/new` or `/clear`) before the next claim; the completion
  and its handoff are all the next session reads. Never start a second
  item to avoid losing the first: `pm-checkpoint` (`pause`) first.
- **Stage boundaries drop exploration.** When a design or plan handoff
  skill completes, `pm-checkpoint` (`stage`) records the spec or plan path
  and the next stage reads that file instead of the conversation that
  produced it. Do not carry a design discussion into execute.
- **Read the named files only.** A skill reads the files its mode names
  plus the Shared definitions entries it uses. Never read `planning.json`
  as PM state, the whole of `LOG.md`, briefs or `research/` the mode does
  not name, or a whole skill file when one section answers the question.
- **Read the named parts only.** Use `grep` or a line range to reach the
  one item, risk, milestone, or brief entry a step needs. Do not page a
  whole roadmap, risk register, or log into context.
- **Write the template only.** Output holds the skill's fixed sections,
  not a recap of the conversation, the plan, or the brief. Give the one
  next action and stop.
- **Compaction.** With an item active, run `pm-checkpoint` (`pause`)
  before compaction or session end. After compaction, `pm-resume` reads
  the files; recalled conversation is discarded, and the files win.

## Committing PM state (mandatory)

PM files are the memory, so they are committed as part of the work. No
skill leaves them loose in the working tree for the user to find, add, and
commit later. A commit made this way is a **PM commit**.

1. **Read the policy** from the `Commits` section of `<PM root>/config.md`:
   `PM state commit: always | ask | never`, `PM branch: <branch>`, and
   `Export on commit: always | if present | never`. A missing section
   (installs before version 5) means `ask`, with the main worktree's
   current branch as the PM branch. A missing `Export on commit` (installs
   before version 14) means `if present`. The policy is the user's standing
   answer: on `always`, never ask whether to commit.
2. **Check the changes** in the **commit worktree**: the main worktree, or
   the worktree that holds the item's branch for a Completion record.
   **Uncommitted PM state** (Shared definitions). No output means there is
   nothing to commit; say nothing about commits. Otherwise continue.
3. **Choose the branch.** The commit target is the item's session branch
   when an item is active and that branch is checked out, including a
   Completion record written in another worktree; otherwise it is the PM
   branch. Run `git -C "<commit worktree>" branch --show-current`. If it is
   empty (detached HEAD) or is not the expected branch, ask one choice
   question: `The worktree is on <branch>. How should the PM state be
   committed?` with the options `Switch to <PM branch> and commit
   (recommended)`, `Commit on <branch>`, and `Leave it uncommitted`. Offer
   the switch only when every changed path in that worktree is inside the
   PM root; otherwise omit that option and say which path blocks it. The
   switch runs **Pull latest** after it, and the worktree stays on the PM
   branch. When `<branch>` is a **Pending pull request**, or the user asked
   to stay on it (rules: Feature branches), put `Commit on <branch>
   (recommended)` first and drop `(recommended)` from the switch. Never
   open a pull request whose only change is PM state.
4. **Stop, print, and commit nothing** when the commit worktree has a merge,
   rebase, cherry-pick, revert, or bisect in progress, or when the commit
   fails. Show the git output, put the two commands from step 7 in a
   `Note`, and finish the skill's own output. Repair a failed pre-commit
   hook only when the repair is inside the PM root, then retry once. Never
   retry with `--no-verify`, and never `stash` or `reset` to force a
   commit.
5. **Ask, unless the policy says otherwise.** On `ask`, ask one choice
   question: `Commit the <n> changed PM files?` with the options `Commit
   them (recommended)` and `Leave them uncommitted`; the free-text entry is
   the commit message. On `always`, commit without asking. On `never`, put
   the commands in a `Note` and run nothing.
6. **Refresh the export** after the last PM file is written and before the
   commands in step 7, or before the `Note` on `never`. It runs when
   `Export on commit` is `always`, or `if present` and
   `<PM root>/planning.json` exists in the commit worktree, and the changed
   paths include a PM file other than the **Export file** and **Export
   schema**. Run `pm-export` (`write`) steps 1 to 5 in the commit worktree,
   without its commit or output; reading every PM file is that step's
   scope. If its verify fails, leave the **Export file** as it was, add
   `Export not refreshed: <first failure>` to the `Note`, and commit the
   rest. Skip it when the user chose `Leave them uncommitted` or `Leave it
   uncommitted`.
7. **Run these two commands, in this order:**

   ```bash
   git -C "<commit worktree>" add -A -- "<PM root>"
   git -C "<commit worktree>" commit -m "<message>" -- "<PM root>"
   ```

   The pathspec keeps another session's staged work out of the commit. Then
   rerun the check from step 2 and confirm it prints nothing.

8. **Message:** `docs(pm): <verb> <what changed>`, at most 72 characters,
   for example `docs(pm): close R-007 tenant billing` or `docs(pm): pause
   R-007 at execute`. Use the repository's own commit convention instead
   when its agent instructions or contributing guide states one.

Rules:

- One commit per skill run, after the last PM file is written, and none at
  all for a skill that wrote nothing.
- Leftovers are swept in: PM files left uncommitted by an earlier session
  belong in this commit. When `NOW.md` belongs to another session
  (Non-interruption rule 7), commit only the paths this run changed.
- Commit the PM root only. Source code, specs, plans, and agent instruction
  files are never included, even when the same work changed them.
- `pm-park` never commits, and `pm-risk` never commits in capture mode:
  they run mid-workflow and must return in one line. Their inbox files and
  risks are committed by the next skill that commits, usually
  `pm-checkpoint`.
- The **Export file** and its **Export schema** are ordinary PM files
  inside the PM root, so the same commit covers them. `pm-export` is the
  only skill that writes them, including the refresh in step 6, so a PM
  commit never leaves the export behind the Markdown it changed.
- A PM commit never pushes, tags, merges, rebases, or creates or deletes
  branches.
- Report the result as one `Note` line: `<short sha> <subject>`, `PM state
  unchanged`, or `PM state left uncommitted: <n> files`.

### Completion rides the branch

A **Completion record** is committed on the branch that delivers the item,
inside the item's pull request, before CI runs. It is never committed to
the PM branch after the merge, and it never gets a pull request of its own.

The finish order is fixed:

1. Every plan checkbox is checked and the `Done when` checks pass on the
   branch.
2. `pm-checkpoint` (`done`) writes the Completion record and commits it
   with `docs(pm): close <ID> <slug>` on the item's session branch.
3. The workflow's finish step pushes that branch and opens the pull
   request, so the record is part of it from the first CI run.
4. If CI fails, the completion is unmerged and reversible: `pm-revise`
   (`fix-in-place`) removes the `## Done` line and restores `NOW.md`, the
   fix is applied, and steps 1 to 3 re-run on the same pull request. Never
   open a new one.
5. While the pull request is pending, the session stays on the item's
   branch (rules: Feature branches, rule 5).
6. The merge carries the record to the PM branch.

The commit worktree:

- The record starts from the **PM base** (Shared definitions), so it
  fetches first. When the item's branch is the PM branch, write the record
  in place. Otherwise (the normal case) read `LOG.md`, `NOW.md`,
  `ROADMAP.md`, `STRATEGY.md`, and the brief from the **PM base**
  (`git show <PM base>:<PM root>/<file>`), apply the record to those
  contents, then write and commit them in the worktree that holds the
  item's branch. This keeps the commit from reverting PM state the PM
  branch gained after the branch was cut.
- Stop when the PM branch has **Uncommitted PM state**, or when the item's
  worktree has uncommitted changes under the PM root. The record must start
  from committed state.
- A completion that did not ride its branch is **Merged-unclosed**:
  `pm-rejoin` closes it on the PM branch, with a `Note` that the next
  branch carries it when the PM branch is protected. Never a pull request
  of its own.

## Upgrading before work resumes (mandatory)

The rules and the skills carry the same version, and a new behaviour
usually needs both. The version of the rules installed here is recorded in
PM state (`Rules version` in `<PM root>/config.md`), not in the agent
instructions file, so editing, merging, or rewriting that file cannot lose
it.

`pm-resume`, `pm-rejoin`, and `pm-next` run this check before anything
else. `pm-help` reports it as a diagnosis. `pm-setup` never runs it,
because it is the fix.

1. **Read the state** (Shared definitions): the **Rules version** from
   `<PM root>/config.md`, the **Skills version** from the installed
   `pm-setup` reference, and whether any agent instructions file still
   contains `<!-- pm-skills:start`. In bash,
   `grep -o 'Rules version: [0-9]*' <PM root>/config.md`; in PowerShell,
   `Select-String -Path '<PM root>/config.md' -Pattern 'Rules version: \d+'`.
   If `<PM root>/config.md` is missing, skip this check: the skill's own
   guard reports the missing state. If `pm-setup` is not installed, the
   skills version is unknown: reply `Skills version unknown: pm-setup is
   not installed.`, recommend
   `npx skills add https://github.com/purview-dev/pm-skills -y`, and stop.
2. **Compare:**

   | Rules version | Start marker in the agent file | Action |
   | --- | --- | --- |
   | equal to the skills version | present | continue |
   | older than the skills version | present | step 3 |
   | any, including a legacy marker version | absent | step 4 |
   | not recorded | present | step 4 |

3. **Upgrade.** Ask one choice question: `Rules are v<old>; the skills are
   v<new>. Upgrade before continuing?` with the options `Run pm-setup now
   (recommended)` and `Continue on v<old> for this session`. On `Run
   pm-setup now`, run it, show its output, then continue the skill that
   asked. On `Continue`, put `Upgrade debt: rules v<old>, skills v<new>.`
   in the output `Note` and continue.
4. **Repair, record, or migrate.** Reply `Rules: v<version or not
   recorded>; skills: v<version>; section: <present | missing>.` Then ask:
   `Run pm-setup now?` with the options `Run pm-setup now (recommended)`
   and `Continue`. `pm-setup` records the version, migrates a legacy marker,
   and re-installs a missing section. On `Continue`, put `Upgrade debt:
   rules <version or not recorded>, skills v<new>.` in the output `Note`
   and continue, except when the section is missing: then stop, because the
   rules the user relies on are not in the agent file.
5. **Skills older:** reply `Skills are older than the rules (v<old> against
   v<new>).` and ask: `Update the skills now?` with the options `Update,
   then run pm-setup (recommended)` and `Continue on v<old>`. Print
   `npx skills update` for the user to run; never run the skills CLI
   yourself. Then run `pm-setup` when the user asks.
6. **A start marker without a version is normal.** It marks the boundaries
   only. A marker that still carries `version=N` is a legacy install, and
   `pm-setup` migrates it.
7. **During a workflow** these questions wait for the workflow to finish
   (Non-interruption rule 4). `pm-checkpoint` and `pm-park` never run this
   check: saving the state always comes first.

After an upgrade, `pm-setup` checks `<PM root>/config.md` for the settings
the new version adds; version 5 adds the `## Commits` section. When a
`Commits` setting is missing it asks one choice question per setting and
writes the answer, so every skill reads the policy from `config.md`
instead of asking. If the user leaves `PM state commit` unset, PM commits
ask before each commit.

Version 11 adds the **Stack file** and **Completion rides the branch**.
`pm-init` creates `<PM root>/STACK.md` on a fresh install; on an older
install a missing file is an empty stack, and `pm-checkpoint` creates it on
the first `push`. Version 11 also changes when an item is closed: run
`pm-checkpoint` (`done`) on the item's branch before the finish step opens
its pull request, and never close it on the PM branch after the merge.

Version 12 adds the **Risk register** and `pm-risk`. `pm-init` creates
`<PM root>/RISKS.md` on a fresh install; on an older install a missing file
is an empty register, and `pm-risk` creates it on the first write. Version
12 also moves the export to `schemaVersion` 3, which adds `risks`: run
`pm-export`, and `pm-docs-site upgrade` for an installed docs site.

Version 13 adds the **Context budget** and **Named reference** rules. Each
item is one context: `pm-checkpoint` (`done`) ends its output by telling
the user to start a new session (`/new` or `/clear`) before `pm-next`, and
a stage handoff passes the spec or plan path instead of the conversation
that produced it. Every skill prints an ID with its title (`<ID> <title>`)
wherever its output names one, never a bare ID.

Version 14 adds `Export on commit` to the `Commits` section: a PM commit
refreshes `<PM root>/planning.json` before it commits, so the export never
lags the Markdown. `pm-init` now writes `PM state commit: always` by
default, and `pm-setup` writes any missing `Commits` setting on upgrade.

Version 15 adds the **Feature branches** rules. `pm-next` pulls the latest
PM branch, creates the **Item branch** from the **PM base**, and claims
the item there, so the claim rides the branch like the Completion
record. A session stays on its branch when the user asks, during an
interruption, and while its pull request is pending. Every branch move
pulls first, with `--ff-only`. No setting is added.

Version 16 adds **Quick capture**. During a workflow, `pm-park` and
`pm-risk` capture classify from the words alone, skip the `Related`
search, and hand the write to a non-blocking background task when the
agent has one, so the step in progress does not wait. `pm-review` runs the
skipped `Related` search when it triages the file. No setting is added.

## Asking the user (mandatory)

- **Every question uses the agent's interactive question tool** (for
  example `AskUserQuestion` in Claude Code, or the `question` or
  `ask_user` tool in other agents). This includes open-ended questions.
- Offer 2 to 4 options. Put the recommended option first and add
  `(recommended)` to its label. Label each option with the action or
  answer it stands for ("Drop R-004", "Add to Next"), not a bare keyword.
  Rely on the tool's built-in free-text entry for custom answers; if the
  tool has none, add a `Type something` option.
- For open-ended questions, draft 2 or 3 likely answers from the
  repository and PM state and offer them as options. The free-text entry
  covers anything else.
- Make each question stand on its own. The dialog may hide earlier text,
  so include the ID, title, or fact the user needs to decide.
- **Name what you reference.** Never ask about a milestone, item, risk,
  bet, `V` line, brief, or inbox file by ID alone. Print a `## For this question`
  legend (Communication contract) above the question, listing each ID it
  names with the words needed to decide it (Shared definitions: Reference
  legend). Keep it to the IDs the question uses; do not print the whole
  roadmap.
- **Offer a way to see more.** Add one escape option after the decision
  options; it does not count towards the 2 to 4 and is never an answer.
  `Explain <ID>` when the question names IDs, `Show the roadmap` for a
  milestone, focus, or ordering question, `Show the board` for an owner,
  column, or "what is in progress" question. On `Explain <ID>`, print that
  item's, risk's, or milestone's full block from its file (`ROADMAP.md`,
  `RISKS.md`, `STRATEGY.md`, `LOG.md`, or the brief) — every field, and for a milestone
  its exit criteria and its items — then ask the same question again with
  the same options. On `Show the roadmap` or `Show the board`, run that
  read-only view (`pm-roadmap`, `pm-board`), then ask the same question
  again. Neither changes state. Where the tool caps the option count, keep
  two decision options and the escape option.
- Ask one decision at a time. Up to 4 independent questions may share one
  prompt when the tool supports it. A question that depends on an earlier
  answer waits for it.
- Use multi-select when the choices are not exclusive, for example which
  findings to park.
- **Never** print lettered or numbered choices for the user to type, and
  never ask the user to reply `yes`, `ok`, `approve`, `a`, or any other
  keyword to continue. If no question tool exists, ask one plain-language
  question and accept a free-form answer.

## Communication contract (all `pm-*` output)

Output must be literal, predictable, and immediately actionable.

- Lead with the answer or the action. No preamble, no praise, no recap.
- Give **one** next action. Offer at most 2 alternatives only when a
  decision is required, and mark one as recommended.
- Every task states **Done when** as observable checks (a test passes, an
  endpoint returns 200, a file exists).
- Use exact file paths, commands, and IDs. No vague verbs ("look into",
  "consider", "maybe"). No idioms.
- **Name every ID.** Write a named reference (Shared definitions) wherever
  output names an item, risk, milestone, bet, or `V` line. A bare ID is
  never a description: the words that identify it go beside it in the
  same line, table row, option, or change line.
- Use the skill's fixed template with the same headings in the same order
  every time. Omit empty optional sections. Do not invent new sections.
- Keep to the Context budget: output the template only, and do not restate
  the plan, brief, or conversation.
- Before a question that names IDs, print the `## For this question` legend
  (Asking the user). It is the only section a question adds.
- At most 5 bullets per section, except boards, tables, and lists that a
  skill's template defines as complete. At most 3 sentences per paragraph.
- State any assumption explicitly as `Assumption: ...`.
- Flag scope changes explicitly as `SCOPE CHANGE: ...`. Never expand scope
  silently; park the extra work instead.
- Neutral wording about progress. Report facts (counts, dates), not
  judgements.

<!-- pm-skills:end -->
