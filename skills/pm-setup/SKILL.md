---
name: pm-setup
description: Use only when the user explicitly asks to set up, add, or upgrade the pm-* project-management skills in a repository, including merging their rules into an existing AGENTS.md or CLAUDE.md.
---

# pm-setup

Wire the `pm-*` skills into a repository. Merge their rules into the
existing agent instructions file, and check that every `pm-*` skill is
installed. Existing content is never rewritten, reordered, or removed.

- Source repository: `https://github.com/kjldev/pm-skills`
- Rules to merge: `references/AGENTS-section.md` in this skill's folder.
- Skills are installed by the `skills` CLI, not by this skill:
  `npx skills add <source> -y`

## Guard

- If a workflow skill is active in this conversation (brainstorming,
  planning, executing, debugging, TDD), do not start. Reply:
  `Active: <skill> at <step>. I'll run pm-setup when this finishes.`
- The current folder must be inside a git repository. Work in the **main
  worktree**: the first path in `git worktree list`.
- If `AGENTS.md` or `CLAUDE.md` has uncommitted changes, stop. Reply:
  `Commit or stash changes to <file> first, so this merge can be reverted
  with git.` This is the rollback guarantee.

## Step 1: Inventory (read-only)

Collect these facts. Write nothing yet.

1. **Agent files:** whether `AGENTS.md`, `CLAUDE.md`, and
   `.claude/CLAUDE.md` exist at the repository root. For each one, record
   its line endings (LF or CRLF), whether it starts with a UTF-8 BOM, and
   whether it ends with a newline.
2. **Imports:** whether `CLAUDE.md` contains a line `@AGENTS.md`.
3. **Existing merge:** whether any agent file contains
   `<!-- pm-skills:start`. If it does, read its `version=` value and
   compare it with the version in `references/AGENTS-section.md`.
4. **Installed skills:** for each of `pm-init`, `pm-resume`, `pm-next`,
   `pm-park`, `pm-checkpoint`, and `pm-review`, check whether a `SKILL.md`
   exists in `.claude/skills/<name>/` or `.agents/skills/<name>/`. A
   symlink counts.
5. **PM state:** whether `pm/` exists.
6. **Workflow framework:** look for skills named `brainstorming`,
   `writing-plans`, `executing-plans`, and `subagent-driven-development` in
   `.claude/skills/`, `.agents/skills/`, `~/.claude/skills/`, and
   `~/.claude/plugins/`. Record the result as one of: Superpowers found,
   other framework found (name it), or none.
7. **Conflicting instructions:** search the agent files (case-insensitive)
   for `brainstorm`, `using-superpowers`, `always invoke`, `TODO.md`,
   `backlog`, `roadmap`, `task list`, `commit automatically`, `auto-commit`,
   `worktree`. Read each match in context. It is a conflict only if
   following it would break a Non-interruption rule in
   `references/AGENTS-section.md`. For example:
   - "Always brainstorm new ideas immediately" conflicts with rule 5.
   - "Track tasks in TODO.md" is a second task system, which conflicts with
     `pm/` as the single source of truth.
   - "Commit after every change", applied to PM files, conflicts with
     rule 6.

## Step 2: Choose the target file

| Found | Target for the section | Extra change |
| --- | --- | --- |
| Markers already in a file | That file (replace in place) | None |
| `AGENTS.md` and a `CLAUDE.md` that imports it | `AGENTS.md` | None |
| `AGENTS.md` and a `CLAUDE.md` that does not import it | `AGENTS.md` | Append `@AGENTS.md` to `CLAUDE.md` |
| `AGENTS.md` only | `AGENTS.md` | None |
| `CLAUDE.md` only | `CLAUDE.md` | None |
| Neither | New `AGENTS.md` | New `CLAUDE.md` containing `@AGENTS.md` |

If only `.claude/CLAUDE.md` exists, treat it as `CLAUDE.md`.

## Step 3: Show the plan and get one confirmation

Show this, then ask exactly one question: `Apply? (yes / no / change
<item>)`.

```markdown
## pm-setup plan

- Mode: install | upgrade v<old> to v<new> | already current (nothing to do)
- Target: <file> (<append section | replace between markers>)
- Extra: <@AGENTS.md import added to CLAUDE.md | none>
- Skills: <n> of 6 installed. Missing: <names | none>
- Workflow framework: <Superpowers | name | none>

## Conflicts in your existing instructions

| File:line | Text (short) | Rule | Proposed |
| --- | --- | --- | --- |
| AGENTS.md:42 | "Brainstorm every new idea" | 5 | Leave it. The pm section states that pm-park comes first. |

## Not changed

- Everything outside the pm-skills markers.
- pm/ (run pm-init to create it).
```

Rules for this step:

- If there are no conflicts, omit the Conflicts section.
- For each conflict, the default proposal is **Leave it**. The managed
  section already states precedence. Offer to edit a conflicting line only
  if the user asks, and then ask for a yes per line.
- If skills are missing, add this line to the plan:
  `Missing skills: run npx skills add https://github.com/kjldev/pm-skills -y
  after this merge.`
  Do not install them yourself.
- If the framework is "none" or "other", add `Assumption: the Handoffs
  table will need editing in pm/config.md after pm-init.`
- If the mode is "already current" and no skills are missing, stop after
  showing the plan.

## Step 4: Apply (only after "yes")

1. **Section.** Read `references/AGENTS-section.md`.
   - Upgrade: replace everything from `<!-- pm-skills:start` through
     `<!-- pm-skills:end -->`, inclusive. Change nothing else.
   - Install: append to the end of the target file. If the file does not
     end with a newline, add one, then a blank line, then the section.
   - Match the target file's existing line endings and BOM. Do not
     re-wrap, re-indent, or reformat any existing line.
2. **Import.** If step 2 calls for it, append `@AGENTS.md` on its own line
   at the end of `CLAUDE.md`, preceded by one blank line.
3. **pm/config.md.** If `pm/config.md` exists, check that each skill in its
   Handoffs table exists. Report any missing ones. Do not edit the file.

## Step 5: Verify

1. Run `git diff --stat` and `git diff` on the agent files. The only changes
   must be inside the markers, plus the `@AGENTS.md` line if one was added.
   If anything else changed, revert that file with
   `git checkout -- <file>` and report the failure.
2. Check that the start marker and end marker each appear exactly once,
   across all agent files.
3. If the repository has a markdownlint config, run `npx markdownlint-cli2`
   on the changed files and report the result.

## Output

```markdown
## pm-setup done

- Target: <file> (<installed | upgraded to v<n>>)
- Skills: <6 of 6 installed | missing: names>
- Diff check: only the managed section changed

## Do this next

1. <Only if skills are missing:> Install the missing skills.
   - Start with: `npx skills add https://github.com/kjldev/pm-skills -y`
   - Done when: all 6 pm-* skills are listed by `npx skills list`
2. Commit.
   - Start with: `git add <changed paths> && git commit -m "chore: add pm-* skills"`.
     List only paths that exist, taken from: `.claude/skills/pm-*`,
     `.agents/skills/pm-*`, `AGENTS.md`, and `CLAUDE.md`.
   - Done when: `git status` is clean
3. <Run pm-init, if pm/ does not exist. Otherwise run pm-resume.>
```

Do not run the install or the commit. Print them for the user.

## Upgrading later

1. `npx skills update` updates the skill files.
2. Run `pm-setup` again. It replaces only the section between the markers
   when the version has changed.
