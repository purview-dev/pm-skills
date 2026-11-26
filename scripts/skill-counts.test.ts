import { describe, expect, it } from "bun:test";

import { skillCountDrift } from "./skill-counts.ts";

const file = "pm-setup/SKILL.md";
const plan = (total: string) => `- Skills: <n> of ${total} installed. Missing: <names | none>`;
const output = (n: string, total: string) => `- Skills: <${n} of ${total} installed | missing: names>`;
const lines = (...l: string[]) => l.join("\n");

describe("pm-setup skill counts", () => {
  it("reports nothing when every count matches", () => {
    const text = lines(plan("26"), "- Workflow skills: <n> of <total> installed.", output("26", "26"));
    expect(skillCountDrift(file, text, 26)).toEqual([]);
  });

  it("names the line and the wrong number", () => {
    expect(skillCountDrift(file, lines(plan("26"), output("25", "26")), 26)).toEqual([
      "pm-setup/SKILL.md:2: skill count 25, expected 26",
    ]);
  });

  it("checks the total after a placeholder", () => {
    expect(skillCountDrift(file, lines(plan("25"), output("26", "26")), 26)).toEqual([
      "pm-setup/SKILL.md:1: skill count 25, expected 26",
    ]);
  });

  it("reports each wrong number", () => {
    expect(skillCountDrift(file, lines(plan("26"), output("27", "27")), 26)).toEqual([
      "pm-setup/SKILL.md:2: skill count 27, expected 26",
      "pm-setup/SKILL.md:2: skill count 27, expected 26",
    ]);
  });

  it("fails when the plan count line is missing", () => {
    expect(skillCountDrift(file, lines("- Skills: <n> installed of all.", output("26", "26")), 26)).toEqual([
      'pm-setup/SKILL.md: no "- Skills: <n> of <N> installed" line found',
    ]);
  });

  it("fails when the output count line is missing", () => {
    expect(skillCountDrift(file, lines(plan("26"), "- Skills: <all installed | missing: names>"), 26)).toEqual([
      'pm-setup/SKILL.md: no "- Skills: <<N> of <N> installed" line found',
    ]);
  });

  it("ignores other N of M text", () => {
    expect(skillCountDrift(file, lines("Step 2 of 6", plan("26"), output("26", "26")), 26)).toEqual([]);
  });

  it("counts lines in CRLF text", () => {
    expect(skillCountDrift(file, ["a", plan("25"), output("26", "26")].join("\r\n"), 26)).toEqual([
      "pm-setup/SKILL.md:2: skill count 25, expected 26",
    ]);
  });
});
