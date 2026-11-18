# R-017 fs-allow review follow-ups

- Captured: 2026-11-18 22:48
- Source: agent (R-017 execute, final review)
- Kind: tech-debt
- Affects: packages/pm-docs-site/lib/index.ts, packages/pm-docs-site/test/integration.test.ts
- Context: R-017 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Deferred minors from the R-017 final review: (1) the `pm-docs-site:fs-allow` tests find the plugin by position (`.at(-1)`) instead of by name, so adding a later plugin breaks them; (2) the appended entry serves the whole package folder (test/, .astro/, scripts/, node_modules/) in in-repo and linked dev, which `fs.deny` still guards, and the comment could say so; (3) on case-insensitive macOS a case-only difference appends a harmless duplicate entry.

## Links

- packages/pm-docs-site/test/integration.test.ts
- packages/pm-docs-site/lib/index.ts
- packages/pm-docs-site/lib/fs-allow.ts
