# Agent instructions

## Project structure and architecture

This repository packages project-management workflows as reusable agent
skills. Each `skills/pm-*/SKILL.md` defines a skill's trigger, guardrails,
steps, and output format. `pm-init` supplies the templates for the state
those skills manage in a consuming repository; it does not represent live
project state in this repository.

The skills form a lifecycle: `pm-setup` installs the shared rules,
`pm-init` creates project state, `pm-resume` reads it, `pm-next` claims an
item and hands off to a development workflow, `pm-checkpoint` records
progress, commits the PM state, or closes the item, and `pm-review`
triages the roadmap and inbox. `pm-rejoin` re-establishes the position
when a session drifts out of the lifecycle. `pm-park` captures ideas (from
the user or the agent) without interrupting active work. `pm-shape`
discusses and challenges one idea into a brief, `pm-discover` analyses the
existing product for evidence, and `pm-strategy` owns vision, milestones,
and roadmap generation.
`pm-purview` matches .NET projects to Purview tools using the dated
snapshot in `skills/pm-purview/references/catalogue.md`; refresh that
snapshot from `https://purview.dev/llms.txt` when Purview releases change.
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
it. The rules and the skills carry the same version, and `pm-resume`,
`pm-rejoin`, and `pm-next` gate work on it: a consumer whose recorded rules
are older than its installed skills is asked to run `pm-setup` before work
resumes.

## Build, test, and lint

There is no build system or automated test suite. Validation and Markdown
linting run locally and in CI (`.github/workflows/ci.yml`, which runs the
same `bun` commands as the `just` recipes). Markdown is linted with
`markdownlint-cli2`, using `.markdownlint-cli2.jsonc` (default rules, with
`MD013` disabled):

- Install git hooks (requires `bun` and `lefthook`): `just install`
- Lint all Markdown and validate skills: `just lint-check` (auto-fix
  Markdown: `just lint-fix`)
- Validate only (`scripts/validate.ts`: frontmatter, README, managed-section
  and setup inventory, markers, template placeholders): `just validate`
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
  main worktree and commit only that PM root, as defined by *Committing PM
  state* in the managed section. They never commit code, specs, plans, or
  agent instruction files, and never push, merge, or create branches.
- Markdown follows the repository's configured markdownlint defaults.
  Long lines are allowed (`MD013` is disabled).
