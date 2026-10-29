<!-- pm-skills:start version=1 -->
<!-- Managed by pm-setup. Edit outside these markers; content inside is replaced on upgrade. -->

## Project management layer (`pm-*` skills)

This repo uses a thin project-management layer that sits above the
development workflow skills (currently Superpowers). It decides **which**
feature is worked on. The workflow skills decide **how** it is built.

| Skill | Purpose | When it may run |
| --- | --- | --- |
| `pm-setup` | Install or upgrade these skills and this section | User asks |
| `pm-init` | Create `pm/` and write `pm/VISION.md` | User asks |
| `pm-resume` | Show where work stopped and the one next action | Session start, or user asks |
| `pm-next` | Pick and claim the next roadmap item, hand off to design | No active item, user asks |
| `pm-park` | Capture an off-task idea without derailing | Any time (capture mode only) |
| `pm-checkpoint` | Save state at a stopping point; close finished items | Session end, stage end, user asks |
| `pm-review` | Weekly triage of inbox and roadmap | User asks, or `pm-resume` says review is due |

State lives in `pm/` (see `pm/config.md`). Handoffs to workflow skills are
defined in the **Handoffs** table in `pm/config.md`. To change frameworks,
edit that table. Do not edit the skills.

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
6. **PM skills write only inside `pm/`, in the main worktree.** They never:
   - edit spec or plan files,
   - run git commands that change state (`checkout`, `switch`, `stash`,
     `commit`, `reset`, `merge`, `push`),
   - create or remove worktrees or branches.

   Read-only git (`status`, `log`, `branch`, `worktree list`, `diff`) is
   allowed. Suggested commit commands are printed for the user to run.
7. **Other sessions' claims are read-only.** If `pm/NOW.md` names a session
   (branch or worktree) that is not the current one, treat that item and
   its files as read-only. Inbox files are one-file-per-idea so parallel
   sessions never conflict.

## Communication contract (all `pm-*` output)

The user is a solo developer with ASD and inattentive ADHD. Output must be
literal, predictable, and immediately actionable.

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
- Flag scope changes explicitly as `SCOPE CHANGE: ...`. Never expand scope
  silently.
- Neutral wording about progress. Report facts (counts, dates), not
  judgements.

<!-- pm-skills:end -->
