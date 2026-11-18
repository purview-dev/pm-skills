// The dev browser tests' web server (playwright.config.ts, project `dev`): the
// packed package installed from its tarball into a consumer outside the
// repository, as install.test.ts does, then `pm-docs-site dev` on PORT. In the
// repository the package's dependencies resolve from its own node_modules, so
// only a real install shows what Vite's dev optimizer does with them.
//
// The scratch folder is fixed and removed at the start of every run:
// Playwright ends this process with a tree kill on Windows, which skips any
// exit handler, so the next run cleans up after the last.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 4398);
const PACKAGE = fileURLToPath(new URL('../../', import.meta.url));
const FIXTURES = join(PACKAGE, 'test', 'fixtures');
// The long path: Windows' temp folder can be an 8.3 short name, which Vite's
// serving allow list (a real path) does not match.
const DIR = join(realpathSync.native(tmpdir()), 'pm-docs-site-dev-browser');
// The space is deliberate, as in install.test.ts: site paths must survive it.
const CONSUMER = join(DIR, 'consumer site');

function run(cmd: string[], cwd: string): void {
	const result = spawnSync(cmd[0]!, cmd.slice(1), { cwd, stdio: 'inherit' });

	if (result.status !== 0) {
		console.error(`${cmd.join(' ')} exited ${result.status}`);
		process.exit(result.status ?? 1);
	}
}

rmSync(DIR, { recursive: true, force: true, maxRetries: 5 });
mkdirSync(CONSUMER, { recursive: true });

run(['bun', 'pm', 'pack', '--destination', DIR, '--quiet'], PACKAGE);
const tarball = readdirSync(DIR).find((file) => file.endsWith('.tgz'));

if (!tarball) throw new Error(`no tarball in ${DIR}`);

writeFileSync(
	join(CONSUMER, 'package.json'),
	JSON.stringify({
		name: 'consumer',
		private: true,
		type: 'module',
		dependencies: { '@purview-dev/pm-docs-site': `file:${join(DIR, tarball).replace(/\\/g, '/')}` },
	}),
);
run(['bun', 'install'], CONSUMER);

cpSync(join(FIXTURES, 'planning.json'), join(DIR, 'planning.json'));
cpSync(join(FIXTURES, 'docs'), join(DIR, 'docs'), { recursive: true });
writeFileSync(
	join(CONSUMER, 'astro.config.ts'),
	readFileSync(join(FIXTURES, 'site', 'astro.config.ts'), 'utf8')
		.replace("'../../../lib/index.ts'", "'@purview-dev/pm-docs-site'")
		.replace('integrations: [', `server: { port: ${PORT} },\n\tintegrations: [`),
);

// Through the installed package's CLI under Node, as a consumer's `dev` script runs it.
const dev = spawn(process.platform === 'win32' ? 'node.exe' : 'node', [join(CONSUMER, 'node_modules', '@purview-dev', 'pm-docs-site', 'dist', 'cli.js'), 'dev'], {
	cwd: CONSUMER,
	stdio: 'inherit',
});

const stop = () => {
	dev.kill();
	process.exit(0);
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
dev.on('exit', (code) => process.exit(code ?? 1));
