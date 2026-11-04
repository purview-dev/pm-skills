---
name: pm-strategy
description: Use when the user asks to set or revise the product strategy, vision, milestones, focus, or bets, to generate, rebuild, or re-plan the roadmap, or to decide what the project should work on over the coming weeks. Challenges every change, then writes STRATEGY.md, VISION.md, and ROADMAP.md one approved section at a time.
---

# pm-strategy

Decide the order of attack and make the roadmap follow it. `VISION.md`
says what v1 is. `STRATEGY.md` says which milestone comes first, the bets
behind that choice, and every decision made along the way. `ROADMAP.md`
is generated from both.

Follow the Non-interruption rules, Shared definitions, Roadmap order and
edits, Challenge protocol, Persistence, Asking the user, and
Communication contract in the pm-skills section of the agent instructions
file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state directory`
setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `strategy` | Default when `STRATEGY.md` is missing or has no milestones; the user asks about focus, milestones, or bets | Write or revise `STRATEGY.md` |
| `roadmap` | The user asks to generate, rebuild, or re-plan the roadmap; or after `strategy` | Regenerate `ROADMAP.md` from vision, strategy, inbox, research, and code |
| `vision` | The user wants to change v1 outcomes, the customer, scope, or constraints | Revise `VISION.md` one line at a time |

If the mode is unclear, ask one choice question: `What should change?`
with the options `Milestones and focus (recommended)`, `Re-plan the
roadmap`, and `The v1 vision`.

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, apply Non-interruption rule 4 and stop.
- Never change the active item in `NOW.md`. If it does not serve the new
  focus, say so as a Note; the user decides with `pm-checkpoint` (switch).
- If `STRATEGY.md` is missing, create it from the `pm-init` template
  headings (`Current focus`, `Milestones`, `Bets`, `Assumptions and
  risks`, `Not doing`, `Decisions`).

## Step 1: Facts (all modes)

Read `VISION.md`, `STRATEGY.md`, `ROADMAP.md`, `NOW.md`, `LOG.md`, the
inbox, brief headers, and the 3 newest `research/` reports. State, as
facts:

- Per `V` line: items done, open in Next, open in Later.
- Per milestone: items done and open; exit criteria met or not.
- The milestone legend, one line each (Shared definitions: Reference
  legend): `M1 <Name> (focus): R-002 <title>, R-005 <title>`.
- Throughput: items done per week over the last 4 weeks (from `LOG.md`).
- Forecast: open items in the focus milestone divided by throughput, as an
  `Assumption:` with the arithmetic shown. If there is no history, say so
  instead of guessing.
- Drift: Next items outside the focus milestone, items with no `Serves`,
  blocked items past the stale limit, and `Discuss: yes` inbox files.

## Mode: strategy

1. **Milestones.** Propose milestones as checkable outcomes that group `V`
   lines, ordered so each unlocks the next. Prefer the order that tests
   the riskiest assumption soonest. Show the milestone legend (Shared
   definitions: Reference legend) before asking. Ask with the question
   tool: `Use these milestones?` with the options `Use them
   (recommended)`, and up to 2 meaningfully different orderings, each
   labelled by what it puts first, plus `Explain M<n>` and `Show the
   roadmap`.
2. **Focus.** Recommend one milestone as `Current focus`, with `Why now`
   and its evidence. Ask: `Focus on <M>?` with the options `Focus on <M>
   (recommended)`, the next most plausible milestone, and `Explain M<n>`
   plus `Show the roadmap`.
3. **Bets and assumptions.** For the focus milestone, write each bet as
   `We believe <change> will <result> for <who>`, with its evidence and
   the signal that settles it. List the assumptions it rests on, each
   with a test.
4. **Not doing.** Propose items, inbox ideas, or areas to stop or defer,
   with a reason and a revisit condition. Ask one multi-select question:
   `Which of these go on the Not doing list?`
5. **Challenge.** Apply the full Challenge protocol to every milestone,
   bet, and the focus, including the user's own proposals. Typical
   challenges: more than one milestone active at once; a milestone with no
   exit criteria; a bet with no signal; a focus the throughput cannot
   deliver by its target date; a `Not doing` item that a `V` line needs.
   Ask a choice question for each material one.
6. **Write through.** Write each section to `STRATEGY.md` as soon as it is
   approved. Append one line per decision to `## Decisions`:
   `- <date> <decision>. Why: <reason>. Rejected: <alternatives>.`
7. Ask: `Re-plan the roadmap for this strategy now?` with the options
   `Re-plan it (recommended)` and `Leave the roadmap as is`. On re-plan,
   continue with Mode: roadmap.

## Mode: roadmap

1. **Candidates.** Collect existing roadmap items, inbox files with a
   brief or `Discuss: no`, research opportunities, and one proposed item
   for each `V` line or milestone exit criterion with no item. Include
   user tasks (`Owner: user`) for work only the user can do, for example
   accounts, credentials, purchases, legal or marketing text, design
   decisions, and user interviews. In a .NET project with no Purview
   fit report in `research/`, run `pm-purview` (assess mode) and include
   its accepted recommendations.
2. **Complete each item.** Every item gets `Serves`, `Milestone`, `Owner`,
   `Done when`, `Size`, and `Depends on`. Split `L` items into `S` or `M`
   parts. Detect dependency cycles and propose how to break them.
3. **Challenge each item** (protocol checks 1, 2, and 5; all checks for `M`
   and `L`). Items that serve no `V` line or milestone are proposed for
   Later or for dropping, with the reason.
4. **Order Next,** up to the max in `config.md`: claimable items in the
   focus milestone first; then by dependency; then risk first (items that
   test an open assumption); then by value per size. User tasks that block
   agent items go first, so they are done in parallel.
5. **Propose.** Show the proposal in this format (the `Proposed Next` and
   `Proposed Later` tables are the reference legend), then ask one question
   per section, in this order: `Accept this Next order?` (`Accept
   (recommended)`, `Change the order`, `Show the board`), `Which new items
   should be added?` (multi-select), `Which items should be dropped?`
   (multi-select).

   ```markdown
   ## Proposed Next

   | # | ID | Title | Owner | Size | Milestone | Why here |
   | --- | --- | --- | --- | --- | --- | --- |

   ## Proposed Later (by milestone)

   - M2: R-012 <title>, R-015 <title>

   ## New items

   - R-NNN <title> (<owner>, <size>, serves <V>): <reason>

   ## Proposed drops

   - R-NNN <title>: <reason>
   ```

6. **Apply.** Rewrite `ROADMAP.md` with the accepted result, following the
   **Roadmap order and edits** rules. Keep every existing field value the
   user did not change, including `Paused checkpoint`, `Brief`, and `Note`.
   Group Later by milestone. Append accepted drops to `## Dropped` in
   `LOG.md`, delete inbox files that became items, and append to
   `## Decisions` in `STRATEGY.md`:
   `- <date> Re-planned roadmap. Why: <reason>. Rejected: <alternatives>.`

## Mode: vision

1. Ask which line to change, with the question tool, offering the lines
   that step 1 shows to be weakest (no items, contradicted by research,
   not checkable) as options.
2. Propose the new wording, then apply the full Challenge protocol: what
   evidence supports the change, which items and milestones it orphans or
   creates, and what it costs.
3. Ask: `Change <line> to "<new wording>"?` with the options `Change it
   (recommended)` and `Keep the current line`. Write it, then append to
   `## Decisions` in `STRATEGY.md`.
4. List roadmap items whose `Serves` no longer exists, and recommend Mode:
   roadmap.

## Every mode

**Commit** the PM state at the end (rules: Committing PM state), with the
message `docs(pm): update strategy`.

## Output

```markdown
## Strategy <YYYY-MM-DD>

- Focus: <M Name> (<done>/<total> items, forecast <n> weeks | no history)
- Milestones: <M1 status>, <M2 status>, ...
- Next: <n>/<max> (<n> for you). Later: <n>. Dropped: <n>.
- Decisions recorded: <n>

## Do this next

1. <Run pm-next to start <ID> | Do <user task ID> | Run pm-shape on <idea>>
   - Start with: <skill name or task>
   - Done when: <observable check>

## Note

- <commit result>
```
