import { describe, expect, it } from "bun:test";

import { pinnedVersions, versionDrift } from "./package-docs.ts";

const snippet = [
  "```json",
  "{",
  '  "dependencies": { "@purview-dev/pm-docs-site": "0.1.0-pre.2" }',
  "}",
  "```",
].join("\n");

describe("package docs version", () => {
  it("finds the pinned version in a dependency line", () => {
    expect(pinnedVersions(snippet)).toEqual(["0.1.0-pre.2"]);
  });

  it("reports nothing when the pin equals package.json", () => {
    expect(versionDrift("README.md", snippet, "0.1.0-pre.2")).toEqual([]);
  });

  it("names both versions when the pin differs", () => {
    expect(versionDrift("README.md", snippet, "0.1.0-pre.3")).toEqual([
      "README.md: pins @purview-dev/pm-docs-site 0.1.0-pre.2, package.json is 0.1.0-pre.3",
    ]);
  });

  it("reports a file with no pinned example", () => {
    expect(versionDrift("README.md", "no example here", "0.1.0-pre.2")).toEqual([
      "README.md: no pinned @purview-dev/pm-docs-site example",
    ]);
  });
});
