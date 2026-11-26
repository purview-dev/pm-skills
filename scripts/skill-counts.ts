// pm-setup states the size of its inventory on two lines: the plan's "- Skills: <n> of 26 installed" and
// the output's "- Skills: <26 of 26 installed". The inventory names every shipped skill except pm-setup
// itself, so each number must equal the shipped skills minus pm-setup. Each line is matched by its own
// wording, so rewording either one fails instead of switching its check off.
const countLines = [
  { label: "- Skills: <n> of <N> installed", pattern: /^- Skills: <n> of (\d+) installed/ },
  { label: "- Skills: <<N> of <N> installed", pattern: /^- Skills: <(\d+) of (\d+) installed/ },
];

export function skillCountDrift(file: string, text: string, expected: number): string[] {
  const lines = text.split("\n");
  const errors: string[] = [];
  for (const { label, pattern } of countLines) {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index === -1) {
      errors.push(`${file}: no "${label}" line found`);
      continue;
    }
    for (const count of pattern.exec(lines[index])!.slice(1)) {
      if (Number(count) !== expected) errors.push(`${file}:${index + 1}: skill count ${count}, expected ${expected}`);
    }
  }
  return errors;
}
