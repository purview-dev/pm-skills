// The Decisions view: every ADR as a row, with a text search, status and
// category chips (superseded off by default), and grouping by category or
// status. Rows that do not match are hidden, never left out, so the page's
// links stay the same in every state. The state lives in the URL
// (useDecisionsUrlState).
import { DECISIONS_STATUSES, DEFAULT_DECISIONS_STATE, decisionsQuery, groupDecisions, matchesDecision, toggleStatus, type DecisionsGroup } from '../../lib/decisions';
import type { AdrStatus } from '../../lib/planning-types';
import { useDecisionsUrlState } from './useDecisionsUrlState';

/** A link to a known page, or plain text when that page is not built. */
export interface NamedRef {
	label: string;
	href: string | null;
}

/** One ADR as the island shows it; `text` is adrSearchText, computed at build time. */
export interface DecisionRow {
	id: string;
	title: string;
	status: AdrStatus | null;
	category: string | null;
	date: string | null;
	href: string;
	text: string;
	item: NamedRef | null;
	successor: NamedRef | null;
}

interface Props {
	rows: DecisionRow[];
	categories: string[];
	/** Some ADR has no status, so the `unknown` chip is shown. */
	hasUnknown: boolean;
}

const GROUPS: { value: DecisionsGroup; label: string }[] = [
	{ value: 'category', label: 'Category' },
	{ value: 'status', label: 'Status' },
	{ value: 'none', label: 'None' },
];

function Ref({ named }: { named: NamedRef }) {
	return named.href ? (
		<a href={named.href} title={named.label}>
			{named.label}
		</a>
	) : (
		<>{named.label}</>
	);
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);

export default function Decisions({ rows, categories, hasUnknown }: Props) {
	const [state, setState] = useDecisionsUrlState(categories);
	const chips = DECISIONS_STATUSES.filter((status) => hasUnknown || status !== 'unknown');
	const selected = chips.filter((status) => state.status.includes(status));
	const matches = (row: DecisionRow) => matchesDecision(row, state, row.text);
	const groups = groupDecisions(rows, state.group);
	const shown = rows.filter(matches).length;
	const isDefault = decisionsQuery(state) === '';

	return (
		<div className="decisions">
			<div className="decisions-controls">
				<label className="decisions-search">
					Search decisions
					<input type="search" value={state.q} onChange={(event) => setState({ ...state, q: event.currentTarget.value })} />
				</label>
				<div role="group" aria-label="Status" className="decisions-chips">
					{chips.map((status) => (
						<button
							key={status}
							type="button"
							className="decisions-chip"
							aria-pressed={state.status.includes(status)}
							onClick={() => setState({ ...state, status: toggleStatus(state.status, status, chips) })}
						>
							{status}
						</button>
					))}
				</div>
				{categories.length > 1 && (
					<div role="group" aria-label="Category" className="decisions-chips">
						{categories.map((category) => (
							<button
								key={category}
								type="button"
								className="decisions-chip"
								aria-pressed={state.category.includes(category)}
								onClick={() => setState({ ...state, category: toggle(state.category, category) })}
							>
								{category}
							</button>
						))}
					</div>
				)}
				<label className="decisions-group">
					Group by
					<select value={state.group} onChange={(event) => setState({ ...state, group: event.currentTarget.value as DecisionsGroup })}>
						{GROUPS.map((group) => (
							<option key={group.value} value={group.value}>
								{group.label}
							</option>
						))}
					</select>
				</label>
				<button type="button" className="decisions-clear" disabled={isDefault} onClick={() => setState(DEFAULT_DECISIONS_STATE)}>
					Clear
				</button>
			</div>

			<p className="decisions-count" aria-live="polite">
				{shown} of {rows.length} decisions
			</p>

			{groups.map((group) => {
				const visible = group.adrs.filter(matches).length;

				return (
					<section key={group.key} hidden={visible === 0}>
						{state.group !== 'none' && (
							<h2>
								{group.label} ({visible})
							</h2>
						)}
						<ul className="decisions-list">
							{group.adrs.map((row) => (
								<li key={row.id} hidden={!matches(row)} data-adr={row.id}>
									<a href={row.href}>
										<strong>{row.id}</strong> {row.title}
									</a>{' '}
									<span className={`adr-status adr-status--${row.status ?? 'unknown'}`}>{row.status ?? 'unknown'}</span>
									<span className="decisions-meta">
										{[row.category, row.date].filter(Boolean).join(' · ')}
										{row.item && (
											<>
												{' · '}
												<Ref named={row.item} />
											</>
										)}
										{row.successor && (
											<>
												{' · Superseded by '}
												<Ref named={row.successor} />
											</>
										)}
									</span>
								</li>
							))}
						</ul>
					</section>
				);
			})}

			{shown === 0 && (
				<p className="decisions-empty">
					No decisions match
					{state.q ? ` "${state.q}"` : ''}
					{` with status ${selected.length ? selected.join(', ') : 'none'}`}
					{state.category.length ? ` in ${state.category.join(', ')}` : ''}.
				</p>
			)}
		</div>
	);
}
