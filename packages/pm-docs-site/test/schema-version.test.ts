import { describe, expect, it } from 'bun:test';

import { checkExport, checkSchemaVersion, parseExport, PlanningExportError, SUPPORTED_SCHEMA_VERSIONS } from '../lib/schema-version.ts';

describe('checkExport', () => {
	it('rejects null and arrays with the pm-export hint', () => {
		expect(() => checkExport(null, 'p.json')).toThrow('p.json does not hold a plan export (found null). Run the pm-export skill');
		expect(() => checkExport([], 'p.json')).toThrow('(found an array)');
		expect(() => checkExport(4, 'p.json')).toThrow('(found number)');
	});

	it('checks the schemaVersion of an object', () => {
		expect(() => checkExport({ schemaVersion: 6 }, 'p.json')).not.toThrow();
		expect(() => checkExport({ schemaVersion: 7 }, 'p.json')).toThrow('has schemaVersion 7');
	});
});

describe('checkSchemaVersion', () => {
	it('supports schemaVersion 6 only', () => {
		expect(SUPPORTED_SCHEMA_VERSIONS).toEqual([6]);
	});

	it('accepts 6', () => {
		expect(() => checkSchemaVersion(6, 'p.json')).not.toThrow();
	});

	it.each([2, 3, 4, 5, 7, '6', undefined])('rejects %p', (version) => {
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(PlanningExportError);
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(
			`p.json has schemaVersion ${String(version)}; this site reads schemaVersion 5. Run the pm-export skill to write planning.json.`,
		);
	});
});

describe('parseExport', () => {
	it('throws for an unsupported schemaVersion, naming it and the version this site reads', () => {
		expect(() => parseExport('{"schemaVersion":7}', 'p.json')).toThrow('schemaVersion 7');
		expect(() => parseExport('{"schemaVersion":7}', 'p.json')).toThrow('reads schemaVersion 6');
	});

	it('accepts an unsupported schemaVersion when the caller widens the supported list', () => {
		expect(parseExport('{"schemaVersion":7}', 'p.json', [6, 7])).toEqual({ schemaVersion: 7 });
	});
});

describe('PlanningExportError', () => {
	it('names itself and points at pm-export', () => {
		const error = new PlanningExportError('No plan export at x.');

		expect(error.name).toBe('PlanningExportError');
		expect(error.message).toBe('No plan export at x. Run the pm-export skill to write planning.json.');
	});
});
