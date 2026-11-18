# Make the aspire MODULE.md test example self-contained

- Captured: 2026-11-17 23:52
- Source: agent (R-004 execute)
- Kind: improvement
- Affects: skills/pm-docs-site/templates/aspire/MODULE.md
- Context: R-004 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The TUnit example in the aspire MODULE.md calls `BuildAsync` and `Named` without defining them, and uses `Resources.DocsSite`, which a test project reaches only when the constant is visible to it. Verifying R-004 needed `using Aspire.Hosting;` for `DistributedApplicationExecutionContext` and the literal `"docs"`. Show the two helpers and say when to use the literal.

## Links

- docs/superpowers/specs/2026-11-17-aspire-module-verification.md
