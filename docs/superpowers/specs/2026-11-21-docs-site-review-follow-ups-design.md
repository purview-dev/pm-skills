# R-031 Docs-site package: review follow-ups (design)

- Item: R-031 Docs-site package: review follow-ups (serves V4, milestone M1)
- Branch: `feat/r-031-docs-site-package-review-follow-ups`
- Size: a small change; short design.

## Intent

Clear the minor findings deferred from the R-019, R-020, R-023, and R-027
final reviews, and silence the `[WARN] [content] Entry docs → 404 was not
found.` line every build logs, before R-013 publishes the package. The full
finding list, with files, is the item's `Note` in `planning/NOW.md`; this
document records only the decisions.

## Goals and non-goals

- Goal: each finding is fixed or pinned by a test; a docs-site build logs no
  `Entry docs → 404` warning; `just lint-check` passes.
- Non-goal: new behaviour or views. Anti-goal: any change under `skills/`
  (that would force a rules bump); every edit is in `packages/pm-docs-site`,
  `scripts/check-demo.ts`, `examples/demo/`, `docs/wiki/`, and
  `.github/workflows/`.

## Approaches

- **404 warning.** (a) Both docs loaders (`NO_DOCS` and `repoDocsLoader`) add
  a draft `404` entry (splash template, Starlight's own tagline) unless the
  repository already has a `404.md`. Starlight's `get404Route` finds it via
  `getEntry`, and its route list drops drafts in production, so no `/404/`
  page is built. (b) `disable404Route` plus the package's own injected 404
  page: more code to maintain for the same result. **Picked (a).** Trade-off:
  dev mode routes the draft as `/404/`.
- **R-019 (1) slash boundary.** (a) Link an ID after `/`: risks linking
  `src/M1`-style paths, and neither this repository's plan nor the demo uses
  `M1/M2` or `./planning/briefs/`. (b) Pin `M1/M2` and `./planning/...` as
  unlinked in `test/references.test.ts`. **Picked (b).**

## Decisions

1. **Superseded 2026-11-21 (final review):** a draft entry makes Starlight's
   Hero print "This content is a draft" on every production `404.html`, so
   the package uses approach (b): `disable404Route: true` and its own
   `src/pages/404.astro` (Starlight's splash 404, `Astro.locals.t('404.text')`).
   Tests assert no warning, "Page not found", and no "is a draft".
   Originally: approach (a) above; a test asserts a build's log has no
   `Entry docs → 404` line and `404.html` still renders, and that no
   `404/index.html` is built.
2. R-019 (1): approach (b). R-019 (2): `log.astro` renders
   `{entry.id} <LinkedText text={entry.title} />` when the ID has no target.
3. R-020 (3): set the demo export's `source` once to `branch: main`,
   `head: null`; `export.ts write --frozen` keeps it.
4. R-027 (1): gitignore `lib/__probe__/` and assert the restoring rebuild's
   exit code in `test/build.test.ts`.
5. Every other finding: the fix its `Note` names, with a test where the
   finding is behaviour (R-023 1–3, R-020 1, 2, 4, R-027 2, 3) and a wording
   edit where it is text (R-023 4, R-027 4, 5).

## Left to the builder

Test names and placement, the exact `no edge path` reason text, and how the
`emptyStates` scanner is made robust to `data-class=` and an unclosed
`plan-empty` element (an anchored class-attribute match and a bounded
search are both acceptable).
