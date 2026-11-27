# lint-check markdownlint matches no files

- Captured: 2026-11-26 23:30
- Source: agent (R-056 execute)
- Kind: bug
- Severity: minor
- Affects: justfile (lint-check)
- Context: R-056 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

On Windows, `just lint-check` ends with `bunx markdownlint-cli2 "**/*.md" "#node_modules"` printing `Summary: 0 issues in 0 files`, so the recipe may lint no Markdown at all. Running it on one file directly finds issues, so the glob or its quoting under just's shell likely matches nothing.

## Reproduction

Run `just lint-check` on Windows and read its last lines: `Summary: 0 issues in 0 files`. Seen on every run during R-056 execute (2026-11-26).
