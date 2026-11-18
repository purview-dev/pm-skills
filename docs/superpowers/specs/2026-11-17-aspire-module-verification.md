# R-004 Verify the aspire module against a real AppHost

Verification record for `skills/pm-docs-site/templates/aspire/` (spec
section 10). No template change was needed.

## Done when

In an Aspire AppHost, `pm-docs-site extend aspire` adds the `docs` resource,
it serves the Home page, and both composition tests pass.

## Setup

- Scratch repository outside this one (`%TEMP%\r004-aspire`), with a copy of
  `planning/`, and `docs-site/` rendered by
  `bun skills/pm-docs-site/scripts/site.ts write` from a manifest with
  `"modules": ["aspire"]`, using this repository's `package.json` and
  `bun.lock`.
- Tooling: Aspire CLI 13.6.5, AppHost template `Aspire.AppHost.Sdk/13.6.1`,
  .NET 10, Bun, `Aspire.Hosting.JavaScript` 13.6.5,
  `Purview.Aspire.ResourceKit` (newest on nuget.org), xUnit 2.9.3 with
  `Aspire.Hosting.Testing` 13.6.1.
- Two AppHosts, one per variant, each applied from `MODULE.md` as written:
  - **Plain:** `dotnet new aspire-apphost`, the `IsRunMode` block in
    `AppHost.cs` with `{{APPHOST_TO_SITE}}` = `../../docs-site`.
  - **ResourceKit:** a `[HostKit]` class, a `Resources` class with the
    `DocsSite` constant, and `DocsSiteKit.cs` rendered with
    `{{KIT_NAMESPACE}}`, `{{RESOURCES_CLASS}}`, `{{APPHOST_TO_SITE}}`,
    `{{PM_ROOT}}`, and `{{SITE_ROOT}}`; `AppHost.cs` calls
    `builder.AddAspireResourceKit()` only.

## Results

| Check | Plain | ResourceKit |
| --- | --- | --- |
| Site `bun run test` / `check` / `build` | 25 passed / 0 errors / 32 pages | same site |
| `dotnet build` of the AppHost | 0 errors | 0 errors |
| `aspire start`, `aspire wait docs` | Running, healthy | Running, healthy |
| `docs` has an `http` endpoint | yes | yes |
| Home page through that endpoint | 200, shows the export stamp | 200, shows the export stamp |
| `AppHost_InRunMode_HasTheDocsSiteWithAnHttpEndpoint` | pass | pass |
| `AppHost_InPublishMode_HasNoDocsSite` | pass | pass |
| Publish test with the run-mode guard removed | fails (not vacuous) | fails (not vacuous) |

## Observations (no change made)

- `aspire wait docs` reports healthy in under a second: the Vite resource has
  no health check, so readiness is the endpoint answering, not the wait.
- The TUnit example in `MODULE.md` uses helpers (`BuildAsync`, `Named`) it
  does not define, and `Resources.DocsSite` is reachable from a test project
  only when the constant is visible to it. The xUnit version used the
  literal `"docs"`, `using Aspire.Hosting;` for
  `DistributedApplicationExecutionContext`, and builds the model without
  starting it.
- The template AppHost's `Aspire.Hosting.AppHost` 13.6.1 raises NU1903
  (GHSA-f7vh-h5g3-7jrh). It comes from `dotnet new`, not from the module.
