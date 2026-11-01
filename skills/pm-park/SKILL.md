---
name: pm-park
description: Use when the user or the agent has an idea, feature, bug, question, or piece of inspiration to note or remember, at any time, including in the middle of other work ("park this", "note that", "remind me", "idea:"). Writes or appends to one inbox file and replies in one line. During an active workflow it never discusses the idea; it marks it for discussion later.
---

# pm-park

The parking lot. Capture one idea in one file, reply in one line, return to
the task in progress. This is the only `pm-*` skill that may run during an
active workflow.

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `capture` | Default | Write a new inbox file |
| `append` | The user adds to an idea already parked ("also", "add to the X idea") and exactly one inbox file matches | Append under `## Notes` in that file |
| `agent` | The agent notices work outside the active item's `Done when` that it would otherwise do silently or forget: a bug, tech debt, follow-up, or idea | Write a new inbox file with `Source: agent` |

In `agent` mode, park instead of expanding scope. Do not park routine
steps of the current plan.

## Guard

- If `<PM root>/` does not exist, reply: `No <PM root> folder. Run pm-init.
  Idea (not saved): <the idea, verbatim>`. Stop.
- Write in the main worktree, not the current feature worktree.
- Create `<PM root>/inbox/` if it is missing.

## Steps

1. Note whether a workflow is active (Non-interruption rule 1). If one is,
   this run is capture-only: no questions, no evaluation.
2. Classify without asking:
   - `Kind`: from the words used. Use `inspiration` for references,
     examples, or links with no stated feature; `question` for something to
     find out.
   - `Discuss`: `yes` if the user asked to discuss, think through, or
     brainstorm it, or if it is a `question`; otherwise `no`.
   - `Related`: roadmap IDs and inbox titles that share the idea's key
     nouns. Use `none` if nothing clearly matches. Do not ask.
   - `Context`: the active item ID and stage from `NOW.md`, or `none`.
3. **capture** and **agent:** build the slug (lowercase ASCII letters,
   digits, and hyphens, at most 5 words). Get the timestamp (Shared
   definitions). The filename is
   `<PM root>/inbox/<YYYY-MM-DD-HHMM>-<slug>.md`; if it exists, append
   `-2`, then `-3`, before `.md`. Write the file in the **Inbox file**
   format from Shared definitions:
   - `## Idea` holds the user's words verbatim. In `agent` mode, write what
     was observed and where (file path and line), in one to three
     sentences.
   - `## Links` holds every URL or path given with the idea. Omit the
     heading if there are none.
   - `Brief: none`, `Reviewed: never`.
4. **append:** add `- <YYYY-MM-DD> <the new words, verbatim>` under
   `## Notes` in the matching file (create the heading if missing). If the
   new words ask for discussion, set `Discuss: yes`. If more than one file
   matches, use `capture` mode and list the matches in `Related`.
5. Reply with exactly one line:
   - Workflow active: `Parked: <filename> (<kind><, to discuss>). Back to <current step>.`
   - `agent` mode: `Parked for later: <filename> (<kind>): <title>.`
   - No workflow: `Parked: <filename> (<kind>).`
6. If a workflow is active, resume the step that was in progress. Stop.
7. If no workflow is active and the mode is not `agent`:
   - If the user asked to discuss it now, start `pm-shape` with this file.
   - Otherwise ask one choice question: `Shape "<title>" now, or keep it
     parked?` with the options `Keep it parked (recommended)` and `Shape it
     now`. If `Discuss: yes`, recommend `Shape it now` instead. On `Shape
     it now`, start `pm-shape` with this file.

## Output

One line, plus the single choice question in step 7 when no workflow is
active. Nothing else.
