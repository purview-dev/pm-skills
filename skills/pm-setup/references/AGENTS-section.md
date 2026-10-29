<!-- pm-skills:start version=3 -->
<!-- Managed by pm-setup. Edit outside these markers; content inside is replaced on upgrade. -->

## Project management layer (`pm-*` skills)

This repo uses a thin project-management layer that sits above the
development workflow skills (currently Superpowers). It decides **which**
feature is worked on. The workflow skills decide **how** it is built.

The PM state directory is selected during `pm-setup` (default: `planning/`)
and recorded here. In these instructions, **PM root** means that
repository-relative directory. All PM state paths are relative to the
repository root.

- PM state directory: `planning/`

| Skill | Purpose | When it may run |
| --- | --- | --- |
| `pm-setup` | Install or upgrade these skills and this section | User asks |
| `pm-init` | Create the PM root and write `VISION.md` | User asks |
| `pm-resume` | Show where work stopped and the one next action | Session start, or user asks |
| `pm-next` | Pick and claim the next roadmap item, hand off to design | No active item, user asks |
| `pm-park` | Capture an off-task idea without derailing | Any time (capture mode only) |
| `pm-checkpoint` | Save state at a stopping point; close finished items | Session end, stage end, user asks |
| `pm-review` | Weekly triage of inbox and roadmap | User asks, or `pm-resume` says review is due |
| `pm-item` | Drop, block, unblock, or move one roadmap item | User asks |
| `pm-status` | Show the roadmap queue, inbox, and review status (read-only) | User asks |

State lives in the PM root (see `config.md` there). Handoffs to workflow
skills are defined in the **Handoffs** table in that `config.md`. To change
frameworks, edit that table. Do not edit the skills.

## Shared definitions

Every `pm-*` skill uses these definitions. The skills do not redefine them.

- **Rules:** this section. It lives in `AGENTS.md` or `CLAUDE.md`. Where a
  skill says "the rules", it means this section.
- **Limits:** read them from the Limits list in `<PM root>/config.md`
  every time. Never hard-code them. `NOW.md` holds one item, so only one
  item is active at a time.
- **Current session:** the output of `git branch --show-current`. The
  `Session` field in `NOW.md` starts with a branch name. The session matches
  when the current branch equals that name. Empty output (detached HEAD)
  never matches.
- **Item IDs:** `R-NNN` (at least 3 digits). A new ID is the highest number
  found in `ROADMAP.md`, `NOW.md`, and `LOG.md`, plus 1. IDs are never
  reused. Every `LOG.md` line about a roadmap item includes its ID.
- **Timestamps:** local time. In bash or zsh, run
  `date "+%Y-%m-%d %H:%M"`. In PowerShell, run
  `Get-Date -Format "yyyy-MM-dd HH:mm"`. Use the one that matches the shell
  in use. For a date only, use the first 10 characters.
- **Review due:** true when the days since `Last review` are at least the
  review cadence, or the inbox file count (excluding `README.md`) is at
  least the inbox threshold. If `Last review` is `never`, only the inbox
  threshold applies.
- **Main worktree:** the first path in `git worktree list`. PM root paths
  are resolved inside it.

## Non-interruption rules (mandatory)

These rules override any general instruction to invoke skills eagerly,
including Superpowers' `using-superpowers` rule ("invoke any skill that
might apply"). That rule does **not** apply to `pm-*` skills, except
`pm-park` in capture mode.

1. **An active workflow owns the session.** A workflow is active when any
   skill in the Handoffs table, or `systematic-debugging`,
   `test-driven-development`, or `verification-before-completion`, has
   started and not finished. It stays active until it finishes or the user
   explicitly says "stop" or "pause".
2. **No PM skill starts automatically during an active workflow.** PM skills
   run only:
   - when the user names them, or
   - at session start (`pm-resume`), or
   - immediately after a design, plan, or finish handoff skill completes
     (`pm-checkpoint`, stage update only).
3. **Mid-workflow, the only permitted PM action is `pm-park` in capture
   mode.** Write one inbox file, reply with one line, then resume the exact
   step that was in progress. No discussion, no evaluation, no follow-up
   questions.
4. **If the user names another PM skill mid-workflow**, do not run it.
   Reply with exactly:
   `Active: <skill> at <step>. I'll run <pm-skill> when this finishes, or
   say "pause" to checkpoint now.`
   If the user says "pause", run `pm-checkpoint`, then the requested skill.
5. **New ideas during a workflow go to `pm-park`, never to
   `brainstorming`.** Brainstorming a new feature starts only from
   `pm-next`.
6. **PM state skills write only inside the PM root, in the main worktree.**
   `pm-setup` may also edit only the managed section in the selected agent
   instructions file. PM state skills never:
   - edit spec or plan files,
   - run git commands that change state (`checkout`, `switch`, `stash`,
     `commit`, `reset`, `merge`, `push`),
   - create or remove worktrees or branches.

   Read-only git (`status`, `log`, `branch`, `worktree list`, `diff`) is
   allowed. Suggested commit commands are printed for the user to run.
7. **Other sessions' claims are read-only.** If the `Session` in `NOW.md`
   does not match the current session, treat that item and its files as
   read-only. Inbox files are one-file-per-idea so parallel sessions never
   conflict.

## Communication contract (all `pm-*` output)

Output must be literal, predictable, and immediately actionable.

- Lead with the answer or the action. No preamble, no praise, no recap.
- Give **one** next action. Offer at most 2 options only when a decision is
  required, and mark one as recommended.
- Every task states **Done when** as observable checks (a test passes, an
  endpoint returns 200, a file exists).
- Use exact file paths, commands, and IDs. No vague verbs ("look into",
  "consider", "maybe"). No idioms.
- Use the skill's fixed template with the same headings in the same order
  every time. Omit empty optional sections. Do not invent new sections.
- At most 5 bullets per section. At most 3 sentences per paragraph.
- Ask one question at a time. State any assumption explicitly as
  `Assumption: ...`.
- **Ask with choices.** When a step needs the user's decision, use the
  agent's interactive choice prompt (for example, a `question` tool). Offer
  the affirmative action first, then the negative option, then a free-text
  escape such as `Type something`. Label options with the action they take
  ("Apply the plan", "Drop R-004"), not a bare keyword. Never require the
  user to type `yes`, `ok`, `approve`, or another literal word. If the
  agent has no choice prompt, ask inline with the same options.
- Flag scope changes explicitly as `SCOPE CHANGE: ...`. Never expand scope
  silently.
- Neutral wording about progress. Report facts (counts, dates), not
  judgements.

<!-- pm-skills:end -->
