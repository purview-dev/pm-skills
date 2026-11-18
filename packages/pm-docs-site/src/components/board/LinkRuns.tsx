// Prose with every known ID and brief path linked to its page: the island's
// LinkedText.astro. The runs are built at build time (board-data.ts).
import { Fragment } from 'react';

import type { LinkRun } from '../../lib/board';

export default function LinkRuns({ runs }: { runs: LinkRun[] }) {
	return (
		<>
			{runs.map((run, index) =>
				run.href ? (
					<a key={index} href={run.href} title={run.label ?? undefined}>
						{run.text}
					</a>
				) : (
					<Fragment key={index}>{run.text}</Fragment>
				),
			)}
		</>
	);
}
