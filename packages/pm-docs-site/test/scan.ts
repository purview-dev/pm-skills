// Reads one built page for the link test: the known IDs and brief paths in its
// main content that are not inside a link, its internal links, its element ids,
// and its `Linked from` section. Uses Bun's built-in HTMLRewriter.

import { refPattern } from '../src/lib/ref-boundary.ts';

export interface PageScan {
	/** Known keys found in text with no `<a>` ancestor (the page's own `<h1>`, scripts, styles, and `<option>`s are exempt). */
	unlinked: string[];
	/** Internal links (`href` starting `/`) inside `<main>`; `derived` inside `Linked from` or a `<template>`. */
	links: { href: string; derived: boolean }[];
	/** Every `id` attribute on the page. */
	ids: Set<string>;
	/** The `<h1>` text. */
	title: string;
	/** The hrefs listed inside `[data-linked-from]`, without fragments. */
	linkedFrom: Set<string>;
	hasLinkedFrom: boolean;
}

type Frame = { main: boolean; link: boolean; h1: boolean; derived: boolean; linkedFrom: boolean; code: boolean };

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function scanPage(html: string, known: Set<string>): Promise<PageScan> {
	const keys = [...known].sort((a, b) => b.length - a.length).map(escape);
	const pattern = keys.length > 0 ? refPattern(keys) : null;
	const scan: PageScan = { unlinked: [], links: [], ids: new Set(), title: '', linkedFrom: new Set(), hasLinkedFrom: false };
	const root: Frame = { main: false, link: false, h1: false, derived: false, linkedFrom: false, code: false };
	const stack: Frame[] = [root];
	let buffer = '';
	let bufferFrame = root;

	const flush = () => {
		const frame = bufferFrame;

		if (frame.h1) scan.title += buffer;
		if (pattern && frame.main && !frame.link && !frame.h1 && !frame.code) {
			for (const match of buffer.matchAll(pattern)) scan.unlinked.push(match[0]);
		}
		buffer = '';
	};

	const rewriter = new HTMLRewriter().onDocument({
		text(chunk) {
			const frame = stack.at(-1)!;

			if (frame !== bufferFrame) {
				flush();
				bufferFrame = frame;
			}
			buffer += chunk.text;
		},
	});

	rewriter.on('*', {
		element(element) {
			flush();
			const parent = stack.at(-1)!;
			const tag = element.tagName.toLowerCase();
			const id = element.getAttribute('id');

			if (id) scan.ids.add(id);

			const frame: Frame = {
				main: parent.main || tag === 'main',
				link: parent.link || tag === 'a',
				h1: parent.h1 || tag === 'h1',
				derived: parent.derived || tag === 'template' || element.hasAttribute('data-linked-from'),
				linkedFrom: parent.linkedFrom || element.hasAttribute('data-linked-from'),
				// Not prose: scripts, styles, and a <select>'s options (the Board's filters), which cannot hold a link.
				code: parent.code || tag === 'script' || tag === 'style' || tag === 'option',
			};

			if (element.hasAttribute('data-linked-from')) scan.hasLinkedFrom = true;

			const href = element.getAttribute('href');

			if (tag === 'a' && href?.startsWith('/') && frame.main) {
				scan.links.push({ href, derived: frame.derived });
				if (frame.linkedFrom) scan.linkedFrom.add(href.split('#')[0]!);
			}

			if (!element.canHaveContent || element.selfClosing) return;

			stack.push(frame);
			bufferFrame = frame;
			element.onEndTag(() => {
				flush();
				stack.pop();
				bufferFrame = stack.at(-1)!;
			});
		},
	});

	await rewriter.transform(new Response(html)).text();
	flush();

	return scan;
}
