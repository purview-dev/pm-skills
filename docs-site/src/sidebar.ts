// The sidebar: the plan (its optional views switched on in views.ts), then each
// optional module switched on in modules.ts.

import { docsSidebar, type SidebarItem } from './docs-sidebar';
import { modules } from './modules';
import { views } from './views';

export function buildSidebar(): SidebarItem[] {
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

	return [
		{ label: 'Plan', items: plan.filter((item): item is SidebarItem => item !== false) },
		...(modules.architecture ? [{ label: 'Architecture', link: '/architecture/overview/' }] : []),
		...docsSidebar(),
	];
}
