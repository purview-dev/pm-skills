// The site's targets and backlinks, computed once per build from the
// integration's options. An ADR page's sections are rendered once, as the
// `adr-sections` collection, so the keys linkHtml links in that HTML are what its
// Linked from entries come from (ADR-015): links and entries share one source.
// Kept apart from references.ts, which stays pure for its unit tests.
import { getCollection } from 'astro:content';
import config from 'virtual:pm-docs-site/config';

import { ADR_SECTIONS, hasContent, type AdrSectionData } from '../loaders/adrs';
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
		adrKeys = new Map(planning.adrs.map((adr) => [adr.id, new Set<string>()]));
		// No ADR has a non-empty section: the collection is empty, so it is never looked up.
		const sections = planning.adrs.some((adr) => ADR_SECTIONS.some(({ key }) => hasContent(adr[key]))) ? await getCollection('adr-sections') : [];

		for (const entry of sections) {
			const html = entry.rendered?.html;
			const keys = adrKeys.get((entry.data as AdrSectionData).adr);

			if (html && keys) for (const linked of linkHtml(html, known).keys) keys.add(linked);
		}
	}

	return { known, back: references(planning, config.views, adrKeys) };
}

/** The site's targets and backlinks, computed once per build. */
export function siteRefs(): Promise<SiteRefs> {
	cache ??= build();

	return cache;
}
