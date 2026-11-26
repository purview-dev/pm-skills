# pm-docs-site demo

A site built with `@purview-dev/pm-docs-site` from an invented plan, so every view has content: the board, the roadmap and its timeline, milestones, features, the dependency graph, Now, the inbox, briefs, strategy, risks, decisions, the log, the architecture view, and repository docs. The decisions cover every ADR status, a supersede pair, an imported ADR with an empty section, a Mermaid diagram, a code block, and a relative image beside its ADR.

The plan belongs to Slotwise, a booking app for small studios that does not exist. Nothing in it is pm-skills' own plan.

- `planning/` is a PM root written in the pm-skills file format. `planning/planning.json` is generated from it by pm-export: never edit it by hand.
- `docs/` holds the repository docs the site shows, and the spec and plan of the active item.
- The site uses the local `packages/pm-docs-site` through a `file:` dependency, the same way a consumer uses the published package.

From the repository root:

```sh
just demo         # build the package and the demo, then serve it at http://localhost:4321
just demo-check   # check the export, lint the PM files, build, and fail on any empty view
```

After editing `planning/`, regenerate the export:

```sh
bun skills/pm-export/scripts/export.ts write --frozen --root examples/demo --pm-root planning/
```
