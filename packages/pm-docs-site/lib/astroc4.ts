// Loads @purview-dev/astroc4 only when the architecture option asks for it, so a
// site that never sets `architecture` never pulls in LikeC4, Shiki, or astroc4's
// markdown pipeline.

/** The Starlight plugin astroc4's default export returns, given its options. */
export type Astroc4Plugin = (options: Record<string, unknown>) => unknown;

const INSTALL_COMMAND = 'bun add --exact @purview-dev/astroc4@1.0.0-prerelease.9 likec4 @likec4/core shiki @astrojs/markdown-satteri';

/**
 * Dynamically imports @purview-dev/astroc4's Starlight plugin, so it loads
 * only when the `architecture` option is set. A missing install throws a
 * message naming the command to install it, instead of Node's bare
 * module-not-found error.
 */
export async function loadAstroc4(): Promise<Astroc4Plugin> {
	try {
		const module = (await import('@purview-dev/astroc4')) as { default: Astroc4Plugin };

		return module.default;
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ERR_MODULE_NOT_FOUND') {
			throw new Error(`pm-docs-site: the architecture option needs @purview-dev/astroc4. Run: ${INSTALL_COMMAND}`);
		}

		throw error;
	}
}
