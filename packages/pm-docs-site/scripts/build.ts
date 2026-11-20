// Builds the files Node loads from an installed package: empties dist/, so a
// renamed or deleted lib/ module never ships stale, then emits lib/ into dist/
// as JavaScript and declarations with tsc (tsconfig.build.json), and points the
// relative imports of every declaration under `dist/` at `.js`. Run by
// `bun run build` and `prepack`. Plain Node, so npm can run it without Bun.

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

rmSync(join(root, 'dist'), { recursive: true, force: true });

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });

if (result.status !== 0) process.exit(result.status ?? 1);

// tsc rewrites `./x.ts` to `./x.js` in the JavaScript it emits, but keeps the
// `.ts` specifier in declarations, where it names a file the tarball does not
// carry. Rewrite those to `.js`, which TypeScript resolves to the `.d.ts` beside it,
// in every declaration under dist/, at any depth.
const declarations = (readdirSync(join(root, 'dist'), { recursive: true }) as string[]).filter((name) => name.endsWith('.d.ts'));
for (const file of declarations) {
	const path = join(root, 'dist', file);
	const source = readFileSync(path, 'utf8');
	const rewritten = source.replace(/(from\s+|import\()(['"])(\.\.?\/[^'"]+)\.ts\2/g, '$1$2$3.js$2');

	if (rewritten !== source) writeFileSync(path, rewritten);
}
