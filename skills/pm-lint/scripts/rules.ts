// The pm-lint rule catalogue: every rule's ID, severity, whether `fix`
// repairs it, and its one-line statement. references/rules.md documents the
// same rules; each summary is that file's description, word for word, and
// the tests keep the two equal.

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
  rule("format/tabs", "error", true, "No hard tabs outside code fences (a tab becomes four spaces)."),
  rule("format/blank-lines", "error", true, "No two blank lines in a row outside code fences."),
  rule("format/heading-space", "error", true, "An ATX heading has one space after its `#`s and no closing `#`s."),
  rule("format/heading-blank", "error", true, "A heading has a blank line before and after it."),
  rule("format/list-marker", "error", true, "Bullets use `-`."),
  rule("format/list-blank", "error", true, "A list has a blank line before and after it."),
  rule("format/fence-blank", "error", true, "A code fence has a blank line before and after it."),
  rule("format/first-heading", "error", false, "The first line (after any HTML comment) is a level-1 heading."),
  rule("format/single-h1", "error", false, "There is one level-1 heading."),
  rule("format/heading-increment", "error", false, "Heading levels go down one at a time."),
  rule("format/unclosed", "error", false, "Every code fence and HTML comment is closed."),

  // Fields: every `- Key: value` list a PM file defines.
  rule("fields/key-case", "error", true, "A known field key is written as defined (`Done when`, not `done when`)."),
  rule("fields/duplicate", "error", false, "A field appears once in its block."),
  rule("fields/unknown", "warning", false, "A field key is one the file format defines."),

  // config.md
  rule("config/sections", "error", false, "`config.md` has `## Install` and `## Limits`."),
  rule("config/optional-sections", "warning", false, "`config.md` has `## Handoffs`, `## Commits`, and `## Last review` (older installs use defaults; `pm-setup` adds them)."),
  rule("config/rules-version", "error", false, "`Rules version` is a whole number."),
  rule("config/limits", "error", false, "Each limit starts with a number, and `Branch name pattern` is a backticked pattern with `<id>`."),
  rule("config/commits", "error", false, "`PM state commit` is always, ask, or never; `Export on commit` is always, if present, or never; `PM branch` is set."),
  rule("config/last-review", "error", false, "`Last review` `Date` is never or YYYY-MM-DD."),

  // VISION.md
  rule("vision/sections", "error", false, "`VISION.md` has Problem, Customer, a `done when` section, Out of scope, and Constraints."),
  rule("vision/outcome", "error", false, "Each outcome is `V<n>: <text>`, and each V number is used once."),
  rule("vision/constraints", "warning", false, "Constraints has Time available, Budget, and Stack."),

  // STRATEGY.md
  rule("strategy/sections", "error", false, "`STRATEGY.md` has Current focus, Milestones, Bets, Assumptions and risks, Not doing, and Decisions, in that order."),
  rule("strategy/focus", "error", false, "Current focus has `Milestone` and `Why now`, and the milestone is one in `## Milestones` (`M2` or `M2 <Name>`)."),
  rule("strategy/milestone", "error", false, "A milestone is `### M<n> <Name>` with Serves, Exit criteria, Target, and Status; its ID is used once."),
  rule("strategy/milestone-status", "error", false, "A milestone's Status is active, planned, or `done (YYYY-MM-DD)`; Target is none or YYYY-MM-DD."),
  rule("strategy/serves", "error", false, "Every `Serves` V line exists in `VISION.md`."),
  rule("strategy/bet", "error", false, "A bet is `B<n>: <statement>` with Evidence, We will know when, and Status (open, won, or lost)."),
  rule("strategy/assumption", "error", false, "An assumption is `A<n>: <statement>` with Test and Status (untested, holds, or broken)."),
  rule("strategy/not-doing", "warning", false, "A Not doing line has `Why:` and `Revisit:`."),
  rule("strategy/decision", "error", false, "A decision is `<YYYY-MM-DD> <decision>. Why: <reason>. Rejected: <alternatives>.`"),
  rule("strategy/decision-order", "error", true, "Decisions are newest first."),

  // NOW.md
  rule("now/fields", "error", false, "`NOW.md` lists Status, Item, Session, Stage, Brief, Milestone, Spec, Plan, and Started, in that order, optionally with Serves, Owner, Size, Depends on, and Revisits after Milestone, and then an optional Note."),
  rule("now/sections", "error", false, "`NOW.md` has `## Done when` then `## Checkpoint`."),
  rule("now/status", "error", false, "Status is idle or active."),
  rule("now/idle", "error", false, "When idle, every field except Status is empty, and so are Done when and the checkpoint."),
  rule("now/active", "error", false, "When active: Item is `R-NNN <Title>`, Session is set, Stage is design, plan, execute, or finish, Started is YYYY-MM-DD, and Done when has a check."),
  rule("now/checkpoint", "error", false, "A filled checkpoint is `## Checkpoint YYYY-MM-DD HH:MM` with Stopped at, Next action, Start with, Decisions, and Context (Open question is optional)."),
  rule("now/not-in-roadmap", "error", false, "The active item is not also in `ROADMAP.md`."),
  rule(
    "now/item",
    "error",
    false,
    "When active, Serves lists V IDs from `VISION.md`, Owner is agent, user, or both, Size is S, M, or L, Depends on lists existing IDs or none, and Revisits is one existing ID or empty.",
  ),

  // ROADMAP.md
  rule("roadmap/sections", "error", false, "`ROADMAP.md` has `## Next` then `## Later`, and no other level-2 section."),
  rule("roadmap/item", "error", false, "An item is `### R-NNN <Title>` (at least 3 digits) with Serves, Done when, Size, and Status."),
  rule("roadmap/owner", "error", false, "Owner is agent, user, or both."),
  rule("roadmap/size", "error", false, "Size is S, M, or L."),
  rule("roadmap/status", "error", false, "Status is ready, paused, or `blocked (<reason>, since YYYY-MM-DD)`."),
  rule("roadmap/next-max", "error", false, "Next holds at most the `Max items in Next` in `config.md`."),
  rule("roadmap/id-unique", "error", false, "An item ID appears once across `ROADMAP.md`, `NOW.md`, and the `LOG.md` Done and Dropped lines: IDs are never reused."),
  rule("roadmap/depends", "error", false, "Every `Depends on` ID exists in `ROADMAP.md`, `NOW.md`, or `LOG.md`, is not the item itself, and forms no cycle."),
  rule("roadmap/serves", "error", false, "Every `Serves` V line exists in `VISION.md`."),
  rule("roadmap/milestone", "error", false, "`Milestone` names a milestone in `STRATEGY.md`, or is none."),
  rule("roadmap/revisits", "error", false, "`Revisits` names an item in the `LOG.md` Done lines."),
  rule("roadmap/later-order", "warning", false, "Later is grouped by milestone in `STRATEGY.md` order, unassigned last (moving items is `pm-roadmap`'s edit, not a fix)."),

  // LOG.md
  rule("log/sections", "error", false, "`LOG.md` has `## Done`, `## Dropped`, and `## Reviews`, in that order."),
  rule("log/line", "error", false, "Each line starts with YYYY-MM-DD; a Done line is `<date> R-NNN <Title>. Milestone: <M or none>. Owner: <owner>. Plan: <path or none>. Result: <evidence>.`; a Dropped line has `Reason:`."),
  rule("log/order", "error", true, "Each section is newest first (a stable sort by date)."),
  rule("log/id-unique", "error", false, "An ID has at most one Done line."),

  // RISKS.md
  rule("risks/sections", "error", false, "`RISKS.md` has `## Open`, `## Closed`, and `## Removed`, in that order."),
  rule("risks/risk", "error", false, "A risk is `### RK-NNN <Title>` with every register field, in the register's order; Closed only on a closed risk."),
  rule("risks/values", "error", false, "Likelihood and Impact are low, medium, or high; RAG is red, amber, or green; Owner is agent, user, or both; Raised starts with a date; Reviewed is never or a date."),
  rule("risks/rag", "error", true, "RAG is the value Likelihood × Impact derives (**RAG**, Shared definitions), unless RAG override gives a reason."),
  rule("risks/section-status", "error", false, "An open risk is open, mitigating, or accepted with no Closed; a closed risk is closed with `Closed: YYYY-MM-DD: <reason>`."),
  rule("risks/order", "error", true, "Open is ordered red, amber, green, then by ID."),
  rule("risks/id-unique", "error", false, "A risk ID appears once across Open, Closed, and Removed."),
  rule("risks/removed", "error", false, "A removed risk is `- YYYY-MM-DD RK-NNN <title>. Reason: <reason>.`"),

  // ENGINEERING.md
  rule("engineering/sections", "error", false, "`ENGINEERING.md` has `## Technology`, `## Principles`, and `## Removed`, in that order."),
  rule("engineering/technology", "error", false, "A technology is `### <Name>` with Kind, Version, Reason, Decision, Source, and Added, in that order; its name is unique in the section (ignoring case)."),
  rule("engineering/principle", "error", false, "A principle is `### EP-NNN <Title>` with Rule, Applies to, Check, Decision, Source, and Added, in that order."),
  rule("engineering/values", "error", false, "Check is a backticked command or `review`; Decision is none or an existing ADR ID; Source is not empty; Added is YYYY-MM-DD."),
  rule("engineering/decision-current", "warning", false, "A `Decision` ADR is not superseded or deprecated (the fix is `pm-engineering change`)."),
  rule("engineering/id-unique", "error", false, "A principle ID appears once across Principles and Removed."),
  rule("engineering/order", "error", true, "Technology is alphabetical, Principles by ID, Removed newest first."),
  rule("engineering/removed", "error", false, "A removed line is `- YYYY-MM-DD <Name or EP-NNN title>. Reason: <reason>.`"),

  // decisions/ADR-*.md
  rule("adr/header", "error", false, "An ADR starts `# ADR-NNN <Title>` with Status, Date, Category, Supersedes, Item, and Source, in order; Status is proposed, accepted, `superseded by ADR-NNN`, or deprecated; Date is YYYY-MM-DD; Supersedes is `ADR-NNN` or none; Item is `R-NNN` or none; Category and Source are not empty."),
  rule("adr/sections", "error", false, "An ADR has `## Context`, `## Decision`, `## Alternatives`, and `## Consequences`, in order."),
  rule("adr/id", "error", false, "An ADR file is named `ADR-NNN-<slug>.md`, its ID matches its heading, and no two ADRs share an ID."),
  rule("adr/links", "error", false, "`Supersedes` and a `superseded by` Status name an existing ADR and agree with each other; `Item` names an item in `ROADMAP.md`, `NOW.md`, or the `LOG.md` Done or Dropped lines, or is none."),

  // inbox/*.md
  rule("inbox/filename", "error", false, "An inbox file is named `YYYY-MM-DD-HHMM-<slug>.md`, the slug in lower-case kebab case."),
  rule("inbox/fields", "error", false, "Captured is `YYYY-MM-DD HH:MM`; Source is user or `agent (<skill or item and stage>)`; Kind is feature, bug, improvement, question, inspiration, or tech-debt; Discuss is yes or no; Reviewed is never or a date; a bug has a Severity of blocker, major, minor, or cosmetic."),
  rule("inbox/idea", "error", false, "`## Idea` holds the idea."),
  rule("inbox/bug", "warning", false, "A bug has a `## Reproduction` section; only a bug has a Severity."),
  rule("inbox/sections", "warning", false, "An inbox file uses only the Idea, Reproduction, Links, and Notes sections."),

  // briefs/*.md
  rule("brief/filename", "error", false, "A brief is named `R-NNN-<slug>.md` or `YYYY-MM-DD-<slug>.md`."),
  rule("brief/header", "error", false, "A brief has Status (shaping, parked, `on roadmap (<IDs>)`, done, or dropped), Origin, and Updated (YYYY-MM-DD)."),
  rule("brief/sections", "error", false, "A brief has Problem, Who and evidence, Original idea, Proposal, Alternatives considered, Challenges and answers, Ramifications, Done when, Size and slicing, Open questions, and Decision, in that order, then optionally Revisions."),

  // STACK.md and PAUSE.md
  rule("stack/entry", "error", false, "A stack entry is `### R-NNN <Title>` with Pushed, Branch, Stage, Reason, Done when, and Checkpoint."),
  rule("pause/fields", "error", false, "`PAUSE.md` has Paused (`YYYY-MM-DD HH:MM`), Session, Item, Running, and Files, then `## Resume with` (Next action, Start with, Open question) and `## Context`."),

  // Titles, for every file whose format caps them.
  rule("title/length", "warning", false, "An inbox file's, a risk's, or a principle's title is at most 8 words."),

  // The export, when pm-export is installed beside pm-lint.
  rule("export/build", "error", false, "The PM files build into an export that matches `pm-export`'s schema (`pm-export`'s own builder and validator)."),
  rule("export/file", "error", false, "`planning.json`, when it is checked, matches `planning.schema.json`."),
];

export const RULE = new Map(RULES.map((entry) => [entry.id, entry]));
