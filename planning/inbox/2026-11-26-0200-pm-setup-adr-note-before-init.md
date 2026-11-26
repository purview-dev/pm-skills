# pm-setup misses docs/adr Note before init

- Captured: 2026-11-26 02:00
- Source: agent (R-036 execute)
- Kind: bug
- Severity: minor
- Affects: pm-setup
- Context: R-036 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

pm-setup Step 5 item 4 checks for an existing docs/adr/ folder only when `<PM root>/config.md` exists, so running pm-setup before pm-init (the usual order on a new install) never prints the Note that suggests `pm-adr import docs/adr/`.

## Reproduction

Found in the M4 rehearsal (`planning/research/2026-11-26-m4-rehearsal.md`): a scratch repository with `docs/adr/`, `pm-setup` run first, then `pm-init`; no import Note appeared. Every run.

## Links

- planning/research/2026-11-26-m4-rehearsal.md
- skills/pm-setup/SKILL.md
