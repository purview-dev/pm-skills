import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
    if (schemaVersion !== 1) fail(`planning.schema.json: schemaVersion const must be 1 (got ${schemaVersion})`);
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
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
const repoNote = repo.length ? `, ${repo.length} repo-local (${repo.sort().join(", ")})` : "";
console.log(`validate: ${shipped.length} skills OK${repoNote}`);
