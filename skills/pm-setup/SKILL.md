---
name: pm-setup
description: Use only when the user explicitly asks to set up, add, or upgrade the pm-* project-management skills in a repository, including merging their rules into an existing AGENTS.md or CLAUDE.md.
---

# pm-setup

Wire the `pm-*` skills into a repository. Merge their rules into the
existing agent instructions file, and check that every `pm-*` skill is
installed. Existing content is never rewritten, reordered, or removed.

- Source repository: `https://github.com/purview-dev/pm-skills`
- Rules to merge: `references/AGENTS-section.md` in this skill's folder.
- Skills are installed by the `skills` CLI, not by this skill:
  `npx skills add <source> -y` (or `bunx skills add <source> -y`)

## Guard

- If a workflow skill is active in this conversation (brainstorming,
  planning, executing, debugging, TDD), do not start. Reply:
  `Active: <skill> at <step>. I'll run pm-setup when this finishes.`
- This skill is the fix for the upgrade check (rules: Upgrading before work
  resumes), so it never runs that check.
- The only PM state this skill writes is the `Rules version` line in
  `<PM state directory>/config.md`. It never creates or edits any other PM
  file.
- The current folder must be inside a git repository. Work in the **main
  worktree**: the first path in `git worktree list`.
- If `AGENTS.md` or `CLAUDE.md` has uncommitted changes, stop. Reply:
  `Commit or stash changes to <file> first, so this merge can be reverted
  with git.` This is the rollback guarantee.

## Step 1: Choose the PM state directory

If an existing PM state-directory setting is present in a pm-skills
section, preserve it and do not ask again. Otherwise ask this before any
other question, as a choice question: `Which folder should hold the
planning files?` with the options `planning/ (recommended)` and `Type
another folder`.

- Use `planning/` if the user accepts the default.
- Accept only a repository-relative directory. Reject absolute paths, paths
  that escape the repository (such as `../private`), and anything inside
  `.git/`.
- Record the selected path in the managed rules as
  `- PM state directory: planning/`, replacing `planning/` with the user's
  selection. This setting is the source of truth used by all `pm-*` skills.

## Step 2: Inventory (read-only)

Collect these facts. Write nothing yet.

1. **Agent files:** whether `AGENTS.md`, `CLAUDE.md`, and
   `.claude/CLAUDE.md` exist at the repository root. For each one, record
   its line endings (LF or CRLF), whether it starts with a UTF-8 BOM, and
   whether it ends with a newline.
2. **Imports:** whether `CLAUDE.md` contains a line `@AGENTS.md`.
3. **Existing merge and versions:** whether any agent file contains
   `<!-- pm-skills:start`, and whether that marker still carries a
   `version=` value (a legacy install, before version 6); whether any agent
   file contains the section heading `## Project management layer` without a
   start marker (a stranded section); the version in
   `references/AGENTS-section.md` (the skills version); and `Rules version`
   in `<PM state directory>/config.md`, if that file exists. A legacy
   marker's `version=` counts only when `config.md` records none.
4. **Installed skills:** for each of `pm-init`, `pm-resume`, `pm-rejoin`,
   `pm-next`, `pm-up-next`, `pm-park`, `pm-bug`, `pm-risk`, `pm-shape`,
   `pm-discover`, `pm-strategy`, `pm-purview`, `pm-checkpoint`,
   `pm-revise`, `pm-review`, `pm-item`, `pm-board`, `pm-roadmap`,
   `pm-status`, `pm-export`, `pm-docs-site`, and `pm-help`, check that a
   `SKILL.md` exists.
   - First run `npx skills list` (or `bunx skills list`), if either runs.
   - Otherwise check `.agents/skills/<name>/`, `.claude/skills/<name>/`,
     and `.github/skills/<name>/` in the repository, then
     `.agents/skills/`, `.claude/skills/`, and `.copilot/skills/` in the
     user's home folder.
   - A symlink counts. A user-level install counts.
5. **PM state:** whether the selected directory contains PM state
   (`config.md` and `NOW.md`). If it does, record which of `STRATEGY.md`,
   `briefs/`, `research/`, and `RISKS.md` are missing (created on first
   use by version 4 skills, and `RISKS.md` by `pm-risk`). Also run `git check-ignore -q <directory>`. If the
   directory is ignored by git, record it as a warning.
6. **Workflow skills:** the PM skills hand work to these skills, so each
   must be installed. The list is every skill in the Handoffs table of
   `<PM state directory>/config.md` when that file exists, otherwise the
   table in `pm-init`'s `templates/config.md`, plus the three skills that
   Non-interruption rule 1 names. With the default table that is
   `brainstorming`, `writing-plans`, `subagent-driven-development`,
   `executing-plans`, `finishing-a-development-branch`,
   `systematic-debugging`, `test-driven-development`, and
   `verification-before-completion`. Strip any `superpowers:` prefix
   before matching.
   - Look in the output of `npx skills list` (or `bunx skills list`), the
     folders in step 4, and the Claude Code plugin folders in the user's
     home folder: `.claude/plugins/**/skills/<name>/SKILL.md`.
   - A symlink, a user-level install, and a plugin install all count.
   - Record each skill as installed or missing, and the framework as one
     of: Superpowers (every default skill found), other framework (the
     Handoffs table names non-Superpowers skills; name them), partial
     (some missing), or none.
7. **Conflicting instructions:** search the agent files (case-insensitive)
   for `brainstorm`, `using-superpowers`, `always invoke`, `TODO.md`,
   `backlog`, `roadmap`, `task list`, `ideas`, `parking lot`,
   `commit automatically`, `auto-commit`, `worktree`, `type yes`,
   `reply with`. Read each match in context. It is a conflict only if
   following it would break a Non-interruption rule in
   `references/AGENTS-section.md`. For example:
   - "Always brainstorm new ideas immediately" conflicts with rule 5.
   - "Track tasks in TODO.md" is a second task system, which conflicts with
     the configured PM state directory as the single source of truth.
   - "Commit after every change", applied to source, specs, or plans,
     conflicts with rule 6. Only the PM root is committed, by a PM commit.
   - "Ask the user to type yes to continue" conflicts with Asking the
     user.

## Step 3: Choose the target file

| Found | Target for the section | Extra change |
| --- | --- | --- |
| Markers already in a file | That file (replace in place) | None |
| `AGENTS.md` and a `CLAUDE.md` that imports it | `AGENTS.md` | None |
| `AGENTS.md` and a `CLAUDE.md` that does not import it | `AGENTS.md` | Append `@AGENTS.md` to `CLAUDE.md` |
| `AGENTS.md` only | `AGENTS.md` | None |
| `CLAUDE.md` only | `CLAUDE.md` | None |
| Neither | New `AGENTS.md` | New `CLAUDE.md` containing `@AGENTS.md` |

If only `.claude/CLAUDE.md` exists, treat it as `CLAUDE.md`.

## Step 4: Show the plan and ask one question

Show this, then ask exactly one question with the agent's question tool
(never as typed options): `Apply this pm-setup plan to <target>?` with
the options `Apply (recommended)` and `Do not apply`; the tool's free-text
entry covers "change something". The folder question in Step 1 is the
only other question.

```markdown
## pm-setup plan

- Mode: install | upgrade v<old> to v<new> | repair (re-wrap the section) | reinstall (section missing, recorded v<n>) | already current (nothing to do)
- Target: <file> (<append section | replace between markers | wrap the stranded section>)
- Extra: <@AGENTS.md import added to CLAUDE.md | none>
- Skills: <n> of 23 installed. Missing: <names | none>
- Rules version: <v<n> recorded | not recorded | legacy v<n> in the marker | PM state not initialised>
- Workflow framework: <Superpowers | name | partial | none>
- Workflow skills: <n> of <total> installed. Missing: <names | none>
- PM state directory: <path>

## Conflicts in your existing instructions

| File:line | Text (short) | Rule | Proposed |
| --- | --- | --- | --- |
| AGENTS.md:42 | "Brainstorm every new idea" | 5 | Leave it. The pm section states that pm-park comes first. |

## Not changed

- Everything outside the pm-skills markers.
- <PM state directory> (run pm-init to create it).
```

Rules for this step:

- If there are no conflicts, omit the Conflicts section.
- For each conflict, the default proposal is **Leave it**. The managed
  section already states precedence. Offer to edit a conflicting line only
  if the user asks, and then ask one choice question per line: `Change this
  line?` with the options `Leave it (recommended)` and `Change it` (free
  text).
- If skills are missing, add this line to the plan:
  `Missing skills: run npx skills add https://github.com/purview-dev/pm-skills -y
  after this merge.`
  Do not install them yourself.
- If Superpowers skills are missing (framework "partial" or "none" with
  the default Handoffs table), add this line to the plan:
  `Missing workflow skills (<names>): run npx skills add
  https://github.com/obra/superpowers -y, or in Claude Code run /plugin
  install superpowers@claude-plugins-official. pm-next cannot hand off
  until they are installed.`
  Do not install them yourself.
- If the framework is "none" or "other", add `Assumption: the Handoffs
  table will need editing in <PM state directory>/config.md after pm-init.`
- If the PM state directory is ignored by git, add `Warning: <directory> is
  ignored by git, so PM state will not be committed.`
- If the mode is "already current" and no skills are missing, stop after
  showing the plan.

## Step 5: Apply (only after the user chooses Apply)

1. **Section.** Read `references/AGENTS-section.md`.
   - If no setting existed, replace its default `PM state directory` value
     with the path chosen in Step 1.
   - If a setting existed, preserve its current value.
   - Write the start marker as `<!-- pm-skills:start -->`, with no version.
     The version of record is written to `config.md` in item 3.
   - Upgrade: replace everything from `<!-- pm-skills:start` through
     `<!-- pm-skills:end -->`, inclusive. Change nothing else.
   - Repair: when the section heading exists without a start marker, wrap
     the existing section instead of appending. Insert the start marker
     before the heading `## Project management layer` and the end marker
     after the last line of its `## Communication contract` section, which
     runs to the next level-two heading (`##`) that is not one of the
     section's own headings, or to the end of the file. Then replace the
     text between the markers with the reference. Never leave two copies of
     the section.
   - Install or reinstall: append to the end of the target file. If the
     file does not end with a newline, add one, then a blank line, then the
     section.
   - Match the target file's existing line endings and BOM. Do not
     re-wrap, re-indent, or reformat any existing line.
2. **Import.** If Step 3 calls for it, append `@AGENTS.md` on its own line
   at the end of `CLAUDE.md`, preceded by one blank line.
3. **Version of record.** If `<PM state directory>/config.md` exists, set
   `Rules version` to the skills version from the reference, and create the
   `## Install` section when it is missing. This is the migration: a legacy
   `version=` in the old marker becomes this line, and the marker is
   rewritten without it. Change nothing else in the file. If the file does
   not exist, say `PM state not initialised: pm-init records Rules version.`
4. **PM config check.** If `<PM state directory>/config.md` exists, check
   that each skill in its Handoffs table exists and that it has a `Commits`
   section (added in version 5). Report anything missing, including
   `No Commits section in config.md: PM state commits will ask first.` Do
   not edit anything else in the file.

## Step 6: Verify

1. Run `git diff --stat` and `git diff` on the agent files. The only changes
   must be inside the markers, plus the `@AGENTS.md` line if one was added.
   If anything else changed, revert that file with
   `git restore -- <file>` and report the failure.
2. Check that the start marker and end marker each appear exactly once,
   across all agent files, and that the start marker carries no
   `version=`. Check that `config.md`, if changed, differs only in its
   `Rules version` line.
3. If the repository has a markdownlint config, run
   `npx markdownlint-cli2 <files>` (or `bunx markdownlint-cli2 <files>`) on
   the changed files and report the result.

## Output

```markdown
## pm-setup done

- Target: <file> (<installed | upgraded to v<n> | repaired>)
- Skills: <23 of 23 installed | missing: names>
- Workflow skills: <n of n installed | missing: names>
- Rules version: <v<n> recorded in <PM root>/config.md | legacy v<n> migrated | PM state not initialised>
- Diff check: only the managed section changed, plus the Rules version line
- PM state: <not initialized | current | missing version 4 files or the Commits section: names>
- Upgrade gate: <cleared, rules at v<n> | unchanged>

## Do this next

1. <Only if skills are missing:> Install the missing skills.
   - Start with: `npx skills add https://github.com/purview-dev/pm-skills -y`
   - Done when: all 23 pm-* skills are listed by `npx skills list`
2. <Only if workflow skills are missing:> Install the workflow skills.
   - Start with: `npx skills add https://github.com/obra/superpowers -y`,
     or `/plugin install superpowers@claude-plugins-official` in Claude
     Code (for the default Handoffs table; otherwise the framework the
     table names)
   - Done when: every skill in the Handoffs table, and the three named in
     Non-interruption rule 1, is listed by `npx skills list`
3. Commit.
   - Start with: `git add <changed paths> && git commit -m "chore: add pm-* skills"`.
     List only paths that exist, taken from: `.agents/skills/pm-*`,
     `.claude/skills/pm-*`, `.github/skills/pm-*`, `AGENTS.md`,
     `CLAUDE.md`, and `<PM state directory>/config.md`.
   - Done when: `git status` is clean
4. <Run pm-init, if the PM state is not initialized. Run pm-strategy, if
   `STRATEGY.md` is missing after an upgrade. Otherwise run pm-resume, or
   pm-help for an overview of every skill.>
```

Do not run the install or the commit. Print them for the user.

## Upgrading later

1. `npx skills update` updates the skill files.
2. Run `pm-setup` again. It replaces only the section between the markers
   when the version has changed.
