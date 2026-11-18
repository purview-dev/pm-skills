// Refuses a publish whose package.json points at files the package does not
// carry: every `exports` target, every `bin`, and every `files` entry must
// exist. A version published without them cannot be imported, and npm never
// lets the same version be published again. Run by `prepublishOnly` and by the
// publish workflow. Plain Node, so npm can run it without Bun.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** @type {string[]} */
const targets = [];
/** @param {unknown} value */
const walk = (value) => {
	if (typeof value === 'string') targets.push(value);
	else if (value && typeof value === 'object') Object.values(value).forEach(walk);
};
walk(pkg.exports ?? {});
walk(pkg.bin ?? {});
for (const entry of pkg.files ?? []) if (!entry.startsWith('!')) targets.push(entry);

const missing = [...new Set(targets)].filter((target) => !existsSync(join(root, target)));

if (missing.length > 0) {
	console.error(`refusing to publish ${pkg.name}@${pkg.version}: package.json points at missing files`);
	for (const target of missing) console.error(`  - ${target}`);
	process.exit(1);
}

console.log(`${pkg.name}@${pkg.version}: every export, bin, and files entry exists`);
