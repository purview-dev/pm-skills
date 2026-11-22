# Strategy

<!--
Written by pm-strategy, one approved section at a time. Read by pm-next,
pm-review, pm-shape, pm-discover, pm-status, pm-board, pm-roadmap, and
pm-up-next. VISION.md says what v1 is;
this file says the order of attack, the bets behind it, and the decisions
made along the way.
-->

## Current focus

- Milestone: M1 Reproducible docs site
- Why now: every item in Next serves it, and the brief `planning/briefs/2026-11-17-docs-site-package.md` records copied templates, unpinned packages, and rules bumps for template changes as current costs.

## Milestones

<!--
Ordered. Each milestone is a checkable outcome that serves V lines.

### M1 <Name>

- Serves: V1, V2
- Exit criteria: <observable check>
- Target: <YYYY-MM-DD | none>
- Status: active | planned | done (<YYYY-MM-DD>)
-->

### M1 Reproducible docs site

- Serves: V4
- Exit criteria: `npm view @purview-dev/pm-docs-site version` returns a version, `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore`, and `just docs-check` passes.
- Target: none
- Status: active

### M4 Recorded technical decisions

- Serves: V5
- Exit criteria: a report in `planning/research/` shows, in a scratch repository with `package.json`, `tsconfig.json`, `AGENTS.md`, and `docs/adr/`, that `pm-init` writes `ENGINEERING.md` citing all three files and `ADR directory: docs/adr/`, that the design handoff names the ADRs and principles that apply, and that `pm-checkpoint` (`done`) refuses to close on a failing command check.
- Target: none
- Status: planned

### M2 Verified install and upgrade

- Serves: V1
- Exit criteria: in an empty scratch repository, `npx skills add https://github.com/purview-dev/pm-skills -y` then `pm-setup` reports every pm-* and workflow skill installed, and `just validate` fails when `pm-setup`'s skill count differs from the shipped skills.
- Target: none
- Status: planned

### M3 Verified lifecycle guards

- Serves: V2, V3
- Exit criteria: a rehearsal report in `planning/research/` shows `pm-resume` naming the active item, stage, and next action after `/clear`, and `pm-shape` parking an idea instead of running during an active workflow.
- Target: none
- Status: planned

## Bets

<!--
- B1: We believe <change> will <result> for <who>.
  Evidence: <what supports it>. We will know when: <signal>.
  Status: open | won | lost (<YYYY-MM-DD>)
-->

- B1: We believe shipping the docs site as a pinned, independently versioned package will make every consumer's site build the same way and upgrade with one version change, for consumers and for this repository's maintainer.
  Evidence: `skills/pm-docs-site/SKILL.md` scaffold step 5 and upgrade step 4 install the latest packages; about 40 template files are copied into each site.
  We will know when: two builds from the same `planning.json` and lockfile give byte-identical HTML, and a package upgrade changes only `package.json` and `bun.lock`.
  Status: open

## Assumptions and risks

<!--
- A1: <assumption or risk>. Test: <how and when it is checked>.
  Status: untested | holds | broken (<YYYY-MM-DD>)
-->

- A1: An Astro integration installed from a package can inject every plan page, so a consumer needs no page files. Test: R-008 Docs-site package: skeleton at parity renders every current page from the package.
  Status: untested
- A2: A public `@purview-dev` npm scope and a publish workflow cost GBP 0 per month. Test: R-014 Create the npm @purview-dev scope and token.
  Status: untested
- A3: Integration options and Starlight component overrides cover the customisation this repository's `docs-site/` needs. Test: R-013 Docs-site package: publish and migrate moves `docs-site/` onto the package with no copied files.
  Status: untested

## Not doing

<!--
- <thing>. Why: <reason>. Revisit: <condition | never>.
-->

- New views or modules in `skills/pm-docs-site/templates/`. Why: R-013 Docs-site package: publish and migrate replaces the copied templates; only fixes land there meanwhile. Revisit: never.
- Hosting the docs site (GitHub Pages or any deploy). Why: the site is a local view of the plan, and M1 is about reproducible builds. Revisit: after M1 is done.
- Writing PM state from the site (drag and drop, edit actions). Why: PM state changes only through the pm-* skills; the site reads `planning.json` only. Revisit: never.

## Decisions

<!--
Newest first. Nothing in this file changes without a line here.

- <YYYY-MM-DD> <decision>. Why: <reason>. Rejected: <alternatives>.
-->

- 2026-11-22 R-033 ADR directory setting and design handoff moved to the top of Next, ahead of the M1 items. Why: the user asked for the ADRs next. Rejected: keeping it behind R-025 and R-013.
- 2026-11-22 Re-planned roadmap. Why: V5 and M4 added; R-033 to R-035 join Next after the two M1 items, R-036 and R-037 lead Later under M4. Rejected: M4 items ahead of R-013 Docs-site package: publish and migrate.
- 2026-11-22 Milestone M4 Recorded technical decisions added, ordered after M1 and before M2, serving V5. Why: the user asked for it next; it covers the briefs `planning/briefs/2026-11-22-where-do-adrs-fit.md` and `planning/briefs/2026-11-20-technology-and-engineering-principles.md`. Rejected: ordering it after M3.
- 2026-11-22 Vision V5 added: technical decisions are recorded and followed (`pm-init` records technology and principles, the design handoff names the ADRs and principles that apply, `pm-checkpoint` `done` refuses a failing command check). Why: agents contradict earlier technical decisions because nothing records or points at them (both briefs). Rejected: an ADR-only V5; keeping v1 as is. Cost: about 5 items and several rules bumps before M2 and M3.
- 2026-11-18 Vision V3 now reads: during an active workflow, only the Non-interruption rules' exceptions run (capture, `pm-checkpoint` stage, done, push and pop, `pm-pause`, `pm-revise`, and the read-only views and checks); every other PM skill waits, and a capture replies in one line while the step in progress resumes. Why: the old line named only `pm-park`, the read-only views, and `pm-revise`, so it no longer matched Non-interruption rules 2, 3, and 10; pointing at the rules keeps it true as they change. R-016 Rehearse the lifecycle guards and M3 still serve it. Rejected: listing every exception (goes stale each rules version); keeping the old line.
- 2026-11-18 Added R-021 Docs-site package: TypeScript source with a build step at the top of Next; R-017 in-repo dev hydrates and R-019 consumer-ready for 1.0.0 depend on it, and R-019 moved to the top of Later. M1's exit criterion and R-013's Done when name `astro.config.ts` instead of `astro.config.mjs`. Why: TypeScript is strongly preferred, and JavaScript ships only where Node needs it (brief `planning/briefs/2026-11-18-pm-docs-site-typescript.md`). Rejected: Bun-only runtime shipping `.ts`; converting only the non-published files; keeping it parked.
- 2026-11-18 Re-planned roadmap. Why: Next was empty with M1 open; Next is now R-017 in-repo dev hydrates, R-011 milestone timeline, R-012 dependency graph, R-018 export the Now card's owner and size, R-019 consumer-ready for 1.0.0, with R-013 at the top of Later M1 depending on R-019, then R-020 rich demo planning fixture (user request); R-017, R-018, and R-019 fold seven inbox files. Kept "returns a version" in R-013 and the M1 exit criterion instead of naming `1.0.0`, at the user's choice. Rejected: absorbing the consumer fixes into R-013; naming `1.0.0` in both.
- 2026-11-17 Re-planned roadmap. Why: assign every item to M1, M2, or M3, and order Next for the M1 focus (R-014 first as a blocking user task, then R-008, R-003, R-009, R-004); added R-015 and R-016 for the M2 and M3 exit criteria. Rejected: leaving items without milestones.
- 2026-11-17 Not doing: new template views or modules, hosting the docs site, writing PM state from the site. Why: the package replaces the templates, the site stays local and read-only. Rejected: none.
- 2026-11-17 Current focus M1 Reproducible docs site, with bet B1 and assumptions A1 to A3. Why: every item in Next serves it. Rejected: focus on M2 Verified install and upgrade.
- 2026-11-17 Milestones M1 Reproducible docs site, M2 Verified install and upgrade, M3 Verified lifecycle guards, in that order. Why: every Next item and the docs-site package brief serve M1, and it tests the riskiest assumption (an independently versioned, published package). Rejected: install first (M2, M1, M3); guards first (M3, M2, M1).
