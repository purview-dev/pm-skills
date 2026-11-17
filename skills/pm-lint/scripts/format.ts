// The Markdown formatting rules (`format/*`): a dependency-free subset of the
// markdownlint defaults that the PM templates already follow, so PM files
// stay clean in a repository that runs markdownlint and in one that does not.
// Code fences are never reformatted; HTML comments keep their contents.

import { FENCE, headings, isContent, parseLines, type Line } from "./markdown.ts";

export interface Issue {
  line: number;
  rule: string;
  message: string;
}

const BULLET = /^(\s*)([-*+]|\d+[.)]) /;
const TOP_LIST = /^([-*+]|\d+[.)]) /;
const blank = (line: Line | undefined) => line !== undefined && line.text.trim() === "";
const isHeading = (line: Line | undefined) => line !== undefined && isContent(line) && /^#{1,6}([ \t]|$)/.test(line.text);
const colZeroFence = (line: Line | undefined) => line !== undefined && /^(```|~~~)/.test(line.text);

/** Where each top-level list block starts and ends (content lines only). */
function listBlocks(lines: Line[]): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let current: { start: number; end: number } | null = null;
  for (const line of lines) {
    const content = isContent(line);
    if (content && TOP_LIST.test(line.text)) {
      current ??= { start: line.n, end: line.n };
      current.end = line.n;
    } else if (current && content && /^\s+\S/.test(line.text)) {
      current.end = line.n;
    } else if (current && line.fence && /^\s+/.test(line.text)) {
      current.end = line.n; // a fence indented inside a list item
    } else if (current) {
      out.push(current);
      current = null;
    }
  }
  if (current) out.push(current);
  return out;
}

/** Fences at column 0: [opening line, closing line]. */
function fences(lines: Line[]): [number, number][] {
  const out: [number, number][] = [];
  let open: number | null = null;
  for (const line of lines) {
    if (!line.fence || !FENCE.test(line.text) || !colZeroFence(line)) continue;
    if (open === null) open = line.n;
    else {
      out.push([open, line.n]);
      open = null;
    }
  }
  return out;
}

export function checkFormat(text: string): Issue[] {
  const issues: Issue[] = [];
  const add = (line: number, rule: string, message: string) => issues.push({ line, rule, message });
  const normal = text.replace(/\r\n/g, "\n");
  const lines = parseLines(normal);
  const get = (n: number) => lines[n - 1];

  if (normal.length > 0 && (!normal.endsWith("\n") || normal.endsWith("\n\n"))) {
    add(lines.length || 1, "format/final-newline", normal.endsWith("\n") ? "The file ends with blank lines." : "The file does not end with a newline.");
  }

  let previousBlank = false;
  for (const line of lines) {
    if (!line.fence && /[ \t]+$/.test(line.text)) add(line.n, "format/trailing-space", "Trailing whitespace.");
    if (!line.fence && line.text.includes("\t")) add(line.n, "format/tabs", "Hard tab.");
    const isBlank = line.text.trim() === "";
    if (isBlank && previousBlank && !line.fence) add(line.n, "format/blank-lines", "Two blank lines in a row.");
    previousBlank = isBlank && !line.fence;
    if (!isContent(line)) continue;
    if (/^ {0,3}[*+] /.test(line.text) || /^\s+[*+] /.test(line.text)) add(line.n, "format/list-marker", "Use `-` for bullets.");
    if (/^#{1,6}[^#\s]/.test(line.text)) add(line.n, "format/heading-space", "Put one space after the #s.");
    else if (/^#{1,6} {2,}\S/.test(line.text) || /^#{1,6} .*\s#+\s*$/.test(line.text)) add(line.n, "format/heading-space", "One space after the #s, and no closing #s.");
  }

  for (const line of lines) {
    if (!isHeading(line)) continue;
    if (line.n > 1 && !blank(get(line.n - 1))) add(line.n, "format/heading-blank", "Put a blank line before the heading.");
    if (line.n < lines.length && !blank(get(line.n + 1))) add(line.n, "format/heading-blank", "Put a blank line after the heading.");
  }

  for (const block of listBlocks(lines)) {
    const before = get(block.start - 1);
    const after = get(block.end + 1);
    if (before && !blank(before) && !isHeading(before)) add(block.start, "format/list-blank", "Put a blank line before the list.");
    if (after && !blank(after) && !isHeading(after)) add(block.end, "format/list-blank", "Put a blank line after the list.");
  }

  for (const [open, close] of fences(lines)) {
    const before = get(open - 1);
    const after = get(close + 1);
    if (before && !blank(before)) add(open, "format/fence-blank", "Put a blank line before the code fence.");
    if (after && !blank(after)) add(close, "format/fence-blank", "Put a blank line after the code fence.");
  }

  const heads = headings(lines);
  const firstContent = lines.find((line) => line.text.trim() !== "" && !line.comment);
  if (firstContent && !(isHeading(firstContent) && /^# /.test(firstContent.text))) add(firstContent.n, "format/first-heading", "Start the file with a level-1 heading.");
  heads.filter((h) => h.level === 1).slice(1).forEach((h) => add(h.n, "format/single-h1", "A second level-1 heading."));
  heads.forEach((h, i) => {
    const previous = heads[i - 1];
    if (previous && h.level > previous.level + 1) add(h.n, "format/heading-increment", `Level ${h.level} heading after level ${previous.level}.`);
  });

  let open: { marker: string; n: number } | null = null;
  for (const line of lines) {
    if (line.comment) continue;
    const marker = FENCE.exec(line.text)?.[1];
    if (!marker) continue;
    if (open === null) open = { marker, n: line.n };
    else if (marker === open.marker) open = null;
  }
  if (open) add(open.n, "format/unclosed", "A code fence is not closed.");
  const opened = normal.split("<!--").length - 1;
  const closed = normal.split("-->").length - 1;
  if (opened > closed) add(lines.findLast((line) => line.text.includes("<!--"))?.n ?? 1, "format/unclosed", "An HTML comment is not closed.");

  return issues.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

/** Apply every fixable `format/*` rule. Code fences keep their contents; unfixable issues are left for `check`. */
export function fixFormat(text: string): string {
  let lines = parseLines(text.replace(/\r\n/g, "\n"));

  // Line-local fixes.
  let out = lines.map((line) => {
    if (line.fence) return line.text;
    let next = line.text.replace(/[ \t]+$/, "").replace(/\t/g, "    ");
    if (isContent(line)) {
      next = next.replace(/^(\s*)[*+] /, "$1- ");
      const heading = /^(#{1,6})[ \t]*(.*?)(?:\s+#+)?\s*$/.exec(next);
      if (heading && /^#{1,6}(\s|[^#\s])/.test(next) && heading[2] !== "") next = `${heading[1]} ${heading[2]}`;
    }
    return next;
  });

  // Blank lines around headings, lists, and fences.
  lines = parseLines(out.join("\n") + "\n");
  const before = new Set<number>();
  const after = new Set<number>();
  for (const line of lines) {
    if (!isHeading(line)) continue;
    before.add(line.n);
    after.add(line.n);
  }
  for (const block of listBlocks(lines)) {
    before.add(block.start);
    after.add(block.end);
  }
  for (const [open, close] of fences(lines)) {
    before.add(open);
    after.add(close);
  }
  const spaced: string[] = [];
  for (const line of lines) {
    if (before.has(line.n) && spaced.length && spaced.at(-1)!.trim() !== "") spaced.push("");
    spaced.push(line.text);
    const next = lines[line.n];
    if (after.has(line.n) && next && next.text.trim() !== "") spaced.push("");
  }

  // No two blank lines in a row outside fences; no blank lines at the start or end.
  lines = parseLines(spaced.join("\n") + "\n");
  out = [];
  for (const line of lines) {
    if (!line.fence && line.text.trim() === "" && (out.length === 0 || out.at(-1)!.trim() === "")) continue;
    out.push(line.text);
  }
  while (out.length && out.at(-1)!.trim() === "") out.pop();
  return out.length ? out.join("\n") + "\n" : "";
}

export { BULLET };
