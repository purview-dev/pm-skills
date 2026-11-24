# Repository layout

Where each skill, its references and templates, the docs-site package, the scripts, and this
repository's own planning state and site live.

```text
skills/
  pm-setup/
    SKILL.md
    references/AGENTS-section.md
  pm-init/
    SKILL.md
    templates/
  pm-resume/SKILL.md
  pm-rejoin/SKILL.md
  pm-next/SKILL.md
  pm-up-next/SKILL.md
  pm-park/SKILL.md
  pm-bug/SKILL.md
  pm-risk/SKILL.md
  pm-shape/SKILL.md
  pm-discover/SKILL.md
  pm-strategy/SKILL.md
  pm-purview/
    SKILL.md
    references/catalogue.md
  pm-checkpoint/SKILL.md
  pm-pause/SKILL.md
  pm-revise/SKILL.md
  pm-review/SKILL.md
  pm-item/SKILL.md
  pm-board/SKILL.md
  pm-roadmap/SKILL.md
  pm-status/SKILL.md
  pm-export/
    SKILL.md
    references/planning.schema.json
    references/planning.example.json
  pm-docs-site/
    SKILL.md
    references/spec.md       the four-file site on the @purview-dev/pm-docs-site package
    references/template-files.md  the frozen list of files the old templates rendered
    scripts/consumer.ts      writes a package site, or migrates a template site onto it
    templates/aspire/        module: the AppHost resource
  pm-help/SKILL.md
packages/
  pm-docs-site/            the @purview-dev/pm-docs-site npm package
    package.json           its own version, tagged pm-docs-site-v<version>
    lib/                   the TypeScript source Node loads: index.ts (the Astro
                           integration), cli.ts (dev, build, check), types.ts (its
                           options), options, schemaVersion range, docs sources
    dist/                  lib/ built to JavaScript and declarations (gitignored,
                           published; bun run build)
    src/                   the pages and components the integration serves
    scripts/check-exports.ts   refuses a publish whose entry points are missing or the wrong kind of file
    test/                  unit, build, packed-install, and browser tests
    LICENSE.md             a copy of the root licence, checked by validate
docs/wiki/                 this documentation, published on purview.dev
planning/                  this repository's own PM state
docs-site/                 this repository's own project site: four files, on
                           file:../packages/pm-docs-site
scripts/
  validate.ts
  setup-skills.ts
  bump-version.ts
  check-version.ts
  workflows.test.ts        pins the publish workflow's release rules
.github/
  copilot-instructions.md
  workflows/
    ci.yml
    release.yml
    publish-pm-docs-site.yml  publishes @purview-dev/pm-docs-site to npm
package.json
LICENSE.md
```
