// The part of {{PM_ROOT}}planning.json (pm-export, schemaVersion 3) the site reads.
// The full shape is {{PM_ROOT}}planning.schema.json; only what the pages use is typed.

export type Owner = 'agent' | 'user' | 'both';
export type Size = 'S' | 'M' | 'L';
export type Level = 'low' | 'medium' | 'high';
export type Rag = 'red' | 'amber' | 'green';

export interface ItemRef {
	id: string;
	title: string;
}

export interface Milestone {
	id: string;
	name: string;
	serves: string[];
	exitCriteria: string | null;
	target: string | null;
	status: string | null;
}

export interface RoadmapItem {
	id: string;
	title: string;
	section: 'next' | 'later';
	position: number;
	label: 'next' | 'later' | 'blocked' | 'waiting';
	serves: string[];
	milestone: string | null;
	owner: Owner;
	doneWhen: string;
	size: Size;
	dependsOn: string[];
	status: { value: 'ready' | 'paused' | 'blocked'; reason: string | null; since: string | null };
	claimable: boolean;
}

export interface Card {
	id: string;
	title: string;
	owner: Owner | null;
	size: Size | null;
	detail: string | null;
}

export interface DoneEntry {
	date: string;
	id: string | null;
	title: string;
	milestone: string | null;
	owner: string | null;
	plan: string | null;
	result: string | null;
}

export interface Activity {
	date: string;
	kind: 'done' | 'dropped' | 'review';
	id: string | null;
	title: string | null;
	milestone: string | null;
	owner: string | null;
	result: string | null;
}

export interface Risk {
	id: string;
	title: string;
	likelihood: Level;
	impact: Level;
	rag: Rag;
	ragOverride: string | null;
	status: 'open' | 'mitigating' | 'accepted' | 'closed';
	owner: Owner;
	affects: string | null;
	trigger: string | null;
	mitigation: string | null;
	raised: string | null;
	reviewed: string | null;
	closed: string | null;
}

export interface RemovedRisk {
	date: string;
	id: string;
	title: string;
	reason: string | null;
}

export interface Planning {
	schemaVersion: 3;
	generatedAt: string;
	source: { branch: string | null; head: string | null };
	strategy: {
		focus: { milestone: string | null; whyNow: string | null };
		milestones: Milestone[];
	};
	now: {
		status: 'idle' | 'active';
		item: ItemRef | null;
		stage: 'design' | 'plan' | 'execute' | 'finish' | null;
		milestone: string | null;
		started: string | null;
	};
	plan: { path: string; checked: number; total: number } | null;
	roadmap: { next: RoadmapItem[]; later: RoadmapItem[] };
	board: {
		columns: { now: Card[]; next: Card[]; foryou: Card[]; waiting: Card[]; done: DoneEntry[] };
		activity: Activity[];
	};
	log: { done: DoneEntry[] };
	risks: { open: Risk[]; closed: Risk[]; removed: RemovedRisk[] };
	counts: {
		next: number;
		later: number;
		nextMax: number;
		openInbox: number;
		discuss: number;
		shapingBriefs: number;
		done: number;
		dropped: number;
		blockers: number;
		openRisks: number;
		redRisks: number;
		amberRisks: number;
		greenRisks: number;
	};
	checks: { reviewDue: boolean; lastReview: string | null; claimable: string[]; drift: boolean };
}
