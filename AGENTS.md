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
progress or closes the item, and `pm-review` triages the roadmap and
inbox. `pm-park` captures off-task ideas without interrupting active work.
`pm-item` drops, blocks, or moves roadmap items; `pm-status` is a
read-only view. Shared definitions (IDs, limits, session matching,
timestamps) live in the managed section, and skills must not redefine them.
The installed project's PM root (default `planning/`) contains `config.md`,
the source of truth for workflow handoffs. Keep skills framework-neutral
and change handoffs there rather than hardcoding a different framework into
the skills.

The shared rules merged by `pm-setup` are maintained in
`skills/pm-setup/references/AGENTS-section.md`. Its start/end markers and
version are used by setup to safely add or upgrade that section in a
consumer's agent instructions. Keep changes to the managed rules in this
reference, not in generated copies.

## Build, test, and lint

There is no build system or automated test suite configured in this
repository. Markdown is linted with `markdownlint-cli2`, using
`.markdownlint-cli2.jsonc` (default rules, with `MD013` disabled):

- Install git hooks (requires `bun` and `lefthook`): `just install`
- Lint all Markdown and validate skills: `just lint-check` (auto-fix
  Markdown: `just lint-fix`)
- Validate only (`scripts/validate.ts`: frontmatter, README, managed-section
  and setup inventory, markers, template placeholders): `just validate`
- Lint one file: `bunx markdownlint-cli2 skills/pm-next/SKILL.md`
- Adding a skill: create `skills/<name>/SKILL.md`, then list it in the
  README table, the managed-section table, and the `pm-setup` inventory.
  `just validate` fails otherwise.

Hooks are configured in `.config/lefthook.yml`: `commit-msg` runs
`bunx commitlint --edit {1}` (rules in `commitlint.config.mts`), and
`pre-push` runs `just lint-check`.

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
  main worktree, do not perform git state changes, and print suggested
  commit commands for the user rather than running them.
- Markdown follows the repository's configured markdownlint defaults.
  Long lines are allowed (`MD013` is disabled).
