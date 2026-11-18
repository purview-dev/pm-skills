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
- `just package-test` installs, tests, and type-checks the
  `@purview-dev/pm-docs-site` package in `packages/pm-docs-site/`, then runs
  its browser tests in Chromium (Node 24 or later).
- `just lint-check` runs `just validate`, the tests, `pm-lint`, and
  `just package-test`, and lints all Markdown;
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

## The docs-site package

`packages/pm-docs-site/` is the `@purview-dev/pm-docs-site` npm package
([The docs-site package](../guide/Docs-Site-Package.md)). It has its own
version, in its own `package.json`, and its own tag,
`pm-docs-site-v<version>`; a change to it needs no rules bump. Its release
follows purview-dev/astroc4: bump the package's `version` and merge to
`main`.

- **Version changes.** `just version-check`, CI, and the pre-push hook fail a
  package version that is not SemVer, is older than the one on `main`, is
  bumped to a version that is already tagged, or is a prerelease of a
  released version. Prereleases use the `pre` id (`0.1.0-pre.1`).
- **Publishing.** `.github/workflows/publish-pm-docs-site.yml` runs when the
  package's `package.json` changes on `main`. It fails a version that is not
  SemVer, and a stable version off `main`; it skips, green, when the tag
  exists or the package is `private`. It then tests, type-checks, checks the
  exports, and publishes to npm through trusted publishing, with no token.
  A version already on npm is not published again, and `latest` stays on
  the newest prerelease until a stable version exists.
- **Tagging.** The workflow creates the tag and a GitHub release after the
  publish, never marked as the repository's latest release. Never push a
  `pm-docs-site-v*` tag by hand: it makes that version's release skip.
- **Locked by tests.** `scripts/workflows.test.ts` fails a pull request that
  adds an npm token, `registry-url`, or `--provenance`, or drops one of the
  rules above. `just validate` keeps the package's `LICENSE.md` equal to the
  repository's.

The first version is published by hand, because npm configures a trusted
publisher only on a package that exists; the steps are in the package's
[README](../../../packages/pm-docs-site/README.md#releasing).

## Adding a skill

Adding a skill means creating `skills/<name>/SKILL.md` and listing it in the
README table, the managed-section table, the `pm-setup` inventory, and the
`pm-help` skill guide; `just validate` fails otherwise. Full conventions are
in [`AGENTS.md`](../../../AGENTS.md).

Where each file lives: [Repository layout](Repository-Layout.md).
