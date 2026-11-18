import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "bun:test";

// The pm-docs-site publish workflow authenticates to npm with trusted
// publishing (OIDC), as purview-dev/astroc4's release.yml does, so these are
// security and release properties, not style. A test is the only place they can
// be checked without running Actions, and a regression fails its pull request.

const root = join(import.meta.dir, "..");

/** The workflow without its full-line comments: assert the configuration, not the prose. */
const code = (path: string) =>
  readFileSync(join(root, path), "utf8")
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");

const publish = code(".github/workflows/publish-pm-docs-site.yml");
const ci = code(".github/workflows/ci.yml");
const pkg = JSON.parse(readFileSync(join(root, "packages/pm-docs-site/package.json"), "utf8"));

describe("the pm-docs-site publish workflow", () => {
  it("authenticates with trusted publishing, not a token", () => {
    expect(publish).toMatch(/id-token:\s*write/);
    expect(publish).not.toMatch(/NODE_AUTH_TOKEN/);
    expect(publish).not.toMatch(/NPM_TOKEN/);
    expect(publish).not.toMatch(/secrets\./);
    expect(publish).not.toMatch(/_authToken/);
  });

  it("does not let setup-node install an auth placeholder", () => {
    expect(publish).not.toMatch(/registry-url/);
  });

  it("asserts the preconditions trusted publishing needs", () => {
    expect(publish).toMatch(/npm@\^11\.5\.1/);
    expect(publish).toMatch(/ACTIONS_ID_TOKEN_REQUEST_URL/);
  });

  it("leaves provenance to npm, which attaches it under trusted publishing", () => {
    expect(publish).not.toMatch(/--provenance/);
  });

  it("says how to fix an unconfigured trusted publisher", () => {
    expect(publish).toMatch(/ENEEDAUTH/);
    expect(publish).toMatch(/npm trust github @purview-dev\/pm-docs-site --repo purview-dev\/pm-skills --file publish-pm-docs-site\.yml --allow-publish/);
  });

  it("only runs on a bump of the package's version, or by hand", () => {
    expect(publish).toMatch(/paths:\s*\n\s*-\s*packages\/pm-docs-site\/package\.json/);
    expect(publish).toMatch(/workflow_dispatch:/);
  });

  it("skips a version whose tag exists, and checks the version first", () => {
    expect(publish).toMatch(/TAG_PREFIX: pm-docs-site-v/);
    expect(publish).toMatch(/REL001/);
    expect(publish).toMatch(/git rev-parse -q --verify "refs\/tags\/\$\{TAG\}"/);
    expect(publish).toMatch(/REL002/);
    expect(publish).toMatch(/fetch-depth: 0/);
  });

  it("publishes a stable version only from main", () => {
    expect(publish).toMatch(/REL003/);
    expect(publish).toMatch(/"\$\{GITHUB_REF\}" != "refs\/heads\/main"/);
  });

  it("skips a version already on the registry", () => {
    expect(publish).toMatch(/npm view "\$\{PACKAGE\}@/);
    expect(publish).toMatch(/steps\.registry\.outputs\.published != 'true'/);
  });

  it("publishes under a dist-tag, so a prerelease never becomes latest on publish", () => {
    expect(publish).toMatch(/--tag "\$\{\{ steps\.version\.outputs\.dist-tag \}\}"/);
    expect(publish).toMatch(/dist-tag=prerelease/);
  });

  it("keeps latest on the newest prerelease until a stable release exists", () => {
    expect(publish).toMatch(/Keep latest on the newest prerelease/);
    expect(publish).toMatch(/npm dist-tag add "@purview-dev\/pm-docs-site@\$VERSION" latest/);
    expect(publish).toMatch(/::warning::Could not move latest/);
  });

  it("runs publishing inside the npm environment", () => {
    expect(publish).toMatch(/environment:\s*\n\s*name:\s*npm/);
  });

  it("tests and checks the exports before it publishes", () => {
    const order = ["run: bun test", "run: bun run check", "node scripts/check-exports.mjs", "npm publish"].map((step) => publish.indexOf(step));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("tags the release only after a successful publish, never as the latest release", () => {
    expect(publish.indexOf("gh release create")).toBeGreaterThan(publish.indexOf("npm publish"));
    expect(publish).toMatch(/--latest=false/);
    expect(publish).toMatch(/contents:\s*write/);
  });

  it("serializes releases", () => {
    expect(publish).toMatch(/concurrency:\s*\n\s*group:\s*publish-pm-docs-site-/);
    expect(publish).toMatch(/cancel-in-progress:\s*false/);
  });
});

describe("the pm-docs-site package", () => {
  it("refuses a local publish whose exports are missing", () => {
    expect(pkg.scripts.prepublishOnly).toBe("node scripts/check-exports.mjs");
  });
});

describe("the CI workflow", () => {
  it("holds no npm credential", () => {
    expect(ci).not.toMatch(/NODE_AUTH_TOKEN|NPM_TOKEN/);
  });

  it("checks the version on every pull request", () => {
    expect(ci).toMatch(/bun scripts\/check-version\.ts/);
  });
});
