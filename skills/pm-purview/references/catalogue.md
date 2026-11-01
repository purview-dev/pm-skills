# Purview catalogue (snapshot)

Snapshot of <https://purview.dev/llms.txt> taken 2026-11-01 (releases page
dated 2026-10-29). Versions and statuses change: before recommending, check
<https://purview.dev/releases/> and the project's docs page. `Inference:`
marks a judgement that the site does not state.

## Facts that gate every recommendation

- Purview is **C#/.NET only**. AspireC4 also supports TypeScript Aspire
  AppHosts. Nothing applies to a project with no .NET code and no plan
  for any.
- All public projects are MIT licensed. The site is labelled Beta.
- Principle: "Adopt only what helps". "Purview is not an all-or-nothing
  stack." Start with the problem you have and adopt one package.
- **Framework floor: .NET 10.** From November 2026, Purview targets
  .NET 10 and .NET 11 (11 reaches general availability in mid-November
  2026). Treat every package as requiring net10 or later, even where an
  older release supported net8, net9, or net48. A project on net8 or net9
  must upgrade first. Count the upgrade as part of the recommendation's
  cost, or recommend the upgrade as its own roadmap item. The SDK and
  generator build host is the .NET 10 SDK or later.

## Projects

| Project | Status | Install | Use when (signals) | Not when | Scale |
| --- | --- | --- | --- | --- | --- |
| Build SDK | Stable 1.2.0 | `global.json` `msbuild-sdks: Purview.BuildSdk`, import in `Directory.Build.props/.targets` | New or multi-project .NET repo; repeated csproj boilerplate; no Central Package Management; the playbook calls it "the single highest-value change" | Entrenched custom MSBuild; the team cannot accept folder-derived names or CPM (Inference) | All, including solo |
| Telemetry SourceGenerator | Stable 5.1.0 | `dotnet add package Purview.Telemetry.SourceGenerator` (PrivateAssets=all) | Service or app that logs, traces, or emits metrics; hand-written `LoggerMessage` or `ActivitySource` code | netstandard2.0 libraries; no observability needs | All (one analyzer package) |
| Value Objects | Stable 1.2.3 | `dotnet add package Purview.ValueObjects` | Primitive obsession; typed IDs (`CustomerId` vs `OrderId`); domain invariants; EF Core mapping; JSON converters | Scripts; CRUD with no invariants (Inference) | Small and up |
| ZodSharp | Stable 2.4.2 | `Purview.ZodSharp` + `.SystemTextJson` or `.NewtonsoftJson` (not both) + `.AspNetCore` | Validating API or JSON input; JSON Schema as the wire contract; hot-path validation; a team that also uses TypeScript Zod | Trivial validation; JSON Schemas with external `$ref`; a team content with FluentValidation (Inference) | Small and up |
| Results | Stable 1.0.4 | `Purview.Results`, `.AspNetCore`, `.ZodSharp`, `.ZodSharp.AspNetCore` | ASP.NET Core API with expected failures (not found, invalid, conflict) mapped to HTTP ProblemDetails | Exception-based code that will not change. Union errors need C# preview language features on .NET 11 | Small and up |
| Event Sourcing | Preview (1.1.1; 2.0 prerelease) | `Purview.EventSourcing` + one provider (`.SqlServer`, `.Postgres`, `.AzureStorage`, `.MongoDB`, `.CosmosDb`, `.InMemory`) | The domain needs an audit trail or event history; aggregates are real consistency boundaries | CRUD; relational joins inside invariants; needs cross-store atomic rollback; event names cannot be treated as permanent contracts | Medium to large |
| Aspire ResourceKit | Stable 1.0.3 | `dotnet add package Purview.Aspire.ResourceKit` (AppHost) | An Aspire AppHost with many resources, or per-environment toggles | No Aspire; a small AppHost (Inference) | Medium to large |
| AspireC4 | Stable 13.5.3.11 (13.6 preview) | `dotnet add package AspireC4.Hosting`, `builder.AddAspireC4()` | An Aspire app that needs current architecture diagrams | No Aspire. Needs Docker, or Node with `.WithLocalCLI()` | Medium to large |
| Architests | Stable 1.2.0 | `dotnet add package Purview.Architecture.Testing` (TUnit) | Two or more projects or layers; dependency rules to enforce; public API gated in CI | A single project ("architecture tests before there is an architecture" is premature) | Medium and up |
| Build | Stable 0.8.0 (pre-1.0) | `dotnet tool install Purview.Build` | GitHub Actions CI for .NET, especially when publishing NuGet packages, and the team is willing to follow Purview's release conventions | Other CI systems; a team that needs to own and customise its pipeline. Usable outside purview-dev, but tuned for the speed of Purview's own delivery, so its conventions come first | Medium and up |
| Containers | Experimental (prerelease) | `Purview.Containers` + modules | Integration tests against real databases or brokers, especially on Windows without Docker (WSL backend) | Anyone needing stability ("no production support guarantee") | Any, if the risk is accepted |
| SourceGenerator Framework | Stable 1.2.2 | `Purview.SourceGeneratorFramework` (+ `.Testing`, `.Testing.TUnit`) | The project writes its own Roslyn source generators or analyzers | Anything else | Any |
| Engineering Playbook | Experimental (docs only) | Copy from the repo's `templates/` | A new .NET repo that wants conventions, verification tiers, and `AGENTS.md` set up from the start | An established repo with its own conventions (Inference) | All, with scale profiles |
| Logging Source Generators | Archived | None | Never recommend; Telemetry SourceGenerator replaces it (Inference) | Always | None |

Docs: `https://purview.dev/docs/<slug>/`. Per-project index:
`https://purview.dev/projects/<slug>/llms.txt`. Slugs: `build-sdk`,
`telemetry-sourcegenerator`, `value-objects`, `zodsharp`, `results`,
`event-sourcing`, `aspire-resourcekit`, `aspirec4`, `architests`, `build`,
`containers`, `sourcegenerator-framework`, `engineering-playbook`.

Several projects publish agent skills installed with
`npx skills add purview-dev/<repo>`: `build-sdk`, `architests`,
`aspire-resourcekit`, and `results`.

## Scale profiles (engineering playbook)

| Scale | Adopt | Skip for now |
| --- | --- | --- |
| Small (one project, solo or pair) | Build SDK, pinned `global.json`, Central Package Management, `AGENTS.md`, one `TestBuilder` from the first test, minimal docs | Architecture tests, CI tiers, pack validation, release channels |
| Medium (several projects, a team) | Add Architests once a second project exists, a shared testing project, a slow CI tier, agent skills for repeated review comments | Pack validation, release channels |
| Large (published packages or many teams) | Add pack validation, consumer verification, a release gate, release channels, published skills, analyzer-enforced architecture rules | None |

Adopt early: a test builder (retrofitting it means a large diff). Avoid
early: architecture tests before there is an architecture, a pack manifest
before the first package, consumer verification before a contract exists.

## Boundary stack (contracts and data exchange)

Inbound body, then ZodSharp schema, then Value Objects `Create`, then the
domain, then `Result<TValue,TError>`, then HTTP mapping. Rules: "A value is
a type, not a primitive"; Create validates, Hydrate does not; normalise,
then validate; "Expected outcomes are values"; "The schema is the single
source of truth for a wire shape".

- Single project: value types, plus Results for one failure mode.
- Service boundary: all five rules.
- Published contract: also a checked-in exported schema.

## Engineering principles

Convention over configuration. Identity derived, never repeated.
"Architecture is a test, not a diagram". The build is the only authority.
"A clean build has no warnings". Consumer claims proved by a consumer. Docs
live in the repo. One `TestBuilder`. "An agent is a reader with no memory".
Verify in proportion to risk.

## New .NET repository (playbook getting started, Experimental)

1. `global.json`: pin the SDK (`rollForward: disable`), `Purview.BuildSdk`,
   and the Microsoft.Testing.Platform runner.
2. `Directory.Packages.props` (TUnit, Telemetry SourceGenerator, Bogus).
3. `src/Directory.Build.props` and `.targets` importing the SDK, with
   `NamespacePrefix`.
4. `src/<Name>.slnx` and two-line csproj files; test projects end in
   `UnitTests`.
5. A `SharedTestingInfra` project.
6. `.config/purview-build.json` and `.github/workflows/pr.yml` calling
   `purview-dev/build`.
7. `mkdocs.yml`, `docs/wiki`, and `AGENTS.md`.
8. `.config/dotnet-tools.json` (CSharpier, Purview.Build) and a `Justfile`.

There are no `dotnet new` templates; files are copied from the playbook
repository's `templates/` folder.
