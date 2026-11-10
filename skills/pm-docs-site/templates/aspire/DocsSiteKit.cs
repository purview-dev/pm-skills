using Aspire.Hosting.JavaScript;
using Purview.Aspire.ResourceKit;

namespace {{KIT_NAMESPACE}};

/// <summary>
/// The project site: the plan from <c>{{PM_ROOT}}planning.json</c>, served by Astro from
/// <c>{{SITE_ROOT}}</c>.
/// </summary>
/// <remarks>
/// A local reading aid, so it runs only when the AppHost runs; nothing about it is published. Bun
/// installs the site's packages from its lockfile before the dev server starts.
/// </remarks>
[ResourceDefinition<ViteAppResource>({{RESOURCES_CLASS}}.DocsSite)]
sealed partial class DocsSiteKit
{
	/// <inheritdoc />
	protected override IResourceBuilder<ViteAppResource> BuildResource(IDistributedApplicationBuilder builder)
	{
		// Relative to the AppHost project.
		return builder.AddViteApp(Name, "{{APPHOST_TO_SITE}}").WithBun(installArgs: ["--frozen-lockfile"]);
	}

	/// <inheritdoc />
	protected override bool IsResourceEnabled(IDistributedApplicationBuilder builder) =>
		builder.ExecutionContext.IsRunMode;
}
