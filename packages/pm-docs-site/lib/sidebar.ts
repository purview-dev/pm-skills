// The Starlight sidebar: the plan, its optional views switched on in the
// options, then one group per docs source that has pages.

import { pagesOf } from './repo-docs.ts';
import type { ResolvedOptions } from './types.ts';

export type SidebarItem = string | { label: string; link: string } | { label: string; items: SidebarItem[]; collapsed?: boolean };

export function buildSidebar(options: ResolvedOptions): SidebarItem[] {
	const { views, docs } = options;

	const plan: (SidebarItem | false)[] = [
		views.now && { label: 'Now', link: '/plan/now/' },
		{ label: 'Board', link: '/plan/board/' },
		{ label: 'Roadmap', link: '/plan/roadmap/' },
		views.milestones && { label: 'Milestones', link: '/plan/milestones/' },
		views.features && { label: 'Features', link: '/plan/features/' },
		{ label: 'Log', link: '/plan/log/' },
		{ label: 'Risks', link: '/plan/risks/' },
		views.inbox && { label: 'Inbox', link: '/plan/inbox/' },
		views.briefs && { label: 'Briefs', link: '/plan/briefs/' },
		views.strategy && { label: 'Strategy', link: '/plan/strategy/' },
	];

	const groups: SidebarItem[] = docs
		? docs.sources
				.filter((source) => !source.hidden)
				.map((source) => ({
					label: source.label,
					collapsed: source.collapsed ?? false,
					items: pagesOf(source, docs.root).map((page) => page.id),
				}))
				// Starlight rejects an empty group.
				.filter((group) => group.items.length > 0)
		: [];

	return [{ label: 'Plan', items: plan.filter((item) => item !== false) }, ...groups];
}
