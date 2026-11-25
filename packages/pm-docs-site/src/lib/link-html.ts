// Links the known IDs and brief paths inside rendered HTML (an ADR's sections),
// the way LinkedText does for plain text, and returns the keys it linked: the
// ADR page's Linked from entries are built from those keys (ADR-011), so links
// and entries come from the same HTML. Text inside an existing link, a script,
// or a style stays as written; IDs inside code are linked, as LinkedText links
// them in plain text, because the link test requires every known ID on a page
// to be a link. Tags are split with an attribute-aware pattern, so a `>` inside
// an attribute value (an image's alt) never ends the tag.

import { linkify, type Target } from './references';

/** The linked HTML and the key of every target it linked. */
export interface LinkedHtml {
	html: string;
	keys: Set<string>;
}

const TAG = /(<(?:"[^"]*"|'[^']*'|[^'">])*>)/;
const SKIP = new Set(['a', 'script', 'style']);
const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML with each known reference in its text wrapped in a link to its page, and the keys it linked. */
export function linkHtml(html: string, known: Map<string, Target>): LinkedHtml {
	const open: string[] = [];
	const keys = new Set<string>();
	let out = '';

	for (const part of html.split(TAG)) {
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
			for (const run of linkify(part, known)) {
				if (run.target?.href) {
					keys.add(run.target.key);
					out += `<a href="${escapeAttribute(run.target.href)}">${run.text}</a>`;
				} else out += run.text;
			}
		}
	}

	return { html: out, keys };
}
