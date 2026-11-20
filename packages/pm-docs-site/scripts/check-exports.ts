// Refuses a publish whose package.json points at files the package does not
// carry, or at the wrong kind of file: every `exports` target, every `bin`, and
// every `files` entry must exist; a `types` condition must name a declaration,
// and every other `exports` target and every `bin` must be built JavaScript. A
// version published without them cannot be imported, and npm never lets the
// same version be published again. Run by `prepack`, after the build, and by
// the publish workflow, on this package or on the root given as the first
// argument. Plain Node, so npm can run it without Bun.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const DECLARATION = /\.d\.[mc]?ts$/;
const JAVASCRIPT = /\.[mc]?js$/;

const targets: string[] = [];
const wrongKind: string[] = [];
const entry = (target: string, isTypes: boolean): void => {
	targets.push(target);
	const ok = isTypes ? DECLARATION.test(target) : JAVASCRIPT.test(target);

	if (!ok) wrongKind.push(target);
};
const walk = (value: unknown, isTypes: boolean): void => {
	if (typeof value === 'string') entry(value, isTypes);
	else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) walk(child, key === 'types');
};
walk(pkg.exports ?? {}, false);
// Node refuses to strip types under node_modules, so every bin is built JavaScript.
if (typeof pkg.bin === 'string') entry(pkg.bin, false);
else for (const target of Object.values(pkg.bin ?? {}) as string[]) entry(target, false);
for (const file of (pkg.files ?? []) as string[]) if (!file.startsWith('!')) targets.push(file);

const missing = [...new Set(targets)].filter((target) => !existsSync(join(root, target)));

if (wrongKind.length > 0) {
	console.error(`refusing to publish ${pkg.name}@${pkg.version}: exports or bin point at the wrong kind of file`);
	for (const target of new Set(wrongKind)) console.error(`  - ${target}`);
	process.exit(1);
}

if (missing.length > 0) {
	console.error(`refusing to publish ${pkg.name}@${pkg.version}: package.json points at missing files`);
	for (const target of missing) console.error(`  - ${target}`);
	process.exit(1);
}

console.log(`${pkg.name}@${pkg.version}: every export, bin, and files entry exists`);
