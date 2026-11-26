import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'bun:test';

import { CHECK, childTimeout, FIXTURES, PACKAGE, runCli } from './helpers';

const FIXTURE_SITE = join(FIXTURES, 'site');

afterAll(() => {
	rmSync(join(FIXTURE_SITE, 'dist'), { recursive: true, force: true });
	rmSync(join(FIXTURE_SITE, '.astro'), { recursive: true, force: true });
});

describe('runCli', () => {
	it('childTimeout gives a build 10s under BUILD and anything else 10s under CHECK', () => {
		expect(childTimeout(['build', 'site'])).toBe(170_000);
		expect(childTimeout(['check', 'site'])).toBe(50_000);
		expect(childTimeout([])).toBe(50_000);
	});

	it(
		'kills a child that passes its timeout and says so on stderr',
		() => {
			const result = runCli(['build', FIXTURE_SITE], PACKAGE, { timeout: 50 });

			expect(result.timedOut).toBe(true);
			expect(result.code).not.toBe(0);
			expect(result.stderr.startsWith(`runCli: timed out after 50ms: node lib/cli.ts build ${FIXTURE_SITE}\n`)).toBe(true);
		},
		CHECK,
	);

	it(
		'a child that finishes in time is not marked and keeps its stderr',
		() => {
			const result = runCli(['nope'], PACKAGE);

			expect(result.timedOut).toBe(false);
			expect(result.code).toBe(2);
			expect(result.stderr).toContain('usage: pm-docs-site <dev | build | check>');
			expect(result.stderr).not.toContain('runCli: timed out');
		},
		CHECK,
	);
});
