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

/**
 * `--title`/`--planning`/`--port`/`--host` may appear before or after the
 * site-dir positional, in any order. `--port` and `--host` fall back to the
 * `PORT` and `HOST` environment variables (an Aspire `AddViteApp` resource
 * sets `PORT`), with a flag always winning over the environment.
 */
export function parse(argv: string[], env: NodeJS.ProcessEnv): { command: string | undefined; siteDir: string; flags: Flags; server: Server } {
	const flags: Flags = {};
	const positional: string[] = [];
	let port: number | undefined;
	let host: string | undefined;

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index] as string;

		if (arg === '--title' || arg === '--planning') {
			const value = argv[++index];
			if (value === undefined) throw new Error(`pm-docs-site: ${arg} needs a value`);
			flags[arg === '--title' ? 'title' : 'planning'] = value;
		} else if (arg === '--port') {
			const value = argv[++index];
			if (value === undefined) throw new Error('pm-docs-site: --port needs a value');
			port = parsePort(value);
		} else if (arg === '--host') {
			const value = argv[++index];
			if (value === undefined) throw new Error('pm-docs-site: --host needs a value');
			host = value;
		} else {
			positional.push(arg);
		}
	}

	if (port === undefined && env.PORT !== undefined) port = parsePort(env.PORT);
	if (host === undefined && env.HOST !== undefined) host = env.HOST;

	const server: Server = {};
	if (port !== undefined) server.port = port;
	if (host !== undefined) server.host = host;

	return { command: positional[0], siteDir: resolve(positional[1] ?? process.cwd()), flags, server };
}
