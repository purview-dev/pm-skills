// ```mermaid fences rendered to inline SVG with Pele, at build time only: there
// is no client-side renderer and no browser in the build. astroc4's
// `likec4Fences` is the reference for the shape a Sätteri mdast-plugin factory
// takes (`factory.source`, `factory.sourceFormat`); `markdownProcessor` appends
// this fence to an existing Sätteri processor the same way astroc4's
// `registerFences` does, so a site using both astroc4 and Mermaid keeps LikeC4
// fences working.

import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { isSatteriProcessor, satteri } from '@astrojs/markdown-satteri';
import { render } from 'pele';
import type { MdastPluginDefinition, MdastPluginList, PluginFactoryContext } from 'satteri';

const FENCE_LANG = 'mermaid';
const FENCE_MARK = '```' + FENCE_LANG;

/**
 * The Sätteri mdast-plugin factory shape astroc4's `likec4Fences` returns:
 * given the document being compiled, the plugin to run for it, or `null` to
 * leave the document untouched.
 */
export type SatteriMdastPluginFactory = (factory: PluginFactoryContext) => MdastPluginDefinition | null;

/**
 * `ctx.fileURL`'s filesystem path, or `(markdown)` when the compile was given
 * none. `src/loaders/adrs.ts` renders each ADR section this way, since a
 * section is Markdown pulled from `planning.json`, not a file on disk.
 */
function describe(fileURL: URL | undefined): string {
	if (!fileURL) return '(markdown)';

	// `fileURLToPath` refuses a POSIX-style URL on win32 (no drive letter); the
	// pathname still names the file, which is all a build error needs.
	try {
		return fileURLToPath(fileURL);
	} catch {
		return fileURL.pathname;
	}
}

/**
 * Renders every ```mermaid fence in one document to inline SVG with Pele.
 *
 * `idPrefix` hashes the document's source, so the same page renders the same
 * element IDs on every build (stable across builds), while two different
 * sources never collide (distinct across sources) even when each resets its
 * own fence counter to 0 — the case when `adrs.ts` renders two sections of the
 * same ADR as two separate compiles, each with one fence.
 */
export function mermaidFences(): SatteriMdastPluginFactory {
	return (factory) => {
		if (!factory.source.includes(FENCE_MARK)) return null;

		const prefix = createHash('sha256').update(factory.source).digest('hex').slice(0, 8);
		let index = 0;

		return {
			name: 'mermaid-fences',
			code(node, ctx) {
				if (node.lang !== FENCE_LANG) return;

				const where = describe(ctx.fileURL);
				let svg: string;

				try {
					({ svg } = render(node.value, { idPrefix: `pele-${prefix}-${index++}` }));
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);

					throw new Error(`pm-docs-site: ${where}: mermaid fence is not valid (${message})`);
				}

				ctx.replaceNode(node, { type: 'html', value: svg });
			},
		};
	};
}

/**
 * The `markdown.processor` to set so Mermaid fences render: `undefined`
 * (nothing set yet) gets a fresh Sätteri processor with the fence; an
 * existing Sätteri processor (the consumer's own, or astroc4's, which appends
 * its LikeC4 fence the same way) gets the fence appended to its
 * `mdastPlugins`; any other processor is left alone — Mermaid cannot plug
 * into a pipeline that is not Sätteri's — and `warn` is called once to say so.
 * Returns `undefined` to mean "leave the consumer's processor alone".
 */
export function markdownProcessor(existing: unknown, warn: (message: string) => void): unknown | undefined {
	const fences = mermaidFences();

	if (existing === undefined) return satteri({ mdastPlugins: [fences] });

	if (typeof existing !== 'object' || existing === null || !('name' in existing) || !isSatteriProcessor(existing as { name: string })) {
		warn('pm-docs-site: Mermaid fences are disabled: the site is not using the Sätteri Markdown processor.');

		return undefined;
	}

	const options = (existing as { options?: { mdastPlugins?: MdastPluginList } }).options ?? {};

	return satteri({ ...options, mdastPlugins: [...(options.mdastPlugins ?? []), fences] });
}
