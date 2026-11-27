import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PACKAGE = fileURLToPath(new URL('..', import.meta.url));
export const FIXTURES = join(PACKAGE, 'test', 'fixtures');
export const CLI = join(PACKAGE, 'lib', 'cli.ts');

/** Run the CLI under Node, as a consumer would. */
export function runCli(
	args: string[],
	cwd: string = PACKAGE,
	options: { timeout?: number } = {},
): { code: number; stdout: string; stderr: string; timedOut: boolean } {
	const timeout = options.timeout ?? childTimeout(args);
	const result = Bun.spawnSync(['node', CLI, ...args], { cwd, stdout: 'pipe', stderr: 'pipe', timeout, killSignal: 'SIGKILL' });
	const timedOut = result.exitedDueToTimeout === true;
	const stderr = result.stderr.toString();

	return {
		code: result.exitCode ?? -1,
		stdout: result.stdout.toString(),
		stderr: timedOut ? `runCli: timed out after ${timeout}ms: node lib/cli.ts ${args.join(' ')}\n${stderr}` : stderr,
		timedOut,
	};
}

/** The bun test timeout of a test that builds a site. */
export const BUILD = 180_000;
// A check runs the CLI in a Node subprocess and builds nothing, but the start-up
// can pass bun's 5000ms default under load on Windows.
export const CHECK = 60_000;

/**
 * runCli's child time limit: 10s under the test timeout its command runs in, so
 * a hung child is killed and reports its output before bun kills the test (R-056).
 */
export function childTimeout(args: string[]): number {
	return (args[0] === 'build' ? BUILD : CHECK) - 10_000;
}

/** Every `.html` file under a build folder, `/`-separated and sorted. */
export function htmlPages(distDir: string): string[] {
	return (readdirSync(distDir, { recursive: true }) as string[])
		.filter((file) => file.endsWith('.html'))
		.map((file) => relative(distDir, join(distDir, file)).split(sep).join('/'))
		.sort();
}

/** The parity snapshot: the pages the template site renders from the fixture. */
export function expectedPages(): string[] {
	return readFileSync(join(FIXTURES, 'expected-pages.txt'), 'utf8').split('\n').filter(Boolean).sort();
}

/**
 * Scratch sites live in test/.tmp/ (gitignored), not the OS temp folder: on
 * Windows, Astro cannot build a site whose root is on another drive than the
 * package's src/. An installed package is always on the consumer's drive.
 */
export const SCRATCH = join(PACKAGE, 'test', '.tmp');

/**
 * A scratch copy of the fixture layout (site/, planning.json, docs/), so a test
 * can change one file without touching the fixtures.
 */
export function scratchFixture(prefix: string): string {
	mkdirSync(SCRATCH, { recursive: true });
	const dir = mkdtempSync(join(SCRATCH, prefix));

	cpSync(join(FIXTURES, 'planning.json'), join(dir, 'planning.json'));
	cpSync(join(FIXTURES, 'docs'), join(dir, 'docs'), { recursive: true });
	mkdirSync(join(dir, 'site'));
	cpSync(join(FIXTURES, 'site', 'package.json'), join(dir, 'site', 'package.json'));

	return dir;
}

/** An astro.config.ts for a scratch site, importing the package source by file URL. */
export function siteConfig(options: string): string {
	const index = pathToFileURL(join(PACKAGE, 'lib', 'index.ts')).href;

	return `import pmDocsSite from '${index}';\nexport default { integrations: [pmDocsSite(${options})] };\n`;
}

/** `source` with its `//` and block comments blanked; quotes, template literals, and everything else are kept. */
function stripComments(source: string): string {
	let out = '';
	let quote: string | null = null;

	for (let index = 0; index < source.length; index++) {
		const char = source[index]!;

		if (quote !== null) {
			out += char;
			if (char === '\\') out += source[++index] ?? '';
			else if (char === quote) quote = null;
		} else if (char === '/' && source[index + 1] === '/') {
			while (index < source.length && source[index] !== '\n') index++;
			out += '\n';
		} else if (char === '/' && source[index + 1] === '*') {
			const end = source.indexOf('*/', index + 2);

			index = end === -1 ? source.length : end + 1;
			out += ' ';
		} else {
			if (char === "'" || char === '"' || char === '`') quote = char;
			out += char;
		}
	}

	return out;
}

/**
 * The `./` and `../` specifiers a file imports, re-exports, imports for side
 * effects, or imports dynamically (a quoted or plain template-literal
 * specifier). Comments are ignored, and so is a member call such as
 * `foo.import('./x')` or `Array.from('./x')`. It reads type imports too, so it
 * also checks `.d.ts` and `.astro` files.
 */
export function relativeImports(file: string): string[] {
	const source = stripComments(readFileSync(file, 'utf8'));

	return [...source.matchAll(/(?<![.\w$])(?:from|import\s*\(|import)\s*(['"`])(\.\.?\/[^'"`$]+?)\1/g)].map((match) => match[2]!);
}

/** Whether `base` plus one of `suffixes` is a file (a directory never resolves an import). */
export function resolvesToFile(base: string, suffixes: string[]): boolean {
	return suffixes.some((suffix) => existsSync(base + suffix) && statSync(base + suffix).isFile());
}

/** A TCP port that was free a moment ago: listen on port 0, read the port the system chose, and close. */
export function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = createServer();

		server.once('error', reject);
		server.listen(0, () => {
			const address = server.address();
			const port = typeof address === 'object' && address !== null ? address.port : 0;

			server.close(() => (port > 0 ? resolve(port) : reject(new Error('no free port'))));
		});
	});
}
