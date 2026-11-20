import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "bun:test";

import { ALLOWED, checkDemo, PLACEHOLDERS } from "./check-demo.ts";

const dirs: string[] = [];

/** A temporary dist/ holding the given pages (path -> HTML). */
function dist(pages: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "check-demo-"));
  dirs.push(dir);
  for (const [path, html] of Object.entries(pages)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), html);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("checkDemo", () => {
  it("passes a dist whose pages match and have no empty state", () => {
    const dir = dist({ "index.html": "<p>Home</p>", "plan/board/index.html": "<p>R-001 Booking form</p>" });

    expect(checkDemo(dir, ["index.html", "plan/board/index.html"])).toEqual([]);
  });

  it("reports a missing and an unexpected page", () => {
    const dir = dist({ "index.html": "", "plan/extra/index.html": "" });

    expect(checkDemo(dir, ["index.html", "plan/log/index.html"])).toEqual([
      "missing page: plan/log/index.html",
      "unexpected page: plan/extra/index.html",
    ]);
  });

  it("reports an empty state under plan/", () => {
    const dir = dist({ "plan/inbox/index.html": '<main><p class="plan-empty">Nothing here</p></main>' });

    expect(checkDemo(dir, ["plan/inbox/index.html"])).toEqual(['plan/inbox/index.html: empty state "Nothing here"']);
  });

  it("reads the text of an empty state with nested markup", () => {
    const dir = dist({
      "plan/briefs/index.html": '<p class="x plan-empty">No briefs. <a href="/">pm-shape</a> writes one</p>',
    });

    expect(checkDemo(dir, ["plan/briefs/index.html"])).toEqual([
      'plan/briefs/index.html: empty state "No briefs. pm-shape writes one"',
    ]);
  });

  it("does not take a class that only contains plan-empty as a word part", () => {
    const dir = dist({ "plan/now/index.html": '<p class="plan-empty-note">A note</p>' });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual([]);
  });

  it("ignores an allowed use", () => {
    const dir = dist({ "plan/features/r-001/index.html": '<p class="plan-empty">Nothing links here yet.</p>' });

    expect(checkDemo(dir, ["plan/features/r-001/index.html"])).toEqual([]);
  });

  it("ignores empty states outside plan/", () => {
    const dir = dist({ "index.html": '<p class="plan-empty">Nothing is in progress.</p>' });

    expect(checkDemo(dir, ["index.html"])).toEqual([]);
  });

  it("reports a placeholder that has no plan-empty class", () => {
    const dir = dist({ "plan/now/index.html": "<dl><dt>Plan steps</dt><dd>No plan</dd></dl>" });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual(['plan/now/index.html: placeholder "No plan"']);
  });

  it("does not take a placeholder's words inside longer text", () => {
    const dir = dist({ "plan/now/index.html": "<p>No plan survives first contact.</p>" });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual([]);
  });

  it("allows a placeholder up to its allowed count on a page", () => {
    const one = dist({ "plan/milestones/index.html": "<td>No status</td><td>active</td>" });
    const two = dist({ "plan/milestones/index.html": "<td>No status</td><td> No status </td>" });

    expect(checkDemo(one, ["plan/milestones/index.html"])).toEqual([]);
    expect(checkDemo(two, ["plan/milestones/index.html"])).toEqual(['plan/milestones/index.html: placeholder "No status"']);
  });

  it("gives every placeholder a reason", () => {
    expect(PLACEHOLDERS.length).toBeGreaterThan(0);
    for (const entry of PLACEHOLDERS) expect(entry.reason.trim(), entry.text).not.toBe("");
  });

  it("gives every allowlist entry a reason", () => {
    expect(ALLOWED.length).toBeGreaterThan(0);
    for (const entry of ALLOWED) expect(entry.reason.trim(), entry.text).not.toBe("");
  });
});
