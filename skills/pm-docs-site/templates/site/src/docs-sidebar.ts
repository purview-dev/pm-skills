// The sidebar groups for the repository's Markdown. None without the repo-docs
// module, which replaces this file with one built from its docs sources.

export type SidebarItem =
	| string
	| { label: string; link: string }
	| { label: string; items: SidebarItem[]; collapsed?: boolean };

export function docsSidebar(): SidebarItem[] {
	return [];
}
