# Module: aspire

Runs the site as a Vite app resource in the repository's Aspire AppHost, in
run mode only. Spec: section 10 of `references/spec.md`.

## Applies when

- A project file uses `Sdk="Aspire.AppHost.Sdk"` (the AppHost).
- The **ResourceKit** variant applies when that AppHost references
  `Purview.Aspire.ResourceKit` and a class carries `[HostKit]`. Otherwise use
  the **plain** variant.

## Values

| Placeholder | Value |
| --- | --- |
| `{{APPHOST_TO_SITE}}` | The site root relative to the AppHost project folder, with `/` separators (for example `../../docs-site`) |
| `{{RESOURCES_CLASS}}` | ResourceKit only: the static class that holds the resource-name constants (the one other `[ResourceDefinition<T>(...)]` attributes name) |
| `{{KIT_NAMESPACE}}` | ResourceKit only: the namespace of the folder that holds the other resource kits |

## Install

In the AppHost project folder: `dotnet add package Aspire.Hosting.JavaScript`.
When the repository uses central package management
(`Directory.Packages.props`), add a `PackageVersion` there with the version
`dotnet package search Aspire.Hosting.JavaScript --exact-match` reports as
newest for the AppHost's Aspire major version, and a version-less
`PackageReference` in the AppHost project.

## Files (ResourceKit variant)

| Template | Destination |
| --- | --- |
| `DocsSiteKit.cs` | `<kits folder>/DocsSiteKit.cs`, beside the other resource kits |

The generated `AddAspireResourceKit()` registers the kit. Do not change
`Program.cs`.

## Edits

ResourceKit variant, in `{{RESOURCES_CLASS}}`, in the position that keeps the
class's order (alphabetical, or beside the web resources):

```csharp
/// <summary>
/// The project site resource: the plan, served by Astro.
/// </summary>
public const string DocsSite = "docs";
```

Plain variant, in the AppHost's `Program.cs` (or `AppHost.cs`), after the
other resources and before `Build()`:

```csharp
// The project site: a local reading aid, so it runs only when the AppHost runs.
if (builder.ExecutionContext.IsRunMode)
{
    builder.AddViteApp("docs", "{{APPHOST_TO_SITE}}").WithBun(installArgs: ["--frozen-lockfile"]);
}
```

Match the file's indentation (tabs or spaces) and its comment style.

## Tests

When the repository has AppHost composition tests (a test project that
builds the AppHost with `DistributedApplicationTestingBuilder`), add two
tests beside them, using their framework, helpers, and naming:

- `AppHost_InRunMode_HasTheDocsSiteWithAnHttpEndpoint`: the `docs` resource
  exists and has an `EndpointAnnotation` with `UriScheme` `http`.
- `AppHost_InPublishMode_HasNoDocsSite`: built with
  `["--operation", "publish"]`, first assert the execution context is in
  publish mode, then that no resource is named `docs`.

A TUnit example, with helpers that build the model without starting it:

```csharp
[Test]
public async Task AppHost_InRunMode_HasTheDocsSiteWithAnHttpEndpoint(CancellationToken cancellationToken)
{
    // Act
    var (model, context) = await BuildAsync([], cancellationToken);

    // Assert
    await Assert.That(context.IsRunMode).IsTrue();
    var endpoints = Named(model, Resources.DocsSite).Annotations.OfType<EndpointAnnotation>();
    await Assert.That(endpoints.Any(endpoint => endpoint.UriScheme == "http")).IsTrue();
}

// The project site is a local reading aid; nothing about it is deployed.
[Test]
public async Task AppHost_InPublishMode_HasNoDocsSite(CancellationToken cancellationToken)
{
    // Act
    var (model, context) = await BuildAsync(["--operation", "publish"], cancellationToken);

    // Assert: the precondition first, so a wrong publish switch fails here
    // rather than passing vacuously in run mode.
    await Assert.That(context.IsPublishMode).IsTrue();
    await Assert.That(model.Resources.Any(resource => resource.Name == Resources.DocsSite)).IsFalse();
}
```

When there are no composition tests, add none and say so in the output
`Note`.

## Check

- `dotnet build` of the AppHost succeeds, and the two tests pass.
- Running the AppHost shows the `docs` resource running, with an `http`
  endpoint that serves the Home page.
- Files the AppHost regenerates on build (for example an `.aspirec4/`
  folder) are left changed for the workflow to commit.
