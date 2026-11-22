// The integration's options: defaults, validation, and paths made absolute from
// the site root, so the pages and the content config never resolve a path again.

import { resolve } from 'node:path';

import type { PmDocsSiteOptions, ResolvedOptions, ViewName } from './types.ts';

/** The optional plan views. Home, Board, Roadmap, Log and Risks are always on. */
export const VIEW_NAMES: readonly ViewName[] = ['now', 'milestones', 'graph', 'features', 'inbox', 'briefs', 'strategy', 'decisions'];

/** Where the export lives by default, relative to the site root. */
const DEFAULT_PLANNING = '../planning/planning.json';

/**
 * Throw a pm-docs-site message for a malformed `docs` option, which a plain
 * JavaScript astro.config does not type-check.
 */
function checkDocs(docs: unknown): void {
	const value = (docs ?? {}) as { root?: unknown; sources?: unknown };

	if (typeof value.root !== 'string') throw new Error('pm-docs-site: docs.root must be a path');
	if (!Array.isArray(value.sources)) throw new Error('pm-docs-site: docs.sources must be a list of sources');

	for (const source of value.sources) {
		if (typeof source?.base !== 'string' || !Array.isArray(source?.include)) {
			throw new Error(`pm-docs-site: docs source "${String(source?.label)}" needs base and include`);
		}
	}
}

/** @param root the site root, absolute */
export function resolveOptions(options: PmDocsSiteOptions, root: string): ResolvedOptions {
	if (!options || typeof options.title !== 'string' || options.title === '') {
		throw new Error('pm-docs-site: title is required');
	}

	const listed = options.views ?? VIEW_NAMES;

	for (const name of listed) {
		if (!VIEW_NAMES.includes(name)) {
			throw new Error(`pm-docs-site: unknown view "${name}"; expected one of ${VIEW_NAMES.join(', ')}`);
		}
	}

	if (options.docs !== undefined) checkDocs(options.docs);

	const views = Object.fromEntries(VIEW_NAMES.map((name) => [name, listed.includes(name)])) as Record<ViewName, boolean>;

	return {
		title: options.title,
		description: options.description ?? null,
		planning: resolve(root, options.planning ?? DEFAULT_PLANNING),
		planningLabel: (options.planning ?? DEFAULT_PLANNING).replace(/\\/g, '/'),
		docs: options.docs ? { root: resolve(root, options.docs.root), sources: options.docs.sources } : null,
		views,
	};
}
