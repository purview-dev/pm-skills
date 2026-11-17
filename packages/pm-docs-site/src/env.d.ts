/// <reference types="astro/client" />

// The integration's options, resolved and served by index.mjs.
declare module 'virtual:pm-docs-site/config' {
	const config: import('../index').ResolvedOptions;
	export default config;
}
