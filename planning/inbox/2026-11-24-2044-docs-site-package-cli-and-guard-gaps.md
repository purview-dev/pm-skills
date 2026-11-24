# Docs-site package CLI and guard gaps

- Captured: 2026-11-24 20:44
- Source: agent (R-013 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/lib/cli-args.ts, packages/pm-docs-site/test/cli.test.ts, packages/pm-docs-site/lib/mermaid.ts, skills/pm-docs-site/SKILL.md
- Context: R-013 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The R-013 final review parked four minor gaps for a later package release:

- `--port=4399` (the `=` form) is not parsed, so it becomes the site folder, and any unknown flag silently becomes a positional argument (`lib/cli-args.ts`).
- `test/cli.test.ts` "dev --port 4399 serves on 4399" uses a fixed port, which can collide with another process.
- `skills/pm-docs-site/SKILL.md` Guard checks `bun --version` but not Node 24, so an older Node fails only at verify, after files are written.
- Two byte-identical Markdown sources on one page (for example two ADR sections with the same text and fence) get the same Pele IDs (`lib/mermaid.ts`).
