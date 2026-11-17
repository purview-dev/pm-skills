// Every reference the site links: what an ID or brief path points at, how prose
// is split into plain text and links, and (references) which pages link to
// each target. Links and `Linked from` lists both come from here, so they
// cannot disagree. All from planning.json.

import config from 'virtual:pm-docs-site/config';

import type { ViewName } from '../../index';
import { briefAnchor, briefOf, featureHref, features, loadPlanning, milestoneHref, milestoneSummaries, roadmapGroups, type Feature } from './planning';
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

export type Relation = 'depends on' | 'revisits' | 'milestone' | 'affects' | 'mitigation' | 'related' | 'brief' | 'mentions' | 'listed';

/** The order and heading of each relation in a `Linked from` section. */
export const RELATION_LABELS: Record<Relation, string> = {
	'depends on': 'Depends on',
	revisits: 'Revisits',
	milestone: 'Milestone',
	affects: 'Affects',
	mitigation: 'Mitigation',
	related: 'Related',
	brief: 'Brief',
	mentions: 'Mentioned on',
	listed: 'Listed on',
};

/** One page that links a target, and how. */
export interface Backlink {
	href: string;
	label: string;
	relation: Relation;
}

/**
 * For every target, the pages that link to it. Each source page below must
 * render exactly these links (through RefLink and LinkedText); the link test
 * checks that every rendered link appears in its target's list.
 */
export function references(planning: Planning, views: Views): Map<string, Backlink[]> {
	const known = targets(planning, views);
	const back = new Map<string, Backlink[]>([...known.keys()].map((key) => [key, []]));
	const all = features(planning);
	const summaries = milestoneSummaries(planning, all);
	const milestoneKey = (id: string | null) => (id ?? (summaries.some((summary) => summary.id === null) ? 'none' : null));
	// What a FeatureTable row shows in its last column.
	const decision = (feature: Feature) => (feature.state === 'done' ? feature.result : feature.state === 'dropped' ? feature.reason : feature.doneWhen.join(' '));

	const source = (href: string, label: string) => {
		const link = (key: string | null | undefined, relation: Relation) => {
			const target = key ? known.get(key) : undefined;
			const list = key ? back.get(key) : undefined;

			if (!target?.href || !list || target.href === href) return;
			if (!list.some((entry) => entry.href === href && entry.relation === relation)) list.push({ href, label, relation });
		};
		const prose = (text: string | null | undefined, relation: Relation = 'mentions') => {
			for (const run of linkify(text ?? '', known)) if (run.target) link(run.target.key, relation);
		};

		return { link, prose };
	};

	if (views.features) {
		for (const feature of all) {
			const page = source(featureHref(feature.id), `${feature.id} ${feature.title}`);

			for (const dep of feature.dependsOn) page.link(dep, 'depends on');
			page.link(feature.revisits, 'revisits');
			page.link(milestoneKey(feature.milestone), 'milestone');
			for (const other of all) {
				if (other.dependsOn.includes(feature.id) || other.revisits === feature.id) page.link(other.id, 'related');
			}

			const brief = briefOf(planning, feature);

			page.link(brief?.path ?? feature.brief, 'brief');
			for (const risk of [...planning.risks.open, ...planning.risks.closed]) {
				if (risk.affects !== feature.id) continue;
				page.link(risk.id, 'affects');
				page.prose(risk.title);
			}
			for (const text of [...feature.doneWhen, feature.result, feature.reason, feature.note, feature.status?.reason, brief?.status, brief?.problem, brief?.decision]) page.prose(text);
			for (const entry of planning.inbox) if (entry.affects === feature.id || entry.related.includes(feature.id)) page.prose(entry.title);
		}
	}

	if (views.milestones) {
		for (const summary of summaries) {
			const page = source(milestoneHref(summary.id), summary.id ? `${summary.id} ${summary.name}` : summary.name);

			for (const feature of summary.features) {
				page.link(feature.id, 'listed');
				page.prose(decision(feature));
			}
			page.prose(summary.exitCriteria);
			if (summary.id) {
				for (const risk of [...planning.risks.open, ...planning.risks.closed]) {
					if (risk.affects !== summary.id) continue;
					page.link(risk.id, 'affects');
					page.prose(risk.title);
				}
			}
		}
	}

	for (const risk of [...planning.risks.open, ...planning.risks.closed]) {
		const page = source(riskHref(risk), `${risk.id} ${risk.title}`);

		page.prose(risk.affects, 'affects');
		page.prose(risk.trigger);
		page.prose(risk.mitigation, 'mitigation');
		for (const text of [risk.ragOverride, risk.raised, risk.reviewed, risk.closed]) page.prose(text);
	}

	const byId = new Map(all.map((feature) => [feature.id, feature]));
	const board = source('/plan/board/', 'Board');
	const { columns } = planning.board;

	for (const card of [...columns.now, ...columns.next, ...columns.foryou, ...columns.waiting]) {
		board.link(card.id, 'listed');
		board.prose(card.detail);
		if (columns.now.every((now) => now.id !== card.id)) board.link(milestoneKey(byId.get(card.id)?.milestone ?? null), 'listed');
	}

	for (const entry of columns.done) {
		board.link(entry.id, 'listed');
		board.link(milestoneKey(byId.get(entry.id ?? '')?.milestone ?? null), 'listed');
	}

	const roadmap = source('/plan/roadmap/', 'Roadmap');

	for (const group of roadmapGroups(planning)) {
		roadmap.link(group.milestone?.id ?? milestoneKey(null), 'listed');
		roadmap.prose(group.milestone?.exitCriteria);
		for (const event of group.events) {
			roadmap.link(event.id, 'listed');
			roadmap.prose(event.desc);
		}
	}

	const log = source('/plan/log/', 'Log');

	for (const entry of planning.board.activity) {
		if (entry.id) log.link(entry.id, 'listed');
		else log.prose(entry.title);
		log.prose(entry.result);
	}

	const risks = source('/plan/risks/', 'Risks');

	// Open risks show their detail; closed ones their title and closing reason; removed ones their reason.
	for (const risk of planning.risks.open) {
		risks.link(risk.id, 'listed');
		risks.prose(risk.title);
		risks.prose(risk.affects, 'affects');
		risks.prose(risk.trigger);
		risks.prose(risk.ragOverride);
		risks.prose(risk.mitigation, 'mitigation');
	}

	for (const risk of planning.risks.closed) {
		risks.link(risk.id, 'listed');
		risks.prose(risk.title);
		risks.prose(risk.closed);
	}

	for (const risk of planning.risks.removed) {
		risks.link(risk.id, 'listed');
		risks.prose(risk.title);
		risks.prose(risk.reason);
	}

	if (views.features) {
		const page = source('/plan/features/', 'Features');

		for (const feature of all) {
			page.link(feature.id, 'listed');
			page.link(milestoneKey(feature.milestone), 'listed');
			page.prose(decision(feature));
		}
	}

	if (views.milestones) {
		const page = source('/plan/milestones/', 'Milestones');

		for (const summary of summaries) {
			page.link(summary.id ?? 'none', 'listed');
			page.prose(summary.exitCriteria);
		}
	}

	if (views.now && planning.now.item) {
		const page = source('/plan/now/', 'Now');
		const checkpoint = planning.now.checkpoint;

		page.link(planning.now.item.id, 'listed');
		page.link(planning.now.brief, 'listed');
		for (const text of [...planning.now.doneWhen, checkpoint?.stoppedAt, checkpoint?.nextAction, checkpoint?.startWith, checkpoint?.decisions, checkpoint?.context, checkpoint?.openQuestion]) page.prose(text);
		for (const task of planning.plan?.tasks ?? []) page.prose(task.title);
	}

	if (views.inbox) {
		const page = source('/plan/inbox/', 'Inbox');

		for (const entry of planning.inbox) {
			page.prose(entry.title);
			page.prose(entry.affects, 'affects');
			for (const id of entry.related) page.link(id, 'related');
			page.link(entry.brief, 'brief');
			page.prose(entry.idea);
		}
	}

	if (views.briefs) {
		const page = source('/plan/briefs/', 'Briefs');

		for (const brief of planning.briefs) {
			page.link(brief.id, 'listed');
			for (const text of [brief.status, brief.origin, brief.problem, brief.decision, brief.doneWhen, ...brief.revisions.map((revision) => revision.text)]) page.prose(text);
		}
	}

	if (views.strategy) {
		const page = source('/plan/strategy/', 'Strategy');
		const { strategy, vision } = planning;

		page.prose(strategy.focus.milestone, 'listed');
		for (const text of [
			vision.problem,
			vision.customer,
			...vision.outcomes.map((outcome) => outcome.text),
			...vision.outOfScope,
			vision.constraints.timeAvailable,
			vision.constraints.budget,
			vision.constraints.stack,
			strategy.focus.whyNow,
			...strategy.bets.flatMap((bet) => [bet.statement, bet.evidence, bet.signal, bet.status]),
			...strategy.assumptions.flatMap((assumption) => [assumption.statement, assumption.test, assumption.status]),
			...strategy.notDoing.flatMap((entry) => [entry.thing, entry.why, entry.revisit]),
			...strategy.decisions.flatMap((decision) => [decision.date, decision.decision, decision.why, decision.rejected]),
		])
			page.prose(text);
	}

	const home = source('/', 'Home');

	home.prose(planning.strategy.focus.milestone, 'listed');
	home.prose(planning.strategy.focus.whyNow);
	if (!views.now && planning.now.item) home.link(planning.now.item.id, 'listed');
	for (const id of planning.checks.claimable) home.link(id, 'listed');
	for (const risk of planning.risks.open.filter((candidate) => candidate.rag === 'red')) {
		home.link(risk.id, 'listed');
		home.prose(risk.title);
		home.prose(risk.mitigation, 'mitigation');
	}

	return back;
}

let cache: { known: Map<string, Target>; back: Map<string, Backlink[]> } | null = null;

/** The site's targets and backlinks, computed once per build from the integration's options. */
export function siteRefs(): { known: Map<string, Target>; back: Map<string, Backlink[]> } {
	if (!cache) {
		const planning = loadPlanning();

		cache = { known: targets(planning, config.views), back: references(planning, config.views) };
	}

	return cache;
}
