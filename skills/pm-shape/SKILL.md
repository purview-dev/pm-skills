---
name: pm-shape
description: Use when the user wants to brainstorm, discuss, explore, question, challenge, or flesh out an idea or feature - a new one, one parked in the inbox, or a roadmap item - and no development workflow is active. Interviews the user, challenges the idea, maps its ramifications, writes a brief in the PM root after every answer, and ends with one decision - add to the roadmap, build it now, keep it parked, or drop it.
---

# pm-shape

Turn one idea into a decision. The brief is written after every answer, so
the discussion survives compaction and can be resumed in a later session.
This skill decides **whether** and **what**; the design handoff skill
decides **how**.

Follow the Non-interruption rules, Shared definitions, Challenge protocol,
Persistence, Asking the user, and Communication contract in the pm-skills
section of the agent instructions file (`AGENTS.md` or `CLAUDE.md`). PM
root is its `PM state directory` setting (default `planning/`).

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- If a workflow is active, do not shape. Run `pm-park` in capture mode with
  `Discuss: yes` and reply with its one line (Non-interruption rule 5).
- Do not change `NOW.md`, except through `pm-checkpoint` in step 9.
- If the idea is the active item, or belongs to another session, shape it
  read-only: write the brief, but make no roadmap change.

## Input

One of: the idea in the user's words, an inbox file, a brief, or a roadmap
ID. If none is given, list inbox files with `Discuss: yes` first, then the
newest others, and ask with the question tool: `Which idea should we
shape?` with up to 3 of them as options (title and capture date in each
label).

## Steps

1. **Open the brief.** Use the existing brief if the source has a `Brief`
   path, and continue from its first empty heading or its `## Open
   questions`. Otherwise create
   `<PM root>/briefs/<R-NNN or YYYY-MM-DD>-<slug>.md` with the **Brief**
   headings from Shared definitions, `Status: shaping`, `Origin: <inbox
   file | roadmap ID | user request>`, and the idea copied verbatim under
   `## Original idea`. For an inbox file, set its `Brief:` to this path.
   Write the file now.
2. **Ground it in evidence.** Before asking anything, read `VISION.md`,
   `STRATEGY.md`, `ROADMAP.md`, `LOG.md` (Done and Dropped), related inbox
   files, briefs, and `research/` reports, and search the code the idea
   touches. For a `Kind: bug` file, treat `## Reproduction` as the evidence
   of the problem. Write what you find under `## Who and evidence` and a
   first draft of `## Ramifications`, with paths. State immediately if:
   - the idea, or a close variant, was dropped before (quote the `LOG.md`
     line and its reason),
   - it overlaps a roadmap item or another brief,
   - it matches `Out of scope` or `Not doing`,
   - the code already does it, fully or partly.
3. **Explore.** Ask the questions the brief still needs, using the question
   tool, one decision at a time (up to 4 independent ones in one prompt).
   Draft answer options from step 2. Write each answer to its heading
   before the next question. Cover, in this order, and skip what is
   already known:
   1. The problem and who has it (not the solution).
   2. What happens today without it, and how often.
   3. The outcome that would show it worked.
   4. The smallest version that would still deliver that outcome.
   5. Constraints: deadlines, budget, technology, people.
4. **Diverge.** Write at least three options under `## Alternatives
   considered`: do nothing, the smallest version, and the full idea, plus
   any meaningfully different approach found in step 2. In a .NET
   project, if the idea needs something a Purview project covers (see
   the `pm-purview` description), run `pm-purview` (check mode) and add
   any surviving recommendation as an option. For each, give
   effort (S, M, or L), the main benefit, and the main cost. Mark the one
   you recommend and state the strongest argument against it.
5. **Challenge.** Apply the full Challenge protocol to the recommended
   option and to the user's own framing. Write each challenge under
   `## Challenges and answers` as a concrete claim with evidence. Put each
   material challenge to the user as a choice question, for example:
   `Billing per tenant needs a tenant_id on 4 tables (src/db/schema.ts).
   Ship single-tenant billing first?` with the options `Ship the smaller
   version (recommended)` and `Keep the full scope`. Write the answer and
   its reason before the next challenge.
6. **Ramifications.** Complete `## Ramifications` as a table with the
   columns `Area | Effect | Mitigation`, one row per Challenge protocol
   area (data and migrations, security and privacy, performance, user
   experience, operations and cost, maintenance, dependencies,
   reversibility). Write `none found` where nothing applies; never leave a
   row out. List any affected roadmap IDs as dependencies.
7. **Converge.** Write `## Proposal` (what is built, in at most 5 bullets),
   `## Done when` (observable checks), and `## Size and slicing`. If the
   size is `L`, slice it into `S` or `M` parts, each with its own `Done
   when`, in dependency order. Propose `Serves`, `Milestone`, `Owner`, and
   `Depends on`. Anything still undecided goes under `## Open questions`.
8. **Decide.** Ask one choice question: `What should happen to "<title>"?`
   When the source is a roadmap ID, include `R-NNN <title>` and its
   milestone and add `Explain <ID>`. Offer the recommended outcome first,
   then the three most plausible
   others from: `Add to Next`, `Add to Later`, `Build it now`, `Keep it
   parked`, `Drop it`. Recommend from the evidence: a strategic change
   (new milestone, vision change) is `Keep it parked` plus a
   `pm-strategy` recommendation, flagged as `SCOPE CHANGE:`.
9. **Apply the decision.**
   - **Add to Next / Add to Later:** create one roadmap item per slice with
     new IDs (Shared definitions), `Status: ready`, and `Brief:` set to the
     brief path. If the brief has a date name, keep it; do not rename it.
     Next goes in dependency order; if Next would exceed its max, ask which
     item moves to the top of Later (the lowest is recommended). Delete the
     inbox file, if any. Set the brief `Status: on roadmap (<IDs>)`.
   - **Build it now:** add it to the top of Next as above. If `NOW.md` is
     idle, run `pm-next` for it. If an item is active in this session, ask:
     `<active ID> is active. Switch to "<title>"?` with the options `Queue
     it first in Next (recommended)` and `Pause <active ID> and switch`.
     On switch, run `pm-checkpoint` (switch), move this item back above the
     paused item, then run `pm-next`.
   - **Keep it parked:** keep the inbox file (create one in the Inbox file
     format if the idea came from the user directly), set `Discuss: no`
     and `Brief:` to the brief path. Set the brief `Status: parked`.
   - **Drop it:** append to `## Dropped` in `LOG.md`:
     `- <date> <title>. Reason: <one line>. Brief: <path>.` Delete the
     inbox file. Set the brief `Status: dropped`.
10. Write the decision, date, and reason under `## Decision`, and set
    `Updated`. If the decision rejected an earlier strategy line, append
    to `## Decisions` in `STRATEGY.md`.
11. **Commit** the PM state (rules: Committing PM state), with the message
    `docs(pm): shape <slug>`.

If the user stops partway, the brief keeps `Status: shaping` with the
remaining questions under `## Open questions`; the next `pm-shape` run on
it continues from there.

## Output

```markdown
## Shaped: <title>

- Brief: <path>
- Decision: <Added R-NNN to Next | Added to Later | Building R-NNN | Parked | Dropped | Paused with <n> open questions>
- Size: <S | M | L, sliced into n>. Serves: <V lines>. Milestone: <M | none>.
- Challenges: <n> raised, <n> changed the idea

## Do this next

1. <one action, for example run pm-next, or answer the open question>
   - Start with: <skill name, file, or command>
   - Done when: <observable check>

## Note

- <commit result>
```
