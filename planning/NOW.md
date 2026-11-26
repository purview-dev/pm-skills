# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-058 ADR pages: fix and release
- Session: feat/r-058-adr-pages-fix-and-release
- Stage: plan
- Brief:
- Milestone: M5
- Serves: V4
- Owner: agent
- Size: S
- Depends on: none
- Revisits:
- Note: Split from R-042 Docs-site package: deferred review minors on 2026-11-26 (user: one piece of work; the ADR site must get out). From R-040 (2026-11-25 review, inbox 2026-11-25-1008): (26) linkHtml: a raw `<` inside a script or style body (`<script>if (a<b) x='R-012'</script>`) is read as a tag, so the script never closes and the rest of the ADR section is not linked; links and Linked from entries still agree. Fix: while script or style is open, scan to the matching close tag (`src/lib/link-html.ts`). (28) The Decisions noscript test checks a string only. From R-050 (2026-11-25 strategy re-plan, inbox 2026-11-25-1417): (29) No test pins a remote ADR image staying a plain img with its src; a consumer who sets Astro `image.domains` would get it optimised and its src rewritten. Append `![r](https://example.com/r.png)` to the relative-image test in `test/integration.test.ts` and assert `src="https://example.com/r.png"`. (30) Every non-empty ADR section is rendered twice per build (the `adrs` html and the `adr-sections` entry in `src/loaders/adrs.ts`), Mermaid included; share one memoised render per section. 2026-11-26: Started as is outside the current focus M2 Verified install and upgrade; the user chose to release the ADR site first.
- Spec: docs/superpowers/specs/2026-11-26-adr-pages-fix-and-release-design.md
- Plan:
- Started: 2026-11-26

## Done when

- `src/lib/link-html.ts` scans a script or style body to its close tag so the rest of the ADR section is linked, with a `test/link-html.test.ts` case; the Decisions noscript test asserts the rendered list; a test pins a remote ADR image as a plain `img` with its `src`; each ADR section renders once per build, shown by a test; `packages/pm-docs-site/package.json` is `0.1.0-pre.6`; and `just package-test` and `just docs-check` pass.

## Checkpoint

<!--
Active example:

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing (worktree ../saas-r-007)
- Stage: execute
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Spec: docs/superpowers/specs/<file>.md
- Plan: docs/superpowers/plans/<file>.md
- Started: 2026-10-29

## Done when

- <observable check>

## Checkpoint 2026-10-29 14:55

- Stopped at: <last completed step>
- Next action: <one action>
- Start with: <exact command or file path>
- Decisions: <decisions made since the last checkpoint, with reasons | none>
- Context: <facts the next session needs that are not in the spec or plan | none>
- Open question: <only if blocking>
-->
