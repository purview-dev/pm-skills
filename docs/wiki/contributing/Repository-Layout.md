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
    references/spec.md
    scripts/site.ts          renders a site from its manifest; write or check
    templates/site/          the core site (Astro, Starlight, plan pages)
    templates/repo-docs/     module: the repository's Markdown, read in place
    templates/architecture/  module: LikeC4 views through AstroC4
    templates/aspire/        module: the AppHost resource
  pm-help/SKILL.md
packages/
  pm-docs-site/            the @purview-dev/pm-docs-site npm package
    package.json           its own version, tagged pm-docs-site-v<version>
    index.mjs, index.d.ts  the Astro integration and its options
    cli.mjs                the pm-docs-site dev, build, and check commands
    lib/                   options, schemaVersion range, docs sources
    src/                   the pages and components the integration serves
    scripts/check-exports.mjs  refuses a publish with missing files
    test/                  unit, build, packed-install, and browser tests
    LICENSE.md             a copy of the root licence, checked by validate
docs/wiki/                 this documentation, published on purview.dev
planning/                  this repository's own PM state
docs-site/                 this repository's own project site
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
