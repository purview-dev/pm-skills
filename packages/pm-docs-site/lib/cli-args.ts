// pm-docs-site's argument parsing, split from lib/cli.ts: that module calls
// main() as a side effect when it is the process entry point, so a test that
// needs `parse` imports it from here instead, never from lib/cli.ts.
//
// (An import.meta.main guard in lib/cli.ts was tried instead, but Bun's
// Windows bin launcher reports it false for a site path with a space or an
// 8.3 short name, which silently skipped main() for a real consumer build.
// This module has no such entry-point detection to get wrong.)

import { resolve } from 'node:path';

export interface Flags {
	title?: string;
	planning?: string;
}

export interface Server {
	port?: number;
	host?: string;
}

/** Throws the fixed pm-docs-site message for anything other than a port number. */
function parsePort(value: string): number {
	const port = Number(value);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('pm-docs-site: --port needs a port number (1-65535)');
	}

	return port;
}

/** The options the CLI takes; any other `--` argument is an error, never a site folder. */
const FLAGS: readonly string[] = ['--title', '--planning', '--port', '--host'];

/**
 * `--title`/`--planning`/`--port`/`--host` may appear before or after the
 * site-dir positional, in any order, as `--name value` or `--name=value`. An
 * unknown `--` option throws, naming it. For `dev` only, `--port` and `--host`
 * fall back to the `PORT` and `HOST` environment variables (an Aspire
 * `AddViteApp` resource sets `PORT`), with a flag always winning over the
 * environment; `build` and `check` never read them, since they run once and
 * have no server to bind. A `dev` environment `PORT` that is not a port
 * number is ignored with a warning on stderr, instead of throwing: an
 * Aspire-set `PORT` is outside this CLI's control, so a bad value there
 * should not fail the dev server.
 */
export function parse(argv: string[], env: NodeJS.ProcessEnv): { command: string | undefined; siteDir: string; flags: Flags; server: Server } {
	const flags: Flags = {};
	const positional: string[] = [];
	let port: number | undefined;
	let host: string | undefined;

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index] as string;

		if (!arg.startsWith('--')) {
			positional.push(arg);
			continue;
		}

		// `--name=value` or `--name value`; an empty `--name=` has no value.
		const equals = arg.indexOf('=');
		const name = equals === -1 ? arg : arg.slice(0, equals);

		if (!FLAGS.includes(name)) throw new Error(`pm-docs-site: unknown option ${arg}`);

		const value = equals === -1 ? argv[++index] : arg.slice(equals + 1);

		if (value === undefined || value === '') throw new Error(`pm-docs-site: ${name} needs a value`);

		if (name === '--title' || name === '--planning') flags[name === '--title' ? 'title' : 'planning'] = value;
		else if (name === '--port') port = parsePort(value);
		else host = value;
	}

	const command = positional[0];

	if (command === 'dev') {
		if (port === undefined && env.PORT !== undefined) {
			try {
				port = parsePort(env.PORT);
			} catch {
				console.error(`pm-docs-site: ignoring PORT=${env.PORT} (needs a port number, 1-65535)`);
			}
		}
		if (host === undefined && env.HOST !== undefined) host = env.HOST;
	}

	const server: Server = {};
	if (port !== undefined) server.port = port;
	if (host !== undefined) server.host = host;

	return { command, siteDir: resolve(positional[1] ?? process.cwd()), flags, server };
}
