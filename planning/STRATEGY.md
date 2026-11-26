# Strategy

<!--
Written by pm-strategy, one approved section at a time. Read by pm-next,
pm-review, pm-shape, pm-discover, pm-status, pm-board, pm-roadmap, and
pm-up-next. VISION.md says what v1 is;
this file says the order of attack, the bets behind it, and the decisions
made along the way.
-->

## Current focus

- Milestone: M4 Recorded technical decisions
- Why now: ADR support must be complete (user, 2026-11-25); 8 of its items are done, 2 were dropped, its 1 open item (R-036 Plan citation and done check) is in Next, and the forecast is about 0.1 weeks at 8.25 items per week.

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
- Status: done (2026-11-24)

### M4 Recorded technical decisions

- Serves: V5
- Exit criteria: a report in `planning/research/` shows, in a scratch repository with `docs/adr/`, that `pm-adr import docs/adr/` brings its ADRs into `planning/decisions/`, that the design handoff names the ADRs and principles that apply, and that `pm-checkpoint` (`done`) refuses to close on a failing command check; and every ADR section, including a relative image, renders on its docs-site page.
- Target: none
- Status: done (2026-11-26)

### M5 Docs-site package 1.0.0

- Serves: V4
- Exit criteria: `npm view @purview-dev/pm-docs-site version` returns `1.0.0`, the package has a page per brief and per inbox file and a research reports view, its README holds complete user instructions for every view, and `just package-test` and `just docs-check` pass.
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
- B2: We believe recording technology, principles, and ADRs, and naming the ones that apply in every design handoff, will stop agents contradicting earlier technical decisions, for maintainers of repositories that use pm-skills.
  Evidence: `planning/briefs/2026-11-22-where-do-adrs-fit.md` and `planning/briefs/2026-11-20-technology-and-engineering-principles.md` record agents contradicting earlier decisions because nothing records or points at them.
  We will know when: the M4 rehearsal report in `planning/research/` shows the design handoff naming the ADRs and principles that apply and `pm-checkpoint` (`done`) refusing a failing command check.
  Status: open

## Assumptions and risks

<!--
- A1: <assumption or risk>. Test: <how and when it is checked>.
  Status: untested | holds | broken (<YYYY-MM-DD>)
-->

- A1: An Astro integration installed from a package can inject every plan page, so a consumer needs no page files. Test: R-008 Docs-site package: skeleton at parity renders every current page from the package.
  Status: holds (2026-11-25)
- A2: A public `@purview-dev` npm scope and a publish workflow cost GBP 0 per month. Test: R-014 Create the npm @purview-dev scope and token.
  Status: holds (2026-11-25)
- A3: Integration options and Starlight component overrides cover the customisation this repository's `docs-site/` needs. Test: R-013 Docs-site package: publish and migrate moves `docs-site/` onto the package with no copied files.
  Status: holds (2026-11-25)
- A5: A design stage that is handed the applicable ADRs and principles follows them. Test: R-036 Plan citation and done check's rehearsal report in `planning/research/`.
  Status: untested

## Not doing

<!--
- <thing>. Why: <reason>. Revisit: <condition | never>.
-->

- New views or modules in `skills/pm-docs-site/templates/`. Why: R-013 Docs-site package: publish and migrate replaces the copied templates; only fixes land there meanwhile. Revisit: never.
- Hosting the docs site (GitHub Pages or any deploy). Why: the site is a local view of the plan, and M1 is about reproducible builds. Revisit: after M1 is done.
- Writing PM state from the site (drag and drop, edit actions). Why: PM state changes only through the pm-* skills; the site reads `planning.json` only. Revisit: never.
- GitHub issue and Project sync (`planning/inbox/2026-11-22-1739-github-issue-project-sync.md`, brief `planning/briefs/2026-11-22-github-issue-project-sync.md`). Why: M4 and M5 come first. Revisit: after M5 Docs-site package 1.0.0 is done.
- Inferring `ENGINEERING.md` from a repository (`pm-engineering infer`). Why: R-035 was dropped on 2026-11-25; `pm-engineering add` is enough for now. Revisit: when a consumer asks for it, or after M5 Docs-site package 1.0.0 is done.

## Decisions

<!--
Newest first. Nothing in this file changes without a line here.

- <YYYY-MM-DD> <decision>. Why: <reason>. Rejected: <alternatives>.
-->

- 2026-11-26 M4 Recorded technical decisions complete. Why: `planning/research/2026-11-26-m4-rehearsal.md` shows `pm-adr import docs/adr/` bringing a scratch repository's ADRs into `planning/decisions/`, the plan handoff naming the ADRs and principles that apply, and `pm-checkpoint` (`done`) refusing a failing command check; R-050 ADR relative images render unresolved renders every ADR section, including a relative image. Rejected: none.
- 2026-11-25 Re-planned roadmap. Why: R-035 was dropped and M4 has one open item, so Next is R-036 (M4), then R-052, R-042, new R-056 Package tests stable under full lint-check, and R-053 (M5); R-036's Done when gains `pm-adr import docs/adr/` in its rehearsal to cover M4's exit criterion; the R-050 ADR image minors join R-042's Note; Later is M2, M3, then Unassigned. Rejected: R-057 Engineering lint review follow-ups as a new item (its inbox file stays parked); dropping any item.
- 2026-11-25 M4 Recorded technical decisions exit criteria drop "`pm-init` writes `ENGINEERING.md` citing all three files"; the scratch repository needs only `docs/adr/`. Why: R-035 pm-engineering infer from an existing repository was dropped (not needed now), and nothing else builds inference. Rejected: replacing it with a `pm-engineering add` check; keeping it, which leaves M4 unable to close.
- 2026-11-25 V5 first clause changed from "`pm-init` records an existing repository's technology and principles" to "`pm-engineering` records the technology and principles in use". Why: no item serves inference after R-035 was dropped. Rejected: keeping the clause with no item.
- 2026-11-25 A4 (`pm-engineering` infers technology and principles from `package.json`, `tsconfig.json`, and `AGENTS.md`) removed. Why: its test, R-035, was dropped. Rejected: keeping it untested with no test.
- 2026-11-25 Inferring `ENGINEERING.md` added to Not doing, revisit when a consumer asks or after M5. Why: R-035 dropped; `pm-engineering add` is enough for now. Rejected: no Not doing entry.
- 2026-11-25 Re-planned roadmap. Why: focus moved to M4 and M5 was added; Next stays R-050, R-037, R-055, R-035, R-036 (all M4), R-042, R-052, and R-053 join M5, and Later is grouped M5, M2, M3, then Unassigned. Rejected: leaving Later ungrouped.
- 2026-11-25 Not doing: GitHub issue and Project sync until M5 Docs-site package 1.0.0 is done. Why: M4 and M5 come first. Rejected: moving the docs-site hosting revisit to after M5; deferring R-046 to R-049 agent context tidy until M4 is done.
- 2026-11-25 Bet B2 and assumptions A4 and A5 added for M4; A1 to A3 hold. Why: R-008, R-014, and R-013 are done and tested them; B1 stays open because byte-identical builds are not yet measured. Rejected: leaving A1 to A3 untested.
- 2026-11-25 Current focus M4 Recorded technical decisions, which must leave ADR support complete; R-050 ADR relative images render unresolved joins M4, and its exit criteria add that every ADR section, including a relative image, renders on its docs-site page. Why: the user asked for ADR support to be complete; M4's items already fill Next. Rejected: focus on M5 Docs-site package 1.0.0; focus on M2 Verified install and upgrade; R-050 staying in M5.
- 2026-11-25 M1 Reproducible docs site re-checked as done. Why: `docs-site/` holds only its four files, `npm view @purview-dev/pm-docs-site version` returns `0.1.0-pre.4`, and `just docs-check` passes (132 pages). Rejected: none.
- 2026-11-25 Milestone M5 Docs-site package 1.0.0 added, serving V4, ordered M4, M5, M2, M3. Why: the user decided on 2026-11-23 that the package is not stable until it holds every view with complete instructions, and R-050, R-042, R-052, and R-053 had no milestone. Rejected: verification first (M4, M2, M3, M5); no new milestone.
- 2026-11-25 M4 exit criterion names `pm-adr import docs/adr/` instead of `ADR directory: docs/adr/`. Why: ADR-001 ADRs live in the PM root replaced the setting, and no skill writes it. Rejected: dropping the ADR part; keeping the stale wording.
- 2026-11-24 M1 Reproducible docs site complete. Why: R-013 moved docs-site/ to package.json, astro.config.ts, bun.lock, and .gitignore on @purview-dev/pm-docs-site, just docs-check passes, and npm view @purview-dev/pm-docs-site version returns a version (0.1.0-pre.4 publishes on merge). Rejected: none.

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
