---
name: release
description: Use only when releasing this repository - choosing the next version, stable or prerelease, and bumping package.json so the Release workflow tags and publishes it. Repository-only and not installed by the skills CLI. Reads the conventional commits since the last tag, recommends a stable bump, a prerelease (prepatch, preminor, premajor, or the next prerelease), or releasing a prerelease as stable, verifies the version is unused, runs the bump script, and commits the change.
metadata:
  internal: true
---

# release

Cut a release of `pm-skills`, stable or prerelease. The version of record is
the `version` field in `package.json`, a SemVer 2.0 version
(`19.0.0`, `19.0.0-pre.1`). `.github/workflows/release.yml` creates the
`v{version}` tag and a GitHub release when `package.json` changes on `main`,
and marks a prerelease version as a GitHub prerelease.

The major is the rules/skills version: the `version=N` start marker in
`skills/pm-setup/references/AGENTS-section.md`. `scripts/check-version.ts`
(CI and pre-push) requires a pull request that changes `skills/**` to raise
that marker past the one on `main` (`major` or `premajor`), except along an
unreleased prerelease line: while `main` is `N.0.0-<pre>` and `vN.0.0` is not
tagged, a skills change stays on rules N and moves the prerelease on. A pull
request that touches nothing under `skills/` keeps the major and may move the
version forward within it. `scripts/validate.ts` requires this repository's
own `planning/config.md` and `AGENTS.md` to carry the marker version.

This skill is repository-only. It lives in `skills/release/`, and its
frontmatter sets `metadata.internal: true`, so the `skills` CLI hides it from
consumers. It is not part of the `pm-*` lifecycle and is not listed in the
README table, the managed-section table, the `pm-setup` inventory, or the
`pm-help` guide.

## Parts

`bun scripts/bump-version.ts <part> [--preid <id>]` (or `just bump <part>`),
with the SemVer rules in `scripts/semver.ts`. Versions only move forward.

| Part | From `2.4.2` | From `2.5.0-pre.2` | Use it to |
| --- | --- | --- | --- |
| `patch` | `2.4.3` | `2.5.0` | Ship fixes; release a prerelease of a patch |
| `minor` | `2.5.0` | `2.5.0` | Ship features; release a prerelease of a minor |
| `major` | `3.0.0` | `3.0.0` | A rules bump, stable |
| `prepatch` | `2.4.3-pre.1` | `2.5.1-pre.1` | Start a prerelease of the next patch |
| `preminor` | `2.5.0-pre.1` | `2.6.0-pre.1` | Start a prerelease of the next minor |
| `premajor` | `3.0.0-pre.1` | `3.0.0-pre.1` | A rules bump, as a prerelease |
| `prerelease` | `2.4.3-pre.1` | `2.5.0-pre.3` | The next prerelease; `--preid rc` moves `pre` to `rc.1` |
| `release` | refused (already stable) | `2.5.0` | Ship a prerelease as its stable version |
| `set <version>` | any later version | any later version | An exact version, such as `2.4.3-prerelease.1` |

`--preid` names the prerelease label (default `pre`; for example `beta` or
`rc`). The script refuses a version that is already tagged, a prerelease of
a version that is already released, a move backwards, and a skipped major.
A bump that raises the major also raises the marker and `Rules version` in
`skills/pm-init/templates/config.md`.

## Guard

- Work in the repository root. Read the version with
  `node -p 'require("./package.json").version'`.
- If the working tree has uncommitted changes, stop:
  `Commit or stash <paths> first.` A release commit changes only the files
  the bump writes, and, when the major rises, the files `pm-setup` writes.
- Change nothing else: not the skills, the README, or the rules text.
- When the branch already raises the marker past `main`, do not raise the
  major again: `package.json` is already `<N>.0.0` or `<N>.0.0-<pre>`. Move
  that line with `prerelease`, `release`, or `set` instead.
- Never create or delete tags, and never push or merge: print the command
  instead. The Release workflow owns the tag.
- `v{version}` already existing is normal: it is the last release. The point
  of this skill is to move past it.
- Remind the user that a prerelease merged to `main` reaches every consumer
  who installs from `main` (`npx skills add`); a GitHub prerelease does not
  hold it back.

## Steps

1. **Read the state.** Current version (`node -p`), the tags
   (`git tag --list 'v*'`), the last stable tag and the last tag, the
   commits since the last tag (`git log --oneline <last tag>..HEAD`), and
   `git diff --name-only origin/main...HEAD`. If `v{version}` is not a tag
   yet, say so: the current version is unreleased, so this skill is only
   needed for a different number.
2. **Recommend.** Ask the user's intent only when it is not stated
   (`stable` or `prerelease`), then recommend one part:
   - A skills change and the marker equals `main`'s: `major` (stable) or
     `premajor` (prerelease) — unless `main` is an unreleased `N.0.0-<pre>`,
     then `prerelease` (or `release` to ship it).
   - The current version is a prerelease: `prerelease` to publish another,
     `release` to ship it as stable.
   - Otherwise, from the conventional commits since the last tag: `minor`
     (or `preminor`) when any `feat` is present, else `patch` (or
     `prepatch`).
   Never offer a part that raises the major without a skills change. State
   the part, the resulting version, and the paths or commits that decided it.
3. **Confirm.** Ask one choice question: `Bump to which version?` with the
   recommended `v<next> (<part>)` first, then up to two other parts that
   `check-version.ts` allows, each labelled with its version (for a
   prerelease, the stable alternative, and the reverse), and
   `Keep v<current>`. Compute each with the table above. Do not offer a
   version that is already tagged.
4. **Bump.** Run `bun scripts/bump-version.ts <part> [--preid <id>]` (or
   `just bump <part>`). When the major rose, run `pm-setup` so `AGENTS.md`
   and `planning/config.md` carry the new rules version. Then run
   `just validate` and `just version-check`.
5. **Commit.** `git add` the files the bump wrote, then
   `git commit -m "chore(release): v<next>"`. `pm-setup` commits
   `planning/` itself. Do not amend an existing commit.
6. **Report.** Print the new version, whether it is a prerelease, the
   commit, and the next command: `git push` (or open a pull request).
   Merging to `main` triggers the Release workflow, which creates the tag
   and the GitHub release (a prerelease for a prerelease version).

## Output

```markdown
## Released

- Version: v<next> (was v<current>, <part>; <stable | prerelease>)
- Decided by: <the commits or paths that set the part>
- Commit: <short sha> chore(release): v<next>

## Do this next

1. Push and merge.
   - Start with: `git push`
   - Done when: `main` shows the v<next> tag and a GitHub <release | prerelease>
```
