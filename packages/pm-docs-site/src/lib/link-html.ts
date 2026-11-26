// Links the known IDs and brief paths inside rendered HTML (an ADR's sections),
// the way LinkedText does for plain text, and returns the keys it linked: the
// ADR page's Linked from entries are built from those keys (ADR-011), so links
// and entries come from the same HTML. Text inside an existing link, a script,
// or a style stays as written; IDs inside code are linked, as LinkedText links
// them in plain text, because the link test requires every known ID on a page
// to be a link. Tags are split with an attribute-aware pattern, so a `>` inside
// an attribute value (an image's alt) never ends the tag. A script or style body
// is raw text, copied whole up to its close tag (any case), so a `<` inside it
// never reads as a tag.

import { linkify, type Target } from './references';

/** The linked HTML and the key of every target it linked. */
export interface LinkedHtml {
	html: string;
	keys: Set<string>;
}

const TAG = /<(?:"[^"]*"|'[^']*'|[^'">])*>/g;
const RAW = new Set(['script', 'style']);
const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML with each known reference in its text wrapped in a link to its page, and the keys it linked. */
export function linkHtml(html: string, known: Map<string, Target>): LinkedHtml {
	const keys = new Set<string>();
	let links = 0;
	let out = '';
	let at = 0;

	const text = (part: string) => {
		if (links > 0 || part === '') {
			out += part;
			return;
		}
		for (const run of linkify(part, known)) {
			if (run.target?.href) {
				keys.add(run.target.key);
				out += `<a href="${escapeAttribute(run.target.href)}">${run.text}</a>`;
			} else out += run.text;
		}
	};

	TAG.lastIndex = 0;
	for (let match = TAG.exec(html); match; match = TAG.exec(html)) {
		const tag = match[0];
		const name = /^<\/?([a-zA-Z][\w-]*)/.exec(tag)?.[1]?.toLowerCase();
		const closing = tag.startsWith('</');

		text(html.slice(at, match.index));
		out += tag;
		at = TAG.lastIndex;
		if (!name || tag.endsWith('/>')) continue;

		if (name === 'a') links = Math.max(0, links + (closing ? -1 : 1));
		else if (RAW.has(name) && !closing) {
			// Copy the body and its close tag (or the rest, unclosed) as written.
			const close = new RegExp(`</${name}\\b[^>]*>`, 'ig');

			close.lastIndex = at;
			const stop = close.exec(html) ? close.lastIndex : html.length;

			out += html.slice(at, stop);
			at = TAG.lastIndex = stop;
		}
	}
	text(html.slice(at));

	return { html: out, keys };
}
