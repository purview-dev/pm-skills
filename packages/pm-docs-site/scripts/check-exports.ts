// Refuses a publish whose package.json points at files the package does not
// carry: every `exports` target, every `bin`, and every `files` entry must
// exist. A version published without them cannot be imported, and npm never
// lets the same version be published again. Run by `prepack`, after the build, and by the
// publish workflow. Plain Node, so npm can run it without Bun.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const targets: string[] = [];
const entryPoints: string[] = [];
const walk = (value: unknown, into: string[]): void => {
	if (typeof value === 'string') into.push(value);
	else if (value && typeof value === 'object') for (const child of Object.values(value)) walk(child, into);
};
walk(pkg.exports ?? {}, entryPoints);
walk(pkg.bin ?? {}, entryPoints);
targets.push(...entryPoints);
for (const entry of (pkg.files ?? []) as string[]) if (!entry.startsWith('!')) targets.push(entry);

const missing = [...new Set(targets)].filter((target) => !existsSync(join(root, target)));

// Node refuses to strip types under node_modules, so every entry point is built JavaScript.
const notJavaScript = [...new Set(entryPoints)].filter((target) => !target.endsWith('.js') && !target.endsWith('.d.ts'));

if (notJavaScript.length > 0) {
	console.error(`refusing to publish ${pkg.name}@${pkg.version}: exports or bin point at non-JavaScript files`);
	for (const target of notJavaScript) console.error(`  - ${target}`);
	process.exit(1);
}

if (missing.length > 0) {
	console.error(`refusing to publish ${pkg.name}@${pkg.version}: package.json points at missing files`);
	for (const target of missing) console.error(`  - ${target}`);
	process.exit(1);
}

console.log(`${pkg.name}@${pkg.version}: every export, bin, and files entry exists`);
