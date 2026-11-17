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
	now: {{VIEW_NOW}},
	milestones: {{VIEW_MILESTONES}},
	features: {{VIEW_FEATURES}},
	inbox: {{VIEW_INBOX}},
	briefs: {{VIEW_BRIEFS}},
	strategy: {{VIEW_STRATEGY}},
};
