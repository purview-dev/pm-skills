// The dev browser tests' log classifier (test/browser/dev-log.ts): which dev
// server output lines mark a restart, a dependency re-optimisation, or the
// errors a restart mid-request leaves behind.
import { describe, expect, it } from 'bun:test';

import { classifyDevLine, startupProblems } from './browser/dev-log.ts';

describe('classifyDevLine', () => {
	it('marks an Astro restart', () => {
		expect(classifyDevLine('12:00:01 [config] Configuration file updated. Restarting...')).toBe('restart');
	});

	it('marks a Vite re-optimisation', () => {
		expect(classifyDevLine('12:00:01 [vite] ✨ new dependencies optimized: @xyflow/react')).toBe('reoptimise');
		expect(classifyDevLine('12:00:01 [vite] ✨ optimized dependencies changed. reloading')).toBe('reoptimise');
	});

	it('marks a second listen on the same server', () => {
		expect(classifyDevLine('Error [ERR_SERVER_ALREADY_LISTEN]: Listen method has been called more than once without closing.')).toBe('listen-twice');
	});

	it('marks a lost module runner transport', () => {
		expect(classifyDevLine('Error: transport was disconnected, cannot call "fetchModule"')).toBe('transport-lost');
		expect(classifyDevLine('Error: transport invoke timed out after 60000ms')).toBe('transport-lost');
	});

	it('ignores a request line', () => {
		expect(classifyDevLine('12:00:01 [200] /plan/board/ 41ms')).toBeNull();
	});
});

describe('startupProblems', () => {
	const ready = ' astro  v7.4.8 ready in 985 ms\n';

	it('finds none in a clean start', () => {
		expect(startupProblems(ready)).toEqual([]);
	});

	it('finds none for a re-optimisation or a lost transport the server recovered from', () => {
		const log = `${ready}[dev-server] 2026-11-22T09:00:00.000Z reoptimise\n[dev-server] 2026-11-22T09:00:01.000Z transport-lost\n`;

		expect(startupProblems(log)).toEqual([]);
	});

	it('names the update check', () => {
		expect(startupProblems(`${ready} update  ▶ New version of Astro available: 7.4.13\n`)).toEqual(['Astro update check ran']);
	});

	it('names a restart and a second listen', () => {
		const log = `${ready}[dev-server] 2026-11-22T09:00:00.000Z restart\n[dev-server] 2026-11-22T09:00:00.100Z listen-twice\n`;

		expect(startupProblems(log)).toEqual(['dev server restart', 'dev server listen-twice']);
	});

	it('names a start that never got ready', () => {
		expect(startupProblems('')).toEqual(['no "ready in" line']);
	});
});
