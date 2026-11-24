# Engineering lint and skill review minors

- Captured: 2026-11-24 23:45
- Source: agent (R-034 execute, final review)
- Kind: tech-debt
- Affects: R-034
- Context: R-034 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

R-034 final-review minors, deferred:

1. `fixStructure` cannot sort Principles while one heading has no EP ID (comparator returns 0, not transitive); `skills/pm-lint/scripts/structure.ts`.
2. `rules.md` lists the 8-word principle title under the error `engineering/principle`, but the code emits the warning `title/length`, whose description names only inbox files and risks (`rules.ts`, `rules.md`).
3. `rules.ts` and `rules.md` wording differs for `engineering/technology`, `engineering/principle`, and `engineering/removed`; the drift test compares IDs only.
4. A Technology heading shaped `### EP-001 Foo` is keyed as `Foo`, giving a false duplicate with `### Foo`.
5. `Decision: None` (capital N) is an error; other files accept `none` in any case.
6. `localeCompare` without a locale makes `engineering/order` depend on the host locale for non-ASCII names.
7. The `writes ENGINEERING.md on a fresh install` test proves only that the template exists, not `pm-init`'s file table row.
8. The Challenge protocol's "applies in" list in the managed section omits `pm-engineering` (add).
9. `pm-engineering` step 1 follows `superseded by` one step only; a superseded successor is recommended unchecked.
