---
name: release
description: Use only when releasing this repository - choosing the next version and bumping package.json so the Release workflow tags and publishes it. Repository-only and not installed by the skills CLI. Reads the conventional commits since the last tag, recommends patch, minor, or major, verifies the version is unused, runs the bump script, and commits the change.
metadata:
  internal: true
---

# release

Cut a release of `pm-skills`. The version of record is the `version` field in
`package.json`. `.github/workflows/release.yml` creates the `v{version}` tag
and a GitHub release when `package.json` changes on `main`.

`.github/workflows/ci.yml` requires a version bump in any pull request that
changes `skills/**`, so a skills change cannot merge while `v{version}`
already exists. A pull request that touches nothing under `skills/` (docs,
CI, scripts, `.agents/skills/`) merges without one.

This skill is repository-only. It lives in `.agents/skills/`, outside the
shipped `skills/` set, and its frontmatter sets `metadata.internal: true`, so
the `skills` CLI hides it from consumers and installs it only when
`INSTALL_INTERNAL_SKILLS=1` is set. It is not part of the `pm-*` lifecycle and
is not listed in the README table, the managed-section table, the `pm-setup`
inventory, or the `pm-help` guide.

## Guard

- Work in the repository root. Read the version with
  `node -p 'require("./package.json").version'`.
- If the working tree has uncommitted changes outside `package.json`, stop:
  `Commit or stash <paths> first.` A release commit changes only
  `package.json`.
- Change nothing else: not the skills, the managed section, the README, or the
  `Rules version` in `skills/pm-init/templates/config.md`. The release version
  and the rules/skills version are independent.
- If the branch changes `skills/pm-setup/references/AGENTS-section.md`, its
  `version=N` start marker (and `Rules version` in
  `skills/pm-init/templates/config.md`) must already be bumped, or CI fails
  the pull request and `pm-setup` would never install the change. The rules
  version is separate from the release version.
- Never create or delete tags, and never push or merge: print the command
  instead. The Release workflow owns the tag.
- `v{version}` already existing is normal: it is the last release. The point of
  this skill is to move past it.

## Steps

1. **Read the state.** Current version (`node -p`), the tags
   (`git tag --list 'v*'`), and the commits since the last release
   (`git log --oneline v{version}..HEAD`). If `v{version}` is not a tag yet,
   say so: the current version is unreleased, so this skill is only needed if
   the user wants a different number.
2. **Recommend a part.** From the conventional commits since `v{version}`:
   `major` for a breaking change (a `!` after the type or scope, or a
   `BREAKING CHANGE:` footer); otherwise `minor` when any `feat` is present;
   otherwise `patch`. State the part, the resulting version, and the commits
   that decided it.
3. **Confirm.** Ask one choice question: `Bump to which version?` with the
   recommended `v<next> (<part>)` first, then the other two parts, each
   labelled with its version, and `Keep v<current>`. Do not offer a version
   that is already tagged.
4. **Bump.** Run `bun scripts/bump-version.ts <part>` (or `just bump <part>`).
   The script rewrites only the `version` field and fails when the target
   `v<next>` tag already exists.
5. **Commit.** `git add package.json`, then
   `git commit -m "chore(release): v<next>"`. Do not amend an existing commit.
6. **Report.** Print the new version, the commit, and the next command:
   `git push` (or open a pull request). Merging to `main` triggers the Release
   workflow, which creates the tag and the GitHub release.

## Output

```markdown
## Released

- Version: v<next> (was v<current>, <part>)
- Decided by: <the commits that set the part>
- Commit: <short sha> chore(release): v<next>

## Do this next

1. Push and merge.
   - Start with: `git push`
   - Done when: `main` shows the v<next> tag and a GitHub release
```
