// Whether a Vite `server.fs.allow` entry already covers a path: the in-repo
// fixture and linked consumers resolve this package outside the site's
// workspace root, so the integration allows the package folder only when no
// entry contains it.

import { isAbsolute, relative, sep } from 'node:path';

/** Whether `path` is `entry` or inside it. Separators, drives and case follow `node:path`. */
export function containsPath(entry: string, path: string): boolean {
	const rel = relative(entry, path);
	const escapes = rel === '..' || rel.startsWith(`..${sep}`);

	return !escapes && !isAbsolute(rel);
}
