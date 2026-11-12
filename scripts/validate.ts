import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { differences, readManifest } from "../skills/pm-docs-site/scripts/site.ts";

const root = join(import.meta.dir, "..");
const skillsDir = join(root, "skills");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

const shipped = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Repo-local skills live in .agents/skills/ and are never shipped to a
// consumer, so they are exempt from the consumer tables. Their frontmatter
// must set metadata.internal: true, which hides them from the skills CLI.
const repoDir = join(root, ".agents", "skills");
const repo = existsSync(repoDir)
  ? readdirSync(repoDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
  : [];

const readme = read("README.md");
const section = read("skills", "pm-setup", "references", "AGENTS-section.md");
const setup = read("skills", "pm-setup", "SKILL.md");
const help = read("skills", "pm-help", "SKILL.md");

function checkFrontmatter(dir: string, name: string): string | null {
  const file = join(dir, name, "SKILL.md");
  if (!existsSync(join(root, file))) {
    fail(`${file}: missing`);
    return null;
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(read(file))?.[1] ?? "";
  const fmName = /^name:\s*(.+)$/m.exec(fm)?.[1].trim();
  const desc = /^description:\s*(.+)$/m.exec(fm)?.[1].trim();
  if (fmName !== name) fail(`${file}: frontmatter name "${fmName}" != folder "${name}"`);
  if (!desc) fail(`${file}: description missing`);
  else if (desc.length > 1024) fail(`${file}: description exceeds 1024 characters`);
  return fm;
}

for (const name of shipped) {
  if (checkFrontmatter("skills", name) === null) continue;
  if (!readme.includes(`skills/${name}/SKILL.md`)) fail(`README.md: ${name} not linked in skills table`);
  if (!section.includes(`| \`${name}\` |`)) fail(`AGENTS-section.md: ${name} not in skills table`);
  if (name !== "pm-setup" && !setup.includes(`\`${name}\``)) fail(`pm-setup/SKILL.md: ${name} not in inventory`);
  if (!help.includes(`| \`${name}\` |`)) fail(`pm-help/SKILL.md: ${name} not in skill guide`);
}

for (const name of repo) {
  const fm = checkFrontmatter(".agents/skills", name);
  if (fm === null) continue;
  if (!/(^|\n)\s*internal:\s*true\s*($|\n)/.test(fm)) {
    fail(`.agents/skills/${name}/SKILL.md: repo-local skill must set metadata.internal: true`);
  }
}

const starts = section.match(/<!-- pm-skills:start version=\d+ -->/g) ?? [];
const ends = section.match(/<!-- pm-skills:end -->/g) ?? [];
if (starts.length !== 1) fail("AGENTS-section.md: need exactly one start marker with version=N");
if (ends.length !== 1) fail("AGENTS-section.md: need exactly one end marker");

// The template records the skills version, so keep it equal to the reference.
const sectionVersion = /<!-- pm-skills:start version=(\d+) -->/.exec(section)?.[1];
const configTemplate = read("skills", "pm-init", "templates", "config.md");
const templateVersion = /^- Rules version: (\d+)$/m.exec(configTemplate)?.[1];
if (sectionVersion && templateVersion !== sectionVersion) {
  fail(
    `templates/config.md: Rules version ${templateVersion} != AGENTS-section version ${sectionVersion}`,
  );
}

const templates = join(skillsDir, "pm-init", "templates");
const initText = read("skills", "pm-init", "SKILL.md");
for (const m of initText.matchAll(/^\| `([^`]+\.md)` \| `<PM root>\/[^`]+` \|$/gm)) {
  if (!existsSync(join(templates, m[1]))) fail(`pm-init: template ${m[1]} missing`);
}
for (const f of readdirSync(templates)) {
  const text = readFileSync(join(templates, f), "utf8");
  for (const p of text.matchAll(/\{\{(\w+)\}\}/g)) {
    if (p[1] !== "PM_ROOT") fail(`templates/${f}: unknown placeholder {{${p[1]}}}`);
  }
}

for (const name of shipped) {
  if (name === "pm-setup") continue;
  const text = read("skills", name, "SKILL.md");
  if (/(^|[^\w.-])pm\/[A-Za-z]/.test(text.replace(/`pm-[a-z]+`/g, ""))) fail(`skills/${name}/SKILL.md: literal pm/ path`);
}

// The export schema is the contract for `<PM root>/planning.json`, so it must
// parse, pin the version the skill documents, and still describe the shipped
// example: same top-level keys, same required set.
const exportReferences = join(skillsDir, "pm-export", "references");
const schemaPath = join(exportReferences, "planning.schema.json");
const examplePath = join(exportReferences, "planning.example.json");
if (!existsSync(schemaPath)) fail("skills/pm-export/references/planning.schema.json: missing");
else if (!existsSync(examplePath)) fail("skills/pm-export/references/planning.example.json: missing");
else {
  let schema: any = null;
  let example: any = null;
  try {
    schema = JSON.parse(readFileSync(schemaPath, "utf8"));
  } catch (error) {
    fail(`planning.schema.json: invalid JSON (${(error as Error).message})`);
  }
  try {
    example = JSON.parse(readFileSync(examplePath, "utf8"));
  } catch (error) {
    fail(`planning.example.json: invalid JSON (${(error as Error).message})`);
  }
  if (schema && example) {
    if (!String(schema.$schema ?? "").includes("2020-12")) {
      fail("planning.schema.json: must declare JSON Schema draft 2020-12");
    }
    if (schema.additionalProperties !== false) {
      fail("planning.schema.json: the top level must set additionalProperties: false");
    }
    const schemaVersion = schema.properties?.schemaVersion?.const;
    if (schemaVersion !== 3) fail(`planning.schema.json: schemaVersion const must be 3 (got ${schemaVersion})`);
    if (example.schemaVersion !== schemaVersion) {
      fail("planning.example.json: schemaVersion differs from the schema");
    }
    if (example.$schema !== "./planning.schema.json") {
      fail('planning.example.json: $schema must be "./planning.schema.json"');
    }
    const required = [...(schema.required ?? [])].sort().join(",");
    const present = Object.keys(example).sort().join(",");
    if (required !== present) {
      fail(`planning.example.json: top-level keys do not match the schema required list (${present} != ${required})`);
    }
    const documented = `| \`schemaVersion\` | constant | \`${schemaVersion}\``;
    if (!read("skills", "pm-export", "SKILL.md").includes(documented)) {
      fail(`skills/pm-export/SKILL.md: does not document schemaVersion ${schemaVersion}`);
    }
    checkDocsSite(schemaVersion, required);
  }
}

// The docs site reads the export, so its templates must read the schema's
// version: a schema bump without a template change would ship a site that
// fails its build on every consumer's next export.
function checkDocsSite(schemaVersion: number, required: string) {
  const site = join("skills", "pm-docs-site", "templates", "site");
  const lib = join(site, "src", "lib");
  const planning = read(lib, "planning.ts");
  const siteVersion = /export const SCHEMA_VERSION = (\d+);/.exec(planning)?.[1];
  if (Number(siteVersion) !== schemaVersion) {
    fail(`pm-docs-site templates: SCHEMA_VERSION ${siteVersion} != planning.schema.json ${schemaVersion}`);
  }
  if (!read(lib, "planning-types.ts").includes(`schemaVersion: ${schemaVersion};`)) {
    fail(`pm-docs-site templates: planning-types.ts does not type schemaVersion ${schemaVersion}`);
  }
  if (!read("skills", "pm-docs-site", "SKILL.md").includes(`This skill reads schemaVersion ${schemaVersion}.`)) {
    fail(`skills/pm-docs-site/SKILL.md: does not document schemaVersion ${schemaVersion}`);
  }
  let fixture: any = null;
  try {
    fixture = JSON.parse(read(lib, "__fixtures__", "planning.json"));
  } catch (error) {
    fail(`pm-docs-site fixture: invalid JSON (${(error as Error).message})`);
  }
  if (fixture) {
    if (fixture.schemaVersion !== schemaVersion) fail("pm-docs-site fixture: schemaVersion differs from the schema");
    const present = Object.keys(fixture).sort().join(",");
    if (present !== required) fail(`pm-docs-site fixture: top-level keys do not match the schema required list`);
  }
}

// Placeholders in the docs-site templates must be the ones its SKILL.md
// documents, and the copied components must keep their MIT attribution.
const docsSiteTemplates = join(skillsDir, "pm-docs-site", "templates");
if (existsSync(docsSiteTemplates)) {
  const docsSiteSkill = read("skills", "pm-docs-site", "SKILL.md");
  const allowed = new Set([...docsSiteSkill.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]));
  for (const f of readdirSync(docsSiteTemplates, { recursive: true, withFileTypes: true })) {
    if (!f.isFile()) continue;
    const file = join(f.parentPath, f.name);
    const text = readFileSync(file, "utf8");
    for (const p of text.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) {
      if (!allowed.has(p[1])) fail(`${file.slice(root.length + 1)}: placeholder {{${p[1]}}} not in pm-docs-site/SKILL.md`);
    }
    if (f.parentPath.endsWith(join("components", "lib")) && !/MIT License/.test(text)) {
      fail(`${file.slice(root.length + 1)}: missing the Astro Components Kit MIT attribution`);
    }
  }
}

// This repository dogfoods its own rules: the section installed in AGENTS.md
// must be the reference, with the start marker's version removed as pm-setup
// writes it. Otherwise the agents working here follow stale rules.
const agents = read("AGENTS.md");
const installed = /<!-- pm-skills:start -->[\s\S]*?<!-- pm-skills:end -->/.exec(agents)?.[0];
const expected = section.replace(/<!-- pm-skills:start version=\d+ -->/, "<!-- pm-skills:start -->").trimEnd();
if (!installed) fail("AGENTS.md: no installed pm-skills section (run pm-setup)");
else if (installed !== expected) fail("AGENTS.md: the installed pm-skills section differs from AGENTS-section.md (run pm-setup)");

// The repository's own docs site is rendered from the pm-docs-site templates;
// a template change must be carried to it (bun skills/pm-docs-site/scripts/site.ts write docs-site).
const siteRoot = join(root, "docs-site");
if (existsSync(join(siteRoot, "pm-docs-site.json"))) {
  try {
    const manifest = readManifest(siteRoot);
    const schemaVersion = JSON.parse(read("skills", "pm-export", "references", "planning.schema.json")).properties?.schemaVersion?.const;
    if (manifest.schemaVersion !== schemaVersion) fail(`docs-site/pm-docs-site.json: schemaVersion ${manifest.schemaVersion} != ${schemaVersion}`);
    for (const file of differences(siteRoot)) fail(`docs-site/${file}: differs from the pm-docs-site templates (run site.ts write docs-site)`);
  } catch (error) {
    fail(`docs-site: ${(error as Error).message}`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
const repoNote = repo.length ? `, ${repo.length} repo-local (${repo.sort().join(", ")})` : "";
console.log(`validate: ${shipped.length} skills OK${repoNote}`);
