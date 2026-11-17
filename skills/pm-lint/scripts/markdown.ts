// A line-aware model of a PM Markdown file: which lines are content, code
// fences, or HTML comments; its headings and sections; and its `- Key: value`
// fields, each with the line it is on, so every finding can name a line.

export interface Line {
  /** 1-based line number. */
  n: number;
  text: string;
  /** Inside a fenced code block, or a fence delimiter. */
  fence: boolean;
  /** Inside an HTML comment (the templates keep their examples there). */
  comment: boolean;
}

export interface Heading {
  n: number;
  level: number;
  text: string;
}

export interface Bullet {
  /** Line of the `- ` marker. */
  n: number;
  /** Last line of the bullet, continuation lines included. */
  end: number;
  /** The bullet's text, continuation lines joined by one space. */
  text: string;
}

export interface Field {
  n: number;
  /** The key as written. */
  key: string;
  value: string;
}

export interface Section {
  heading: Heading | null;
  /** First and last line of the body (after the heading), inclusive. */
  start: number;
  end: number;
}

export const FENCE = /^ {0,3}(```|~~~)/;

export function parseLines(text: string): Line[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  // A file that ends with a newline has no last line after it.
  if (raw.length > 1 && raw.at(-1) === "") raw.pop();
  const out: Line[] = [];
  let fence: string | null = null;
  let comment = false;
  raw.forEach((line, i) => {
    let inFence = fence !== null;
    let inComment = comment;
    if (!comment) {
      const marker = FENCE.exec(line)?.[1];
      if (marker && (fence === null || marker === fence)) {
        inFence = true;
        fence = fence === null ? marker : null;
      }
    }
    if (fence === null && !inFence) {
      // A comment that opens on this line and does not close on it.
      const opens = line.lastIndexOf("<!--");
      const closes = line.lastIndexOf("-->");
      if (comment) {
        if (closes !== -1 && closes > opens) comment = false;
        inComment = true;
      } else if (opens !== -1 && closes < opens) {
        comment = true;
        inComment = line.trim().startsWith("<!--");
      } else if (line.trim().startsWith("<!--") && line.trim().endsWith("-->")) {
        inComment = true;
      }
    }
    out.push({ n: i + 1, text: line, fence: inFence, comment: inComment });
  });
  return out;
}

export const isContent = (line: Line) => !line.fence && !line.comment;

export function headings(lines: Line[]): Heading[] {
  return lines.filter(isContent).flatMap((line) => {
    const match = /^(#{1,6})[ \t]+(.*?)[ \t#]*$/.exec(line.text);
    return match ? [{ n: line.n, level: match[1]!.length, text: match[2]!.trim() }] : [];
  });
}

/** Sections at one heading level, inside `within` (default: the whole file). Index 0 is the text before the first. */
export function sections(lines: Line[], level: number, within?: Section): Section[] {
  const start = within?.start ?? 1;
  const end = within?.end ?? lines.length;
  const marks = headings(lines).filter((h) => h.n >= start && h.n <= end && h.level <= level);
  const out: Section[] = [];
  const first = marks.find((h) => h.level === level);
  out.push({ heading: null, start, end: (first?.n ?? end + 1) - 1 });
  marks.forEach((h, i) => {
    if (h.level !== level) return;
    const next = marks.slice(i + 1).find((other) => other.level <= level);
    out.push({ heading: h, start: h.n + 1, end: (next?.n ?? end + 1) - 1 });
  });
  return out;
}

export const findSection = (list: Section[], test: RegExp) => list.find((section) => section.heading && test.test(section.heading.text));

const at = (lines: Line[], n: number) => lines[n - 1]!;

/** Top-level `- ` bullets in a line range, with continuation lines; content lines only. */
export function bullets(lines: Line[], section: Pick<Section, "start" | "end">): Bullet[] {
  const out: Bullet[] = [];
  for (let n = section.start; n <= section.end; n++) {
    const line = at(lines, n);
    if (!isContent(line)) continue;
    if (/^[-*+] /.test(line.text)) {
      out.push({ n, end: n, text: line.text.slice(2).trim() });
    } else if (out.length && out.at(-1)!.end === n - 1 && /^\s+\S/.test(line.text)) {
      const last = out.at(-1)!;
      last.end = n;
      if (!/^\s+[-*+] /.test(line.text)) last.text += " " + line.text.trim();
    }
  }
  return out;
}

/** `- Key: value` bullets in a range, in order. Nested bullets and bullets without a colon are skipped. */
export function fields(lines: Line[], section: Pick<Section, "start" | "end">): Field[] {
  return bullets(lines, section).flatMap((bullet) => {
    const match = /^([A-Za-z][A-Za-z ]*?):(?:\s+(.*)|\s*)$/.exec(bullet.text);
    return match ? [{ n: bullet.n, key: match[1]!, value: (match[2] ?? "").trim() }] : [];
  });
}

export const fieldMap = (list: Field[]) => {
  const map = new Map<string, Field>();
  for (const field of list) if (!map.has(field.key.toLowerCase())) map.set(field.key.toLowerCase(), field);
  return map;
};

/** A template placeholder (`[M1]`, `<path>`) or an empty value. */
export const isPlaceholder = (text: string | undefined | null) => {
  const trimmed = text?.trim() ?? "";
  return trimmed === "" || /^\[[^\]]*\]$/.test(trimmed) || /^<[^>]*>$/.test(trimmed);
};

/** The content of a range as text, without comments, trimmed. */
export function sectionText(lines: Line[], section: Pick<Section, "start" | "end">): string {
  return lines
    .slice(section.start - 1, section.end)
    .filter((line) => !line.comment)
    .map((line) => line.text)
    .join("\n")
    .trim();
}
