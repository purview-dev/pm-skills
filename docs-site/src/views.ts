// The plan views this site renders, from the `views` list in pm-docs-site.json
// (every view when the list is missing). Home, Board, Roadmap, Log and Risks
// are always on. The sidebar, the home page and the cross-links read it.
export const views: {
	now: boolean;
	milestones: boolean;
	features: boolean;
	inbox: boolean;
	briefs: boolean;
	strategy: boolean;
} = {
	now: true,
	milestones: true,
	features: true,
	inbox: true,
	briefs: true,
	strategy: true,
};
