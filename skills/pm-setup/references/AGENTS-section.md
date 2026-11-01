<!-- pm-skills:start version=4 -->
<!-- Managed by pm-setup. Edit outside these markers; content inside is replaced on upgrade. -->

## Project management layer (`pm-*` skills)

This repo uses a thin project-management layer that sits above the
development workflow skills (currently Superpowers). It decides **which**
feature is worked on, **why**, and **who** does it. The workflow skills
decide **how** it is built.

The PM state directory is selected during `pm-setup` (default: `planning/`)
and recorded here. In these instructions, **PM root** means that
repository-relative directory. All PM state paths are relative to the
repository root.

- PM state directory: `planning/`

| Skill | Purpose | When it may run |
| --- | --- | --- |
| `pm-setup` | Install or upgrade these skills and this section | User asks |
| `pm-init` | Create the PM root, write `VISION.md`, seed the roadmap | User asks |
| `pm-resume` | Show where work stopped and the next action for the agent and the user | Session start, after compaction, or user asks |
| `pm-next` | Pick and claim the next claimable item, hand off to design | No active item, user asks |
| `pm-park` | Capture an idea, bug, question, or inspiration without derailing | Any time (capture mode only during a workflow) |
| `pm-shape` | Discuss, challenge, and flesh out one idea; decide park, roadmap, build, or drop | No active workflow, user asks |
| `pm-discover` | Analyse the existing product, its history and usage, or answer a product question | No active workflow, user asks |
| `pm-strategy` | Set vision, milestones, bets, and decisions; generate or re-plan the roadmap | User asks, or another PM skill recommends it |
| `pm-purview` | Recommend Purview (purview.dev) .NET tools only where they add value; ask about stack and scale for new projects | User asks, or `pm-init`, `pm-discover`, `pm-shape`, `pm-strategy` find a .NET need it covers |
| `pm-checkpoint` | Save state at a stopping point; close finished items | Session end, before compaction, stage end, user asks |
| `pm-review` | Weekly triage of inbox and roadmap | User asks, or `pm-resume` says review is due |
| `pm-item` | Add, edit, drop, block, unblock, move, reassign, or complete one roadmap item | User asks |
| `pm-status` | Show the summary, task board, roadmap, or the user's queue (read-only) | User asks |
| `pm-help` | Explain the skills, find what is missing in the setup, recommend the next skill (read-only) | User asks (explain mode only during a workflow) |

State lives in the PM root (see `config.md` there). Handoffs to workflow
skills are defined in the **Handoffs** table in that `config.md`. To change
frameworks, edit that table. Do not edit the skills.

## Shared definitions

Every `pm-*` skill uses these definitions. The skills do not redefine them.

- **Rules:** this section. It lives in `AGENTS.md` or `CLAUDE.md`. Where a
  skill says "the rules", it means this section.
- **Limits:** read them from the Limits list in `<PM root>/config.md`
  every time. Never hard-code them. If a limit is missing (older installs),
  use the default from the `pm-init` template and state it as an
  `Assumption:`. `NOW.md` holds one item, so only one item is active at a
  time.
- **Current session:** the output of `git branch --show-current`. The
  `Session` field in `NOW.md` starts with a branch name. The session matches
  when the current branch equals that name. Empty output (detached HEAD)
  never matches.
- **Item IDs:** `R-NNN` (at least 3 digits). A new ID is the highest number
  found in `ROADMAP.md`, `NOW.md`, and `LOG.md`, plus 1. IDs are never
  reused. Every `LOG.md` line about a roadmap item includes its ID.
- **Item fields:** `Serves`, `Done when`, `Size`, and `Status` are
  required. `Milestone`, `Owner`, `Depends on`, `Brief`, `Paused
  checkpoint`, and `Note` are optional. A missing `Owner` means `agent`; a
  missing `Depends on` means `none`.
- **Owner:** `agent` (the agent builds it through the workflow), `user`
  (only the user can do it: decisions, accounts, purchases, reviews,
  content), or `both` (the agent builds it with user input). `agent` and
  `both` items are claimed with `pm-next`. `user` items are never claimed;
  the user does them and closes them with `pm-item done`.
- **Claimable:** an item in `## Next` whose `Status` is `ready` or
  `paused`, whose `Owner` is `agent` or `both`, and whose every
  `Depends on` ID appears in `## Done` in `LOG.md`.
- **Optional files:** `STRATEGY.md`, `briefs/`, and `research/` in the PM
  root may be missing in projects initialised before version 4. Skills that
  read them treat a missing file as empty. Skills that write them create
  them.
- **Inbox file:** one idea per file at
  `<PM root>/inbox/<YYYY-MM-DD-HHMM>-<slug>.md`, written by `pm-park` and
  `pm-discover`, in this format:

  ```markdown
  # <Short title, max 8 words>

  - Captured: <YYYY-MM-DD HH:MM>
  - Source: user | agent (<skill or item ID and stage>)
  - Kind: feature | bug | improvement | question | inspiration | tech-debt
  - Context: <active item ID and stage, or none>
  - Discuss: yes | no
  - Related: <IDs, inbox files, or briefs | none>
  - Brief: <path, once pm-shape has started one | none>
  - Reviewed: <YYYY-MM-DD, set when pm-review keeps it parked | never>

  ## Idea

  <the words as given, verbatim>

  ## Links

  - <URLs, file paths, or screenshots given with the idea>

  ## Notes

  - <YYYY-MM-DD> <text appended later, verbatim>
  ```

  Older inbox files may lack fields; treat missing fields as `none`, `no`,
  or `never`.
- **Brief:** the persistent record of shaping one idea, at
  `<PM root>/briefs/<R-NNN or YYYY-MM-DD>-<slug>.md`, written by
  `pm-shape`. Headings, in order: `Problem`, `Who and evidence`,
  `Original idea`, `Proposal`, `Alternatives considered`, `Challenges and
  answers`, `Ramifications`, `Done when`, `Size and slicing`, `Open
  questions`, `Decision`. Its header lists `Status` (`shaping`, `parked`,
  `on roadmap (<ID>)`, `done`, `dropped`), `Origin`, and `Updated`.
- **Open inbox count:** inbox files, excluding `README.md`, whose
  `Reviewed` is `never` or older than the last review, plus files with
  `Discuss: yes`.
- **Timestamps:** local time. In bash or zsh, run
  `date "+%Y-%m-%d %H:%M"`. In PowerShell, run
  `Get-Date -Format "yyyy-MM-dd HH:mm"`. Use the one that matches the shell
  in use. For a date only, use the first 10 characters.
- **Review due:** true when the days since `Last review` are at least the
  review cadence, or the open inbox count is at least the inbox threshold.
  If `Last review` is `never`, only the inbox threshold applies.
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
   - when the user names them or asks for what they do, or
   - at session start or after compaction (`pm-resume`), or
   - immediately after a design, plan, or finish handoff skill completes
     (`pm-checkpoint`, stage update only), or
   - when the agent parks its own finding (`pm-park`, capture mode).
3. **Mid-workflow, the only permitted PM action is `pm-park` in capture
   mode.** Write one inbox file, reply with one line, then resume the exact
   step that was in progress. No discussion, no evaluation, no follow-up
   questions. If the user wants to discuss the idea, set `Discuss: yes`; it
   is discussed later with `pm-shape`. The one exception: `pm-help` may
   answer a question about a skill in explain mode, without reading PM
   state, then the step in progress resumes.
4. **If the user names another PM skill mid-workflow**, do not run it. Ask
   one choice question: `<skill> is at <step>. When should <pm-skill> run?`
   with the options `After <skill> finishes (recommended)` and `Pause now
   and run it`. If the user picks pause, run `pm-checkpoint` (pause), then
   the requested skill. Otherwise continue the step in progress.
5. **New ideas during a workflow go to `pm-park`, never to `brainstorming`
   or `pm-shape`.** Discussing an idea starts from `pm-shape`. Designing a
   feature starts only from `pm-next`.
6. **PM state skills write only inside the PM root, in the main worktree.**
   `pm-setup` may also edit only the managed section in the selected agent
   instructions file. PM state skills never:
   - edit source code, spec, or plan files,
   - run git commands that change state (`checkout`, `switch`, `stash`,
     `commit`, `reset`, `merge`, `push`),
   - create or remove worktrees or branches.

   Read-only git (`status`, `log`, `branch`, `worktree list`, `diff`) is
   allowed. Suggested commit commands are printed for the user to run.
7. **Other sessions' claims are read-only.** If the `Session` in `NOW.md`
   does not match the current session, treat that item and its files as
   read-only. Inbox files are one-file-per-idea so parallel sessions never
   conflict.

## Challenge protocol (mandatory)

Every idea, feature, roadmap item, vision line, milestone, bet, or priority
order is challenged before it is accepted. This applies equally to ideas
from the user and to the agent's own proposals. It applies in `pm-init`,
`pm-shape`, `pm-discover`, `pm-strategy`, `pm-purview`, `pm-review`,
`pm-item` (add and edit), and `pm-next` (before claiming). It never applies to `pm-park`
capture during a workflow.

1. **Problem:** what problem, for whom, and what evidence shows it exists
   (code, data, user reports, `LOG.md`). If there is none, say so.
2. **Fit:** which `V` line and milestone it serves. Flag any conflict with
   `Out of scope` in `VISION.md` or `Not doing` in `STRATEGY.md`, and any
   earlier drop in `LOG.md`.
3. **Alternatives:** at least two, always including "do nothing" and a
   smaller version. State which one wins and why.
4. **Ramifications:** data and migrations, security and privacy,
   performance, user experience, operations and cost, maintenance,
   dependencies on and from other items, and reversibility. Name the
   concrete effect or write `none found`.
5. **Cost:** size, and which item in Next it delays.
6. **Assumptions:** what must be true, and the signal that would show it
   is wrong.
7. **Agent proposals:** before recommending anything, state the strongest
   argument against it.

How to challenge:

- Make each challenge a concrete claim with evidence (`src/billing.ts`
  has no tenant column), not a vague doubt.
- Scale it: size `S` with a clear problem needs checks 1, 2, and 5 only;
  size `M`, `L`, and anything strategic needs all of them.
- Put each material challenge to the user as a choice question. Record the
  challenge, the answer, and the reason in the file being written.
- Accept the user's decision once it is made. Do not raise the same
  challenge again unless new evidence appears; then cite it.

## Persistence (mandatory)

PM files are the only memory that survives compaction and new sessions.

- **Write-through:** write every decision, answer, and status change to
  its PM file in the same turn it is made, before replying. Never hold PM
  decisions only in the conversation, and never batch them to the end of a
  discussion.
- **Every discussion has a file.** Shaping writes the brief after each
  answer. Discovery writes the research report as findings arrive.
  Strategy writes `STRATEGY.md` after each approved section.
- **Open questions are written down:** in the brief's `## Open questions`,
  or in the `Open question` line of the `NOW.md` checkpoint.
- **Files win.** At session start or after compaction, read the PM state
  (`pm-resume`) before acting on PM matters. If recalled conversation
  content contradicts the files, the files are correct.
- Before a session ends, or when context is about to be compacted, with an
  item active, run `pm-checkpoint` (pause).

## Asking the user (mandatory)

- **Every question uses the agent's interactive question tool** (for
  example `AskUserQuestion` in Claude Code, or the `question` or
  `ask_user` tool in other agents). This includes open-ended questions.
- Offer 2 to 4 options. Put the recommended option first and add
  `(recommended)` to its label. Label each option with the action or
  answer it stands for ("Drop R-004", "Add to Next"), not a bare keyword.
  Rely on the tool's built-in free-text entry for custom answers; if the
  tool has none, add a `Type something` option.
- For open-ended questions, draft 2 or 3 likely answers from the
  repository and PM state and offer them as options. The free-text entry
  covers anything else.
- Make each question stand on its own. The dialog may hide earlier text,
  so include the ID, title, or fact the user needs to decide.
- Ask one decision at a time. Up to 4 independent questions may share one
  prompt when the tool supports it. A question that depends on an earlier
  answer waits for it.
- Use multi-select when the choices are not exclusive, for example which
  findings to park.
- **Never** print lettered or numbered choices for the user to type, and
  never ask the user to reply `yes`, `ok`, `approve`, `a`, or any other
  keyword to continue. If no question tool exists, ask one plain-language
  question and accept a free-form answer.

## Communication contract (all `pm-*` output)

Output must be literal, predictable, and immediately actionable.

- Lead with the answer or the action. No preamble, no praise, no recap.
- Give **one** next action. Offer at most 2 alternatives only when a
  decision is required, and mark one as recommended.
- Every task states **Done when** as observable checks (a test passes, an
  endpoint returns 200, a file exists).
- Use exact file paths, commands, and IDs. No vague verbs ("look into",
  "consider", "maybe"). No idioms.
- Use the skill's fixed template with the same headings in the same order
  every time. Omit empty optional sections. Do not invent new sections.
- At most 5 bullets per section, except boards, tables, and lists that a
  skill's template defines as complete. At most 3 sentences per paragraph.
- State any assumption explicitly as `Assumption: ...`.
- Flag scope changes explicitly as `SCOPE CHANGE: ...`. Never expand scope
  silently; park the extra work instead.
- Neutral wording about progress. Report facts (counts, dates), not
  judgements.

<!-- pm-skills:end -->
