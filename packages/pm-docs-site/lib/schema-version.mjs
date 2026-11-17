// @ts-check
// The pm-export schemaVersions this package reads, declared once. A new export
// format is supported by adding its version here, with the page changes it needs.

/** @type {readonly number[]} */
export const SUPPORTED_SCHEMA_VERSIONS = Object.freeze([3]);

/** The plan export is missing, unreadable, or in a format this package does not read. */
export class PlanningExportError extends Error {
	/** @param {string} message */
	constructor(message) {
		super(`${message} Run the pm-export skill to write planning.json.`);
		this.name = 'PlanningExportError';
	}
}

/**
 * Throw unless the export's schemaVersion is one this package reads.
 * @param {unknown} version
 * @param {string} path the export's path, for the message
 * @returns {void}
 */
export function checkSchemaVersion(version, path) {
	if (typeof version === 'number' && SUPPORTED_SCHEMA_VERSIONS.includes(version)) return;

	throw new PlanningExportError(
		`${path} has schemaVersion ${String(version)}; this site reads schemaVersion ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
	);
}
