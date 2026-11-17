// The Board and Roadmap in the browser: a plain click on a card opens its item
// popup (any other click is the browser's), and Board columns collapse and
// remember it. Without this script every card is a link and every column open.

export const STORAGE_KEY = 'pm-docs-site:board:collapsed';

/** The collapsed column names in storage; junk or no storage is none. */
export function readCollapsed(): Set<string> {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

		return new Set(Array.isArray(value) ? value.filter((name): name is string => typeof name === 'string') : []);
	} catch {
		return new Set();
	}
}

function writeCollapsed(names: Set<string>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...names]));
	} catch {
		// No storage (private mode, a blocked origin): the state lasts until the page closes.
	}
}

function applyCollapsed(names: Set<string>): void {
	document.documentElement.dataset.boardCollapsed = [...names].join(' ');

	for (const column of document.querySelectorAll<HTMLElement>('[data-column]')) {
		const collapsed = names.has(column.dataset.column ?? '');

		column.toggleAttribute('data-collapsed', collapsed);
		column.querySelector('.plan-column__toggle')?.setAttribute('aria-expanded', String(!collapsed));
	}
}

function openItem(link: HTMLAnchorElement): void {
	const dialog = document.querySelector<HTMLDialogElement>('dialog[data-item-dialog]');
	const template = document.querySelector<HTMLTemplateElement>(`template[data-item-detail="${CSS.escape(link.dataset.item ?? '')}"]`);

	if (!dialog || !template) {
		window.location.assign(link.href);
		return;
	}

	dialog.querySelector('#plan-dialog-title')!.textContent = link.textContent?.trim() ?? '';
	dialog.querySelector('[data-item-dialog-body]')!.replaceChildren(template.content.cloneNode(true));
	dialog.querySelector('[data-item-dialog-open]')!.setAttribute('href', link.getAttribute('href') ?? '');
	dialog.addEventListener('close', () => link.focus(), { once: true });
	dialog.showModal();
}

function start(): void {
	const collapsed = readCollapsed();

	applyCollapsed(collapsed);

	document.addEventListener('click', (event) => {
		const target = event.target as Element | null;
		const link = target?.closest<HTMLAnchorElement>('a[data-item]');

		if (link) {
			if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			openItem(link);
			return;
		}

		if (target?.closest('[data-item-dialog-close]')) {
			target.closest('dialog')?.close();
			return;
		}

		const toggle = target?.closest<HTMLButtonElement>('.plan-column__toggle');
		const name = toggle?.closest<HTMLElement>('[data-column]')?.dataset.column;

		if (name) {
			if (collapsed.has(name)) collapsed.delete(name);
			else collapsed.add(name);
			writeCollapsed(collapsed);
			applyCollapsed(collapsed);
		}
	});
}

start();
