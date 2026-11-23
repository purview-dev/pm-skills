# ADR-007 LikeC4 markers render through astroc4

- Status: proposed
- Date: 2026-11-23
- Category: architecture
- Supersedes: none
- Item: R-045
- Source: none

## Context

The wiki writes diagrams as pairs: a `<!-- purview:likec4 file=… view=… -->` marker around a Mermaid fence. purview.dev renders the LikeC4 view; GitHub shows the Mermaid. The user wants LikeC4 everywhere on the docs site, with Mermaid as the fallback. The marker spec is purview.dev's `skills/purview-site-docs/references/diagrams.md`. Spec: `docs/superpowers/specs/2026-11-23-docs-site-package-architecture-view-design.md`.

## Decision

`@purview-dev/astroc4` gains a `markers` option (default on), implemented inside its `likec4Fences` Sätteri plugin. Each marker block becomes the LikeC4 view it names; a block that cannot be drawn keeps its Mermaid with a warning and never fails the build. `markers.root` is the repository root, so a model may live anywhere in the repository. `@purview-dev/pm-docs-site`'s `architecture` option loads astroc4 as an optional peer dependency and passes its `docs.root` as `markers.root`.

## Alternatives

- A marker plugin inside `pm-docs-site`: no outside release, but purview.dev keeps a second implementation of the same marker.
- Client-side rewriting: breaks build determinism and adds JavaScript.
- Do nothing: the docs site shows only the Mermaid fallback.

## Consequences

- purview.dev and the docs site can share one implementation (purview.dev's move is a follow-up).
- R-045 depends on an astroc4 prerelease (`1.0.0-prerelease.9`) that the user merges.
- Markers work in `.md` only; MDX rejects HTML comments. ADR sections fall back to Mermaid because exported text has no page path.
