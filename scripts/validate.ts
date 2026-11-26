import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SCHEMA_VERSION as EXPORTER_SCHEMA_VERSION } from "../skills/pm-export/scripts/planning.ts";
import { formatErrors, validate as validateSchema } from "../skills/pm-export/scripts/schema.ts";
import { versionDrift } from "./package-docs.ts";
import { compare as compareVersions, parse as parseVersion } from "./semver.ts";
import { skillCountDrift } from "./skill-counts.ts";

const root = join(import.meta.dir, "..");
const skillsDir = join(root, "skills");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

const authored = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Two kinds of skill live in skills/, the only folder the skills CLI discovers, and the frontmatter is
// what separates them. A skill this repository ships to consumers is listed in every consumer table; a
// repo-local one — guidance for working in *this* repository — sets metadata.internal: true, which
// hides it from the skills CLI, and is exempt from those tables.
function frontmatter(name: string): string {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(read("skills", name, "SKILL.md"))?.[1] ?? "";
}

const isInternal = (name: string) => /(^|\n)\s*internal:\s*true\s*($|\n)/.test(frontmatter(name));
const repo = authored.filter(isInternal);
const shipped = authored.filter((name) => !isInternal(name));

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
for (const message of skillCountDrift("pm-setup/SKILL.md", setup, shipped.filter((name) => name !== "pm-setup").length)) {
  fail(message);
}

// Every way back into design passes the ADR instruction (R-039).
for (const name of ["pm-next", "pm-checkpoint", "pm-revise", "pm-rejoin", "pm-resume"]) {
  if (!read("skills", name, "SKILL.md").includes("**Every design handoff**")) {
    fail(`skills/${name}/SKILL.md: a design re-entry does not cite **Every design handoff**`);
  }
}

// Every way into plan passes the principles and ADRs (R-036).
for (const name of ["pm-next", "pm-checkpoint", "pm-revise", "pm-rejoin", "pm-resume"]) {
  if (!read("skills", name, "SKILL.md").includes("**Every plan handoff**")) {
    fail(`skills/${name}/SKILL.md: a plan re-entry does not cite **Every plan handoff**`);
  }
}
if (!section.includes("- **Every plan handoff**")) {
  fail("AGENTS-section.md: missing **Every plan handoff**");
}

// done checks the item's changed files against the principles before writing the completion record (R-036).
const checkpoint = read("skills", "pm-checkpoint", "SKILL.md");
if (!checkpoint.includes("**Principles check**") || !checkpoint.includes("--diff-filter=d")) {
  fail("skills/pm-checkpoint/SKILL.md: done has no **Principles check**");
}

// A Purview package accepted through pm-purview is recorded in ENGINEERING.md when its item closes (R-036, ADR-014).
if (!read("skills", "pm-purview", "SKILL.md").includes("Purview package: <PackageId>.")) {
  fail("skills/pm-purview/SKILL.md: accepted item's Note has no Purview package marker");
}
if (!checkpoint.includes("**Record the Purview package**")) {
  fail("skills/pm-checkpoint/SKILL.md: done has no **Record the Purview package** sub-step");
}

// pm-setup checks for an outside ADR folder before pm-init too (R-057).
const setupSkill = read("skills", "pm-setup", "SKILL.md");
if (!setupSkill.includes("After pm-init, run pm-adr import <folder>") || !setupSkill.includes("**Outside ADR folder (read-only).**")) {
  fail("skills/pm-setup/SKILL.md: the outside ADR check does not run before pm-init");
}

for (const name of repo) {
  const fm = checkFrontmatter("skills", name);
  if (fm === null) continue;
  if (!/(^|\n)\s*internal:\s*true\s*($|\n)/.test(fm)) {
    fail(`skills/${name}/SKILL.md: a repo-local skill must set metadata.internal: true`);
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

// The release is the rules/skills version: package.json is <N>.<minor>.<patch>
// with N the marker version, so a release and the rules it ships never differ.
const pkgVersion = JSON.parse(read("package.json")).version as string;
const pkgParsed = parseVersion(pkgVersion);
const pkgMajor = pkgParsed ? String(pkgParsed.major) : undefined;
if (!pkgMajor) fail(`package.json: version "${pkgVersion}" is not SemVer (MAJOR.MINOR.PATCH, optionally -<prerelease>)`);
else if (sectionVersion && pkgMajor !== sectionVersion) {
  fail(`package.json: version ${pkgVersion} major != rules version ${sectionVersion} (run just bump major)`);
}

// This repository dogfoods its own release: its PM state must record the rules
// it ships, which pm-setup writes when it installs them.
if (existsSync(join(root, "planning", "config.md"))) {
  const ownVersion = /^- Rules version: (\d+)$/m.exec(read("planning", "config.md"))?.[1];
  if (sectionVersion && ownVersion !== sectionVersion) {
    fail(`planning/config.md: Rules version ${ownVersion ?? "missing"} != AGENTS-section version ${sectionVersion} (run pm-setup)`);
  }
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
    if (schemaVersion !== 5) fail(`planning.schema.json: schemaVersion const must be 5 (got ${schemaVersion})`);
    // Every definition is used, and every reference resolves.
    const refs = new Set<string>();
    const collectRefs = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(collectRefs);
      else if (node && typeof node === "object") {
        for (const [key, value] of Object.entries(node)) {
          if (key === "$ref" && typeof value === "string") refs.add(value);
          else collectRefs(value);
        }
      }
    };
    collectRefs(schema);
    const defs = Object.keys(schema.$defs ?? {});
    for (const name of defs) {
      if (!refs.has(`#/$defs/${name}`)) fail(`planning.schema.json: $defs/${name} is never referenced`);
    }
    for (const ref of refs) {
      const name = ref.startsWith("#/$defs/") ? ref.slice("#/$defs/".length) : null;
      if (name !== null && !defs.includes(name)) fail(`planning.schema.json: $ref ${ref} has no definition`);
    }
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
    // The exporter writes the schema's version, and the example is a document it accepts.
    if (EXPORTER_SCHEMA_VERSION !== schemaVersion) {
      fail(`skills/pm-export/scripts/planning.ts: SCHEMA_VERSION ${EXPORTER_SCHEMA_VERSION} != planning.schema.json ${schemaVersion}`);
    }
    try {
      for (const line of formatErrors(validateSchema(example, schema))) fail(`planning.example.json: ${line}`);
    } catch (error) {
      fail(`planning.schema.json: ${(error as Error).message}`);
    }
    checkDocsSite(schemaVersion, required, schema);
  }
}

// Docs sites read the export through the pm-docs-site package, so the package
// must read the schema's version: a schema bump without a package change would
// ship a site that fails its build on every consumer's next export.
function checkDocsSite(schemaVersion: number, required: string, schema: Record<string, any>) {
  const pkg = join("packages", "pm-docs-site");
  const supportedText = /Object\.freeze\(\[([\d, ]+)\]\)/.exec(read(pkg, "lib", "schema-version.ts"))?.[1] ?? "";
  const supported = supportedText.split(",").map((v) => v.trim()).filter(Boolean).map(Number);
  if (!supported.includes(schemaVersion)) {
    fail(`pm-docs-site package: SUPPORTED_SCHEMA_VERSIONS lacks schemaVersion ${schemaVersion}`);
  }
  if (!read("skills", "pm-docs-site", "SKILL.md").includes(`This skill reads schemaVersion ${schemaVersion}.`)) {
    fail(`skills/pm-docs-site/SKILL.md: does not document schemaVersion ${schemaVersion}`);
  }
  let fixture: any = null;
  try {
    fixture = JSON.parse(read(pkg, "test", "fixtures", "planning.json"));
  } catch (error) {
    fail(`pm-docs-site fixture: invalid JSON (${(error as Error).message})`);
  }
  if (fixture) {
    if (fixture.schemaVersion !== schemaVersion) fail("pm-docs-site fixture: schemaVersion differs from the schema");
    const present = Object.keys(fixture).sort().join(",");
    if (present !== required) fail(`pm-docs-site fixture: top-level keys do not match the schema required list`);
    // The package's tests read this fixture as an export, so it must be one pm-export could write.
    for (const line of formatErrors(validateSchema(fixture, schema))) fail(`pm-docs-site fixture: ${line}`);
  }
}

// The skill states the minimum package version it needs, never the current
// one, so a package release is not a skills change; it must exist.
const docsSiteSkill = read("skills", "pm-docs-site", "SKILL.md");
const docsPackageVersion = JSON.parse(read("packages", "pm-docs-site", "package.json")).version as string;
const minimumText = /^Minimum package version: `([^`]+)`/m.exec(docsSiteSkill)?.[1];
const minimum = minimumText ? parseVersion(minimumText) : null;
const docsPackage = parseVersion(docsPackageVersion);
if (!minimum) fail("skills/pm-docs-site/SKILL.md: no `Minimum package version: `<version>`` line");
else if (!docsPackage) fail(`packages/pm-docs-site/package.json: version ${docsPackageVersion} is not SemVer`);
else if (compareVersions(minimum, docsPackage) > 0) {
  fail(`skills/pm-docs-site/SKILL.md: minimum package version ${minimumText} is above the package's ${docsPackageVersion}`);
}

// The copied Astro Components Kit files must keep their MIT attribution.
const componentsKit = join(root, "packages", "pm-docs-site", "src", "components", "lib");
for (const name of readdirSync(componentsKit).filter((n) => n.endsWith(".astro"))) {
  if (!/MIT License/.test(readFileSync(join(componentsKit, name), "utf8"))) {
    fail(`packages/pm-docs-site/src/components/lib/${name}: missing the Astro Components Kit MIT attribution`);
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

// The repository's own docs site is a package site: four files, with
// everything else in @purview-dev/pm-docs-site.
const SITE_FILES = ["package.json", "astro.config.ts", "bun.lock", ".gitignore"];
const SITE_GENERATED = ["node_modules", "dist", ".astro"];
const siteEntries = readdirSync(join(root, "docs-site")).filter((name) => !SITE_GENERATED.includes(name));
for (const name of siteEntries.filter((n) => !SITE_FILES.includes(n))) {
  fail(`docs-site: unexpected ${name} (a package site holds ${SITE_FILES.join(", ")})`);
}
for (const name of SITE_FILES.filter((n) => !siteEntries.includes(n))) fail(`docs-site: missing ${name}`);

// npm packs only the package's own folder, so the pm-docs-site package ships
// a copy of the repository's licence, which must not drift from it.
const packageLicence = join("packages", "pm-docs-site", "LICENSE.md");
if (existsSync(join(root, "packages", "pm-docs-site", "package.json"))) {
  if (!existsSync(join(root, packageLicence))) fail(`${packageLicence}: missing (copy LICENSE.md)`);
  else if (read(packageLicence) !== read("LICENSE.md")) fail(`${packageLicence}: differs from LICENSE.md (copy it again)`);

  // The consumer docs pin the package's own version, so they never name a stale release.
  const packageVersion = JSON.parse(read("packages", "pm-docs-site", "package.json")).version as string;
  for (const doc of ["packages/pm-docs-site/README.md", "docs/wiki/guide/Docs-Site-Package.md"]) {
    for (const message of versionDrift(doc, read(doc), packageVersion)) fail(message);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
const repoNote = repo.length ? `, ${repo.length} repo-local (${repo.sort().join(", ")})` : "";
console.log(`validate: ${shipped.length} skills OK${repoNote}`);
