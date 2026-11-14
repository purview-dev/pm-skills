# Installation

How to install the skills and the workflow skill set they hand off to, then set up the planning files in
your repository.

Run this from the root of the target repository:

```bash
npx skills add https://github.com/purview-dev/pm-skills -y
# or
bunx skills add https://github.com/purview-dev/pm-skills -y
```

Skills install at project level by default. Add `-g` for a user-level
install, or `-a claude-code` to target a single agent. See the
[skills CLI](https://github.com/vercel-labs/skills) for all options.

## The workflow skill set

The skills hand design, planning, and execution to a workflow skill set,
by default [Superpowers](https://github.com/obra/superpowers). `pm-setup`
checks that every workflow skill is installed and prints the command when
one is missing:

```bash
npx skills add https://github.com/obra/superpowers -y
# or, in Claude Code
/plugin install superpowers@claude-plugins-official
```

To use another framework, see [Using a different workflow framework](Other-Workflow-Frameworks.md).

## First run

Then, in your agent:

1. `run pm-setup` merges the rules into your existing `AGENTS.md` or
   `CLAUDE.md`, between `<!-- pm-skills:start -->` and
   `<!-- pm-skills:end -->` markers. Nothing outside the markers changes.
2. Commit, using the command `pm-setup` prints.
3. `run pm-init` writes `planning/VISION.md` by default and seeds the
   roadmap. `pm-setup` asks where to store the planning files before its
   other setup questions; choose a different repository-relative directory
   if needed.
4. Not sure what to run? `pm-help` explains every skill, lists what is
   missing in your setup, and recommends the next skill.

The files `pm-init` creates are listed in [Planning files](../reference/Planning-Files.md).
