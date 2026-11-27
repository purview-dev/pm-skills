import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'bun:test';

import { relativeImports, resolvesToFile } from './helpers';

const dirs: string[] = [];

function scratch(): string {
	const dir = mkdtempSync(join(tmpdir(), 'imports-'));
	dirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('relativeImports', () => {
	it('finds side-effect, static, re-export and dynamic imports', () => {
		const file = join(scratch(), 'a.ts');
		writeFileSync(
			file,
			["import '../styles/x.css';", 'import "./a.ts";', "export { b } from './b.ts';", "const c = await import('./c.ts');", "import x from 'astro';"].join('\n'),
		);

		expect(relativeImports(file)).toEqual(['../styles/x.css', './a.ts', './b.ts', './c.ts']);
	});

	it('skips member calls and comments, and finds a plain template-literal dynamic import', () => {
		const file = join(scratch(), 'b.ts');
		writeFileSync(
			file,
			[
				"foo.import('./no.ts');",
				"// import './comment.ts';",
				"/* export { z } from './block.ts'; */",
				'const t = await import(`./tpl.ts`);',
				'const d = await import(`./${name}.ts`);',
				"const u = 'https://example.com/'; import './after.ts';",
			].join('\n'),
		);

		expect(relativeImports(file)).toEqual(['./tpl.ts', './after.ts']);
	});
});

describe('resolvesToFile', () => {
	it('does not count a bare directory as a resolved import', () => {
		const dir = scratch();
		mkdirSync(join(dir, 'sub'));

		expect(resolvesToFile(join(dir, 'sub'), ['', '.ts'])).toBe(false);

		writeFileSync(join(dir, 'sub.ts'), '');

		expect(resolvesToFile(join(dir, 'sub'), ['', '.ts'])).toBe(true);
	});
});
