---
name: pm-risk
description: Use when the user or the agent names a risk, threat, or something that could go wrong at any time, including in the middle of other work ("risk:", "log a risk", "what if X fails"), or asks to add, update, re-rate, review, close, remove, or show risks or the risk register and their RAG status. Captures a risk in one line without interrupting a workflow, or manages the register in RISKS.md, deriving each risk's red, amber, or green status from likelihood and impact.
---

# pm-risk

The risk register. Capture one risk in one line at any time, or add,
update, re-rate, review, close, remove, or mitigate one risk in
`<PM root>/RISKS.md`. Capture never interrupts a workflow.

Follow the Non-interruption rules, Shared definitions (Risk register, Risk
IDs, RAG), Roadmap order and edits, Challenge protocol, Persistence,
Committing PM state, Asking the user, and Communication contract in the
pm-skills section of the agent instructions file (`AGENTS.md` or
`CLAUDE.md`). PM root is its `PM state directory` setting (default
`planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `capture <risk>` | Default during a workflow, or when the agent notices a risk; "risk: ...", "note the risk that ..." | Write one risk from the words given; no questions; never commits |
| `add <title>` | No workflow, "add a risk", "log the risk that ..." | Write one risk, asking for the missing fields; challenged first |
| `update <RK-NNN> <field> <value>` | "change the mitigation of RK-003", "RK-003 is now likely" | Change `Title`, `Likelihood`, `Impact`, `Status`, `Owner`, `Affects`, `Trigger`, or `Mitigation`; RAG recomputed |
| `rag <RK-NNN> <red \| amber \| green \| auto> [<reason>]` | "RK-003 is red", "clear the override" | Set or clear the RAG override |
| `review [<RK-NNN>]` | "review the risks", `pm-review` asks | Reassess open risks one at a time; set `Reviewed` |
| `mitigate <RK-NNN> [next \| later] [<position>]` | "make a task to mitigate RK-003" | Add the mitigation as a roadmap item; set `Mitigation` and `Status: mitigating` |
| `close <RK-NNN> <reason>` | "RK-003 is no longer a risk", "it happened and is handled" | Move the risk to `## Closed` |
| `remove <RK-NNN> <reason>` | "RK-003 was a duplicate", "delete RK-003" | Delete a risk recorded in error; log it under `## Removed` |
| `view` | "show the risks", "risk register", "what is red?" | Read-only: render the register |

If the request fits no mode, ask one choice question with the 2 or 3 most
likely modes as options.

## Guard

- If `<PM root>/` does not exist, reply: `No <PM root> folder. Run pm-init.
  Risk (not saved): <the risk, verbatim>`. Stop.
- Write in the main worktree, not the current feature worktree.
- If `<PM root>/RISKS.md` is missing, create it from `pm-init`'s
  `templates/RISKS.md` before the first write. `view` writes nothing and
  shows an empty register instead.
- **During an active workflow** (Non-interruption rule 1), only `capture`
  and `view` run. `view` runs only when the user asks for it. Any other
  mode applies Non-interruption rule 4 and stops; a new risk mid-workflow
  is a `capture`, never an `add`.
- `capture` works whatever the state: an active or idle `NOW.md`, a
  `NOW.md` that belongs to another session (Non-interruption rule 7: write
  the risk, never the item), or a pending upgrade. It never asks, never
  challenges, and never commits.
- If the ID is not in `RISKS.md`, reply `<RK-NNN> not found.` and list the
  open risks as `RK-NNN <title> (<RAG>)`. Stop.
- `RAG` is never set by hand except through `rag`. Every write that
  changes Likelihood or Impact recomputes it (Shared definitions: RAG).
- Never edit `NOW.md`, briefs, the inbox, or code. The only other PM file
  this skill writes is `ROADMAP.md`, in `mitigate`.

## Steps

Whenever a question or reply names an ID, show `RK-NNN <title> (<RAG>)` or
`R-NNN <title>` with it and add `Explain <ID>` to the question (Asking the
user).

1. **capture:** classify without asking.
   - `Title`: at most 8 words from the user's words; keep their wording.
   - `Likelihood` and `Impact`: the levels the words state ("likely",
     "would lose data"); `medium` when they state none.
   - `RAG`: derived; `RAG override: none`. `Status: open`.
   - `Owner`: `user` when only the user can act on it (a decision, an
     account, a contract), otherwise `agent`.
   - `Affects`: the active item ID from `NOW.md` when the risk is about it,
     else the IDs, milestones, or paths the words name, else `none`.
   - `Trigger` and `Mitigation`: the words given, else `none`.
   - `Raised: <date> (<user | agent (<skill or item ID and stage>)>)`,
     `Reviewed: never`.

   Give it a new ID (Shared definitions: Risk IDs), insert it in `## Open`
   at its RAG position, and reply with exactly one line:
   - Workflow active: `Risk: RK-NNN <title> (<RAG>). Back to <current step>.`
   - Otherwise: `Risk: RK-NNN <title> (<RAG>), unreviewed. Run pm-risk review RK-NNN to rate it.`

   If a workflow is active, resume the step that was in progress. Stop.
2. **add:** search `RISKS.md` (all sections), `ROADMAP.md`, and the inbox
   for a duplicate; if one matches, ask `RK-NNN <title> looks the same.
   Update it, or add a new risk?` with `Update RK-NNN (recommended)` and
   `Add a new risk`. Apply the Challenge protocol checks 1 (what evidence
   shows the risk is real), 4 (what it would affect), and 6 (the signal
   that it is happening, which becomes `Trigger`). Ask for each missing
   field with the question tool, up to 4 at once, offering drafted values:
   Likelihood, Impact, Owner, and Mitigation. Write the risk with
   `Reviewed: <today>`, then show the derived RAG.
3. **update:** apply the change. For `Likelihood` or `Impact`, apply the
   Challenge protocol check 1 (what changed, with evidence) and recompute
   RAG; when an override exists and the derived value now equals it, clear
   the override and say so. `Status: closed` runs `close`, not `update`.
   For `Affects`, the IDs must exist in `ROADMAP.md`, `NOW.md`, `LOG.md`, or
   `STRATEGY.md`. Move the block when its RAG position changes.
4. **rag:** `auto` clears `RAG override` and sets the derived value. A
   value that differs from the derived one needs a reason; when none was
   given, ask for it, offering 2 drafted reasons. Write `RAG override:
   <reason> (derived <value>, <date>)`. A value equal to the derived one
   clears the override.
5. **review:** take the open risks with `Reviewed: never` first, then the
   oldest `Reviewed`, or the one ID given. For each, print its block and
   ask one choice question: `RK-NNN <title> is <RAG> (<likelihood>
   likelihood, <impact> impact). Still right?` with `Keep it (recommended)`,
   `Re-rate it`, `Close it`, and the `Explain RK-NNN` escape option. Recommend
   `Re-rate it` for a captured risk (`Reviewed: never`) with `medium` and
   `medium`. Apply the answer (steps 3, 4, or 7), set `Reviewed: <today>`,
   and write it before the next question. Offer `mitigate` for every red
   risk whose `Mitigation` is `none`.
6. **mitigate:** draft one roadmap item from the risk: the title `Mitigate
   RK-NNN <title>`, `Serves` and `Milestone` from the item or milestone in
   `Affects`, `Owner` from the risk, and an observable `Done when` that
   shows the `Trigger` can no longer fire. Apply the Roadmap **add**
   operation with its Challenge protocol checks 1, 2, and 5, at the position
   given, else the bottom of Later. Then set `Mitigation: R-NNN <title>` and
   `Status: mitigating`.
7. **close:** set `Status: closed`, add `Closed: <date>: <reason>`, and
   move the block to the top of `## Closed`. Name roadmap items whose title
   or `Note` names this risk, so the user can drop them with `pm-item`.
8. **remove:** ask one choice question: `Remove RK-NNN <title>? Removed
   risks keep only one line.` with `Close it instead (recommended)` and
   `Remove it`. Recommend `Remove it` when the reason is a duplicate or a
   mistake. On remove, delete the block and append
   `- <date> RK-NNN <title>. Reason: <reason>.` to `## Removed`.
9. **view:** read `RISKS.md` and write nothing. Show the output (view).
10. **Commit** the PM state (rules: Committing PM state), with the message
    `docs(pm): <mode> <RK-NNN>` (`docs(pm): review risks` for a review of
    more than one risk). `capture` and `view` never commit.

## Output

`capture` replies with the one line from step 1 and nothing else.

```markdown
## Risk <RK-NNN Title>

- RAG: <red | amber | green> (<likelihood> likelihood, <impact> impact<, override: reason>)
- Status: <status>; owner <owner>
- Changed: <what changed>
- Roadmap: <R-NNN> <title> at <section> <position> | unchanged>
- PM state: <commit result>

## Do this next

1. <Run pm-risk mitigate <RK-NNN> | Run pm-risk review | Run pm-export to refresh the site | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>
```

## Output (view)

```markdown
## Risks

- Open: <n> (<r> red, <a> amber, <g> green); unreviewed: <n>
- Closed: <n>; removed: <n>

| ID | Risk | RAG | Likelihood | Impact | Status | Owner | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <every open risk, in register order> | | | | | | | |

## Do this next

1. <Run pm-risk review | Run pm-risk mitigate <RK-NNN> for the first red risk without a mitigation | continue the current task>
   - Start with: <skill or command>
   - Done when: <observable check>
```

The table lists every open risk; it is exempt from the 5-bullet limit.
