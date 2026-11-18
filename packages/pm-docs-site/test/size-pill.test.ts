// The size pill has one set of colours: the Now card (TaskKanbanCard, styled in
// kanban.css) and every other card (KanbanItemCard, inline styles) both use the
// kit's low, medium, and high colours for S, M, and L.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'bun:test';

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

const CSS = read('styles/kanban.css');
const ITEM_CARD = read('components/board/KanbanItemCard.tsx');
const VARIANTS = { S: 'low', M: 'med', L: 'high' } as const;

/** A `.task-card__tag--<variant>` rule's colour and background. */
function taskCardPill(variant: string): { color: string; bg: string } {
	const body = new RegExp(`\\.task-card__tag--${variant}\\s*\\{([^}]*)\\}`).exec(CSS)?.[1] ?? '';

	return { color: /(?:^|;|\s)color:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? '', bg: /background:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? '' };
}

/** KanbanItemCard's `sizeMap` entry for one size. */
function itemCardPill(size: string): { color: string; bg: string } {
	const match = new RegExp(`\\b${size}: \\{ color: '([^']+)', bg: '([^']+)' \\}`).exec(ITEM_CARD);

	return { color: match?.[1] ?? '', bg: match?.[2] ?? '' };
}

describe('the size pill', () => {
	for (const [size, variant] of Object.entries(VARIANTS)) {
		it(`colours ${size} the same on the Now card and the other cards`, () => {
			const item = itemCardPill(size);

			expect(item.color).not.toBe('');
			expect(taskCardPill(variant)).toEqual(item);
		});
	}

	it('uses the kit colours', () => {
		expect(['S', 'M', 'L'].map((size) => itemCardPill(size).color)).toEqual(['#059669', '#d97706', '#dc2626']);
	});
});
