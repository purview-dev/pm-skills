// The browser tests' web server (playwright.config.ts `webServer`): builds a
// scratch copy of the fixture site with the CLI under Node, as a consumer
// would, then serves its dist/ on PORT. No dependency beyond Node.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PORT = Number(process.env.PORT ?? 4399);
const PACKAGE = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURES = join(PACKAGE, 'test', 'fixtures');
const DIR = join(PACKAGE, 'test', '.tmp', 'browser');
const SITE = join(DIR, 'site');
const DIST = join(SITE, 'dist');

rmSync(DIR, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
cpSync(join(FIXTURES, 'planning.json'), join(DIR, 'planning.json'));
cpSync(join(FIXTURES, 'docs'), join(DIR, 'docs'), { recursive: true });
cpSync(join(FIXTURES, 'site', 'package.json'), join(SITE, 'package.json'));
writeFileSync(
	join(SITE, 'astro.config.mjs'),
	readFileSync(join(FIXTURES, 'site', 'astro.config.mjs'), 'utf8').replace("'../../../index.mjs'", `'${pathToFileURL(join(PACKAGE, 'index.mjs')).href}'`),
);

const build = spawnSync(process.execPath, [join(PACKAGE, 'cli.mjs'), 'build', SITE], { stdio: 'inherit' });

if (build.status !== 0) process.exit(build.status ?? 1);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.wasm': 'application/wasm' };

createServer((request, response) => {
	const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname)).replace(/^([/\\])+/, '');
	let file = join(DIST, path);

	if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
	if (!file.startsWith(DIST) || !existsSync(file)) {
		response.writeHead(404, { 'content-type': 'text/html' }).end(readFileSync(join(DIST, '404.html')));
		return;
	}

	response.writeHead(200, { 'content-type': TYPES[/** @type {keyof typeof TYPES} */ (extname(file))] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(PORT, () => console.log(`serving ${DIST} on http://localhost:${PORT}`));
