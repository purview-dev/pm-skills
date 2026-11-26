# M4 rehearsal 2026-11-26

- Item: R-036 Plan citation and done check
- Branch: `feat/r-036-plan-citation-and-done-check`
- Scratch repository: `C:\Users\Kieron.Lanning\AppData\Local\Temp\r036-rehearsal-1292849632`
- Skills commit: `5e9bc62`
- Session: one fresh agent session, following each `SKILL.md` literally; every question took the recommended option or the value the task brief names.

## Step 1: Scratch repository

Created `package.json`, `App.csproj` (`<PackageReference Include="Purview.Telemetry.SourceGenerator" />`), `Directory.Packages.props` (`<PackageVersion Include="Purview.Telemetry.SourceGenerator" Version="3.2.1" />`), `docs/adr/0001-use-bun.md` and `docs/adr/0002-typescript-only.md` (MADR 3 YAML frontmatter), `src/index.ts`, and `src/util.ts`. Each `skills/<name>/` folder was linked into `.claude/skills/<name>` as a junction, as `scripts/setup-skills.ts` does (`.claude/skills/` gitignored). `pm-setup` (question `Which folder should hold the planning files?`: `planning/ (recommended)`; `Apply this pm-setup plan to AGENTS.md?`: `Apply (recommended)`) wrote a new `AGENTS.md` with the reference section, start marker without `version=`, and `CLAUDE.md` holding `@AGENTS.md`.

```text
git -C <scratch> log --oneline
5c4b1b0 chore: add pm-* skills
cf35fd7 chore: scratch repository
bunx markdownlint-cli2 AGENTS.md -> Summary: 0 issues in 0 files
```

Result: pass

## Step 2: Init and import

`pm-init`: templates copied with `{{PM_ROOT}}` = `planning/`; `PM branch: main` (no `origin/HEAD`, fallback `main`); `Rules version: 21` kept (marker present without version); `PM state commit`: `Commit automatically (recommended)`. No substantial code, so `decisions/README.md` was copied; Note `Existing ADRs in docs/adr/. Run pm-adr import docs/adr/ to bring them in.` The repository is a scaffold, so `pm-purview` (`new`) ran: answers `Web API or service`, `.NET 10 or 11 (recommended)`, `Solo prototype`, `No database`; it recommended Telemetry SourceGenerator and the user accepted it to `Later (recommended)`. Step 6 wrote R-003 with `Note: Purview package: Purview.Telemetry.SourceGenerator. Docs: <https://purview.dev/>. Report: planning/research/2026-11-26-purview-fit.md.` and ADR-001 (`proposed`, `Item: R-003`).

`pm-adr import docs/adr/`: question `Import 2 ADRs from docs/adr/ into planning/decisions/? The originals stay.`: `Import 2 ADRs (recommended)`. YAML `status` and `date` mapped, `Category: uncategorised`, `Context and Problem Statement` to `## Context`, `Decision Outcome` to `## Decision`, `Considered Options` to `## Alternatives`, `### Consequences` to `## Consequences`.

```text
c43e9f2 docs(pm): initialise planning
24f86b2 docs(pm): import 2 ADRs
planning/decisions/: ADR-001-use-purview-telemetry-sourcegenerator-for-app-logging.md
                     ADR-002-use-bun-as-the-runtime.md
                     ADR-003-typescript-only-in-source.md
                     README.md
lint.ts check planning/decisions --no-export -> pm-lint: clean
```

Result: pass (both imported ADRs landed, as ADR-002 and ADR-003, because `pm-purview` had written ADR-001 first)

## Step 3: Plan handoff

No `ENGINEERING.md`: `git rm planning/ENGINEERING.md` (commit `1342e33`, simulating an install from before the file). `pm-next` claimed R-001 Format greeting names on `feat/r-001-format-greeting-names`; its spec names `src/index.ts`, `src/index.test.ts`, and ADR-003. `pm-checkpoint stage` (`b6c1f38 docs(pm): stage R-001 at plan`) passed:

```markdown
- ADRs: ADR-003 TypeScript only in source (accepted)
- Principles: none
- Cite the EP and ADR IDs in the tasks they constrain; put each command check in the plan's verification steps.
```

R-001 was left at plan on its branch (`git switch main`). `pm-engineering add principle`, twice, on `main` (committed together as `daeb8f4`):

```text
### EP-001 No JavaScript in src
- Applies to: src/**
- Check: `bun -e "process.exit(new Bun.Glob('src/**/*.js').scanSync().next().done ? 0 : 1)"`
- Decision: ADR-003
### EP-002 Errors carry context
- Applies to: src/**
- Check: review
```

The EP-001 command exits 0 with no `.js` file in `src/` and 1 with `src/x.js`. `pm-next` (user named R-002 Validate greeting input) skipped R-001 (`R-001 Format greeting names is on feat/r-001-format-greeting-names.`) and claimed R-002. Its spec's file table names `src/index.ts` and `src/index.test.ts`, and it names ADR-003 and ADR-002. `pm-checkpoint stage` (`0c83a13 docs(pm): stage R-002 at plan`) passed:

```markdown
- ADRs: ADR-003 TypeScript only in source (accepted), ADR-002 Use Bun as the runtime (accepted)
- Principles: EP-001 No JavaScript in src: Source under `src/` is TypeScript only; no `.js` file is added there. (Check: `bun -e "process.exit(new Bun.Glob('src/**/*.js').scanSync().next().done ? 0 : 1)"`); EP-002 Errors carry context: Every error thrown from `src/` names the input or state that caused it; a bare `Error()` with no message is not allowed. (Check: review)
- Cite the EP and ADR IDs in the tasks they constrain; put each command check in the plan's verification steps.
```

The R-003 handoff later (`3ee49e0`) listed only EP-003 C# passes the house analyzer, because its spec names `App.csproj` and `Telemetry/IGreetingTelemetry.cs` and EP-001 and EP-002 apply to `src/**`.

The plan (`docs/superpowers/plans/2026-11-26-validate-greeting-input.md`) was written with `writing-plans` from the handoff text: see A5 finding.

Result: pass

## Step 4: Done check

Work on `feat/r-002-validate-greeting-input` (`3ed8eb4`): `src/index.test.ts` and the guard in `greet`, plus `src/a.js`, a new `shout` in `src/index.ts` that throws `new Error()` with no message, and `git rm src/util.ts`. `bun test`: 3 pass. Plan: no `- [ ]` box.

Run 1, `pm-checkpoint done`:

```text
git diff --name-only --diff-filter=d main...HEAD (outside planning/)
docs/superpowers/plans/2026-11-26-validate-greeting-input.md
docs/superpowers/specs/2026-11-26-validate-greeting-input-design.md
src/a.js
src/index.test.ts
src/index.ts
EP-001 check -> exit 1
git status --porcelain -> (empty)
```

Output: `EP-001 No JavaScript in src: bun -e "process.exit(new Bun.Glob('src/**/*.js').scanSync().next().done ? 0 : 1)" failed (exit 1).` (no output lines). `done` stayed in `pause`, nothing written.

Run 2, after `git rm src/a.js` (`5b2a951`): EP-001 exit 0; EP-002 review of the `src/index.ts` and `src/index.test.ts` diff found `shout`. The capture `planning/inbox/2026-11-26-0156-shout-throws-bare-error.md` (`Kind: tech-debt`, `Affects: R-002`, `Source: agent (R-002 done)`) was swept into the record. `src/util.ts` is excluded by `--diff-filter=d` (without it, the list ends with `src/util.ts`), so no line names it.

```text
f491aea docs(pm): close R-002 validate-greeting-input
 planning/LOG.md                                    |  2 ++
 planning/NOW.md                                    | 24 ++++++++++------------
 .../2026-11-26-0156-shout-throws-bare-error.md     | 19 +++++++++++++++++
Note: EP-002 Errors carry context: src/index.ts shout throws a bare new Error() with no message (line 10).
Note: Principles: 1 command checks passed, 1 review findings.
```

Uninstalled check (run on R-003, after merging R-002 into `main` as a simulated pull request): `pm-engineering add principle` EP-003 C# passes the house analyzer, `Applies to: **/*.cs`, `Check: r036-analyzer check .` (`a32ceb8`), with no `r036-analyzer` on `PATH`. R-003's changed files include `Telemetry/IGreetingTelemetry.cs`.

```text
cmd /c "exit 0"; r036-analyzer check .; "LASTEXITCODE=$LASTEXITCODE  `$?=$?"
r036-analyzer: The term 'r036-analyzer' is not recognized as a name of a cmdlet, function, script file, or executable program.
LASTEXITCODE=0  $?=False
git status --porcelain -> (empty)
```

`done` refused under "including a command that cannot run" and wrote nothing, but PowerShell sets no exit code for a missing command, so `failed (exit <n>)` has no value (see Skill defects found).

Result: pass

## Step 5: Purview record

R-003 Adopt Purview Telemetry SourceGenerator was claimed with its `Note` (`Purview package: Purview.Telemetry.SourceGenerator. ...`) copied to `NOW.md`; its spec names ADR-001. After a shim `r036-analyzer` was put on `PATH` (exit 0), `pm-checkpoint done`:

```text
manifests: App.csproj:6: <PackageReference Include="Purview.Telemetry.SourceGenerator" />
           Directory.Packages.props:6: <PackageVersion Include="Purview.Telemetry.SourceGenerator" Version="3.2.1" />
fcaac6c docs(pm): close R-003 adopt-purview-telemetry-sourcegenerator
+### Purview.Telemetry.SourceGenerator
+- Kind: library
+- Version: 3.2.1
+- Reason: Use Purview.Telemetry.SourceGenerator to generate App logging from one interface.
+- Decision: ADR-001
+- Source: Directory.Packages.props
+- Added: 2026-11-26
-- Status: proposed
+- Status: accepted   (ADR-001)
Note: Principles: 1 command checks passed, 0 review findings.
Note: Accepted ADR-001 Use Purview Telemetry SourceGenerator for App logging.
Note: Recorded Purview.Telemetry.SourceGenerator 3.2.1 in ENGINEERING.md.
```

Operator slip: the record was applied to `main`'s `ROADMAP.md`, which still held R-003 in `Later` (the claim was on the branch), and the agent did not remove the block. `pm-lint` reported `planning/ROADMAP.md:30 roadmap/id-unique R-003 is in ROADMAP.md and in LOG.md`; `bfef222 docs(pm): remove closed R-003 from roadmap` fixed it. The skill text was right; the lint gate caught the slip.

```text
bun skills/pm-lint/scripts/lint.ts check --root <scratch> -> pm-lint: clean
```

Result: pass

## A5 finding

- The plan cites EP-001, EP-002, ADR-002, and ADR-003 in `## Global Constraints`, in Task 1's heading, and in its steps, and puts the EP-001 command in Task 1, Step 6 as a verification step with `Expected: exit 0`; EP-002 becomes a diff review step (Step 5).
- `writing-plans` says nothing about principles or ADRs; every citation came from the plan handoff block, so the handoff is what carries them.
- A5 holds for this run, but weakly: the same agent wrote the handoff and the plan and knew the test, so this is not an independent check. A plan written by a session that does not know A5 is the stronger test.
- In a real execute stage, the plan's EP-001 step would have caught `src/a.js` before `done`; the rehearsal added it after the plan steps on purpose.

## Skill defects found

- `pm-checkpoint` step 5, **Principles check**: "a non-zero exit, including a command that cannot run, ... listing `EP-NNN <title>: <command> failed (exit <n>).`" In PowerShell a missing command sets no exit code (`$LASTEXITCODE` keeps the previous value, 0 here; only `$?` is `False`), so `<n>` has no value, and an agent that reads only `$LASTEXITCODE` would pass the check. Suggest `failed (exit <n> | not found)` and naming `$?` for PowerShell. **fixed in df75a98**
- `pm-checkpoint` step 5, **Record the Purview package**: "`Source` the manifest path" is ambiguous when the `PackageReference` is in `App.csproj` and the version is in `Directory.Packages.props`. The spec (section 5) says the block cites `App.csproj`; the task brief says `Source` is the `Directory.Packages.props` path. The run chose `Directory.Packages.props`, where the version was read. **fixed in df75a98**
- Observation, not R-036 scope: `pm-setup` Step 5, item 4 nests the read-only `docs/adr/` check under "If `<PM state directory>/config.md` exists", so `pm-setup` before `pm-init` never prints that Note; `pm-init` step 3 does.

## Re-run after df75a98

Re-ran both defects against the same scratch repository
(`C:\Users\Kieron.Lanning\AppData\Local\Temp\r036-rehearsal-1292849632`), a
fresh session with no prior context, after `df75a98 fix(pm-checkpoint):
powershell missing command and purview source path (R-036)`.

### Principles check: missing command

The new text: "a non-zero exit, or a command that cannot run (not found; in
PowerShell `$?` is false while `$LASTEXITCODE` may stay 0), keeps `done` in
`pause` with nothing written, listing `EP-NNN <title>: <command> failed
(exit <n>).`, or `failed (not run: <error>).` for a command that cannot
run."

```text
nonexistent-linter-xyz src; "`$?=$? LASTEXITCODE=$LASTEXITCODE"
nonexistent-linter-xyz: The term 'nonexistent-linter-xyz' is not recognized
as a name of a cmdlet, function, script file, or executable program.
$?=False LASTEXITCODE=
```

`$?` is `False` and `$LASTEXITCODE` carries no number, so the command
cannot run; the text now routes this to `failed (not run: <error>).`, not
`failed (exit <n>).`, which has no value for a missing command. `done`
stays in `pause` with nothing written, listing `EP-NNN <title>:
nonexistent-linter-xyz src failed (not run: The term 'nonexistent-linter-xyz'
is not recognized as a name of a cmdlet, function, script file, or
executable program.).` No PM file was touched.

Result: pass

### Record the Purview package: Source

`App.csproj` carries the `PackageReference`:

```xml
<PackageReference Include="Purview.Telemetry.SourceGenerator" />
```

`Directory.Packages.props` carries the central version:

```xml
<PackageVersion Include="Purview.Telemetry.SourceGenerator" Version="3.2.1" />
```

The new text: "`Source` the path of the manifest that holds the
`PackageReference` (or `global.json` for an SDK), even when the version
comes from `Directory.Packages.props`." The `PackageReference` is in
`App.csproj`, so `Source` is now required to be `App.csproj`, not
`Directory.Packages.props`. The existing entry (written before df75a98)
held `Source: Directory.Packages.props`, which no longer matches; corrected
the one line in `planning/ENGINEERING.md` and committed in the scratch
repository:

```text
3fdda04 docs(pm): correct purview source
 1 file changed, 1 insertion(+), 1 deletion(-)
bun skills/pm-lint/scripts/lint.ts check --root <scratch> -> pm-lint: clean
```

Result: pass
