// @ts-check
// The integration's options: defaults, validation, and paths made absolute from
// the site root, so the pages and the content config never resolve a path again.

import { resolve } from 'node:path';

/** @typedef {import('../index').PmDocsSiteOptions} PmDocsSiteOptions */
/** @typedef {import('../index').ResolvedOptions} ResolvedOptions */
/** @typedef {import('../index').ViewName} ViewName */

/** The optional plan views. Home, Board, Roadmap, Log and Risks are always on. */
export const VIEW_NAMES = /** @type {const} */ (['now', 'milestones', 'features', 'inbox', 'briefs', 'strategy']);

/** Where the export lives by default, relative to the site root. */
const DEFAULT_PLANNING = '../planning/planning.json';

/**
 * @param {PmDocsSiteOptions} options
 * @param {string} root the site root, absolute
 * @returns {ResolvedOptions}
 */
export function resolveOptions(options, root) {
	if (!options || typeof options.title !== 'string' || options.title === '') {
		throw new Error('pm-docs-site: title is required');
	}

	const listed = options.views ?? VIEW_NAMES;

	for (const name of listed) {
		if (!VIEW_NAMES.includes(name)) {
			throw new Error(`pm-docs-site: unknown view "${name}"; expected one of ${VIEW_NAMES.join(', ')}`);
		}
	}

	const views = /** @type {Record<ViewName, boolean>} */ (
		Object.fromEntries(VIEW_NAMES.map((name) => [name, listed.includes(name)]))
	);

	return {
		title: options.title,
		description: options.description ?? null,
		planning: resolve(root, options.planning ?? DEFAULT_PLANNING),
		docs: options.docs ? { root: resolve(root, options.docs.root), sources: options.docs.sources } : null,
		views,
	};
}
