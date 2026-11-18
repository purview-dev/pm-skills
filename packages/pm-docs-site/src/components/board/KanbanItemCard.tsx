/**
 * KanbanItemCard — Polished agile kanban ticket with priority pill, assignee avatar, attachment count, and comment indicators.
 *
 * From the Astro Components Kit by Konstantin (https://astrocomponents.dev/docs/kanban-item-card/,
 * https://github.com/konstantinWDK/astro-components), MIT License. Ported to React from its
 * manual-install source (via ../lib/KanbanItemCard.astro); the changes are that hard-coded
 * dark-theme colours use Starlight theme variables, so the card reads in light and dark themes;
 * the title (and tag) can be a link, for the site's item popup and backlinks (href, itemId,
 * tagHref), and the due-date line (and a title that is not a link) links known IDs; the pill
 * shows the item's size (S, M, L in the kit's low, medium, high colours) and is omitted without
 * one; a RAG dot sits beside it; the assignee chip is omitted for a card with no owner; and the
 * card is not focusable and has no role. Its styles are in src/styles/kanban.css.
 */
import type { CardRag, LinkRun } from '../../lib/board';
import type { Size } from '../../lib/planning-types';
import LinkRuns from './LinkRuns';

interface Props {
	title: string;
	titleRuns: LinkRun[];
	size: Size | null;
	rag: CardRag;
	tag: string;
	tagHref: string | null;
	/** Null with no owner: no chip, as the owner filter hides the card. */
	assignee: string | null;
	detail: LinkRun[];
	commentsCount?: number;
	attachmentsCount?: number;
	href: string | null;
	itemId: string | null;
}

/** The kit's low, medium, and high pill colours, by size. */
const sizeMap: Record<Size, { color: string; bg: string }> = {
	S: { color: '#059669', bg: 'rgba(16, 185, 129, 0.12)' },
	M: { color: '#d97706', bg: 'rgba(245, 158, 11, 0.12)' },
	L: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.12)' },
};

const iconProps = {
	className: 'k-item__icon',
	width: 13,
	height: 13,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
	'aria-hidden': true,
} as const;

export default function KanbanItemCard({ title, titleRuns, size, rag, tag, tagHref, assignee, detail, commentsCount = 0, attachmentsCount = 0, href, itemId }: Props) {
	const pill = size ? sizeMap[size] : null;

	return (
		<div className="k-item">
			<div className="k-item__head">
				{tagHref ? (
					<a className="k-item__tag" href={tagHref}>
						{tag}
					</a>
				) : (
					<span className="k-item__tag">{tag}</span>
				)}
				{(pill || rag !== 'none') && (
					<span className="k-item__badges">
						{pill && (
							<span className="k-item__priority" title={`Size ${size}`} style={{ color: pill.color, background: pill.bg, borderColor: `${pill.color}33` }}>
								<span className="k-item__priority-dot" style={{ background: pill.color }}></span>
								{size}
							</span>
						)}
						{rag !== 'none' && <span className="k-item__rag" data-rag={rag} role="img" aria-label={`RAG ${rag}`}></span>}
					</span>
				)}
			</div>

			<h4 className="k-item__title">
				{href ? (
					<a className="plan-item-link" href={href} data-item={itemId ?? undefined}>
						{title}
					</a>
				) : (
					<LinkRuns runs={titleRuns} />
				)}
			</h4>

			<div className="k-item__footer">
				<div className="k-item__meta">
					<div className="k-item__meta-item" title="Due Date">
						<svg {...iconProps}>
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						<span>
							<LinkRuns runs={detail} />
						</span>
					</div>

					{commentsCount > 0 && (
						<div className="k-item__meta-item" title={`${commentsCount} comments`}>
							<svg {...iconProps}>
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
							<span>{commentsCount}</span>
						</div>
					)}

					{attachmentsCount > 0 && (
						<div className="k-item__meta-item" title={`${attachmentsCount} attachments`}>
							<svg {...iconProps}>
								<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
							</svg>
							<span>{attachmentsCount}</span>
						</div>
					)}
				</div>

				{assignee && (
					<div className="k-item__assignee" title={`Assigned to ${assignee}`}>
						{assignee}
					</div>
				)}
			</div>
		</div>
	);
}
