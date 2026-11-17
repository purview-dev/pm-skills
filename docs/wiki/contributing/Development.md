# Development

The tools and `just` recipes for working on this repository, and the versioning rules a pull request
must follow.

Requires [`bun`](https://bun.sh) and, for the git hooks,
[`lefthook`](https://lefthook.dev/installation) and
[`just`](https://github.com/casey/just).

- `just setup-skills` clears and re-links this repository's `skills/pm-*`
  into `.claude/skills/` and `.agents/skills/`, so the agents working here
  use the skills as they are being edited. `just setup-skills --cli` uses
  `bunx skills add ./ -y` instead, which copies them.
- `just validate` checks skill frontmatter, the README and managed-section
  tables, the `pm-setup` inventory, the section markers, the template
  placeholders, the export schema, the managed section installed in
  `AGENTS.md`, and that `docs-site/` still matches the `pm-docs-site`
  templates.
- `just docs` serves this repository's own project site (its plan from
  `planning/planning.json`, the README, these docs, and every skill) at
  <http://localhost:4321>; `just docs-check` tests, type-checks, and builds
  it.
- `just lint-check` runs `just validate` and lints all Markdown;
  `just lint-fix` applies Markdown fixes.
- `just install` verifies the tools and installs the git hooks (commitlint
  on commit, `just lint-check` on push).

This repository manages itself with these skills: `planning/` is its live
PM state, and `docs-site/` is the site `pm-docs-site` builds from it.

## Versions and releases

- `just bump <part>` writes the next release version to `package.json`:
  `patch`, `minor`, or `major` for a stable release; `prepatch`,
  `preminor`, `premajor`, or `prerelease` (with `--preid <id>`, default
  `pre`) for a prerelease such as `2.4.3-pre.1`; `release` to turn a
  prerelease into its stable version; `set <version>` for an exact one.
  Raising the major (`major`, `premajor`) also raises the rules version.
- `just version-check` compares the version with `main` (also run on push).

The `package.json` major is the rules/skills version (rules v17 ship as
`17.x.y`), and this repository must run what it ships: its own
`planning/config.md` and `AGENTS.md` carry the same rules version. CI runs
the same checks on every push and pull request to `main`. A pull request
that changes anything under `skills/` must raise the rules version past the
one on `main` (`just bump major` or `just bump premajor`, then `pm-setup`),
to a version that is not already tagged; while `main` is an unreleased
`N.0.0-pre.*` prerelease, skills changes may stay on rules N and move the
prerelease on. Pull requests that touch nothing under `skills/` (docs, CI,
scripts, package metadata) keep the rules version, and may move the
version forward within it. Prerelease versions are published as GitHub
prereleases. The repository-only `release` skill in `skills/release/` picks
the bump and commits it; it is not installed into consuming projects.

## Adding a skill

Adding a skill means creating `skills/<name>/SKILL.md` and listing it in the
README table, the managed-section table, the `pm-setup` inventory, and the
`pm-help` skill guide; `just validate` fails otherwise. Full conventions are
in [`AGENTS.md`](../../../AGENTS.md).

Where each file lives: [Repository layout](Repository-Layout.md).
