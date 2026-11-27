// The Board and Roadmap in the browser: a plain click on a card opens its item
// popup (any other click is the browser's). Without this script every card is
// a link. A click on the dialog element itself (the backdrop; its content
// sits in `.plan-dialog__frame`, never directly in the dialog) closes the
// popup. The Board's column collapse lives in its island
// (src/components/board/Board.tsx).
//
// When a mousedown and the matching mouseup land on different elements (a
// drag, or a text selection released past the dialog's edge), the browser
// retargets the synthesised `click` event to their nearest common ancestor,
// which is the dialog itself whenever either end was the backdrop. So a
// click's own target cannot tell a genuine backdrop click from a drag that
// merely started or ended there: `pointerdown` and `pointerup` are not
// retargeted, so this records both separately and closes only when neither
// end of the gesture left the backdrop.

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

/** True for the dialog element itself (the backdrop), never its frame. */
function isDialogBackdrop(target: EventTarget | null): target is HTMLDialogElement {
	return target instanceof HTMLDialogElement && target.matches('dialog[data-item-dialog]');
}

/** The documents start() has run for, so a second import or call never stacks the listeners. */
const started = new WeakSet<Document>();

/** Adds the popup's three document listeners, once per document. */
export function start(doc: Document = document): void {
	if (started.has(doc)) return;
	started.add(doc);

	let pointerDownOnBackdrop = false;
	let pointerUpOnBackdrop = false;

	doc.addEventListener('pointerdown', (event) => {
		pointerDownOnBackdrop = isDialogBackdrop(event.target);
	});

	doc.addEventListener('pointerup', (event) => {
		pointerUpOnBackdrop = isDialogBackdrop(event.target);
	});

	doc.addEventListener('click', (event) => {
		const target = event.target as Element | null;
		const link = target?.closest<HTMLAnchorElement>('a[data-item]');

		if (link) {
			if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			event.preventDefault();
			openItem(link);
			return;
		}

		if (isDialogBackdrop(target) && pointerDownOnBackdrop && pointerUpOnBackdrop) {
			target.close();
			return;
		}

		if (target?.closest('[data-item-dialog-close]')) {
			target.closest('dialog')?.close();
		}
	});
}

// Tests import this module with no DOM; the browser always has one.
if (typeof document !== 'undefined') start();
