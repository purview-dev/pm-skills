import { describe, expect, it } from 'bun:test';

import { checkSchemaVersion, PlanningExportError, SUPPORTED_SCHEMA_VERSIONS } from '../lib/schema-version.ts';

describe('checkSchemaVersion', () => {
	it('supports schemaVersion 4 only', () => {
		expect(SUPPORTED_SCHEMA_VERSIONS).toEqual([4]);
	});

	it('accepts 4', () => {
		expect(() => checkSchemaVersion(4, 'p.json')).not.toThrow();
	});

	it.each([2, 3, '4', undefined])('rejects %p', (version) => {
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(PlanningExportError);
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(
			`p.json has schemaVersion ${String(version)}; this site reads schemaVersion 4. Run the pm-export skill to write planning.json.`,
		);
	});
});

describe('PlanningExportError', () => {
	it('names itself and points at pm-export', () => {
		const error = new PlanningExportError('No plan export at x.');

		expect(error.name).toBe('PlanningExportError');
		expect(error.message).toBe('No plan export at x. Run the pm-export skill to write planning.json.');
	});
});
