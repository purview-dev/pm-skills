// Every reference the site links: what an ID or brief path points at, how prose
// is split into plain text and links, and (references) which pages link to
// each target. Links and `Linked from` lists both come from here, so they
// cannot disagree. All from planning.json.

import type { ViewName } from '../../index';
import { briefAnchor, featureHref, features, milestoneHref, milestoneSummaries } from './planning';
import type { Planning } from './planning-types';

export type Views = Record<ViewName, boolean>;

export type TargetKind = 'item' | 'milestone' | 'risk' | 'brief';

export interface Target {
	kind: TargetKind;
	/** The ID, `none` for the No-milestone page, or the brief's path. */
	key: string;
	/** The page or anchor; `null` when that page is not built. */
	href: string | null;
	label: string;
}

/** The page of one open or closed risk, or a removed risk's row on the Risks page. */
export function riskHref(risk: { id: string }, removed = false): string {
	return removed ? `/plan/risks/#${risk.id.toLowerCase()}` : `/plan/risks/${risk.id.toLowerCase()}/`;
}

/** Every link target in the export, keyed by `Target.key`. */
export function targets(planning: Planning, views: Views): Map<string, Target> {
	const known = new Map<string, Target>();
	const add = (target: Target) => known.set(target.key, target);
	const all = features(planning);

	for (const feature of all) {
		add({ kind: 'item', key: feature.id, href: views.features ? featureHref(feature.id) : null, label: `${feature.id} ${feature.title}` });
	}

	for (const summary of milestoneSummaries(planning, all)) {
		add({
			kind: 'milestone',
			key: summary.id ?? 'none',
			href: views.milestones ? milestoneHref(summary.id) : null,
			label: summary.id ? `${summary.id} ${summary.name}` : summary.name,
		});
	}

	for (const risk of [...planning.risks.open, ...planning.risks.closed]) {
		add({ kind: 'risk', key: risk.id, href: riskHref(risk), label: `${risk.id} ${risk.title}` });
	}

	for (const risk of planning.risks.removed) {
		add({ kind: 'risk', key: risk.id, href: riskHref(risk, true), label: `${risk.id} ${risk.title}` });
	}

	for (const brief of planning.briefs) {
		add({ kind: 'brief', key: brief.path, href: views.briefs ? `/plan/briefs/#${briefAnchor(brief.path)}` : null, label: brief.title });
	}

	return known;
}

/** A run of prose: plain text, or the text of one known reference and its target. */
export interface Run {
	text: string;
	target?: Target;
}

const ID = String.raw`\b(?:RK-\d{3,}|R-\d{3,}|M\d+)\b`;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Split text into plain runs and runs that are a known ID or brief path with a page. */
export function linkify(text: string, known: Map<string, Target>): Run[] {
	const paths = [...known.values()].filter((target) => target.kind === 'brief').map((target) => escape(target.key));
	const pattern = new RegExp([...paths, ID].join('|'), 'g');
	const runs: Run[] = [];
	const plain = (value: string) => {
		if (!value) return;
		const last = runs.at(-1);

		if (last && !last.target) last.text += value;
		else runs.push({ text: value });
	};
	let at = 0;

	for (const match of text.matchAll(pattern)) {
		const target = known.get(match[0]);

		plain(text.slice(at, match.index));
		if (target?.href) runs.push({ text: match[0], target });
		else plain(match[0]);
		at = match.index + match[0].length;
	}

	plain(text.slice(at));

	return runs;
}
