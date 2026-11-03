---
name: pm-help
description: Use when the user asks for help with the pm-* skills, what a pm skill does, which pm skill to use, how the project-management workflow fits together, or what is missing or out of date in the project's PM setup. Explains the skills, checks the install and PM state for gaps, and recommends the next skill to run. Read-only.
---

# pm-help

Explain the `pm-*` skills and recommend which one to run now, based on
what is installed and what the PM state shows. Read-only: this skill never
writes files and never runs the skill it recommends without asking.

Follow the Non-interruption rules, Shared definitions, Asking the user, and
Communication contract in the pm-skills section of the agent instructions
file (`AGENTS.md` or `CLAUDE.md`), if that section exists. PM root is its
`PM state directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `overview` | Default: "help", "what can the pm skills do", "what should I do" | Diagnose the setup, list the skills, recommend one |
| `explain <skill or topic>` | "What does pm-shape do?", "how do I park an idea?", "what is a brief?" | Explain one skill or concept |

## Guard

- If a workflow is active, only `explain` mode may run, and only from the
  skill guide below, without reading PM state. Answer in at most 5 lines,
  then resume the step in progress. For `overview`, apply
  Non-interruption rule 4.
- If the pm-skills section is missing from the agent instructions, still
  run: diagnosis check 1 reports it.

## Skill guide

Use this to explain skills. Keep each explanation to its row plus, when
asked, the skill's own `SKILL.md` steps.

| Skill | Use it when | Say for example | Writes |
| --- | --- | --- | --- |
| `pm-setup` | Installing or upgrading the skills and the rules in `AGENTS.md` or `CLAUDE.md` | "set up the pm skills" | The managed section only |
| `pm-init` | Starting project management in a repository, once | "initialise planning" | The PM root, `VISION.md`, a seeded roadmap |
| `pm-resume` | Starting a session, or after the context was compacted | "where was I?" | Nothing |
| `pm-rejoin` | You lost the pm thread, a workflow is running that `NOW.md` does not record, or a session started mid-task | "where am I in the pm lifecycle?", "rejoin", "get back on track" | `NOW.md`, `ROADMAP.md` |
| `pm-next` | Nothing is active and you want to start the next item | "what's next?", "start R-007" | `NOW.md`, `ROADMAP.md` |
| `pm-park` | You or the agent have an idea, bug, question, or inspiration to remember, even mid-task | "park this: ...", "note that ..." | One inbox file |
| `pm-shape` | You want to brainstorm, discuss, or challenge one idea before committing to it | "let's think through dark mode" | A brief; a roadmap item if accepted |
| `pm-discover` | You want evidence from the code, history, or usage data, or an answer about how the product works today | "what should we fix next?", "is export used?" | A research report; inbox ideas |
| `pm-strategy` | Setting focus, milestones, bets, or the vision, or rebuilding the roadmap | "re-plan the roadmap" | `STRATEGY.md`, `VISION.md`, `ROADMAP.md` |
| `pm-purview` | A .NET project wants to know which Purview tools would help, or a new project is choosing its stack | "would Purview help here?" | A research report; roadmap items if accepted |
| `pm-checkpoint` | Stopping, pausing, switching items, or finishing one | "pause", "R-007 is done" | `NOW.md`, `LOG.md`, `ROADMAP.md` |
| `pm-review` | Weekly, or when `pm-resume` says a review is due | "weekly review" | Inbox, `ROADMAP.md`, `LOG.md`, `config.md` |
| `pm-item` | Changing one roadmap item: add, edit, drop, block, move, reassign, or mark a task of yours done | "drop R-012", "I've done R-009" | `ROADMAP.md`, `LOG.md` |
| `pm-status` | Seeing the summary, task board, milestone roadmap, or your own queue | "show the board", "what do I need to do?" | Nothing |
| `pm-help` | Not sure which skill to use | "pm help" | Nothing |

Concepts to explain on request, from the pm-skills section: the PM root,
item IDs and fields, owners (agent, user, both), claimable items, the
inbox file, briefs, the Challenge protocol, Persistence, the
Non-interruption rules, PM commits and the `Commits` section in
`<PM root>/config.md`, the rules version and the upgrade check, drift and
`pm-rejoin`, and the Handoffs table in `<PM root>/config.md`.

## Steps (overview)

1. **Diagnose.** Run these checks in order. Each failure is one finding
   with the skill that fixes it. Read-only git commands only.

   | # | Check | Finding if it fails | Fix |
   | --- | --- | --- | --- |
   | 1 | `AGENTS.md` or `CLAUDE.md` contains `<!-- pm-skills:start` | Rules not installed (`<PM root>/config.md` records the version when they were) | `pm-setup` |
   | 2 | `Rules version` in `<PM root>/config.md` equals the `version=` in `pm-setup`'s `references/AGENTS-section.md`, if readable; a legacy `version=` in the marker counts when `config.md` records none | `Rules out of date (v<old>, v<new> available)`, `Rules version not recorded`, or `Skills older than the rules (v<old>, v<new>)` | `pm-setup`, or `npx skills update` then `pm-setup` |
   | 3 | Every skill in the guide has an installed `SKILL.md` (same locations as `pm-setup` step 2) | Missing skills: names | `npx skills add https://github.com/purview-dev/pm-skills -y` |
   | 4 | `<PM root>/config.md` and `NOW.md` exist | PM state not initialised | `pm-init` |
   | 5 | `VISION.md` has no `[...]` placeholders left | Vision incomplete | `pm-strategy` (vision) |
   | 6 | `STRATEGY.md` exists and has at least one milestone and a `Current focus` | No strategy or focus | `pm-strategy` |
   | 7 | Every skill named in the Handoffs table in `config.md` is installed | Handoff skill missing: name | Edit the Handoffs table, or install it |
   | 8 | `NOW.md` is not malformed (fields as in `pm-resume`) | `NOW.md` malformed | Fix by hand, or `git restore` it |
   | 9 | If an item is active: its last checkpoint is under 7 days old | `Active item idle for <n> days` | `pm-resume`, then `pm-checkpoint` |
   | 10 | Next has a claimable item, or an item is active | Nothing claimable | `pm-review`, or the blocking user task |
   | 11 | Review due is false (Shared definitions) | Review due | `pm-review` |
   | 12 | No inbox file has `Discuss: yes` and no brief has `Status: shaping` | `<n> ideas waiting for discussion` | `pm-shape` |
   | 13 | No `Owner: user` item blocks an agent item | `Your task <ID> blocks <IDs>` | Do it, then `pm-item done <ID>` |
   | 14 | If the repository has `.csproj`, `.slnx`, or `.sln` files: a `research/*purview-fit.md` report exists | Purview fit not assessed | `pm-purview` |
   | 15 | If the repository has substantial code: a `research/` report exists | Roadmap not checked against the existing product | `pm-discover` |
   | 16 | `NOW.md` agrees with the work: when idle, the current branch does not match the `Branch name pattern`; when active, `Session` equals the current branch | Drifted from the lifecycle | `pm-rejoin` |
   | 17 | **Uncommitted PM state** is empty | `<n>` uncommitted PM files | `pm-checkpoint`, which commits them |

   Stop at the first failing check among 1 to 4; later checks depend on
   them.
2. **Recommend.** The recommendation is the fix for the first failing
   check. If nothing fails, it is the next action from `pm-resume`'s
   rules (usually `pm-next`, or continuing the active item).
3. Show the output. Then ask one choice question: `Run <recommended
   skill> now?` with the options `Run it (recommended)` and `Explain
   another skill`. On `Explain another skill`, ask which, offering the 3
   skills most relevant to the findings as options.

## Steps (explain)

1. Match the request to a skill or concept. If it matches none, offer the
   2 or 3 closest skills as choices.
2. Answer from the skill guide row and the skill's `SKILL.md`: what it
   does, when to use it, what to say to start it, what it writes, and
   what it never does. For a concept, quote the definition from the
   pm-skills section.
3. If the PM state exists and the workflow is not active, add one line on
   whether the skill applies right now and why.

## Output (overview)

```markdown
## PM help

- Rules: <v<n> installed | out of date (v<old> to v<new>) | skills older (v<old> to v<new>) | version not recorded | not installed>
- Skills: <n>/<total> installed
- PM state: <initialised at <PM root> | not initialised>
- Now: <ID Title (stage) | idle>

## What's missing

- <finding>: fix with `<skill or command>`

## Skills

| Skill | Use it when |
| --- | --- |
| <every skill from the guide, one row each> | |

## Do this next

1. <the recommendation>
   - Start with: <skill name or command>
   - Done when: <observable check>
```

Omit `What's missing` when every check passes. The Skills table lists
every skill; it is exempt from the 5-bullet limit.

## Output (explain)

```markdown
## <skill or concept>

- What: <one sentence>
- Use when: <one sentence>
- Start with: "<example phrase>"
- Writes: <files | nothing>
- Never: <the main thing it will not do>
- Right now: <applies | does not apply>, because <fact>
```
