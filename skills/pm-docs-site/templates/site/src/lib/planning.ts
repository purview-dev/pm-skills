// The plan, read from {{PM_ROOT}}planning.json and shaped for the plan pages.
//
// planning.json is written by the pm-export skill from the Markdown PM state;
// it is the only source of plan data on this site. Nothing here parses
// {{PM_ROOT}}*.md, and nothing on a page is typed by hand.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Brief, InboxEntry, Level, Milestone, Owner, Planning, Rag, Risk, RoadmapItem, Size, Stage } from './planning-types';

/** Where the export lives, relative to the site root (`{{SITE_ROOT}}`). */
const DEFAULT_PATH = '{{SITE_TO_ROOT}}/{{PM_ROOT}}planning.json';

/** The pm-export `schemaVersion` this site reads (pm-docs-site keeps it equal to pm-export's schema). */
export const SCHEMA_VERSION = 5;

export class PlanningExportError extends Error {
	constructor(message: string) {
		super(`${message} Run the pm-export skill to write {{PM_ROOT}}planning.json.`);
		this.name = 'PlanningExportError';
	}
}

/**
 * Read and check the export. Paths resolve from the working directory, which is
 * the site root under `just docs`, `astro build` and the Aspire resource.
 */
export function loadPlanning(path: string = resolve(process.cwd(), DEFAULT_PATH)): Planning {
	let text: string;

	try {
		text = readFileSync(path, 'utf8');
	} catch {
		throw new PlanningExportError(`No plan export at ${path}.`);
	}

	let planning: { schemaVersion?: unknown };

	try {
		planning = JSON.parse(text);
	} catch (error) {
		throw new PlanningExportError(`${path} is not valid JSON (${(error as Error).message}).`);
	}

	if (planning.schemaVersion !== SCHEMA_VERSION) {
		throw new PlanningExportError(
			`${path} has schemaVersion ${String(planning.schemaVersion)}; this site reads schemaVersion ${SCHEMA_VERSION}.`,
		);
	}

	return planning as Planning;
}

/** Board-card priority from item size — the PM state has no priority of its own. */
export function sizeToPriority(size: Size | null): 'low' | 'medium' | 'high' {
	return size === 'L' ? 'high' : size === 'M' ? 'medium' : 'low';
}

/** The owner as a card's initials. A missing owner means `agent` (PM rules). */
export function initials(owner: Owner | string | null): string {
	return owner === 'user' ? 'YOU' : owner === 'both' ? 'AG+U' : 'AG';
}

export interface TimelineEvent {
	title: string;
	desc: string;
	time: string;
	status: 'done' | 'active' | 'pending';
}

export interface RoadmapGroup {
	milestone: {
		id: string;
		name: string;
		status: string | null;
		exitCriteria: string | null;
		isFocus: boolean;
	} | null;
	events: TimelineEvent[];
	/** Done items against every item in the group (done, in progress and queued). */
	progress: { done: number; total: number };
}

/**
 * One group per milestone in strategy order, then "no milestone": the Done log
 * (newest first), the Now item, then Next and Later in roadmap order.
 */
export function roadmapGroups(planning: Planning): RoadmapGroup[] {
	const groupOf = (milestone: string | null) => milestoneId(milestone, planning.strategy.milestones);
	const focus = planning.strategy.focus.milestone ?? '';

	const eventsFor = (id: string | null): TimelineEvent[] => [
		...planning.log.done
			.filter((entry) => groupOf(entry.milestone) === id)
			.map((entry) => ({
				title: label(entry.id, entry.title),
				desc: entry.result ?? '',
				time: entry.date,
				status: 'done' as const,
			})),
		...(planning.now.item && groupOf(planning.now.milestone) === id
			? [
					{
						title: label(planning.now.item.id, planning.now.item.title),
						desc: planning.now.stage ? `In progress: ${planning.now.stage}` : 'In progress',
						time: 'Now',
						status: 'active' as const,
					},
				]
			: []),
		...[...planning.roadmap.next, ...planning.roadmap.later]
			.filter((item) => groupOf(item.milestone) === id)
			.map((item) => ({
				title: label(item.id, item.title),
				desc: item.doneWhen,
				time: item.section === 'next' ? 'Next' : 'Later',
				status: 'pending' as const,
			})),
	];

	const groups: RoadmapGroup[] = planning.strategy.milestones.map((milestone) => ({
		milestone: {
			id: milestone.id,
			name: milestone.name,
			status: milestone.status,
			exitCriteria: milestone.exitCriteria,
			isFocus: milestoneId(focus, [milestone]) !== null,
		},
		...withProgress(eventsFor(milestone.id)),
	}));

	const unassigned = eventsFor(null);

	return unassigned.length > 0 ? [...groups, { milestone: null, ...withProgress(unassigned) }] : groups;
}

function withProgress(events: TimelineEvent[]): Pick<RoadmapGroup, 'events' | 'progress'> {
	return { events, progress: { done: events.filter((event) => event.status === 'done').length, total: events.length } };
}

const LEVELS: Level[] = ['low', 'medium', 'high'];

/**
 * The RAG the PM rules derive from likelihood and impact (low 1, medium 2,
 * high 3; a product of 6 or more is red, 3 or 4 amber, otherwise green).
 * A risk's own `rag` may differ when it carries an override; it colours the
 * risk, and this colours a matrix cell.
 */
export function derivedRag(likelihood: Level, impact: Level): Rag {
	const score = (LEVELS.indexOf(likelihood) + 1) * (LEVELS.indexOf(impact) + 1);

	return score >= 6 ? 'red' : score >= 3 ? 'amber' : 'green';
}

export interface MatrixCell {
	likelihood: Level;
	impact: Level;
	rag: Rag;
	risks: Risk[];
}

/** The likelihood × impact grid: rows from high impact down, columns from low likelihood up. */
export function riskMatrix(risks: Risk[]): MatrixCell[][] {
	return [...LEVELS].reverse().map((impact) =>
		LEVELS.map((likelihood) => ({
			likelihood,
			impact,
			rag: derivedRag(likelihood, impact),
			risks: risks.filter((risk) => risk.likelihood === likelihood && risk.impact === impact),
		})),
	);
}

/** The site URL of a docs/ file named in the plan, or `null` when it is not one. */
export function docsHref(path: string | null): string | null {
	const match = /^docs\/(.+)\.md$/i.exec(path?.trim() ?? '');

	return match ? `/${match[1]}/` : null;
}

function label(id: string | null, title: string): string {
	return id ? `${id} ${title}` : title;
}

/**
 * The known milestone a value names: its ID (`M2`) or its ID and name
 * (`M2 Billing`). Anything else (`none`, an unknown ID, `null`) is no milestone.
 */
export function milestoneId(value: string | null, milestones: Pick<Milestone, 'id'>[]): string | null {
	const text = value?.trim() ?? '';

	return milestones.find((milestone) => text === milestone.id || text.startsWith(`${milestone.id} `))?.id ?? null;
}

/** A plan's completion as a whole percentage; `0` when there is no plan or it has no steps. */
export function planProgress(plan: { checked: number; total: number } | null): number {
	return plan && plan.total > 0 ? Math.round((plan.checked / plan.total) * 100) : 0;
}

/** Inbox severity as a card priority: the inbox has no priority of its own. */
export function severityToPriority(severity: InboxEntry['severity']): 'low' | 'medium' | 'high' | 'urgent' {
	return severity === 'blocker' ? 'urgent' : severity === 'major' ? 'high' : severity === 'minor' ? 'medium' : 'low';
}

export type FeatureState = 'now' | 'next' | 'later' | 'done' | 'dropped';

/** The words each state is shown with, in the order the Features page lists them. */
export const FEATURE_STATES: Record<FeatureState, string> = {
	now: 'In progress',
	next: 'Next',
	later: 'Later',
	done: 'Done',
	dropped: 'Dropped',
};

/**
 * One roadmap item wherever the export holds it — the Now item, Next, Later,
 * the Done log, or the Dropped log — with the fields that place holds.
 */
export interface Feature {
	id: string;
	title: string;
	state: FeatureState;
	/** A known milestone ID (`milestoneId`), or `null`. */
	milestone: string | null;
	owner: string | null;
	size: Size | null;
	serves: string[];
	doneWhen: string[];
	dependsOn: string[];
	label: RoadmapItem['label'] | null;
	status: RoadmapItem['status'] | null;
	position: number | null;
	brief: string | null;
	note: string | null;
	revisits: string | null;
	stage: Stage | null;
	started: string | null;
	/** Done or dropped: the log date. */
	date: string | null;
	result: string | null;
	plan: string | null;
	reason: string | null;
}

/** Every item with an ID, in this order: Now, Next, Later, Done (newest first), Dropped (newest first). */
export function features(planning: Planning): Feature[] {
	const known = planning.strategy.milestones;
	const blank = { serves: [], doneWhen: [], dependsOn: [], label: null, status: null, position: null, brief: null, note: null, revisits: null, stage: null, started: null, date: null, result: null, plan: null, reason: null };
	const now = planning.now.item
		? [
				{
					...blank,
					id: planning.now.item.id,
					title: planning.now.item.title,
					state: 'now' as const,
					milestone: milestoneId(planning.now.milestone, known),
					owner: planning.now.item.owner,
					size: planning.now.item.size,
					serves: planning.now.item.serves,
					dependsOn: planning.now.item.dependsOn,
					revisits: planning.now.item.revisits,
					doneWhen: planning.now.doneWhen,
					brief: planning.now.brief,
					stage: planning.now.stage,
					started: planning.now.started,
					plan: planning.now.plan,
				},
			]
		: [];
	const queued = [...planning.roadmap.next, ...planning.roadmap.later].map((item) => ({
		...blank,
		id: item.id,
		title: item.title,
		state: item.section,
		milestone: milestoneId(item.milestone, known),
		owner: item.owner,
		size: item.size,
		serves: item.serves,
		doneWhen: item.doneWhen ? [item.doneWhen] : [],
		dependsOn: item.dependsOn,
		label: item.label,
		status: item.status,
		position: item.position,
		brief: item.brief,
		note: item.note,
		revisits: item.revisits,
	}));
	const done = planning.log.done.flatMap((entry) =>
		entry.id
			? [{ ...blank, id: entry.id, title: entry.title, state: 'done' as const, milestone: milestoneId(entry.milestone, known), owner: entry.owner, size: null, date: entry.date, result: entry.result, plan: entry.plan }]
			: [],
	);
	const dropped = planning.log.dropped.flatMap((entry) =>
		entry.id ? [{ ...blank, id: entry.id, title: entry.title, state: 'dropped' as const, milestone: null, owner: null, size: null, date: entry.date, reason: entry.reason }] : [],
	);

	const seen = new Set<string>();

	return [...now, ...queued, ...done, ...dropped].filter((feature) => !seen.has(feature.id) && seen.add(feature.id));
}

/** The items whose `Depends on` names `id`. */
export function dependents(all: Feature[], id: string): Feature[] {
	return all.filter((feature) => feature.dependsOn.includes(id));
}

/** The brief a feature links to, by its `Brief` path, else by the brief's own ID. */
export function briefOf(planning: Planning, feature: Pick<Feature, 'id' | 'brief'>): Brief | null {
	return planning.briefs.find((brief) => brief.path === feature.brief) ?? planning.briefs.find((brief) => brief.id === feature.id) ?? null;
}

export interface MilestoneSummary {
	/** `null` for the items with no milestone. */
	id: string | null;
	/** The page slug: the lower-case ID, or `none`. */
	slug: string;
	name: string;
	status: string | null;
	target: string | null;
	exitCriteria: string | null;
	serves: string[];
	isFocus: boolean;
	features: Feature[];
	/** Done items against every item that is not dropped. */
	progress: { done: number; total: number };
}

/** One summary per milestone in strategy order, then `No milestone` when an item has none. */
export function milestoneSummaries(planning: Planning, all: Feature[] = features(planning)): MilestoneSummary[] {
	const focus = planning.strategy.focus.milestone;
	const summary = (milestone: Milestone | null): MilestoneSummary => {
		const members = all.filter((feature) => feature.milestone === (milestone?.id ?? null));
		const counted = members.filter((feature) => feature.state !== 'dropped');

		return {
			id: milestone?.id ?? null,
			slug: milestone ? milestone.id.toLowerCase() : 'none',
			name: milestone?.name ?? 'No milestone',
			status: milestone?.status ?? null,
			target: milestone?.target ?? null,
			exitCriteria: milestone?.exitCriteria ?? null,
			serves: milestone?.serves ?? [],
			isFocus: milestone ? milestoneId(focus, [milestone]) !== null : false,
			features: members,
			progress: { done: counted.filter((feature) => feature.state === 'done').length, total: counted.length },
		};
	};
	const groups = planning.strategy.milestones.map(summary);
	const unassigned = summary(null);

	return unassigned.features.length > 0 ? [...groups, unassigned] : groups;
}

/** An inbox file's source as a card's initials: `agent (…)` → `AG`, anything else (the user) → `YOU`. */
export function sourceInitials(source: string | null): string {
	return /^agent\b/i.test(source?.trim() ?? '') ? 'AG' : 'YOU';
}

/** The anchor of a brief's row on the Briefs page: its file name without `.md`, lower-case. */
export function briefAnchor(path: string): string {
	return (path.split('/').at(-1) ?? path).replace(/\.md$/i, '').toLowerCase();
}

/** The page of one item on this site. */
export function featureHref(id: string): string {
	return `/plan/features/${id.toLowerCase()}/`;
}

/** The page of one milestone on this site; `null` is the `No milestone` page. */
export function milestoneHref(id: string | null): string {
	return `/plan/milestones/${id ? id.toLowerCase() : 'none'}/`;
}
