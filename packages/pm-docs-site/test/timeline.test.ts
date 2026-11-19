import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'bun:test';

import { loadPlanning } from '../src/lib/planning';
import type { Planning } from '../src/lib/planning-types';
import { targets } from '../src/lib/references';
import {
	normaliseTarget,
	parseMilestoneStatus,
	parseTimelineQuery,
	PINCH_STEP,
	timelineMilestones,
	timelineQuery,
	wheelScrollsStrip,
	ZOOM,
	zoomFromWheel,
	zoomStep,
} from '../src/lib/timeline';

// A synthetic export, never the project's own: the tests must not change when the plan does.
const FIXTURE = fileURLToPath(new URL('./fixtures/planning.json', import.meta.url));
const ALL_VIEWS = { now: true, milestones: true, graph: true, features: true, inbox: true, briefs: true, strategy: true };

describe('parseMilestoneStatus', () => {
	it('reads a plain state', () => {
		expect(parseMilestoneStatus('active')).toEqual({ state: 'active', label: 'active', doneOn: null });
		expect(parseMilestoneStatus('planned')).toEqual({ state: 'planned', label: 'planned', doneOn: null });
		expect(parseMilestoneStatus('done')).toEqual({ state: 'done', label: 'done', doneOn: null });
	});

	it('reads the done date', () => {
		expect(parseMilestoneStatus('done (2026-11-03)')).toEqual({ state: 'done', label: 'done', doneOn: '2026-11-03' });
	});

	it('trims and ignores case', () => {
		expect(parseMilestoneStatus(' Active ').state).toBe('active');
	});

	it('keeps an unrecognised status as other, with its own text', () => {
		expect(parseMilestoneStatus('paused')).toEqual({ state: 'other', label: 'paused', doneOn: null });
	});

	it('labels a missing status', () => {
		expect(parseMilestoneStatus(null)).toEqual({ state: 'other', label: 'No status', doneOn: null });
	});
});

describe('normaliseTarget', () => {
	it('treats null, empty, and none (any case) as no target', () => {
		expect(normaliseTarget(null)).toBeNull();
		expect(normaliseTarget('')).toBeNull();
		expect(normaliseTarget('none')).toBeNull();
		expect(normaliseTarget('None')).toBeNull();
	});

	it('keeps any other text as written', () => {
		expect(normaliseTarget('2026-12-15')).toBe('2026-12-15');
		expect(normaliseTarget('Q1 2027')).toBe('Q1 2027');
	});
});

describe('timelineMilestones', () => {
	const planning = loadPlanning(FIXTURE);
	const known = targets(planning, ALL_VIEWS);
	const milestones = timelineMilestones(planning, known);

	it('orders by strategy.milestones and adds none last', () => {
		expect(milestones.map((milestone) => milestone.key)).toEqual(['M1', 'M2', 'none']);
	});

	it('gives M2 its focus, status, target, and progress', () => {
		const m2 = milestones.find((milestone) => milestone.key === 'M2')!;

		expect(m2.isFocus).toBe(true);
		expect(m2.status).toEqual({ state: 'active', label: 'active', doneOn: null });
		expect(m2.target).toBe('2026-12-15');
		expect(m2.progress).toEqual({ done: 1, total: 4, percent: 25 });
	});

	it('gives M1 its done status, no target, and progress', () => {
		const m1 = milestones.find((milestone) => milestone.key === 'M1')!;

		expect(m1.status.state).toBe('done');
		expect(m1.status.doneOn).toBe('2026-11-03');
		expect(m1.target).toBeNull();
		expect(m1.progress).toEqual({ done: 1, total: 3, percent: 33 });
		expect(m1.href).toBe('/plan/milestones/m1/');
	});

	it('names the no-milestone card and counts its progress', () => {
		const none = milestones.find((milestone) => milestone.key === 'none')!;

		expect(none.name).toBe('No milestone');
		expect(none.progress).toEqual({ done: 2, total: 5, percent: 40 });
		expect(none.href).toBe(known.get('none')?.href ?? null);
	});

	it('has no href when the milestone has no page', () => {
		const off = timelineMilestones(planning, targets(planning, { ...ALL_VIEWS, milestones: false }));

		expect(off.every((milestone) => milestone.href === null)).toBe(true);
	});

	it('hides No milestone when its only items are dropped', () => {
		const minimal = {
			strategy: { focus: { milestone: null }, milestones: [{ id: 'M9', name: 'Empty milestone', serves: [], exitCriteria: null, target: null, status: null }] },
			now: { item: null, milestone: null, stage: null },
			board: { columns: { now: [] } },
			roadmap: { next: [], later: [] },
			log: { done: [], dropped: [{ id: 'R-099', title: 'Dropped idea', reason: 'Not needed.' }] },
		} as unknown as Planning;
		const minimalKnown = new Map<string, { href: string | null }>();

		const result = timelineMilestones(minimal, minimalKnown);

		expect(result.map((milestone) => milestone.key)).toEqual(['M9']);
		expect(result[0]!.progress).toEqual({ done: 0, total: 0, percent: 0 });
	});
});

describe('parseTimelineQuery', () => {
	it('is horizontal by default, and for any value other than exactly vertical', () => {
		expect(parseTimelineQuery('')).toBe('horizontal');
		expect(parseTimelineQuery('?layout=horizontal')).toBe('horizontal');
		expect(parseTimelineQuery('?layout=VERTICAL&x=1')).toBe('horizontal');
	});

	it('is vertical only for the exact value, in any position', () => {
		expect(parseTimelineQuery('?layout=vertical')).toBe('vertical');
		expect(parseTimelineQuery('?x=1&layout=vertical')).toBe('vertical');
	});
});

describe('timelineQuery', () => {
	it('appends layout=vertical last, keeping other params', () => {
		expect(timelineQuery('vertical', '?x=1')).toBe('?x=1&layout=vertical');
	});

	it('drops layout, keeping other params, when horizontal', () => {
		expect(timelineQuery('horizontal', '?x=1&layout=vertical')).toBe('?x=1');
	});

	it('returns the empty string when no parameters remain', () => {
		expect(timelineQuery('horizontal', '?layout=vertical')).toBe('');
	});

	it('writes just the layout when there is nothing else', () => {
		expect(timelineQuery('vertical', '')).toBe('?layout=vertical');
	});
});

describe('zoomStep', () => {
	it('steps up by one increment', () => {
		expect(zoomStep(1, 1)).toBe(1.25);
	});

	it('holds at the max', () => {
		expect(zoomStep(2, 1)).toBe(2);
	});

	it('holds at the min', () => {
		expect(zoomStep(0.5, -1)).toBe(0.5);
	});

	it('snaps an off-grid value to the step before moving', () => {
		expect(zoomStep(1.1, 1)).toBe(1.25);
	});
});

describe('zoomFromWheel', () => {
	it('steps once on a mouse notch in pixels', () => {
		expect(zoomFromWheel(1, 0, -100, 0)).toEqual({ zoom: 1.25, pending: 0 });
	});

	it('steps once on a line-mode notch, regardless of magnitude', () => {
		expect(zoomFromWheel(1, 0, 3, 1)).toEqual({ zoom: 0.75, pending: 0 });
	});

	it('accumulates a pinch below the threshold without stepping', () => {
		expect(zoomFromWheel(1, 0, -20, 0)).toEqual({ zoom: 1, pending: -20 });
	});

	it('steps once and keeps the remainder once pending crosses the threshold', () => {
		expect(zoomFromWheel(1, -40, -20, 0)).toEqual({ zoom: 1.25, pending: -10 });
	});

	it('holds at the limit but still consumes pending', () => {
		expect(zoomFromWheel(2, -40, -20, 0)).toEqual({ zoom: 2, pending: -10 });
	});

	it('returns the input unchanged when deltaY is 0', () => {
		expect(zoomFromWheel(1, 5, 0, 0)).toEqual({ zoom: 1, pending: 5 });
	});
});

describe('wheelScrollsStrip', () => {
	const strip = { scrollLeft: 0, scrollWidth: 1000, clientWidth: 500 };

	it('scrolls the strip forward when there is room ahead', () => {
		expect(wheelScrollsStrip({ deltaX: 0, deltaY: 100 }, { ...strip, scrollLeft: 0 })).toBe(true);
	});

	it('does not scroll the strip forward at its end', () => {
		expect(wheelScrollsStrip({ deltaX: 0, deltaY: 100 }, { ...strip, scrollLeft: 500 })).toBe(false);
	});

	it('does not scroll the strip backward at its start', () => {
		expect(wheelScrollsStrip({ deltaX: 0, deltaY: -100 }, { ...strip, scrollLeft: 0 })).toBe(false);
	});

	it('never scrolls the strip without overflow', () => {
		expect(wheelScrollsStrip({ deltaX: 0, deltaY: 100 }, { scrollLeft: 0, scrollWidth: 500, clientWidth: 500 })).toBe(false);
	});

	it('leaves a mostly sideways gesture to native scrolling', () => {
		expect(wheelScrollsStrip({ deltaX: 100, deltaY: 10 }, strip)).toBe(false);
	});
});

describe('ZOOM and PINCH_STEP', () => {
	it('fixes the documented constants', () => {
		expect(ZOOM).toEqual({ min: 0.5, max: 2, step: 0.25, default: 1 });
		expect(PINCH_STEP).toBe(50);
	});
});
