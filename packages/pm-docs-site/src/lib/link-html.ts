// Links the known IDs and brief paths inside rendered HTML (an ADR's sections),
// the way LinkedText does for plain text: the same linkify runs, so a link here
// is one `references()` already lists. Text inside an existing link stays as
// written; IDs inside code are linked, as LinkedText links them in plain text,
// because the link test requires every known ID on a page to be a link.

import { linkify, type Target } from './references';

const SKIP = new Set(['a']);
const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML with each known reference in its text wrapped in a link to its page. */
export function linkHtml(html: string, known: Map<string, Target>): string {
	const open: string[] = [];
	let out = '';

	for (const part of html.split(/(<[^>]+>)/)) {
		if (part.startsWith('<')) {
			const tag = /^<\/?([a-zA-Z][\w-]*)/.exec(part)?.[1]?.toLowerCase();

			if (tag && SKIP.has(tag) && !part.endsWith('/>')) {
				if (part.startsWith('</')) {
					const at = open.lastIndexOf(tag);

					if (at !== -1) open.splice(at, 1);
				} else open.push(tag);
			}
			out += part;
		} else if (open.length > 0 || part === '') {
			out += part;
		} else {
			out += linkify(part, known)
				.map((run) => (run.target?.href ? `<a href="${escapeAttribute(run.target.href)}">${run.text}</a>` : run.text))
				.join('');
		}
	}

	return out;
}
