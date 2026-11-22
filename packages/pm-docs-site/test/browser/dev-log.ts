// Classifies the dev server's output for the dev browser tests' log
// (dev-server.ts): the lines that show the server restarted, re-optimised its
// dependencies, or lost a request to a restart, so a failed run leaves its
// cause in dev.log.

import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The dev browser tests' scratch folder, removed at the start of every run. The
 * long path: Windows' temp folder can be an 8.3 short name, which Vite's serving
 * allow list (a real path) does not match.
 */
export const DIR = join(realpathSync.native(tmpdir()), 'pm-docs-site-dev-browser');
/** The last run's dev server output, with a `[dev-server]` line per event. */
export const DEV_LOG = join(DIR, 'dev.log');

export type DevEvent = 'restart' | 'reoptimise' | 'listen-twice' | 'transport-lost';

const PATTERNS: [RegExp, DevEvent][] = [
	// Astro: "<reason> Restarting..." (core/dev/restart.js).
	[/restarting/i, 'restart'],
	// Vite's dependency optimizer.
	[/new dependencies optimized|optimized dependencies changed/i, 'reoptimise'],
	// Node: a restart that listens again on the same server.
	[/listen method has been called more than once|ERR_SERVER_ALREADY_LISTEN/i, 'listen-twice'],
	// Vite's module runner: a server render cut off by a restart.
	[/transport was disconnected|transport invoke timed out/i, 'transport-lost'],
];

/** The event a dev server output line marks, or null for any other line. */
export function classifyDevLine(line: string): DevEvent | null {
	return PATTERNS.find(([pattern]) => pattern.test(line))?.[1] ?? null;
}

/** The events that mean the server itself restarted (R-029), as opposed to one it recovers from. */
const RESTARTS: DevEvent[] = ['restart', 'listen-twice'];

/**
 * What went wrong while the dev server started, from dev.log: the update check
 * that triggers R-029's restart, and any restart. A re-optimisation or a lost
 * transport stays in the log as evidence only, since the server recovers.
 */
export function startupProblems(log: string): string[] {
	const problems: string[] = [];

	if (!log.includes('ready in')) problems.push('no "ready in" line');
	if (log.includes('New version of Astro available')) problems.push('Astro update check ran');

	for (const event of RESTARTS) {
		if (new RegExp(`^\\[dev-server\\] \\S+ ${event}$`, 'm').test(log)) problems.push(`dev server ${event}`);
	}

	return problems;
}
