import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { viewGroups, viewsIn } from './architecture';

describe('viewsIn', () => {
	it('finds element, dynamic and deployment views with their titles', () => {
		const source = [
			'views {',
			'  view c1-context {',
			'    title "C1 - System context"',
			'  }',
			"  dynamic view flow-sign-in {\n    title 'Sign-in'\n  }",
			'  deployment view production {',
			'  }',
			'  view c2-containers of shop.api {',
			'  }',
			'}',
		].join('\n');

		expect(viewsIn(source)).toEqual([
			{ id: 'c1-context', title: 'C1 - System context' },
			{ id: 'flow-sign-in', title: 'Sign-in' },
			{ id: 'production', title: 'production' },
			{ id: 'c2-containers', title: 'c2-containers' },
		]);
	});
});

describe('viewGroups', () => {
	it('makes one group per views/ folder, Overview first with the top-level views', async () => {
		const views = await mkdtemp(join(tmpdir(), 'views-'));
		await mkdir(join(views, 'billing'));
		await mkdir(join(views, 'access-control'));
		await writeFile(join(views, 'landscape.c4'), 'views {\n  view c1-context {\n  }\n}\n');
		await writeFile(join(views, 'billing', 'flows.c4'), 'views {\n  dynamic view flow-invoice {\n  }\n}\n');
		await writeFile(join(views, 'access-control', 'flows.c4'), 'views {\n  view sign-in {\n  }\n}\n');

		const groups = viewGroups(views);

		expect(groups.map((group) => [group.slug, group.title, group.views.map((view) => view.id)])).toEqual([
			['overview', 'Overview', ['c1-context']],
			['access-control', 'Access control', ['sign-in']],
			['billing', 'Billing', ['flow-invoice']],
		]);
	});
});
