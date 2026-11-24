# Template files

Every path the `pm-docs-site` templates rendered into a site (the core, the `repo-docs` and `architecture` modules, and every view), frozen on 2026-11-24 when the skill moved to the `@purview-dev/pm-docs-site` package; `scripts/consumer.ts migrate` reads this list and deletes only these paths from a template site.

Each path is relative to the site root and carries the SHA-256 of this repository's `docs-site/` copy at that date, or `none` where this site did not have the file. The `aspire` module is not listed: it writes AppHost files (`DocsSiteKit.cs` and edits to the AppHost), never site files.

## Paths

- `.gitignore` `c760594e89b7b78ec030eb86107c075f9d8177fa7987881c04ff6ea47d5d40cc`
- `astro.config.mjs` `16dcc1cee3cafe3e386f1cce723d69ac86de381f443c9b66920f6654d4586275`
- `package.json` `4119694514dd50fd4f1446ee6ff93072c0f3ec03160cefad24c3d0e2bf1214c4`
- `pm-docs-site.json` `b36aca6f1c1e1535b99fc7561ba06922a5180fbfd915ea3c8b8132ce7d52fb5f`
- `src/components/ExportStamp.astro` `88ee76f805b2a47b588f70000c17223bd9eec49e1c4c911574a67deddee9ca40`
- `src/components/FeatureTable.astro` `bc352826cfbf20228cbdd637be3e193ec72f19749c329622cabed9fe2a06b397`
- `src/components/StateBadge.astro` `829b08560069179f556042f6426e79ca053c2ed5e9ac81ec606e39cfc2d76bca`
- `src/components/lib/KanbanItemCard.astro` `2315cccb9214088cf62ec511349bcc26c3aca0ec34040d288e454ead7dad1c83`
- `src/components/lib/StatusTimelineFeed.astro` `f9c25c61f1951fd808ef0afe41a6b2a35ef0938332c5271aeb6c00daa8a00487`
- `src/components/lib/TaskKanbanCard.astro` `61f4ce31f9cb3e4049cf8588e68a5c638b15793297fa333c37f7c424c125fa37`
- `src/content.config.ts` `098fdb67b82f49463322e91b8bb753c51d7e10e0892fc8c2bb2985883372c025`
- `src/docs-sidebar.ts` `ad39a0ceea0586f8f8dccd2d84bafbfd0da9ee2329b0fe42f98532f47e32f64b`
- `src/docs-sources.ts` `259e3770b62665c215f44a59a0fe3108223498ab15b309431e14e623d4c240b1`
- `src/lib/__fixtures__/planning.json` `2d62f3a7acd35c85456cbe5641f90dd48de67377e748cb5933c523aeced8761a`
- `src/lib/architecture.test.ts` `none`
- `src/lib/architecture.ts` `none`
- `src/lib/planning-types.ts` `052700c2be50a5c7e21bfcd1aa10886fbb0dd05d8a8a31b116b37002ecb24ed3`
- `src/lib/planning.test.ts` `d20437ee4ff2097d1d781c765ba480ebc6a38643faebcae710fc26cdb64dd00a`
- `src/lib/planning.ts` `3c9fdc38307bbe10c2dc893eb22334be2465eab2f9f27beba5efd823a3ce6401`
- `src/loaders/repo-docs.test.ts` `4c3a084a7f9d33737c31838413d147a98e8fb67f454e4e688be3fc2bddf60291`
- `src/loaders/repo-docs.ts` `992cbd53735067e69d8fa1914261917859276869aac63893661f43463f2370e9`
- `src/modules.ts` `73d5886c922cca5df631a8c98411e67cd992f969a540873da30d73fb38d54bfc`
- `src/pages/architecture/[group].astro` `none`
- `src/pages/index.astro` `6faca0be10979dd4e2b1ec8717bd545ac9c5a96b6ce8a75812be7c5c62a098fa`
- `src/pages/plan/board.astro` `c8efb4c3085d46ac32589cbaf77970335e06a250f45f852466addcd29e4b0bbe`
- `src/pages/plan/briefs.astro` `d5b1b5af3a17f4b8ad7c42d20f020113d6d6f294bb34fd31f97e1b91f14357f7`
- `src/pages/plan/features/[id].astro` `61c6edd194ed55afa9fb33422a99ee1e20b97fa478624e4a17ac493fd7092708`
- `src/pages/plan/features/index.astro` `cc4d77f0f014be58cb019618f3db9d724e57cdf55531470a3e7f09ad837488d4`
- `src/pages/plan/inbox.astro` `dc10fc7a625265b40c2cead7529d0607b6023e49f39431bee27c391b9905b344`
- `src/pages/plan/log.astro` `e0da81cb7750fc871968547dc574bd9a607a60856046a7702e0034d4e463a892`
- `src/pages/plan/milestones/[milestone].astro` `f72ba0400408c2a298afa39969c168298e79de5ceb70dbae87e78bd4c1d9b81b`
- `src/pages/plan/milestones/index.astro` `9d8661ea4c136103b9aae88c16e58bf7053cef981db8ace5c954672d2c8fa09a`
- `src/pages/plan/now.astro` `4da62983e0d0191b0e39fabcb74f9c6b0614cbc8c27505253c722faba6d4f811`
- `src/pages/plan/risks.astro` `01d12d5232e6a226ec783d1617e4b5da30baf67330e63cac4e83b3447037cd24`
- `src/pages/plan/roadmap.astro` `e2281e6721ea07bdce202926de49b58cd78de789e5f279d329f307620e7de698`
- `src/pages/plan/strategy.astro` `647aaf634dca6183594bebfa7d012d987060115a74b92082cb4638df2f0bed46`
- `src/sidebar.ts` `8c0bc588b2d46063dc2b2efd46541db41a4e2204a168a0819473c11516aa4784`
- `src/styles/components.css` `f46fbc13b93be969db58b4e9f2f77dce6fa2a6db0a4f4d9c75bd146e3d8cc27d`
- `src/views.ts` `6c94f0ebb1150cecb3ce9659b1016562c8816582378f227971bd358859556928`
- `tsconfig.json` `4fce510886518e203bb26f7cc3f4dc5fb38dbdc73c711aa40c7468e5d208040e`
- `vitest.config.ts` `2c2bd9b7b1373e65fb01d65c7f70fdcf0ad850c76d2a05530243b5142d9cb875`
