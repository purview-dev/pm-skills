<!-- pm-skills:start version=6 -->
<!-- Managed by pm-setup. Edit outside these markers; content inside is replaced on upgrade.
     Installed copies keep this marker without a version. The version of record is
     `Rules version` in the PM root config.md, so editing or merging this file cannot lose it. -->

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
| `pm-rejoin` | Find the true position in the lifecycle from git and PM state, then rejoin at the right stage | Drifted or detached from the lifecycle, NOW.md disagrees with the work, user asks "where am I" |
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
  are resolved inside it. Quote the path in commands, because it may
  contain spaces.
- **PM branch:** the branch named by `PM branch` in `<PM root>/config.md`.
  It is where PM state is committed, normally the repository's default
  branch. Installs without the setting use the main worktree's current
  branch.
- **Uncommitted PM state:** the paths printed by
  `git -C <main worktree> status --porcelain -- <PM root>`.
- **Drift:** the PM state disagrees with the work in progress. Either
  `NOW.md` is idle while the current branch matches the `Branch name
  pattern`, or `NOW.md` names another `Session` while this branch is the
  item's own branch. `pm-rejoin` locates drift and repairs it.
- **Rules version:** the installed version of this section, recorded as
  `Rules version` in the `Install` section of `<PM root>/config.md`. It is
  the only version of record, and it survives edits, merges, and rewrites
  of the agent instructions file.
- **Skills version:** the `N` in `<!-- pm-skills:start version=N -->` at the
  top of `references/AGENTS-section.md` in the installed `pm-setup` skill
  folder (locations: `pm-setup` step 2, item 4). The rules and the skills
  ship together, so equal numbers mean a current install.
- **Legacy version:** an install made before version 6 carries `version=N`
  in its start marker instead. Treat it as the **Rules version** when
  `config.md` has none; `pm-setup` migrates it and rewrites the marker
  without a version.

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
   is discussed later with `pm-shape`. The exceptions: `pm-help` may
   answer a question about a skill in explain mode, without reading PM
   state; `pm-rejoin` may run in `locate` mode, which reads git and PM
   state and writes nothing. In both cases the step in progress resumes
   afterwards.
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
   instructions file, and the `Rules version` line in `<PM root>/config.md`.
   PM state skills never:
   - edit source code, spec, or plan files,
   - create or remove worktrees or branches,
   - `stash`, `reset`, `merge`, `push`, `rebase`, or `cherry-pick`,
   - switch branches, except the switch to the PM branch that a PM commit
     offers,
   - stage or commit anything outside the PM root.

   The only state-changing git commands a skill runs are the `add` and
   `commit` of one PM commit (see **Committing PM state**). Read-only git
   (`status`, `log`, `branch`, `worktree list`, `diff`) is always allowed.
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

## Committing PM state (mandatory)

PM files are the memory, so they are committed as part of the work. No
skill leaves them loose in the working tree for the user to find, add, and
commit later. A commit made this way is a **PM commit**.

1. **Read the policy** from the `Commits` section of `<PM root>/config.md`:
   `PM state commit: always | ask | never` and `PM branch: <branch>`. A
   missing section (installs before version 5) means `ask`, with the main
   worktree's current branch as the PM branch.
2. **Check the changes** in the main worktree: **Uncommitted PM state**
   (Shared definitions). No output means there is nothing to commit; say
   nothing about commits. Otherwise continue.
3. **Check the branch:** `git -C <main worktree> branch --show-current`.
   If it is empty (detached HEAD) or is not the PM branch, ask one choice
   question: `The main worktree is on <branch>. How should the PM state be
   committed?` with the options `Switch to <PM branch> and commit
   (recommended)`, `Commit on <branch>`, and `Leave it uncommitted`. Offer
   the switch only when every changed path in that worktree is inside the
   PM root; otherwise omit that option and say which path blocks it. After
   the switch, the main worktree stays on the PM branch.
4. **Stop, print, and commit nothing** when the main worktree has a merge,
   rebase, cherry-pick, revert, or bisect in progress, or when the commit
   fails. Show the git output, put the two commands from step 6 in a
   `Note`, and finish the skill's own output. Repair a failed pre-commit
   hook only when the repair is inside the PM root, then retry once. Never
   retry with `--no-verify`, and never `stash` or `reset` to force a
   commit.
5. **Ask, unless the policy says otherwise.** On `ask`, ask one choice
   question: `Commit the <n> changed PM files?` with the options `Commit
   them (recommended)` and `Leave them uncommitted`; the free-text entry is
   the commit message. On `always`, commit without asking. On `never`, put
   the commands in a `Note` and run nothing.
6. **Run these two commands, in this order:**

   ```bash
   git -C "<main worktree>" add -A -- "<PM root>"
   git -C "<main worktree>" commit -m "<message>" -- "<PM root>"
   ```

   The pathspec keeps another session's staged work out of the commit. Then
   rerun the check from step 2 and confirm it prints nothing.

7. **Message:** `docs(pm): <verb> <what changed>`, at most 72 characters,
   for example `docs(pm): close R-007 tenant billing` or `docs(pm): pause
   R-007 at execute`. Use the repository's own commit convention instead
   when its agent instructions or contributing guide states one.

Rules:

- One commit per skill run, after the last PM file is written, and none at
  all for a skill that wrote nothing.
- Leftovers are swept in: PM files left uncommitted by an earlier session
  belong in this commit. When `NOW.md` belongs to another session
  (Non-interruption rule 7), commit only the paths this run changed.
- Commit the PM root only. Source code, specs, plans, and agent instruction
  files are never included, even when the same work changed them.
- `pm-park` never commits: it runs mid-workflow and must return in one
  line. Its inbox files are committed by the next skill that commits,
  usually `pm-checkpoint`.
- A PM commit never pushes, tags, merges, rebases, or creates or deletes
  branches.
- Report the result as one `Note` line: `<short sha> <subject>`, `PM state
  unchanged`, or `PM state left uncommitted: <n> files`.

## Upgrading before work resumes (mandatory)

The rules and the skills carry the same version, and a new behaviour
usually needs both. The version of the rules installed here is recorded in
PM state (`Rules version` in `<PM root>/config.md`), not in the agent
instructions file, so editing, merging, or rewriting that file cannot lose
it.

`pm-resume`, `pm-rejoin`, and `pm-next` run this check before anything
else. `pm-help` reports it as a diagnosis. `pm-setup` never runs it,
because it is the fix.

1. **Read the state** (Shared definitions): the **Rules version** from
   `<PM root>/config.md`, the **Skills version** from the installed
   `pm-setup` reference, and whether any agent instructions file still
   contains `<!-- pm-skills:start`. In bash,
   `grep -o 'Rules version: [0-9]*' <PM root>/config.md`; in PowerShell,
   `Select-String -Path '<PM root>/config.md' -Pattern 'Rules version: \d+'`.
   If `<PM root>/config.md` is missing, skip this check: the skill's own
   guard reports the missing state. If `pm-setup` is not installed, the
   skills version is unknown: reply `Skills version unknown: pm-setup is
   not installed.`, recommend
   `npx skills add https://github.com/purview-dev/pm-skills -y`, and stop.
2. **Compare:**

   | Rules version | Start marker in the agent file | Action |
   | --- | --- | --- |
   | equal to the skills version | present | continue |
   | older than the skills version | present | step 3 |
   | any, including a legacy marker version | absent | step 4 |
   | not recorded | present | step 4 |

3. **Upgrade.** Ask one choice question: `Rules are v<old>; the skills are
   v<new>. Upgrade before continuing?` with the options `Run pm-setup now
   (recommended)` and `Continue on v<old> for this session`. On `Run
   pm-setup now`, run it, show its output, then continue the skill that
   asked. On `Continue`, put `Upgrade debt: rules v<old>, skills v<new>.`
   in the output `Note` and continue.
4. **Repair, record, or migrate.** Reply `Rules: v<version or not
   recorded>; skills: v<version>; section: <present | missing>.` Then ask:
   `Run pm-setup now?` with the options `Run pm-setup now (recommended)`
   and `Continue`. `pm-setup` records the version, migrates a legacy marker,
   and re-installs a missing section. On `Continue`, put `Upgrade debt:
   rules <version or not recorded>, skills v<new>.` in the output `Note`
   and continue, except when the section is missing: then stop, because the
   rules the user relies on are not in the agent file.
5. **Skills older:** reply `Skills are older than the rules (v<old> against
   v<new>).` and ask: `Update the skills now?` with the options `Update,
   then run pm-setup (recommended)` and `Continue on v<old>`. Print
   `npx skills update` for the user to run; never run the skills CLI
   yourself. Then run `pm-setup` when the user asks.
6. **A start marker without a version is normal.** It marks the boundaries
   only. A marker that still carries `version=N` is a legacy install, and
   `pm-setup` migrates it.
7. **During a workflow** these questions wait for the workflow to finish
   (Non-interruption rule 4). `pm-checkpoint` and `pm-park` never run this
   check: saving the state always comes first.

After an upgrade, check `<PM root>/config.md` for the settings the new
version adds; version 5 adds the `## Commits` section. Ask one choice
question: `config.md has no Commits section. Add it with defaults?` with
the options `Add it (recommended)` and `Leave it`. If the user leaves it,
PM commits ask before each commit.

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
