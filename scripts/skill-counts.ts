// pm-setup states the size of its inventory as "<n> of 26" and "<26 of 26"; "<n> of <total>" (workflow
// skills) has no digits and is not matched. The inventory names every
// shipped skill except pm-setup itself, so each number must equal the shipped skills minus pm-setup.
export function skillCountDrift(file: string, text: string, expected: number): string[] {
  const errors: string[] = [];
  let found = false;
  text.split("\n").forEach((line, index) => {
    for (const match of line.matchAll(/(\d+|<n>) of (\d+)/g)) {
      found = true;
      for (const count of [match[1], match[2]]) {
        if (count !== "<n>" && Number(count) !== expected) errors.push(`${file}:${index + 1}: skill count ${count}, expected ${expected}`);
      }
    }
  });
  if (!found) return [`${file}: no "<N> of <N>" skill count found`];
  return errors;
}
