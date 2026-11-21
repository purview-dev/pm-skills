// Starlight's 404 route calls `getEntry('docs', '404')` and falls back to its
// own page when there is no such entry, and Astro logs `Entry docs → 404 was
// not found.` on every build when the lookup misses. Both docs loaders add this
// entry unless the repository has its own `404` page. It is a draft, and
// Starlight routes no draft in a production build, so no /404/ page is built
// (`astro dev` serves it). The tagline is Starlight's own English text.

export const NOT_FOUND_ID = '404';

export const NOT_FOUND_DATA = {
	title: '404',
	template: 'splash',
	draft: true,
	editUrl: false,
	pagefind: false,
	hero: { tagline: 'Page not found. Check the URL or try using the search.' },
} as const;
