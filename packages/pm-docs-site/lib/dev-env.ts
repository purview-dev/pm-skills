// The environment `pm-docs-site dev` runs Astro in.
//
// Astro's dev server checks npm for a newer Astro on start (not on CI) and
// records the check in `.astro/settings.json`. It ignores one watcher event for
// that write, but on Windows a new file gives two (create, then change), so the
// second restarts the server; a restart while it starts cuts the content sync,
// and every page then answers 500 until it is restarted by hand (R-029). The
// package pins Astro, so the notice is not the consumer's to act on: turn the
// check off unless the consumer has set ASTRO_DISABLE_UPDATE_CHECK.

/** Sets ASTRO_DISABLE_UPDATE_CHECK to `true` in `env` when it is unset. */
export function disableUpdateCheck(env: NodeJS.ProcessEnv): void {
	env.ASTRO_DISABLE_UPDATE_CHECK ??= 'true';
}
