// The site's targets and backlinks, computed once per build from the
// integration's options. An ADR page's sections are rendered HTML (the `adrs`
// collection), so the keys linkHtml links there are what its Linked from
// entries come from (ADR-011): links and entries share one source. Kept apart
// from references.ts, which stays pure for its unit tests.
import { getCollection } from 'astro:content';
import config from 'virtual:pm-docs-site/config';

import { ADR_SECTIONS, type RenderedAdr } from '../loaders/adrs';
import { linkHtml } from './link-html';
import { loadPlanning } from './planning';
import { references, targets, type Backlink, type Target } from './references';

export interface SiteRefs {
	known: Map<string, Target>;
	back: Map<string, Backlink[]>;
}

let cache: Promise<SiteRefs> | null = null;

async function build(): Promise<SiteRefs> {
	const planning = loadPlanning();
	const known = targets(planning, config.views);
	let adrKeys: Map<string, Set<string>> | undefined;

	// An empty collection is never looked up: Astro warns that it does not exist.
	if (planning.adrs.length > 0 && config.views.decisions) {
		adrKeys = new Map();
		for (const entry of await getCollection('adrs')) {
			const adr = entry.data as RenderedAdr;
			const keys = new Set<string>();

			for (const { key } of ADR_SECTIONS) {
				const html = adr.html[key];

				if (html) for (const linked of linkHtml(html, known).keys) keys.add(linked);
			}
			adrKeys.set(adr.id, keys);
		}
	}

	return { known, back: references(planning, config.views, adrKeys) };
}

/** The site's targets and backlinks, computed once per build. */
export function siteRefs(): Promise<SiteRefs> {
	cache ??= build();

	return cache;
}
