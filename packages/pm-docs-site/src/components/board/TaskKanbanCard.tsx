/**
 * TaskKanbanCard — Agile task card with priority labels, progress completion bar, and due date.
 *
 * From the Astro Components Kit by Konstantin (https://astrocomponents.dev/docs/task-kanban-card/,
 * https://github.com/konstantinWDK/astro-components), MIT License. Ported to React from its
 * manual-install source (via ../lib/TaskKanbanCard.astro); the changes are that hard-coded
 * dark-theme colours use Starlight theme variables, so the card reads in light and dark themes;
 * the task can be a link, for the site's item popup and backlinks (href, itemId), and a task that
 * is not a link links known IDs; the tag shows the item's size (S, M, L as the kit's low, med,
 * high) and is omitted without one; a RAG dot sits beside it; and the card has no role. Its
 * styles are in src/styles/kanban.css.
 */
import type { CardRag, LinkRun } from '../../lib/board';
import type { Size } from '../../lib/planning-types';
import LinkRuns from './LinkRuns';

interface Props {
	task: string;
	taskRuns: LinkRun[];
	date: string;
	assigneeInitials: string;
	size: Size | null;
	rag: CardRag;
	progress: number;
	href: string | null;
	itemId: string | null;
}

const sizeVariant: Record<Size, 'low' | 'med' | 'high'> = { S: 'low', M: 'med', L: 'high' };

export default function TaskKanbanCard({ task, taskRuns, date, assigneeInitials, size, rag, progress, href, itemId }: Props) {
	return (
		<div className="task-card">
			<div className="task-card__tags">
				<span className="k-item__badges">
					{size && (
						<span className={`task-card__tag task-card__tag--${sizeVariant[size]}`} title={`Size ${size}`}>
							<span className="task-card__tag-dot" aria-hidden="true"></span>
							{size}
						</span>
					)}
					{rag !== 'none' && <span className="k-item__rag" data-rag={rag} role="img" aria-label={`RAG ${rag}`}></span>}
				</span>
				<span className="task-card__pct">{progress}%</span>
			</div>

			<p className="task-card__desc">
				{href ? (
					<a className="plan-item-link" href={href} data-item={itemId ?? undefined}>
						{task}
					</a>
				) : (
					<LinkRuns runs={taskRuns} />
				)}
			</p>

			<div className="task-card__progress-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Task progress">
				<div className="task-card__progress-bar" style={{ width: `${progress}%` }}></div>
			</div>

			<div className="task-card__footer">
				<div className="task-card__date">
					<svg className="task-card__date-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					<span>{date}</span>
				</div>

				<div className="task-card__assignee" title={`Assigned to ${assigneeInitials}`}>
					{assigneeInitials}
				</div>
			</div>
		</div>
	);
}
