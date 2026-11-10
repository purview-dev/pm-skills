// The plan, read from planning/planning.json and shaped for the plan pages.
//
// planning.json is written by the pm-export skill from the Markdown PM state;
// it is the only source of plan data on this site. Nothing here parses
// planning/*.md, and nothing on a page is typed by hand.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Owner, Planning, Size } from './planning-types';

/** Where the export lives, relative to the site root (`docs-site`). */
const DEFAULT_PATH = '../planning/planning.json';

/** The pm-export `schemaVersion` this site reads (pm-docs-site keeps it equal to pm-export's schema). */
export const SCHEMA_VERSION = 2;

export class PlanningExportError extends Error {
	constructor(message: string) {
		super(`${message} Run the pm-export skill to write planning/planning.json.`);
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
	const known = new Set(planning.strategy.milestones.map((milestone) => milestone.id));
	const groupOf = (milestone: string | null) => (milestone && known.has(milestone) ? milestone : null);
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
			isFocus: focus === milestone.id || focus.startsWith(`${milestone.id} `),
		},
		...withProgress(eventsFor(milestone.id)),
	}));

	const unassigned = eventsFor(null);

	return unassigned.length > 0 ? [...groups, { milestone: null, ...withProgress(unassigned) }] : groups;
}

function withProgress(events: TimelineEvent[]): Pick<RoadmapGroup, 'events' | 'progress'> {
	return { events, progress: { done: events.filter((event) => event.status === 'done').length, total: events.length } };
}

/** The site URL of a docs/ file named in the plan, or `null` when it is not one. */
export function docsHref(path: string | null): string | null {
	const match = /^docs\/(.+)\.md$/i.exec(path?.trim() ?? '');

	return match ? `/${match[1]}/` : null;
}

function label(id: string | null, title: string): string {
	return id ? `${id} ${title}` : title;
}
