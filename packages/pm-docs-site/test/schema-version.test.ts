import { describe, expect, it } from 'bun:test';

import { checkSchemaVersion, PlanningExportError, SUPPORTED_SCHEMA_VERSIONS } from '../lib/schema-version.ts';

describe('checkSchemaVersion', () => {
	it('supports schemaVersion 3 only', () => {
		expect(SUPPORTED_SCHEMA_VERSIONS).toEqual([3]);
	});

	it('accepts 3', () => {
		expect(() => checkSchemaVersion(3, 'p.json')).not.toThrow();
	});

	it.each([2, 4, '3', undefined])('rejects %p', (version) => {
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(PlanningExportError);
		expect(() => checkSchemaVersion(version, 'p.json')).toThrow(
			`p.json has schemaVersion ${String(version)}; this site reads schemaVersion 3. Run the pm-export skill to write planning.json.`,
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
