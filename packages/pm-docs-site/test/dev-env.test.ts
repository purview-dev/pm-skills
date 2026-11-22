// `pm-docs-site dev` turns off Astro's update check (lib/dev-env.ts): its
// `.astro/settings.json` write restarts the dev server mid-start on Windows,
// and the restarted server answers 500 (R-029).
import { describe, expect, it } from 'bun:test';

import { disableUpdateCheck } from '../lib/dev-env.ts';

describe('disableUpdateCheck', () => {
	it('turns the update check off when the environment does not set it', () => {
		const env: NodeJS.ProcessEnv = { PATH: 'x' };

		disableUpdateCheck(env);

		expect(env).toEqual({ PATH: 'x', ASTRO_DISABLE_UPDATE_CHECK: 'true' });
	});

	it('keeps a value the consumer set', () => {
		const env: NodeJS.ProcessEnv = { ASTRO_DISABLE_UPDATE_CHECK: 'false' };

		disableUpdateCheck(env);

		expect(env.ASTRO_DISABLE_UPDATE_CHECK).toBe('false');
	});
});
