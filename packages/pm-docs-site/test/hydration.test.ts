import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, it } from 'bun:test';

import { PACKAGE } from './helpers';

const BROWSER = join(PACKAGE, 'test', 'browser');

it('every hydrated() helper in a browser spec waits HYDRATED, not the default', () => {
	const specs = readdirSync(BROWSER).filter((file) => file.endsWith('.browser.ts'));
	const helpers = specs.flatMap((file) => {
		const source = readFileSync(join(BROWSER, file), 'utf8');
		const body = source.match(/async function hydrated\([^)]*\)[^{]*\{([\s\S]*?)\n\}/)?.[1];
		return body === undefined ? [] : [{ file, body }];
	});

	expect(helpers.map((helper) => helper.file).sort()).toEqual(['board.browser.ts', 'graph.browser.ts', 'timeline.browser.ts']);
	for (const helper of helpers) expect(helper.body, helper.file).toContain('{ timeout: HYDRATED }');
});
