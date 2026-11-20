// The pm-export schemaVersions this package reads, declared once. A new export
// format is supported by adding its version here, with the page changes it needs.

export const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = Object.freeze([4]);

/** The plan export is missing, unreadable, or in a format this package does not read. */
export class PlanningExportError extends Error {
	constructor(message: string) {
		super(`${message} Run the pm-export skill to write planning.json.`);
		this.name = 'PlanningExportError';
	}
}

/**
 * Throw unless the export's schemaVersion is one this package reads.
 * @param path the export's path, for the message
 */
export function checkSchemaVersion(version: unknown, path: string): void {
	if (typeof version === 'number' && SUPPORTED_SCHEMA_VERSIONS.includes(version)) return;

	throw new PlanningExportError(
		`${path} has schemaVersion ${String(version)}; this site reads schemaVersion ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
	);
}

/**
 * Throw unless the parsed export is an object with a schemaVersion this package
 * reads, so `null`, an array, or a scalar fails with the pm-export hint.
 * @param path the export's path, for the message
 */
export function checkExport(value: unknown, path: string): asserts value is { schemaVersion: number } {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		const kind = value === null ? 'null' : Array.isArray(value) ? 'an array' : typeof value;

		throw new PlanningExportError(`${path} does not hold a plan export (found ${kind}).`);
	}

	checkSchemaVersion((value as { schemaVersion?: unknown }).schemaVersion, path);
}
