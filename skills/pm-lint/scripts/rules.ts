// The pm-lint rule catalogue: every rule's ID, severity, whether `fix`
// repairs it, and its one-line statement. references/rules.md documents the
// same rules in full; the tests keep the two in step.

export type Severity = "error" | "warning";

export interface Rule {
  id: string;
  severity: Severity;
  fixable: boolean;
  summary: string;
}

const rule = (id: string, severity: Severity, fixable: boolean, summary: string): Rule => ({ id, severity, fixable, summary });

export const RULES: Rule[] = [
  // Markdown formatting: every Markdown file in the PM root.
  rule("format/final-newline", "error", true, "The file ends with exactly one newline."),
  rule("format/trailing-space", "error", true, "No line ends with spaces or tabs."),
  rule("format/tabs", "error", true, "No hard tabs outside code fences."),
  rule("format/blank-lines", "error", true, "No two blank lines in a row outside code fences."),
  rule("format/heading-space", "error", true, "An ATX heading has one space after its #s and no closing #s."),
  rule("format/heading-blank", "error", true, "A heading has a blank line before and after it."),
  rule("format/list-marker", "error", true, "Bullets use `-`."),
  rule("format/list-blank", "error", true, "A list has a blank line before and after it."),
  rule("format/fence-blank", "error", true, "A code fence has a blank line before and after it."),
  rule("format/first-heading", "error", false, "The first line is a level-1 heading."),
  rule("format/single-h1", "error", false, "There is one level-1 heading."),
  rule("format/heading-increment", "error", false, "Heading levels go down one at a time."),
  rule("format/unclosed", "error", false, "Every code fence and HTML comment is closed."),

  // Fields: every `- Key: value` list a PM file defines.
  rule("fields/key-case", "error", true, "A known field key is written as defined (`Done when`, not `done when`)."),
  rule("fields/duplicate", "error", false, "A field appears once in its block."),
  rule("fields/unknown", "warning", false, "A field key is one the file format defines."),

  // config.md
  rule("config/sections", "error", false, "config.md has `## Install` and `## Limits`."),
  rule("config/optional-sections", "warning", false, "config.md has `## Handoffs`, `## Commits`, and `## Last review` (older installs use defaults)."),
  rule("config/rules-version", "error", false, "`Rules version` is a whole number."),
  rule("config/limits", "error", false, "Each limit is a number, and `Branch name pattern` is a backticked pattern with `<id>`."),
  rule("config/commits", "error", false, "`PM state commit` is always, ask, or never; `Export on commit` is always, if present, or never; `PM branch` is set."),
  rule("config/last-review", "error", false, "`Last review` `Date` is never or YYYY-MM-DD."),

  // VISION.md
  rule("vision/sections", "error", false, "VISION.md has Problem, Customer, a `done when` section, Out of scope, and Constraints."),
  rule("vision/outcome", "error", false, "Each outcome is `V<n>: <text>`, and each V number is used once."),
  rule("vision/constraints", "warning", false, "Constraints has Time available, Budget, and Stack."),

  // STRATEGY.md
  rule("strategy/sections", "error", false, "STRATEGY.md has Current focus, Milestones, Bets, Assumptions and risks, Not doing, and Decisions, in that order."),
  rule("strategy/focus", "error", false, "The focus `Milestone` names a milestone in `## Milestones`."),
  rule("strategy/milestone", "error", false, "A milestone is `### M<n> <Name>` with Serves, Exit criteria, Target, and Status; its ID is used once."),
  rule("strategy/milestone-status", "error", false, "A milestone Status is active, planned, or done (YYYY-MM-DD); Target is none or YYYY-MM-DD."),
  rule("strategy/serves", "error", false, "Every `Serves` V line exists in VISION.md."),
  rule("strategy/bet", "error", false, "A bet is `B<n>: <statement>` with Evidence, We will know when, and Status (open, won, or lost)."),
  rule("strategy/assumption", "error", false, "An assumption is `A<n>: <statement>` with Test and Status (untested, holds, or broken)."),
  rule("strategy/not-doing", "warning", false, "A Not doing line has `Why:` and `Revisit:`."),
  rule("strategy/decision", "error", false, "A decision starts with YYYY-MM-DD and has `Why:`."),
  rule("strategy/decision-order", "error", true, "Decisions are newest first."),

  // NOW.md
  rule("now/fields", "error", false, "NOW.md lists Status, Item, Session, Stage, Brief, Milestone, Spec, Plan, and Started, in that order, optionally with Serves, Owner, Size, Depends on, and Revisits after Milestone."),
  rule("now/sections", "error", false, "NOW.md has `## Done when` and `## Checkpoint`."),
  rule("now/status", "error", false, "Status is idle or active."),
  rule("now/idle", "error", false, "When idle, every field except Status is empty."),
  rule("now/active", "error", false, "When active: Item is `R-NNN <Title>`, Session is set, Stage is design, plan, execute, or finish, Started is YYYY-MM-DD, and Done when has a check."),
  rule("now/checkpoint", "error", false, "A checkpoint is `## Checkpoint YYYY-MM-DD HH:MM` with Stopped at, Next action, Start with, Decisions, and Context."),
  rule("now/not-in-roadmap", "error", false, "The active item is not also in ROADMAP.md."),
  rule(
    "now/item",
    "error",
    false,
    "When active, Serves lists V IDs from VISION.md, Owner is agent, user, or both, Size is S, M, or L, Depends on lists existing IDs or none, and Revisits is one existing ID or empty.",
  ),

  // ROADMAP.md
  rule("roadmap/sections", "error", false, "ROADMAP.md has `## Next` then `## Later`, and no other level-2 section."),
  rule("roadmap/item", "error", false, "An item is `### R-NNN <Title>` with Serves, Done when, Size, and Status."),
  rule("roadmap/owner", "error", false, "Owner is agent, user, or both."),
  rule("roadmap/size", "error", false, "Size is S, M, or L."),
  rule("roadmap/status", "error", false, "Status is ready, paused, or blocked (<reason>, since YYYY-MM-DD)."),
  rule("roadmap/next-max", "error", false, "Next holds at most the `Max items in Next` in config.md."),
  rule("roadmap/id-unique", "error", false, "An item ID appears once across ROADMAP.md, NOW.md, and the LOG.md Done and Dropped lines."),
  rule("roadmap/depends", "error", false, "Every `Depends on` ID exists, is not the item itself, and forms no cycle."),
  rule("roadmap/serves", "error", false, "Every `Serves` V line exists in VISION.md."),
  rule("roadmap/milestone", "error", false, "`Milestone` names a milestone in STRATEGY.md, or is none."),
  rule("roadmap/revisits", "error", false, "`Revisits` names an item in the LOG.md Done lines."),
  rule("roadmap/later-order", "warning", false, "Later is grouped by milestone in STRATEGY.md order, unassigned last."),

  // LOG.md
  rule("log/sections", "error", false, "LOG.md has `## Done`, `## Dropped`, and `## Reviews`."),
  rule("log/line", "error", false, "Each line starts with YYYY-MM-DD; a Done line has an ID and Milestone, Owner, Plan, and Result; a Dropped line has a Reason."),
  rule("log/order", "error", true, "Each section is newest first."),
  rule("log/id-unique", "error", false, "An ID has at most one Done line."),

  // RISKS.md
  rule("risks/sections", "error", false, "RISKS.md has `## Open`, `## Closed`, and `## Removed`."),
  rule("risks/risk", "error", false, "A risk is `### RK-NNN <Title>` with every register field, in order."),
  rule("risks/values", "error", false, "Likelihood and Impact are low, medium, or high; RAG is red, amber, or green; Status and Owner are allowed values."),
  rule("risks/rag", "error", true, "RAG is the value Likelihood × Impact derives, unless RAG override gives a reason."),
  rule("risks/section-status", "error", false, "Open risks are open, mitigating, or accepted with no Closed; closed risks are closed with `Closed: YYYY-MM-DD: <reason>`."),
  rule("risks/order", "error", true, "Open is ordered red, amber, green, then by ID."),
  rule("risks/id-unique", "error", false, "A risk ID appears once across Open, Closed, and Removed."),
  rule("risks/removed", "error", false, "A removed risk is `- YYYY-MM-DD RK-NNN <title>. Reason: <reason>.`"),

  // inbox/*.md
  rule("inbox/filename", "error", false, "An inbox file is named `YYYY-MM-DD-HHMM-<slug>.md`, slug in lower-case kebab case."),
  rule("inbox/fields", "error", false, "Captured is YYYY-MM-DD HH:MM; Source is user or agent (…); Kind, Discuss, and Reviewed are allowed values; a bug has a Severity."),
  rule("inbox/idea", "error", false, "`## Idea` holds the idea."),
  rule("inbox/bug", "warning", false, "A bug has a `## Reproduction` section; only a bug has a Severity."),
  rule("inbox/sections", "warning", false, "An inbox file uses only Idea, Reproduction, Links, and Notes sections."),

  // briefs/*.md
  rule("brief/filename", "error", false, "A brief is named `R-NNN-<slug>.md` or `YYYY-MM-DD-<slug>.md`."),
  rule("brief/header", "error", false, "A brief has Status (shaping, parked, on roadmap (…), done, dropped), Origin, and Updated (YYYY-MM-DD)."),
  rule("brief/sections", "error", false, "A brief has the brief headings, in order, with Revisions only after Decision."),

  // STACK.md and PAUSE.md
  rule("stack/entry", "error", false, "A stack entry is `### R-NNN <Title>` with Pushed, Branch, Stage, Reason, Done when, and Checkpoint."),
  rule("pause/fields", "error", false, "PAUSE.md has Paused, Session, Item, Running, and Files, then `## Resume with` (Next action, Start with, Open question) and `## Context`."),

  // Titles, for every file whose format caps them.
  rule("title/length", "warning", false, "An inbox file's or a risk's title is at most 8 words."),

  // The export, when pm-export is installed beside pm-lint.
  rule("export/build", "error", false, "The PM files build into an export that matches pm-export's schema."),
  rule("export/file", "error", false, "planning.json matches planning.schema.json."),
];

export const RULE = new Map(RULES.map((entry) => [entry.id, entry]));
