// Islands ship to the browser; lib/planning (and anything importing it, such
// as lib/timeline, lib/graph, and lib/graph-layout) reads files with node
// APIs at build time (src/components/graph/Graph.tsx:5-7, the Timeline.tsx
// header). A component under src/components may therefore only `import type`
// from those modules, never a value; this guard walks every .tsx and .ts file
// there and fails on a value import of one of them.
//
// tsconfig.json extends astro/tsconfigs/strict, which turns verbatimModuleSyntax
// on, so TypeScript never elides a type-only binding on its own: every
// type-only import here already carries an explicit `type` keyword, either on
// the whole import (`import type { X } from`) or on every named specifier
// (`import { type X } from`). Both forms are fully erased at build time (a
// brace import whose every specifier is `type` has nothing left to emit), so
// the checker below treats both as type-only. A mix (`import { type X, Y }
// from`) keeps `Y` as a real binding and still counts as a value import.
//
// The same rule applies to a re-export (`export { X } from`, `export * from`,
// or `export type { X } from`); a side-effect import (`import '<specifier>';`)
// and a dynamic import (`import('<specifier>')`) carry no type-only form at
// all, so either one of a guarded lib is always a value import.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'bun:test';

import { PACKAGE } from './helpers';

const COMPONENTS = join(PACKAGE, 'src', 'components');

/** The guarded modules' resolved tail; `lib/timeline-state` and other `lib/graph-*` files are not guarded. */
const GUARDED_LIBS = ['lib/planning', 'lib/timeline', 'lib/graph', 'lib/graph-layout'];

/** The guarded lib a specifier resolves to, matched on a path boundary, with or without a `.ts` extension. */
function guardedLib(specifier: string): string | undefined {
	return GUARDED_LIBS.find((lib) => new RegExp(`(^|/)${lib}(\\.ts)?$`).test(specifier));
}

/** Strips line and block comments, so prose that mentions `import` or `from` (the file header comments above) is never mistaken for one. */
function stripComments(source: string): string {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.split('\n')
		.map((line) => (line.trim().startsWith('//') ? '' : line))
		.join('\n');
}

/** True when every named specifier in a brace clause (for example `type X, type Y`) carries its own `type` modifier. */
function everySpecifierIsType(braces: string): boolean {
	const names = braces
		.slice(1, -1)
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);

	return names.length > 0 && names.every((name) => /^type\s+/.test(name));
}

// `import ... from` and `export ... from` share the same shape: an optional whole-clause
// `type`, the clause between the keyword and `from`, and the quoted specifier.
const IMPORT_RE = /import\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;
// A side-effect import has no clause at all: `import '<specifier>';`.
const SIDE_EFFECT_IMPORT_RE = /import\s*['"]([^'"]+)['"]/g;
// A dynamic import: `import('<specifier>')`, with or without `await`.
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Findings from a static `import`/`export ... from` clause, where a `type` keyword can make it erasable. */
function fromClauseFindings(source: string, pattern: RegExp): string[] {
	const findings: string[] = [];

	for (const match of source.matchAll(pattern)) {
		const [, wholeType, clause, specifier] = match;
		if (!guardedLib(specifier)) continue;

		const typeOnly = Boolean(wholeType) || (clause.startsWith('{') && everySpecifierIsType(clause));
		if (!typeOnly) findings.push(specifier);
	}

	return findings;
}

/** Findings from a form that has no type-only shape at all: a side-effect or dynamic import. */
function alwaysValueFindings(source: string, pattern: RegExp): string[] {
	const findings: string[] = [];

	for (const [, specifier] of source.matchAll(pattern)) if (guardedLib(specifier)) findings.push(specifier);

	return findings;
}

/** Every value-importing specifier of a guarded module found in `source`, across every import and export form. */
function valueImportsOfGuardedLibs(source: string): string[] {
	const stripped = stripComments(source);

	return [
		...fromClauseFindings(stripped, IMPORT_RE),
		...fromClauseFindings(stripped, EXPORT_RE),
		...alwaysValueFindings(stripped, SIDE_EFFECT_IMPORT_RE),
		...alwaysValueFindings(stripped, DYNAMIC_IMPORT_RE),
	];
}

describe('islands import only types from server-only libs', () => {
	it('every .tsx and .ts file under src/components imports the guarded libs as types only', () => {
		const files = (readdirSync(COMPONENTS, { recursive: true }) as string[]).filter((name) => name.endsWith('.tsx') || name.endsWith('.ts'));

		expect(files.length).toBeGreaterThan(0);

		for (const file of files) {
			const source = readFileSync(join(COMPONENTS, file), 'utf8');
			const findings = valueImportsOfGuardedLibs(source);

			expect(findings, `${file}: value import of ${findings.join(', ')}`).toEqual([]);
		}
	});

	it('the guard catches a value import', () => {
		expect(valueImportsOfGuardedLibs(`import { features } from '../../lib/planning';`)).toEqual(['../../lib/planning']);
		expect(valueImportsOfGuardedLibs(`import type { Feature } from '../../lib/planning';`)).toEqual([]);
		expect(valueImportsOfGuardedLibs(`export { loadPlanning } from '../../lib/planning';`)).toEqual(['../../lib/planning']);
		expect(valueImportsOfGuardedLibs(`export * from '../../lib/planning';`)).toEqual(['../../lib/planning']);
		expect(valueImportsOfGuardedLibs(`import '../../lib/planning';`)).toEqual(['../../lib/planning']);
		expect(valueImportsOfGuardedLibs(`const m = await import('../../lib/planning');`)).toEqual(['../../lib/planning']);
		expect(valueImportsOfGuardedLibs(`export type { Feature } from '../../lib/planning';`)).toEqual([]);
		expect(valueImportsOfGuardedLibs(`import('../../lib/timeline-state');`)).toEqual([]);
	});
});
