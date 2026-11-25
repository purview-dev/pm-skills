# R-055 Engineering lint and skill review minors: design

- Item: R-055 Engineering lint and skill review minors (V5, M4)
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md
- ADRs: none written. These fixes stay inside ADR-009 (Engineering file records state, ADRs reasons).

## Intent

Close the nine minor findings from R-034's final review so the engineering
lint rules, their documentation, and `pm-engineering` behave as their text
says. Done when: each finding is fixed (or has a one-line won't-fix reason
in the plan), the drift test in `skills/pm-lint/scripts/lint.test.ts`
compares rule text as well as IDs, the Challenge protocol's "applies in"
list names `pm-engineering`, and `just lint-check` passes.

Non-goals: new lint rules, changes to the `ENGINEERING.md` format, docs-site
changes (the site renders none of this differently).

## Approaches (rule text drift, finding 3)

Comparing text shows 52 of 92 rules differ between `rules.ts` and
`references/rules.md`, mostly because `rules.md` is fuller.

- **rules.md wording wins (chosen by the user).** Copy each `rules.md`
  description into the `rules.ts` summary; the test asserts exact equality
  for every rule. One wording, no generator.
- Generate the `rules.md` tables from `rules.ts`: more machinery for the
  same result.
- Exact text for `engineering/*` only: leaves 49 rules free to drift.

Update the `rules.ts` header comment: the summary equals the `rules.md`
description.

## Fixes

1. `fixStructure` (`skills/pm-lint/scripts/structure.ts`): the Principles
   comparator sorts blocks without an EP ID after numbered ones, stable
   among themselves, so the order is total.
2. `title/length` stays the rule for long principle titles; its summary
   (both files) names inbox files, risks, and principles. Remove "(title at
   most 8 words)" from `engineering/principle` in `rules.md`.
3. As above.
4. Technology blocks key on the full heading text, not the EP-stripped
   title, so `### EP-001 Foo` and `### Foo` are distinct names.
5. `Decision` accepts `none` case-insensitively (`/^none$/i`), as other
   PM files do.
6. Technology order uses `localeCompare(other, "en")` in both the check and
   the fix, so the result does not depend on the host locale.
7. The fresh-install test also asserts `skills/pm-init/SKILL.md`'s file
   table has the `ENGINEERING.md` row.
8. Add `pm-engineering` (add and change) to the Challenge protocol's
   "applies in" list in `skills/pm-setup/references/AGENTS-section.md`,
   install the same text in `AGENTS.md`'s managed section, and run
   `just bump prerelease` (21.0.0-pre.12). `main` is on an unreleased
   21.0.0 prerelease, so the rules stay version 21.
9. `pm-engineering` step 1 follows `superseded by` to the end of the chain
   (stopping on a cycle) and recommends the last ADR; when that ADR is
   deprecated, it offers the deprecated choices instead.

Each code fix gets a test in `lint.test.ts`.

## Left to the builder

Exact test names and fixture text; the order of edits.
