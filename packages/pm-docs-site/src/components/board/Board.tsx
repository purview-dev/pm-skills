// The Board island: the filter bar, the five column headers with their
// collapse toggles, and the cards in lanes, in one CSS grid (.plan-columns in
// board.astro, components.css). It is server-rendered, so without JavaScript
// every card shows and the filter bar stays hidden. The item popup is not
// here: a card's title keeps `a.plan-item-link[data-item]`, which
// src/scripts/plan.ts opens from the page's ItemDetail templates. The filter
// and group state lives in the URL (useBoardUrlState.ts); `.plan-board__body`
// (the header row and the lanes) is hidden while <html> has the pending mark.
import { useEffect, useState } from 'react';

import { COLUMNS, DEFAULT_STATE, isFiltered, lanes, matches } from '../../lib/board';
import type { BoardCard, BoardFilters, ColumnName, GroupBy } from '../../lib/board';
import type { Owner } from '../../lib/planning-types';
import KanbanItemCard from './KanbanItemCard';
import TaskKanbanCard from './TaskKanbanCard';
import { useBoardUrlState } from './useBoardUrlState';

interface Props {
	cards: BoardCard[];
	milestones: { id: string; name: string }[];
}

/** Collapsed columns: the key the inline pre-paint script in PlanInteractions.astro also reads. */
const STORAGE_KEY = 'pm-docs-site:board:collapsed';

/** The collapsed column names in storage; junk or no storage is none. */
function readCollapsed(): Set<string> {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

		return new Set(Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string') : []);
	} catch {
		return new Set();
	}
}

function writeCollapsed(names: ReadonlySet<string>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...names]));
	} catch {
		// No storage (private mode, a blocked origin): the state lasts until the page closes.
	}
}

/** The root attribute the collapse CSS reads (components.css). */
function applyCollapsed(names: ReadonlySet<string>): void {
	document.documentElement.dataset.boardCollapsed = [...names].join(' ');
}

/** The owner as a card's initials, as `initials` in planning.ts (which cannot load in the browser). A missing owner means `agent`. */
function initials(owner: Owner | null): string {
	return owner === 'user' ? 'YOU' : owner === 'both' ? 'AG+U' : 'AG';
}

/** The id of a column's cell in a lane: `col-x-cards` in the ungrouped lane, `col-x-cards-<lane>` otherwise. */
function cellId(column: ColumnName, lane: string): string {
	return lane === 'all' ? `col-${column}-cards` : `col-${column}-cards-${lane}`;
}

function Card({ card }: { card: BoardCard }) {
	return (
		<div data-card={card.key} data-owner={card.owner ?? 'none'} data-milestone={card.milestone ?? 'none'} data-size={card.size ?? 'none'} data-rag={card.rag}>
			{card.column === 'now' ? (
				<TaskKanbanCard
					task={card.title}
					taskRuns={card.titleRuns}
					date={card.started ?? ''}
					assigneeInitials={initials(card.owner)}
					size={card.size}
					rag={card.rag}
					progress={card.progress ?? 0}
					href={card.href}
					itemId={card.id}
				/>
			) : (
				<KanbanItemCard
					title={card.title}
					titleRuns={card.titleRuns}
					size={card.size}
					rag={card.rag}
					tag={card.tag}
					tagHref={card.tagHref}
					assignee={initials(card.owner)}
					detail={card.detail}
					href={card.href}
					itemId={card.id}
				/>
			)}
		</div>
	);
}

interface FilterProps {
	id: string;
	label: string;
	value: string | null;
	options: { value: string; label: string }[];
	onChange: (value: string | null) => void;
}

function Filter({ id, label, value, options, onChange }: FilterProps) {
	return (
		<div className="plan-board__filter">
			<label htmlFor={id}>{label}</label>
			<select id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}>
				<option value="">All</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}

const GROUPS: { value: GroupBy; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'milestone', label: 'Milestone' },
	{ value: 'owner', label: 'Owner' },
];

export default function Board({ cards, milestones }: Props) {
	const [state, setState, hydrated] = useBoardUrlState(milestones.map((milestone) => milestone.id));
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

	useEffect(() => {
		const stored = readCollapsed();

		applyCollapsed(stored);
		setCollapsed(stored);
	}, []);

	const toggle = (name: ColumnName) => {
		const next = new Set(collapsed);

		if (next.has(name)) next.delete(name);
		else next.add(name);
		writeCollapsed(next);
		applyCollapsed(next);
		setCollapsed(next);
	};

	const setFilter = (key: keyof BoardFilters) => (value: string | null) => setState((current) => ({ ...current, filters: { ...current.filters, [key]: value } }));

	const visible = cards.filter((card) => matches(card, state.filters));
	const filtered = isFiltered(state);
	const grouped = state.group !== 'none';
	const rows = lanes(visible, state.group, milestones);

	return (
		<>
			<div className="plan-board__filters" hidden={!hydrated}>
				<Filter
					id="board-owner"
					label="Owner"
					value={state.filters.owner}
					options={[
						{ value: 'agent', label: 'agent' },
						{ value: 'user', label: 'user' },
						{ value: 'both', label: 'both' },
					]}
					onChange={setFilter('owner')}
				/>
				<Filter
					id="board-milestone"
					label="Milestone"
					value={state.filters.milestone}
					options={[...milestones.map((milestone) => ({ value: milestone.id, label: `${milestone.id} ${milestone.name}` })), { value: 'none', label: 'No milestone' }]}
					onChange={setFilter('milestone')}
				/>
				<Filter
					id="board-size"
					label="Size"
					value={state.filters.size}
					options={[
						{ value: 'S', label: 'S' },
						{ value: 'M', label: 'M' },
						{ value: 'L', label: 'L' },
					]}
					onChange={setFilter('size')}
				/>
				<Filter
					id="board-rag"
					label="Risk"
					value={state.filters.rag}
					options={[
						{ value: 'red', label: 'red' },
						{ value: 'amber', label: 'amber' },
						{ value: 'green', label: 'green' },
						{ value: 'none', label: 'No risk' },
					]}
					onChange={setFilter('rag')}
				/>
				<div className="plan-board__filter">
					<label htmlFor="board-group">Group by</label>
					<select id="board-group" value={state.group} onChange={(event) => setState((current) => ({ ...current, group: event.target.value as GroupBy }))}>
						{GROUPS.map((group) => (
							<option key={group.value} value={group.value}>
								{group.label}
							</option>
						))}
					</select>
				</div>
				<button type="button" id="board-clear" className="plan-board__clear" disabled={!filtered} onClick={() => setState((current) => ({ ...current, filters: DEFAULT_STATE.filters }))}>
					Clear
				</button>
			</div>

			<div className="plan-board__body">
				{COLUMNS.map(({ name, title }) => {
					const shut = collapsed.has(name);

					return (
						<section key={name} className={grouped ? 'plan-column' : 'plan-column plan-column--joined'} data-column={name} data-collapsed={shut ? '' : undefined} aria-labelledby={`col-${name}`}>
							<h2 id={`col-${name}`}>
								<button type="button" className="plan-column__toggle" aria-expanded={!shut} aria-controls={rows.map((lane) => cellId(name, lane.key)).join(' ')} onClick={() => toggle(name)}>
									<span className="plan-column__name">{title}</span> <span className="plan-column__count">{visible.filter((card) => card.column === name).length}</span>
								</button>
							</h2>
						</section>
					);
				})}

				{rows.map((lane) => (
					<div key={lane.key} className="plan-lane" data-lane={lane.key}>
						{grouped && (
							<div className="plan-lane__header">
								<span className="plan-lane__name">{lane.label}</span> <span className="plan-lane__count">{lane.cards.length}</span>
							</div>
						)}
						{COLUMNS.map(({ name }) => {
							const inCell = lane.cards.filter((card) => card.column === name);

							return (
								<div key={name} className="plan-column__cards" data-lane-column={name} id={cellId(name, lane.key)}>
									{!grouped && inCell.length === 0 && <p className="plan-empty">{filtered ? 'Nothing matches' : 'Nothing here'}</p>}
									{inCell.map((card) => (
										<Card key={card.key} card={card} />
									))}
								</div>
							);
						})}
					</div>
				))}
			</div>
		</>
	);
}
