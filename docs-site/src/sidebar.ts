// The sidebar: the plan, then each optional module switched on in modules.ts.

import { docsSidebar, type SidebarItem } from './docs-sidebar';
import { modules } from './modules';

export function buildSidebar(): SidebarItem[] {
	return [
		{
			label: 'Plan',
			items: [
				{ label: 'Board', link: '/plan/board/' },
				{ label: 'Roadmap', link: '/plan/roadmap/' },
				{ label: 'Log', link: '/plan/log/' },
				{ label: 'Risks', link: '/plan/risks/' },
			],
		},
		...(modules.architecture ? [{ label: 'Architecture', link: '/architecture/overview/' }] : []),
		...docsSidebar(),
	];
}
