# R-027 deferred review minors

- Captured: 2026-11-20 14:21
- Source: agent (R-027 execute)
- Kind: tech-debt
- Affects: packages/pm-docs-site
- Context: R-027 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

Minors from the R-027 Docs-site package: build hardening final review, deferred: (1) `test/build.test.ts` probe test can leave `lib/__probe__` behind if the run is killed, and `prepack` would then ship `dist/__probe__/`; the restoring rebuild in `finally` ignores its exit code (gitignore `lib/__probe__/` or assert the exit code). (2) `test/install.test.ts` `relativeImports` skips side-effect imports (`import '../styles/x.css'`, `import '../scripts/plan.ts'`). (3) The install test counts a bare directory as a resolved import (the `''` suffix); use `statSync(...).isFile()`. (4) "non-JavaScript" wording remains in `.github/workflows/publish-pm-docs-site.yml:151`, `docs/wiki/contributing/Repository-Layout.md:57`, and `packages/pm-docs-site/README.md:219`; `check-exports` now reports "the wrong kind of file". (5) `docs/wiki/contributing/Development.md:71` uses `0.1.0-pre.1` as a format example; mark it "for example" so it is not read as the current release.
