/// <reference types="astro/client" />

// The integration's options, resolved and served by lib/index.ts.
declare module 'virtual:pm-docs-site/config' {
	const config: import('../lib/types.ts').ResolvedOptions;
	export default config;
}
