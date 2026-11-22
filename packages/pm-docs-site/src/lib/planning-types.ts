// The part of planning.json (pm-export, schemaVersion 5) the site reads.
// The full shape is planning.schema.json; only what the pages use is typed.

export type Owner = 'agent' | 'user' | 'both';
export type Size = 'S' | 'M' | 'L';
export type Level = 'low' | 'medium' | 'high';
export type Rag = 'red' | 'amber' | 'green';
export type Stage = 'design' | 'plan' | 'execute' | 'finish';

export interface ItemRef {
	id: string;
	title: string;
}

export interface NowItem extends ItemRef {
	serves: string[];
	owner: Owner | null;
	size: Size | null;
	dependsOn: string[];
	revisits: string | null;
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
	brief: string | null;
	note: string | null;
	revisits: string | null;
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

export interface DroppedEntry {
	date: string;
	id: string | null;
	title: string;
	reason: string | null;
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

export interface Checkpoint {
	at: string;
	stoppedAt: string | null;
	nextAction: string | null;
	startWith: string | null;
	decisions: string | null;
	context: string | null;
	openQuestion: string | null;
}

export interface PlanTask {
	number: number;
	title: string;
	checked: number;
	total: number;
	steps: { text: string; checked: boolean }[];
}

export interface InboxEntry {
	file: string;
	title: string;
	captured: string | null;
	source: string | null;
	kind: 'feature' | 'bug' | 'improvement' | 'question' | 'inspiration' | 'tech-debt' | null;
	severity: 'blocker' | 'major' | 'minor' | 'cosmetic' | null;
	affects: string | null;
	context: string | null;
	discuss: 'yes' | 'no';
	related: string[];
	brief: string | null;
	reviewed: string | null;
	idea: string | null;
}

export interface Brief {
	path: string;
	id: string | null;
	title: string;
	status: string | null;
	origin: string | null;
	updated: string | null;
	decision: string | null;
	problem: string | null;
	doneWhen: string | null;
	revisions: { date: string | null; text: string }[];
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

export type AdrStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded';

/** One ADR, whole: the four sections are the Markdown under each heading; `""` when empty, `null` when missing. */
export interface Adr {
	id: string;
	path: string;
	title: string;
	status: AdrStatus | null;
	supersededBy: string | null;
	date: string | null;
	category: string | null;
	supersedes: string | null;
	item: string | null;
	source: string | null;
	context: string | null;
	decision: string | null;
	alternatives: string | null;
	consequences: string | null;
}

export interface Planning {
	schemaVersion: 5;
	generatedAt: string;
	source: { branch: string | null; head: string | null };
	vision: {
		problem: string | null;
		customer: string | null;
		outcomes: { id: string; text: string }[];
		outOfScope: string[];
		constraints: { timeAvailable: string | null; budget: string | null; stack: string | null };
	};
	strategy: {
		focus: { milestone: string | null; whyNow: string | null };
		milestones: Milestone[];
		bets: { id: string; statement: string; evidence: string | null; signal: string | null; status: string | null }[];
		assumptions: { id: string; statement: string; test: string | null; status: string | null }[];
		notDoing: { thing: string; why: string | null; revisit: string | null }[];
		decisions: { date: string | null; decision: string; why: string | null; rejected: string | null }[];
	};
	now: {
		status: 'idle' | 'active';
		item: NowItem | null;
		stage: Stage | null;
		session: string | null;
		brief: string | null;
		milestone: string | null;
		spec: string | null;
		plan: string | null;
		started: string | null;
		doneWhen: string[];
		checkpoint: Checkpoint | null;
	};
	plan: { path: string; checked: number; total: number; tasks: PlanTask[] } | null;
	roadmap: { next: RoadmapItem[]; later: RoadmapItem[] };
	board: {
		columns: { now: Card[]; next: Card[]; foryou: Card[]; waiting: Card[]; done: DoneEntry[] };
		activity: Activity[];
	};
	log: { done: DoneEntry[]; dropped: DroppedEntry[]; reviews: { date: string; summary: string | null }[] };
	inbox: InboxEntry[];
	briefs: Brief[];
	risks: { open: Risk[]; closed: Risk[]; removed: RemovedRisk[] };
	adrs: Adr[];
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
