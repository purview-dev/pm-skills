import { afterEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";

import { inspect, renderAstroConfig, templateFiles } from "./consumer";

// The real template site is this repository's docs-site/ as it was before the
// migration: its site-owned and manifest files are copied in __fixtures__/
// template-site/ (from `git show main:docs-site/<path>`, so the tests run on a
// shallow CI checkout and after docs-site/ moves to the package), and every
// other path in references/template-files.md is written as a stub.

const skillDir = join(import.meta.dir, "..");
const fixture = join(import.meta.dir, "__fixtures__", "template-site");
const script = join(import.meta.dir, "consumer.ts");
const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "pm-docs-site-consumer-"));
  dirs.push(dir);
  return dir;
}

/** A copy of the pre-migration docs-site: the fixture files, a stub for each other listed path, and a bun.lock. */
function templateSite(): string {
  const site = join(scratch(), "docs-site");
  cpSync(fixture, site, { recursive: true });
  for (const file of templateFiles(skillDir)) {
    const path = join(site, file);
    if (existsSync(path) || file.startsWith("src/lib/architecture") || file.startsWith("src/pages/architecture/")) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "// template file\n");
  }
  writeFileSync(join(site, "bun.lock"), "{}\n");
  return site;
}

function files(dir: string): string[] {
  return (readdirSync(dir, { recursive: true, withFileTypes: true }) as any[])
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"))
    .sort();
}

function run(...args: string[]) {
  const result = spawnSync("bun", [script, ...args], { encoding: "utf8" });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}

const DESCRIPTION = "The plan for pm-skills, from planning/planning.json, with every skill and its references.";

const SOURCES = [
  { label: "Project", base: ".", include: ["README.md", "AGENTS.md"], prefix: "project/" },
  { label: "Guide", base: "docs/wiki", include: ["Home.md", "*/*.md"], prefix: "docs/" },
  { label: "Skills", base: "skills", include: ["*/SKILL.md"], prefix: "skills/", indexFile: "SKILL.md" },
  { label: "References", base: "skills", include: ["*/references/*.md", "*/templates/*/MODULE.md"], prefix: "skills/", collapsed: true },
];

// Written by hand from what inspect maps from the real manifest (no views: the
// manifest has none, and the default planning path is left out).
const EXPECTED_CONFIG = `import { defineConfig } from 'astro/config';
import pmDocsSite from '@purview-dev/pm-docs-site';

export default defineConfig({
	integrations: [
		pmDocsSite({
			title: 'pm-skills project',
			description: 'The plan for pm-skills, from planning/planning.json, with every skill and its references.',
			docs: {
				root: '..',
				sources: [
					{ label: 'Project', base: '.', include: ['README.md', 'AGENTS.md'], prefix: 'project/' },
					{ label: 'Guide', base: 'docs/wiki', include: ['Home.md', '*/*.md'], prefix: 'docs/' },
					{ label: 'Skills', base: 'skills', include: ['*/SKILL.md'], prefix: 'skills/', indexFile: 'SKILL.md' },
					{ label: 'References', base: 'skills', include: ['*/references/*.md', '*/templates/*/MODULE.md'], prefix: 'skills/', collapsed: true },
				],
			},
		}),
	],
});
`;

describe("templateFiles", () => {
  it("reads every frozen path, including the manifest and the site-owned files", () => {
    const paths = templateFiles(skillDir);
    expect(paths).toContain("pm-docs-site.json");
    expect(paths).toContain("package.json");
    expect(paths).toContain("src/docs-sources.ts");
    expect(paths).toContain("src/pages/architecture/[group].astro");
    expect(paths).toContain("src/pages/plan/milestones/[milestone].astro");
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("inspect", () => {
  it("maps the real site's manifest and sources to options", async () => {
    const result = await inspect(templateSite(), skillDir);
    expect(result.options).toEqual({ title: "pm-skills project", description: DESCRIPTION, docs: { root: "..", sources: SOURCES } });
    expect(result.options.views).toBeUndefined();
    expect(result.unlisted).toEqual([]);
    expect(result.listed).toContain("astro.config.mjs");
    expect(result.listed).not.toContain("package.json");
    expect(result.listed).not.toContain(".gitignore");
    expect(result.extraConfig).toBeNull();
    expect(result.architectureDir).toBeNull();
  });

  it("maps LIKEC4_DIR to architectureDir and options.architecture.project", async () => {
    const site = templateSite();
    const manifest = JSON.parse(readFileSync(join(site, "pm-docs-site.json"), "utf8"));
    manifest.modules = ["repo-docs", "architecture"];
    manifest.views = ["now", "features"];
    manifest.values.LIKEC4_DIR = "docs/architecture/likec4";
    manifest.values.LIKEC4_VERSION = "1.2.3";
    writeFileSync(join(site, "pm-docs-site.json"), JSON.stringify(manifest));
    const result = await inspect(site, skillDir);
    expect(result.architectureDir).toBe("docs/architecture/likec4");
    expect(result.options.architecture).toEqual({ project: "../docs/architecture/likec4" });
    expect(result.options.views).toEqual(["now", "features"]);
  });

  it("returns the astro config when it holds more than the template's", async () => {
    const site = templateSite();
    const path = join(site, "astro.config.mjs");
    writeFileSync(path, readFileSync(path, "utf8").replace("export default defineConfig({", "export default defineConfig({\n\tsite: 'https://example.com',"));
    const result = await inspect(site, skillDir);
    expect(result.extraConfig).toContain("site: 'https://example.com'");
  });

  it("maps a non-default PM root to planning", async () => {
    const site = templateSite();
    const manifest = JSON.parse(readFileSync(join(site, "pm-docs-site.json"), "utf8"));
    manifest.values.PM_ROOT = "docs/pm/";
    writeFileSync(join(site, "pm-docs-site.json"), JSON.stringify(manifest));
    expect((await inspect(site, skillDir)).options.planning).toBe("../docs/pm/planning.json");
  });
});

describe("renderAstroConfig", () => {
  it("renders the real site's options", async () => {
    const { options } = await inspect(templateSite(), skillDir);
    expect(renderAstroConfig(options)).toBe(EXPECTED_CONFIG);
  });

  it("places extra integrations beside pmDocsSite", () => {
    const text = renderAstroConfig({ title: "T", views: ["now"], architecture: { project: "arch" } }, "sitemap()");
    expect(text).toContain("\t\tpmDocsSite({\n\t\t\ttitle: 'T',\n\t\t\tviews: ['now'],\n\t\t\tarchitecture: { project: 'arch' },\n\t\t}),\n\t\tsitemap(),\n\t],");
  });

  it("escapes quotes in strings", () => {
    expect(renderAstroConfig({ title: "Kieron's plan" })).toContain("title: 'Kieron\\'s plan',");
  });
});

describe("migrate", () => {
  it("leaves exactly the four consumer files", () => {
    const site = templateSite();
    const result = run("migrate", site);
    expect(result.status).toBe(0);
    expect(files(site)).toEqual([".gitignore", "astro.config.ts", "bun.lock", "package.json"]);
    expect(readFileSync(join(site, "astro.config.ts"), "utf8")).toBe(EXPECTED_CONFIG);
    const pkg = JSON.parse(readFileSync(join(site, "package.json"), "utf8"));
    expect(pkg).toEqual({
      name: "pm-skills-docs-site",
      version: "0.1.0",
      private: true,
      type: "module",
      description: DESCRIPTION,
      scripts: { dev: "pm-docs-site dev", build: "pm-docs-site build", preview: "astro preview", check: "pm-docs-site check" },
    });
    expect(readFileSync(join(site, "package.json"), "utf8")).toStartWith('{\n\t"name"');
    expect(result.out).toContain("git show HEAD:");
  });

  it("stops before deleting anything when the site has a file that is not a template file", () => {
    const site = templateSite();
    writeFileSync(join(site, "src", "pages", "extra.astro"), "---\n---\n");
    const before = files(site);
    const result = run("migrate", site);
    expect(result.status).toBe(1);
    expect(result.out).toContain("src/pages/extra.astro");
    expect(files(site)).toEqual(before);
  });

  it("deletes the unlisted files too with --include-unlisted", () => {
    const site = templateSite();
    writeFileSync(join(site, "src", "pages", "extra.astro"), "---\n---\n");
    const result = run("migrate", site, "--include-unlisted");
    expect(result.status).toBe(0);
    expect(files(site)).toEqual([".gitignore", "astro.config.ts", "bun.lock", "package.json"]);
  });

  it("stops on an existing astro.config.ts, and replaces it with --include-unlisted", () => {
    const site = templateSite();
    writeFileSync(join(site, "astro.config.ts"), "export default {};\n");
    const before = files(site).map((file) => [file, readFileSync(join(site, file), "utf8")]);
    const stopped = run("migrate", site);
    expect(stopped.status).toBe(1);
    expect(stopped.out).toContain("unlisted: astro.config.ts");
    expect(files(site).map((file) => [file, readFileSync(join(site, file), "utf8")])).toEqual(before);
    const result = run("migrate", site, "--include-unlisted");
    expect(result.status).toBe(0);
    expect(files(site)).toEqual([".gitignore", "astro.config.ts", "bun.lock", "package.json"]);
    expect(readFileSync(join(site, "astro.config.ts"), "utf8")).toBe(EXPECTED_CONFIG);
  });

  it("ignores node_modules, dist, and .astro", async () => {
    const site = templateSite();
    for (const dir of ["node_modules/x", "dist", ".astro"]) {
      mkdirSync(join(site, dir), { recursive: true });
      writeFileSync(join(site, dir, "file.js"), "");
    }
    expect((await inspect(site, skillDir)).unlisted).toEqual([]);
  });
});

describe("write", () => {
  it("writes a package site into an empty folder", () => {
    const site = join(scratch(), "site");
    mkdirSync(site);
    const result = run("write", site, "--options", JSON.stringify({ title: "My plan" }));
    expect(result.status).toBe(0);
    expect(files(site)).toEqual([".gitignore", "astro.config.ts", "package.json"]);
    expect(readFileSync(join(site, ".gitignore"), "utf8")).toBe("node_modules/\ndist/\n.astro/\n");
    expect(readFileSync(join(site, "astro.config.ts"), "utf8")).toContain("\t\t\ttitle: 'My plan',\n");
    const pkg = JSON.parse(readFileSync(join(site, "package.json"), "utf8"));
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe("module");
    expect(pkg.scripts.dev).toBe("pm-docs-site dev");
    expect(pkg.dependencies).toBeUndefined();
  });

  it("keeps an existing .gitignore", () => {
    const site = join(scratch(), "site");
    mkdirSync(site);
    writeFileSync(join(site, ".gitignore"), "custom/\n");
    expect(run("write", site, "--options", JSON.stringify({ title: "T" })).status).toBe(0);
    expect(readFileSync(join(site, ".gitignore"), "utf8")).toBe("custom/\n");
  });
});
