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

	expect(helpers.map((helper) => helper.file)).toEqual(expect.arrayContaining(['board.browser.ts', 'graph.browser.ts', 'timeline.browser.ts']));
	for (const helper of helpers) expect(helper.body, helper.file).toContain('{ timeout: HYDRATED }');
});

// A wait for an island's hydration marker, or for Astro to drop `ssr`, anywhere in a spec.
const HYDRATION_WAIT = /\.plan-board__filters'\)\)\.toBeVisible\(|\.plan-graph__toolbar'\)\)\.toBeVisible\(|\.plan-timeline__toolbar'\)\)\.toBeVisible\(|not\.toHaveAttribute\('ssr'/;

it('every hydration wait in a browser spec passes a timeout, not the 5000ms default', () => {
	const defaults = readdirSync(BROWSER)
		.filter((file) => file.endsWith('.browser.ts'))
		.flatMap((file) =>
			readFileSync(join(BROWSER, file), 'utf8')
				.split('\n')
				.map((line, index) => ({ at: `${file}:${index + 1}`, line }))
				.filter(({ line }) => HYDRATION_WAIT.test(line) && !line.includes('timeout:')),
		)
		.map(({ at }) => at);

	expect(defaults).toEqual([]);
});
