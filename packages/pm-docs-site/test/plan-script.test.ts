// src/scripts/plan.ts registers its document listeners once per document, so
// a second import or call (for example under view transitions) never stacks them.
import { describe, expect, it, mock } from 'bun:test';

import { start } from '../src/scripts/plan';

describe('plan.ts start()', () => {
	it('adds its three listeners once per document', () => {
		const addEventListener = mock(() => {});
		const doc = { addEventListener } as unknown as Document;

		start(doc);
		start(doc);

		expect(addEventListener.mock.calls.map((call) => (call as unknown[])[0])).toEqual(['pointerdown', 'pointerup', 'click']);
	});
});