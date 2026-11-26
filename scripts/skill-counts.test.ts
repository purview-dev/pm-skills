import { describe, expect, it } from "bun:test";

import { skillCountDrift } from "./skill-counts.ts";

const file = "pm-setup/SKILL.md";

describe("pm-setup skill counts", () => {
  it("reports nothing when every count matches", () => {
    const text = [
      "- Skills: <n> of 26 installed.",
      "- Skills: <26 of 26 installed | missing: names>",
      "- Workflow skills: <n> of <total> installed.",
    ].join("\n");
    expect(skillCountDrift(file, text, 26)).toEqual([]);
  });

  it("names the line and the wrong number", () => {
    expect(skillCountDrift(file, "a\n- Skills: <25 of 26 installed>", 26)).toEqual([
      "pm-setup/SKILL.md:2: skill count 25, expected 26",
    ]);
  });

  it("checks the total after a placeholder", () => {
    expect(skillCountDrift(file, "- Skills: <n> of 25 installed.", 26)).toEqual([
      "pm-setup/SKILL.md:1: skill count 25, expected 26",
    ]);
  });

  it("reports each wrong number", () => {
    expect(skillCountDrift(file, "<27 of 27", 26)).toEqual([
      "pm-setup/SKILL.md:1: skill count 27, expected 26",
      "pm-setup/SKILL.md:1: skill count 27, expected 26",
    ]);
  });

  it("fails when no count is found", () => {
    expect(skillCountDrift(file, "- Workflow skills: <n> of <total>", 26)).toEqual([
      'pm-setup/SKILL.md: no "<N> of <N>" skill count found',
    ]);
  });

  it("counts lines in CRLF text", () => {
    expect(skillCountDrift(file, "a\r\n<25 of 26", 26)).toEqual([
      "pm-setup/SKILL.md:2: skill count 25, expected 26",
    ]);
  });
});
