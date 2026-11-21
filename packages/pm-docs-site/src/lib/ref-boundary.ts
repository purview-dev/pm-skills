// Where a reference (an ID or a brief path) may start and end in prose. The
// site's links (linkify) and the link test's scanner (test/scan.ts) both build
// their patterns here, so a reference is linked exactly where the test looks
// for one. No imports, so the test helper can load it outside Astro.

/**
 * Not inside a word, a path, or a hyphenated token. An ID after `/` is
 * deliberately not linked (`M1/M2` links only `M1`, and `./planning/briefs/x.md`
 * stays plain), because a `/` also starts a path segment (`src/M1`).
 * test/references.test.ts pins it.
 */
export const REF_BEFORE = String.raw`(?<![\w/-])`;
/** Not followed by more of a word or a hyphenated token. */
export const REF_AFTER = String.raw`(?![\w-])`;

/** A global pattern for any of `alternatives` (already escaped; longest first) at reference boundaries. */
export function refPattern(alternatives: string[]): RegExp {
	return new RegExp(`${REF_BEFORE}(?:${alternatives.join('|')})${REF_AFTER}`, 'g');
}
