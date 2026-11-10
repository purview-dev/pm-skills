# Roadmap

<!--
IDs are R-NNN, never reused. A new ID is the highest number in ROADMAP.md,
NOW.md, and LOG.md, plus 1. pm-next takes the first claimable item in Next:
Status ready or paused, Owner agent or both, every Depends on ID done.
Owner user items are done by the user and closed with pm-item done.
Position is the order of the item blocks: Next is the claim order; Later is
grouped by milestone in STRATEGY.md order. Move, add, and insert with
pm-item, pm-board, or pm-roadmap (rules: Roadmap order and edits).
-->

## Next

<!-- Ordered. Maximum is set in config.md. -->

### R-001 Set milestones and focus

- Serves: V2
- Owner: both
- Done when: `planning/STRATEGY.md` has at least one milestone and a `Current focus`, and `pm-help` check 6 passes.
- Size: S
- Depends on: none
- Status: ready

### R-002 Check the docs-site Board at three widths

- Serves: V4
- Owner: agent
- Done when: a browser test of `docs-site` shows the Board's five columns in one row at 1440, 1024, and 700px.
- Size: S
- Depends on: none
- Status: ready

### R-003 Fix pm-export's ajv validation command

- Serves: V4
- Owner: agent
- Done when: the command in `pm-export`'s guard exits 0 on `planning/planning.json`, instead of failing on the unknown `date-time` format.
- Size: S
- Depends on: none
- Status: ready

### R-004 Verify the aspire module against a real AppHost

- Serves: V4
- Owner: both
- Done when: in an Aspire AppHost, `pm-docs-site extend aspire` adds the `docs` resource, it serves the Home page, and both composition tests pass.
- Size: M
- Depends on: none
- Status: ready

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-005 Rehearse a schemaVersion bump through the docs site

- Serves: V4
- Owner: agent
- Done when: on a scratch branch, moving `pm-export` to schemaVersion 3 fails `just validate` until the templates follow, and `pm-docs-site upgrade` then passes `just docs-check`.
- Size: M
- Depends on: none
- Status: ready

### R-006 Check pm-setup's skill counts in validate

- Serves: V1
- Owner: agent
- Done when: `just validate` fails when the `<n> of 22` counts in `pm-setup` differ from the number of shipped skills.
- Size: S
- Depends on: none
- Status: ready

### R-007 Docs-site extension pages

- Serves: V4
- Owner: agent
- Done when: the Now, Inbox, Briefs, and Strategy pages from `pm-docs-site` spec section 12 render from `planning.json` only, each with unit-tested derivations.
- Size: L
- Depends on: none
- Status: ready
- Note: Size L: split into one item per page with `pm-docs-site plan <extension>` before starting.
