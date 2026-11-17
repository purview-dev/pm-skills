# Package tests slow the pre-push hook

- Captured: 2026-11-17 17:41
- Source: agent (R-008 execute, final review)
- Kind: question
- Affects: justfile
- Context: R-008 execute
- Discuss: yes
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-008 added `package-test` to `just lint-check`, which the lefthook pre-push hook runs. It adds two Astro builds, a pack, and a networked `bun install` to every push: about 40 to 60 seconds, and a push fails offline. Keep it, move it to CI only, or run only the fast unit tests on pre-push?

## Links

- justfile
- .config/lefthook.yml
