# Context baseline 2026-11-24

- Item: R-043 Per-session context report
- Command: `bun skills/pm-help/scripts/context.ts --root .` (and `--format json`)
- Commit: `7fc76e9` on `feat/r-043-per-session-context-report`
- Estimate: characters / 4 (ADR-008 Context cost is estimated as characters / 4)

## Report

| Session | Est. tokens | Largest |
| --- | --- | --- |
| always | 21,700 | AGENTS.md#pm-skills 17,400; AGENTS.md#Project structure and architecture 1,900; AGENTS.md#Build, test, and lint 1,900 |
| resume | 31,800 | AGENTS.md 21,700; planning/ROADMAP.md 4,900; planning/STRATEGY.md 2,100 |
| claim | 46,400 | AGENTS.md 21,700; planning/ROADMAP.md 4,900; planning/briefs/2026-11-22-agent-context-tidy.md 4,900 |
| checkpoint | 40,400 | AGENTS.md 21,700; planning/ROADMAP.md 4,900; planning/briefs/2026-11-22-agent-context-tidy.md 4,900 |
| review | 35,200 | AGENTS.md 21,700; planning/ROADMAP.md 4,900; planning/STRATEGY.md 2,100 |

- PM state: no tidy needed.
- `claim` is 42,652 estimated tokens without the design handoff skill (`.agents/skills/brainstorming/SKILL.md`, 3,798), which depends on the machine.

## Top five contributors (exact estimated tokens)

| Session | Contributors |
| --- | --- |
| always | `AGENTS.md#pm-skills` 17,364; `AGENTS.md#Project structure and architecture` 1,927; `AGENTS.md#Build, test, and lint` 1,877; `AGENTS.md#Repository conventions` 539; `AGENTS.md#preamble` 6 |
| resume | `AGENTS.md` 21,711; `planning/ROADMAP.md` 4,888; `planning/STRATEGY.md` 2,118; `skills/pm-resume/SKILL.md` 2,083; `planning/NOW.md` 616 |
| claim | `AGENTS.md` 21,711; `planning/ROADMAP.md` 4,888; `planning/briefs/2026-11-22-agent-context-tidy.md` 4,887; `.agents/skills/brainstorming/SKILL.md` 3,798; `skills/pm-next/SKILL.md` 2,465 |
| checkpoint | `AGENTS.md` 21,711; `planning/ROADMAP.md` 4,888; `planning/briefs/2026-11-22-agent-context-tidy.md` 4,887; `skills/pm-checkpoint/SKILL.md` 3,831; `planning/STRATEGY.md` 2,118 |
| review | `AGENTS.md` 21,711; `planning/ROADMAP.md` 4,888; `planning/STRATEGY.md` 2,118; ≤ `planning/LOG.md` 2,001; `skills/pm-review/SKILL.md` 1,696 |

## Findings

- The agent file is 47% to 68% of every PM session's estimate, and the managed section is 80% of the agent file. It is the largest cost in every session type.
- The `pm-*` skill files a session runs are 1,700 to 3,800 estimated tokens each, smaller than `ROADMAP.md` (4,888) and the active brief (4,887).
- No counted skill cites a reference file yet, so no session counts a `references/*.md` today.

## Next

- R-046 Upgrade, format, and git rules move to references is the first cut; its `always` line must drop by at least 6,500 tokens from this baseline (21,711).
