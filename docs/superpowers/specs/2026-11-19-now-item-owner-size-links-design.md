# R-018 Export the Now card's owner and size: design

- Item: R-018 Export the Now card's owner and size (Serves V4, Milestone M1)
- Size: M (widened from S at claim, 2026-11-19)
- Branch: `feat/r-018-export-the-now-cards-owner-and-size`
- Status: approved 2026-11-19

## Intent

The active item is the one item every view should show best, and today it
shows worst. The board's Now card says "No owner", so the R-010 owner and
size filters hide it, and the R-012 dependency graph draws no edges into or
out of it (R-008 -> R-012 is missing) and covers the gap with an
`Own links not exported yet` notice. The user chose in R-012's design
(2026-11-19) to fix both in one item.

The cause is upstream of the export: once `pm-next` claims an item, it
removes the block from `ROADMAP.md`, and `NOW.md` has no field for its
owner, size, serves, dependencies, or revision target. The exporter
(`skills/pm-export/scripts/planning.ts:489`) writes `owner: null, size:
null` because it has nothing to read. The same gap makes `pm-checkpoint`
`switch` put an item back in Next without its `Serves`, `Owner`, or `Size`.

## Done when

- `bun skills/pm-export/scripts/export.ts write` gives the active item's
  Now card its roadmap `owner` and `size` instead of `null`.
- The export gives the active item its own `dependsOn` and `revisits`, and
  the R-012 dependency graph draws those edges (for example R-008 -> R-012).
- The graph's `Own links not exported yet` notice is removed.
- The schema field docs, `planning.example.json`, and the docs-site
  fixtures agree, and `just test` covers it.

## Goals

- `NOW.md` carries the claimed item's roadmap fields, so no information is
  lost between `ROADMAP.md` and `NOW.md` in either direction.
- The export publishes them on `now.item`, and every consumer reads them
  from there.
- The graph draws the active item like any other node.

## Non-goals

- No change to how items are ordered, claimed, or closed.
- No new view or page. The board and graph only lose their gaps.
- `Note` and `Paused checkpoint` are not copied into `NOW.md`; `Note`
  stays on the roadmap side only (see Decisions).

## Anti-goals

- Reading git history to recover a claimed item's fields. It breaks on
  fixtures, shallow clones, and any repository without the claim commit.
- Listing the active item inside `roadmap`. Next positions and `claimable`
  would change meaning for every reader.
- A `NOW.md` without the new fields (any install before rules 20) failing
  lint or the export. It exports nulls and empty lists with an
  `Assumption:`.
- Reading git history in the exporter. Only `pm-setup`'s one-time backfill
  reads the claim commit (section 5).

## Approaches

Considered for where the active item's fields go in the schemaVersion 4
export:

- **A. Enrich `now.item` (picked).** `now.item` grows from `{id, title}` to
  `{id, title, serves, owner, size, dependsOn, revisits}`. The Now card
  copies `owner` and `size` from it; the package's `features()` takes the
  edges from it. Consumers already read `now.item`, so each change is one
  read, and the item's facts stay together.
- **B. Flat fields on `now`.** Mixes item facts with session facts (stage,
  spec, checkpoint). Rejected.
- **C. The active item in `roadmap` with a `now` section.** One shape for
  every item, but it changes Next positions and `claimable`, and every
  roadmap count would have to filter it. Rejected.

The user picked A. The user also chose to keep the scope widened as one
item (size M) rather than split the links into a second item, because
moving to schemaVersion 4 before R-013 releases the package as 1.0.0 is
cheaper than after. (The package is already on npm as `0.1.0-pre.2`; that
prerelease stays on schemaVersion 3, see section 6.)

The source of the values has one viable option: `pm-next` copies them into
`NOW.md`. Git-history recovery is an anti-goal, and no other PM file holds
an active item's fields.

## Design

### 1. `NOW.md` format (PM file format, rules 20)

New fields, in this order, after `Milestone` and before `Spec`:

```markdown
- Serves: V4
- Owner: agent
- Size: M
- Depends on: R-008
- Revisits:
```

- Values use the roadmap item format (`Serves` a list of `V` IDs, `Owner`
  `agent | user | both`, `Size` `S | M | L`, `Depends on` IDs or `none`,
  `Revisits` one ID or empty). Empty when idle, like every other field.
- Optional for lint: a `NOW.md` without them is valid, so installs before
  rules 20 lint clean. When present and active, they follow the same value
  checks as the roadmap item fields. `pm-lint` rules, `rules.md`,
  `structure.ts` (`KEYS.now`), and a test change together.
- `skills/pm-init/templates/NOW.md` lists them, including in its active
  example.

### 2. Skills that write or read `NOW.md`

- `pm-next` step 7 copies `Serves`, `Owner` (default `agent`), `Size`,
  `Depends on` (default `none`), and `Revisits` from the roadmap block.
- `pm-checkpoint`:
  - `switch` writes them back on the restored roadmap block, with `Done
    when` from `## Done when`, so the block is complete. The `## Done
    when` bullets are joined with `; ` into the one-line roadmap field
    (my call). `## Done when` holds checks only; `pm-next` never writes a
    `Note:` bullet there.
  - `push` copies them into the stack entry; `pop` restores them.
  - `done` takes the `Owner` for the `LOG.md` Done line from `NOW.md`.
- `pm-resume`'s malformed-`NOW.md` check does not require them.
- Any other skill that prints the active item's owner or size reads it
  from `NOW.md`. The builder finds those with a grep over `skills/`.

### 3. Export (schemaVersion 4)

- New `$defs/nowItem`: `{id, title, serves, owner, size, dependsOn,
  revisits}`, `additionalProperties: false`, all required. `serves` and
  `dependsOn` are ID lists (empty when missing), `owner` and `size` the
  card enums including `null`, and `revisits` an ID or `null`.
- `now.item` is `nowItem | null`. `itemRef` stays for its other users.
- `schemaVersion` const 3 -> 4, in the schema, `planning.ts`,
  `planning.example.json`, the SKILL.md field map, and the docs-site
  fixtures (`scripts/validate.ts` enforces they agree).
- `planning.ts` reads the new `NOW.md` fields. A missing `Owner` or `Size`
  exports `null` with an `Assumption:` naming the field. Invalid values get
  the same assumptions as roadmap items.
- The Now card takes `owner` and `size` from `now.item`.
- `export.test.ts` covers: an active `NOW.md` with all fields, one without
  them (rules 19 shape), and an idle one. The synthetic repository in
  `scripts/__fixtures__/repo/` gains the fields.

### 4. Docs-site templates (`skills/pm-docs-site/templates/site/`)

- `SCHEMA_VERSION = 4`, the `planning-types.ts` literal and a `NowItem`
  type, the fixture, and the SKILL.md sentence.
- Re-render `docs-site/` with `bun skills/pm-docs-site/scripts/site.ts
  write docs-site`; `just docs-check` passes.

### 5. Rules (managed section)

- `just bump major` (19 -> 20), then `pm-setup` to install the section in
  `AGENTS.md`.
- Add a `Version 20` upgrade note: `NOW.md` carries the claimed item's
  `Serves`, `Owner`, `Size`, `Depends on`, and `Revisits`, and `pm-setup`
  fills them in for an item that was active before the upgrade. The export
  moves to schemaVersion 4: run `pm-export`, and `pm-docs-site upgrade` for
  an installed site.
- **Backfill on upgrade (the user's choice).** When `pm-setup` upgrades to
  rules 20 and `NOW.md` is active without the new fields, it reads the
  item's block from `ROADMAP.md` in the parent of the item's claim commit
  (the commit whose subject is `docs(pm): claim <ID> ...`, found with
  `git log` on the session branch), writes the five fields to `NOW.md`,
  and shows them. When the claim commit or the block cannot be found, it
  asks the user one choice question per missing required value (`Owner`,
  `Size`, `Serves`), defaulting `Depends on` to `none` and `Revisits` to
  empty. The state is then committed as a PM commit. This needs Non-interruption
  rule 6 to let `pm-setup` write those `NOW.md` fields, on top of the
  managed section and `Rules version`. Change that rule in the same
  commit.
- In this repository, running `pm-setup` after the bump backfills R-018's
  own `NOW.md` (Serves V4, Owner agent, Size M, Depends on none). The first
  Done when check is then verified live on `planning/planning.json`, as
  well as in the tests.
- Update `pm-help` only if a diagnosis check needs the new fields (none
  expected).

### 6. Package and graph (after R-012 merges)

R-012's graph exists only on `feat/r-012-docs-site-package-dependency-graph`,
which is waiting on its pull request and changes the same package files.
So this part runs last, after R-012 merges and `main` is merged into this
branch:

- `packages/pm-docs-site`: schemaVersion 4 types, `SCHEMA_VERSION`, test
  fixtures, and the CLI test that expects a too-new export (it moves from 4
  to 5).
- The package reads schemaVersion 4 only: `SUPPORTED_SCHEMA_VERSIONS` in
  `lib/schema-version.ts` becomes `[4]`, and a version 3 export fails with
  the existing re-export hint (the user's choice). There is no code path
  for the old `{id, title}` `now.item`.
- `packages/pm-docs-site/package.json` keeps its version, so nothing
  publishes when R-018 merges. npm's `0.1.0-pre.2` stays on schemaVersion 3
  until R-013 releases the package.
- `features()` in `src/lib/planning.ts` gives the Now feature its
  `dependsOn` and `revisits` from `now.item`, so the graph draws its edges.
- Remove `linksNotExported` and the `Own links not exported yet` notice
  (`GraphNodes.tsx`, `routes/plan/graph.astro`, README) and their tests.
- A browser or unit test shows an edge into the active node.

If R-012 has not merged when parts 1 to 5 are done, `pm-checkpoint` pauses
R-018 at execute with that as the open question. It does not branch from
R-012.

## Decisions

- `Note` stays out of `NOW.md`: it is a roadmap annotation, and the
  checkpoint already holds the session's context. `switch` loses nothing
  new compared with today; carrying `Note` is left for a later item.
- New `NOW.md` fields are optional, not required, so the upgrade needs no
  migration of an active item.
- `now.item` is a new `nowItem` def, not an extended `itemRef`, because
  `itemRef` is used elsewhere for plain references.

## Left to the builder

- Exact wording of the assumptions and the upgrade note.
- Test structure and fixture values.
- Whether `pm-status`, `pm-board`, or `pm-up-next` need text changes after
  the grep in section 2.
