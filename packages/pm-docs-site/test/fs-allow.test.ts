import { describe, expect, it } from 'bun:test';

import { containsPath } from '../lib/fs-allow.ts';

describe('containsPath', () => {
	it('contains an equal path', () => {
		expect(containsPath('/repo/pkg', '/repo/pkg')).toBe(true);
	});

	it('contains a path inside it', () => {
		expect(containsPath('/repo', '/repo/pkg')).toBe(true);
	});

	it('does not contain its parent', () => {
		expect(containsPath('/repo/pkg', '/repo')).toBe(false);
	});

	it('does not contain a sibling that shares its prefix', () => {
		expect(containsPath('/repo/pkg', '/repo/pkg-old')).toBe(false);
	});

	it('does not contain a path outside it', () => {
		expect(containsPath('/other', '/repo/pkg')).toBe(false);
	});

	it.if(process.platform === 'win32')('compares Windows drives and separators', () => {
		expect(containsPath('C:/repo', 'D:/repo/pkg')).toBe(false);
		expect(containsPath('C:\\repo', 'C:/repo/pkg')).toBe(true);
	});
});
