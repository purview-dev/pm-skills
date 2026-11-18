// The Board and Roadmap in the browser: a plain click on a card opens its item
// popup (any other click is the browser's). Without this script every card is
// a link. The Board's column collapse lives in its island
// (src/components/board/Board.tsx).

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
		}
	});
}

start();
