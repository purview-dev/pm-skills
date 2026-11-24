# ADR-005 Docs sites consume the pm-docs-site package

- Status: accepted
- Date: 2026-11-23
- Category: architecture
- Supersedes: none
- Item: R-013
- Source: none

## Context

Consumer docs sites carried about 40 copied template files rendered by `skills/pm-docs-site/scripts/site.ts`, resolved their own Astro and Starlight versions, and any template change forced a rules bump (brief `planning/briefs/2026-11-17-docs-site-package.md`). Spec: `docs/superpowers/specs/2026-11-23-docs-site-package-publish-and-migrate-design.md`.

## Decision

Every docs site, including this repository's `docs-site/`, is a four-file consumer (`package.json`, `astro.config.ts`, `bun.lock`, `.gitignore`) of `@purview-dev/pm-docs-site`, configured through `pmDocsSite()` options. The skill's templates (except the `aspire` AppHost snippets) and `site.ts` are deleted. The skill states a minimum package version, and `scaffold` and `upgrade` pin `latest` exactly. This repository's `docs-site/` depends on the local package (`file:../packages/pm-docs-site`), like `examples/demo/`.

## Alternatives

- Tidy the templates in place: fixes version spread but keeps about 40 copied files per consumer.
- Pin the published version in `docs-site/`: the true consumer path, but every package release needs a second pull request after publishing.
- A root Bun workspace: moves `bun.lock` out of `docs-site/` and changes the repository layout for one site.

## Consequences

- A template change is a package release, not a rules bump.
- `upgrade` migrates a template site once, using a frozen list of template files.
- Consumers lose file-level edits; customisation is through options.
- The architecture module must exist as a package option before the migration ships.
