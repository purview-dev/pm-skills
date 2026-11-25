# R-041 ADR skill follow-ups — design

- Item: R-041 ADR skill follow-ups (Serves V5, Milestone M4, size S)
- Branch: `feat/r-041-adr-skill-follow-ups`
- ADRs: writes ADR-010 Item close names captures, accepts ADRs in place (proposed), which supersedes ADR-003 Item close accepts its spec's ADRs; follows ADR-001 ADRs live in the PM root.
- Context: `docs/superpowers/specs/2026-11-22-adrs-across-the-pm-skills-design.md` (R-039)

## Intent

Close the five minor findings from R-039's final review so ADR and capture writes are consistent across the PM skills. A skills change, so a rules change: the repository is on the unreleased `21.0.0-pre.9` line, so it stays on rules 21 with `just bump prerelease` (no `Version 22` upgrade note; one sentence is added to the Version 21 notes, goal 6).

## Goals

1. **Dated Supersedes note.** `skills/pm-discover/SKILL.md` step 4 and `skills/pm-revise/SKILL.md` step 8 (`park`) write `- <YYYY-MM-DD> Supersedes ADR-NNN <title> in design.` under the inbox file's `## Notes`, matching the inbox format (`- <YYYY-MM-DD> <text>`). `pm-revise` step 6 (`new item`) writes into a roadmap `Note:`, not inbox Notes, and is unchanged.
2. **`pm-purview` check mode stops before deciding.** `skills/pm-purview/SKILL.md`: in `check` mode, step 5 writes the report and the skill returns its result to the calling skill's step; steps 6 (decide, roadmap items, ADRs) and 7 (commit) do not run. State this in the Guard line about `check` mode and at the head of step 6, so "This skill never runs `pm-adr`" in `pm-shape` and `pm-discover` holds.
3. **Legend reuse for an ADR.** `skills/pm-shape/SKILL.md` step 5 and `skills/pm-review/SKILL.md` (stale proposed ADRs) print the `## For this question` legend only when no `## For this discussion` legend in the same output already lists that ADR (Communication contract: a question reuses the discussion legend).
4. **`done` finds ADRs in the main worktree** (ADR-010). `skills/pm-checkpoint/SKILL.md` step 5: for each `ADR-NNN` the spec names, look in the item's branch's decisions folder first, then in the main worktree's. Only an ID found in neither keeps `done` in `pause` (`ADR-NNN named in <spec> has no file.`). An ADR found only in the main worktree, `proposed`, with `Item: <this ID>`, is accepted there in place (`pm-adr accept` write steps) with the Note `Accepted ADR-NNN <title> in the main worktree; the next PM commit on <PM branch> carries it.`
5. **`done` never stops for a capture** (ADR-010). In step 5's commit-worktree guard, a **capture** is an uncommitted inbox file, decisions-folder file, or `RISKS.md`. Captures in the item's worktree are swept into the Completion record commit (the existing *Leftovers are swept in* rule). Captures on the PM branch in another main worktree no longer stop it; they are named in the Note `<n> captures uncommitted on <PM branch>: <paths>. The next PM commit there carries them.` Any other uncommitted PM path (`NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, a brief) still stops it, as today.
6. The managed section's *Completion rides the branch* (`skills/pm-setup/references/AGENTS-section.md`, "Stop when the PM branch has **Uncommitted PM state** …") says the same as goal 5, and the installed copy at the end of `AGENTS.md` matches it; one sentence is appended to the Version 21 upgrade notes, because the rules text changed (still rules 21, unreleased line).
7. `skills/pm-adr/SKILL.md` Guard: `accept` applied by `pm-checkpoint` (`done`) writes in the worktree that holds the item's branch, or in the main worktree when the ADR is only there (ADR-010).
8. `just lint-check` passes; `just bump prerelease` moves `package.json` to `21.0.0-pre.10`.

## Non-goals

- Changing where `pm-park`, `pm-risk`, or `pm-adr` write (ADR-001 stands).
- Moving files between worktrees, or deleting anything in the main worktree.
- Any script, schema, export, or docs-site change: the edits are SKILL.md prose. Docs site: nothing, because no PM state, file format, or browsable record changes.

## Approaches

- **Sweep or move at done:** move the item's ADRs from the main worktree into the item's worktree before accepting, so acceptance rides the pull request. Rejected by the user; deletes uncommitted files in the main worktree.
- **Captures follow the active item:** capture skills write in the active item's worktree. Supersedes ADR-001; captures hidden from other sessions until merge.
- **Name them, never stop (chosen by the user):** smallest change; cost is that, in the separate-worktree layout, the accepted status reaches the PM branch through its next PM commit rather than the item's merge (recorded in ADR-010).

## Left to the builder

- Exact sentence wording in each SKILL.md, within the Communication contract.
- Whether `pm-help`'s skill guide row for `pm-checkpoint` needs a word changed (only if it mentions stopping on uncommitted state).
- Any `pm-lint` rule touched by the Notes date prefix (none expected: inbox `## Notes` lines already require it).
