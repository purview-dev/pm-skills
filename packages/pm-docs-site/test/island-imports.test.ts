// Islands ship to the browser; lib/planning (and anything importing it, such
// as lib/timeline, lib/graph, and lib/graph-layout) reads files with node
// APIs at build time (src/components/graph/Graph.tsx:5-7, the Timeline.tsx
// header). A component under src/components may therefore only `import type`
// from those modules, never a value; this guard walks every .tsx and .ts file
// there and fails on a value import of one of them. The same holds for every
// bundled `<script>` in an .astro file under src/ and every .ts file under
// src/scripts/, which ship to the browser too.
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
const LIB_DIR = join(PACKAGE, 'src', 'lib');
const SRC = join(PACKAGE, 'src');
const SCRIPTS = join(PACKAGE, 'src', 'scripts');

/**
 * The bodies of an .astro file's bundled `<script>` elements, which ship to
 * the browser like an island. An `is:inline` script (or one with
 * `define:vars`, which implies it) is not bundled and cannot import, so it is
 * skipped; the frontmatter runs at build time and is never scanned.
 */
function bundledScripts(astroSource: string): string[] {
	return [...astroSource.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(([, attributes]) => !/\bis:inline\b|\bdefine:vars\b/.test(attributes!)).map(([, , body]) => body!.trim());
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
// `type`, the clause between the keyword and `from`, and the quoted specifier. The clause
// cannot cross a `;`, so a lazy match never runs past its own statement into a later one.
const IMPORT_RE = /import\s+(type\s+)?([^;]*?)\s*from\s*['"]([^'"]+)['"]/g;
const EXPORT_RE = /export\s+(type\s+)?([^;]*?)\s*from\s*['"]([^'"]+)['"]/g;
// A side-effect import has no clause at all: `import '<specifier>';`.
const SIDE_EFFECT_IMPORT_RE = /import\s*['"]([^'"]+)['"]/g;
// A dynamic import: `import('<specifier>')`, with or without `await`.
const DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/** Every specifier imported or re-exported as a value (never type-only) in `source`, across every import and export form. */
function valueImportSpecifiers(source: string): string[] {
	const stripped = stripComments(source);
	const findings: string[] = [];

	for (const pattern of [IMPORT_RE, EXPORT_RE]) {
		for (const match of stripped.matchAll(pattern)) {
			const [, wholeType, clause, specifier] = match;
			const typeOnly = Boolean(wholeType) || (clause.startsWith('{') && everySpecifierIsType(clause));
			if (!typeOnly) findings.push(specifier);
		}
	}

	for (const pattern of [SIDE_EFFECT_IMPORT_RE, DYNAMIC_IMPORT_RE]) {
		for (const [, specifier] of stripped.matchAll(pattern)) findings.push(specifier);
	}

	return findings;
}

/** A within-`src/lib` relative specifier's module name (`./board-data` -> `board-data`); anything else (a package, or a path outside `src/lib`) is not one. */
function libModuleName(specifier: string): string | undefined {
	return /^\.\/[\w-]+$/.test(specifier) ? specifier.slice(2) : undefined;
}

/** `lib/planning`, plus every `src/lib` module that value-imports it, directly or through another guarded module (`lib/timeline-state` and `lib/graph-state` import only types, so they stay unguarded). Derived so a new lib module is covered without editing this list by hand. */
function deriveGuardedLibs(): string[] {
	const files = readdirSync(LIB_DIR).filter((name) => name.endsWith('.ts'));
	const valueImportsOf = new Map<string, Set<string>>();

	for (const file of files) {
		const name = file.replace(/\.ts$/, '');
		const source = readFileSync(join(LIB_DIR, file), 'utf8');
		const imports = valueImportSpecifiers(source)
			.map(libModuleName)
			.filter((imported): imported is string => imported !== undefined);

		valueImportsOf.set(name, new Set(imports));
	}

	const guarded = new Set(['planning']);
	for (let changed = true; changed; ) {
		changed = false;
		for (const [name, imports] of valueImportsOf) {
			if (!guarded.has(name) && [...imports].some((imported) => guarded.has(imported))) {
				guarded.add(name);
				changed = true;
			}
		}
	}

	return [...guarded].map((name) => `lib/${name}`);
}

const GUARDED_LIBS = deriveGuardedLibs();

/** The guarded lib a specifier resolves to, matched on a path boundary, with or without a `.ts` extension. */
function guardedLib(specifier: string): string | undefined {
	return GUARDED_LIBS.find((lib) => new RegExp(`(^|/)${lib}(\\.ts)?$`).test(specifier));
}

/** Every value-importing specifier of a guarded module found in `source`, across every import and export form. */
function valueImportsOfGuardedLibs(source: string): string[] {
	return valueImportSpecifiers(source).filter((specifier) => guardedLib(specifier) !== undefined);
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

	it('guards every lib module that value-imports lib/planning, directly or transitively', () => {
		// board-data.ts and references.ts both value-import lib/planning without
		// being named in a hand-maintained list.
		expect(valueImportsOfGuardedLibs(`import { boardRows } from '../../lib/board-data';`)).toEqual(['../../lib/board-data']);
		expect(valueImportsOfGuardedLibs(`import { linkify } from '../../lib/references';`)).toEqual(['../../lib/references']);
	});

	it('does not guard a lib module that only type-imports the guarded libs', () => {
		// lib/board.ts and lib/graph-state.ts import only types from planning and
		// its guarded dependents, so they stay client-safe and unguarded.
		expect(valueImportsOfGuardedLibs(`import { cardRag } from '../../lib/board';`)).toEqual([]);
		expect(valueImportsOfGuardedLibs(`import { chainOf } from '../../lib/graph-state';`)).toEqual([]);
	});

	it('bounds the from-clause so a later statement is not folded into an earlier type-only one', () => {
		// The lazy clause used to run from one statement's `type` keyword all the
		// way to a later `from '<guarded lib>'`, reading a real value re-export as
		// type-only.
		expect(valueImportsOfGuardedLibs(`export type Foo = string;\nexport { y } from '../../lib/planning';`)).toEqual(['../../lib/planning']);
	});
});

describe('client scripts import only types from server-only libs', () => {
	it('reads the bundled <script> bodies of an .astro file and skips is:inline ones', () => {
		expect(bundledScripts('<script is:inline>a</script><script>import x from "../lib/planning";</script>')).toEqual(['import x from "../lib/planning";']);
		expect(bundledScripts('<script is:inline define:vars={{ board }}>a</script>')).toEqual([]);
	});

	it('the guard catches a value import in an .astro client script', () => {
		const source = bundledScripts('<script>import { features } from "../../lib/planning";</script>').join('\n');

		expect(valueImportsOfGuardedLibs(source)).toEqual(['../../lib/planning']);
	});

	it('every bundled .astro <script> under src and every .ts file under src/scripts imports the guarded libs as types only', () => {
		const astro = (readdirSync(SRC, { recursive: true }) as string[]).filter((name) => name.endsWith('.astro'));
		const scripts = (readdirSync(SCRIPTS, { recursive: true }) as string[]).filter((name) => name.endsWith('.ts'));

		expect(astro.length).toBeGreaterThan(0);
		expect(scripts.length).toBeGreaterThan(0);

		for (const file of astro) {
			const findings = valueImportsOfGuardedLibs(bundledScripts(readFileSync(join(SRC, file), 'utf8')).join('\n'));

			expect(findings, `${file}: value import of ${findings.join(', ')}`).toEqual([]);
		}

		for (const file of scripts) {
			const findings = valueImportsOfGuardedLibs(readFileSync(join(SCRIPTS, file), 'utf8'));

			expect(findings, `src/scripts/${file}: value import of ${findings.join(', ')}`).toEqual([]);
		}
	});
});
