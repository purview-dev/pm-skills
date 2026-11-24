import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "bun:test";

import { ALLOWED, ARCHITECTURE_VIEWS, checkDemo, PLACEHOLDERS, RENDERED_DIAGRAMS } from "./check-demo.ts";

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
    const dir = dist({ "plan/risks/index.html": '<td class="plan-empty">–</td>' });

    expect(checkDemo(dir, ["plan/risks/index.html"])).toEqual([]);
  });

  it("reports an empty state on the home page", () => {
    const dir = dist({ "index.html": '<p class="plan-empty">Nothing in Next can be started.</p>' });

    expect(checkDemo(dir, ["index.html"])).toEqual(['index.html: empty state "Nothing in Next can be started."']);
  });

  it("ignores empty states outside plan/ and the home page", () => {
    const dir = dist({ "docs/guide/index.html": '<p class="plan-empty">Nothing is in progress.</p>' });

    expect(checkDemo(dir, ["docs/guide/index.html"])).toEqual([]);
  });

  it("does not take data-class as a class", () => {
    const dir = dist({ "plan/now/index.html": '<p data-class="plan-empty">A note</p>' });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual([]);
  });

  it("ends an unclosed plan-empty element at the next one, not at the end of the page", () => {
    const dir = dist({ "plan/now/index.html": '<div class="plan-empty">A<div class="plan-empty">B</div>' });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual([
      'plan/now/index.html: empty state "A"',
      'plan/now/index.html: empty state "B"',
    ]);
  });

  it("reports a placeholder that has no plan-empty class", () => {
    const dir = dist({ "plan/now/index.html": "<dl><dt>Plan steps</dt><dd>No plan</dd></dl>" });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual(['plan/now/index.html: placeholder "No plan"']);
  });

  it("does not take a placeholder's words inside longer text", () => {
    const dir = dist({ "plan/now/index.html": "<p>No plan survives first contact.</p>" });

    expect(checkDemo(dir, ["plan/now/index.html"])).toEqual([]);
  });

  it("reports a placeholder with whitespace around it once per page", () => {
    const dir = dist({ "plan/milestones/index.html": "<td>No status</td><td> No status </td>" });

    expect(checkDemo(dir, ["plan/milestones/index.html"])).toEqual(['plan/milestones/index.html: placeholder "No status"']);
  });

  it("gives every placeholder a reason", () => {
    expect(PLACEHOLDERS.length).toBeGreaterThan(0);
    for (const entry of PLACEHOLDERS) expect(entry.reason.trim(), entry.text).not.toBe("");
  });

  it("gives every allowlist entry a reason", () => {
    expect(ALLOWED.length).toBeGreaterThan(0);
    for (const entry of ALLOWED) expect(entry.reason.trim(), entry.text).not.toBe("");
  });

  it("passes a diagrams page whose marker rendered the astroc4 fence", () => {
    const dir = dist({
      "docs/guide/diagrams/index.html": '<section class="not-content likec4-md-fence" data-astroc4-fence data-view-id="overview.overview"></section>',
    });

    expect(checkDemo(dir, ["docs/guide/diagrams/index.html"])).toEqual([]);
  });

  it("reports a diagrams page that kept the mermaid fallback instead of the astroc4 fence", () => {
    const dir = dist({ "docs/guide/diagrams/index.html": '<pre><code class="language-mermaid">flowchart LR</code></pre>' });

    expect(checkDemo(dir, ["docs/guide/diagrams/index.html"])).toEqual([
      "docs/guide/diagrams/index.html: missing data-astroc4-fence (marker did not render)",
      "docs/guide/diagrams/index.html: language-mermaid fallback still present",
    ]);
  });

  it("names every page whose marker must render", () => {
    expect(RENDERED_DIAGRAMS).toContain("docs/guide/diagrams/index.html");
  });

  /** A minimal astro-island as astroc4's LikeC4View.astro emits it for a project view. */
  function island(viewId: string, projectId = "architecture"): string {
    return `<astro-island component-url="/_astro/LikeC4ProjectView.4SGd25x3.js" component-export="default" props="{&quot;viewId&quot;:[0,&quot;${viewId}&quot;],&quot;projectId&quot;:[0,&quot;${projectId}&quot;]}" ssr client="only"></astro-island>`;
  }

  /**
   * A minimal compiled LikeC4 project chunk, shaped like the real build's
   * `_astro/model.*.js`: `projectId`, and each view keyed by id in the views
   * map with a `sourcePath` and a matching `id` field.
   */
  function modelChunk(viewIds: string[], projectId = "architecture"): string {
    const views = viewIds.map((id) => `${id}:{_type:\`element\`,sourcePath:\`views/${id}/model.c4\`,title:\`${id}\`,id:\`${id}\`}`).join(",");

    return `var n=e({projectId:\`${projectId}\`,project:{id:\`${projectId}\`},views:{${views}}});`;
  }

  it("passes an architecture page whose island names its view id and the compiled model declares it", () => {
    const dir = dist({
      "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("overview")}`,
      "_astro/model.test.js": modelChunk(["overview"]),
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([]);
  });

  it("reports an architecture page with no LikeC4ProjectView island at all", () => {
    const dir = dist({
      "architecture/overview/index.html": "<h1>Architecture: Overview</h1><p>System overview</p>",
      "_astro/model.test.js": modelChunk(["overview"]),
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: missing LikeC4ProjectView island for view "overview"',
    ]);
  });

  it("reports an architecture page whose island names the wrong view id", () => {
    const dir = dist({
      "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("services")}`,
      "_astro/model.test.js": modelChunk(["overview"]),
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: missing LikeC4ProjectView island for view "overview"',
    ]);
  });

  it("reports a view missing from the compiled model when no chunk exists at all", () => {
    const dir = dist({ "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("overview")}` });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: view "overview" missing from the compiled architecture project model',
    ]);
  });

  it("reports a view missing from the compiled model when the chunk exists but does not declare it", () => {
    const dir = dist({
      "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("overview")}`,
      // The chunk is the right project, but only declares a different view.
      "_astro/model.test.js": modelChunk(["services"]),
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: view "overview" missing from the compiled architecture project model',
    ]);
  });

  it("does not let a stray matching id without a sourcePath satisfy the compiled-model check", () => {
    const dir = dist({
      "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("overview")}`,
      // An element id "overview" in the right project's chunk, but no sourcePath: not a view.
      "_astro/model.test.js": "var n=e({projectId:`architecture`,elements:{overview:{title:`overview`,id:`overview`}}});",
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: view "overview" missing from the compiled architecture project model',
    ]);
  });

  it("does not let a different project's chunk satisfy the compiled-model check", () => {
    const dir = dist({
      "architecture/overview/index.html": `<h1>Architecture: Overview</h1>${island("overview")}`,
      // A real view declaration, but under an unrelated project.
      "_astro/model.test.js": modelChunk(["overview"], "other"),
    });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: view "overview" missing from the compiled architecture project model',
    ]);
  });

  it("reports both a missing island and a missing compiled view together, in order", () => {
    const dir = dist({ "architecture/overview/index.html": "<h1>Architecture: Overview</h1>" });

    expect(checkDemo(dir, ["architecture/overview/index.html"])).toEqual([
      'architecture/overview/index.html: missing LikeC4ProjectView island for view "overview"',
      'architecture/overview/index.html: view "overview" missing from the compiled architecture project model',
    ]);
  });

  it("names every architecture page and the view ids it must render", () => {
    expect(ARCHITECTURE_VIEWS).toEqual({
      "architecture/overview/index.html": ["overview"],
      "architecture/services/index.html": ["services"],
    });
  });
});
