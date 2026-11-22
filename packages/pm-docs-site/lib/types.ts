// The integration's option types, re-exported by index.ts. A separate module
// so the other lib/ modules and src/ can import them without importing the
// integration itself.

/** An optional plan view. Home, Board, Roadmap, Log and Risks are always on. */
export type ViewName = 'now' | 'milestones' | 'graph' | 'features' | 'inbox' | 'briefs' | 'strategy' | 'decisions';

/** One folder of repository Markdown, shown as one sidebar group. */
export interface DocsSource {
	/** The sidebar group for this source's pages. */
	label: string;
	/** The folder to read, relative to the docs root (`.` for the root). */
	base: string;
	/** Files to read, as globs relative to `base` (`*` within a folder, `**` across folders). */
	include: string[];
	/** Prepended to each page's path to make its URL. Default: none. */
	prefix?: string;
	/** A file name that stands for its folder, such as `SKILL.md` or `README.md`. */
	indexFile?: string;
	/** Sidebar order by page path. Default: `asc`. */
	order?: 'asc' | 'desc';
	collapsed?: boolean;
	/** Load the pages without listing them in the sidebar. */
	hidden?: boolean;
}

export interface PmDocsSiteOptions {
	/** The site title. */
	title: string;
	description?: string;
	/** The pm-export file, relative to the site root. Default: `../planning/planning.json`. */
	planning?: string;
	/** Repository Markdown to render as pages; `root` is relative to the site root. Default: none. */
	docs?: { root: string; sources: DocsSource[] };
	/** The optional views to render. Default: all seven. */
	views?: ViewName[];
}

/** The options with defaults applied and every path absolute. */
export interface ResolvedOptions {
	title: string;
	description: string | null;
	planning: string;
	/** The export path as the options wrote it, `/`-separated: shown on pages instead of the machine path. */
	planningLabel: string;
	docs: { root: string; sources: DocsSource[] } | null;
	views: Record<ViewName, boolean>;
}
