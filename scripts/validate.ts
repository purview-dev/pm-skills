import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const skillsDir = join(root, "skills");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const readme = read("README.md");
const section = read("skills", "pm-setup", "references", "AGENTS-section.md");
const setup = read("skills", "pm-setup", "SKILL.md");

for (const name of skills) {
  const file = join("skills", name, "SKILL.md");
  if (!existsSync(join(root, file))) {
    fail(`${file}: missing`);
    continue;
  }
  const text = read(file);
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? "";
  const fmName = /^name:\s*(.+)$/m.exec(fm)?.[1].trim();
  const desc = /^description:\s*(.+)$/m.exec(fm)?.[1].trim();
  if (fmName !== name) fail(`${file}: frontmatter name "${fmName}" != folder "${name}"`);
  if (!desc) fail(`${file}: description missing`);
  else if (desc.length > 1024) fail(`${file}: description exceeds 1024 characters`);

  if (!readme.includes(`skills/${name}/SKILL.md`)) fail(`README.md: ${name} not linked in skills table`);
  if (!section.includes(`| \`${name}\` |`)) fail(`AGENTS-section.md: ${name} not in skills table`);
  if (name !== "pm-setup" && !setup.includes(`\`${name}\``)) fail(`pm-setup/SKILL.md: ${name} not in inventory`);
}

const starts = section.match(/<!-- pm-skills:start version=\d+ -->/g) ?? [];
const ends = section.match(/<!-- pm-skills:end -->/g) ?? [];
if (starts.length !== 1) fail("AGENTS-section.md: need exactly one start marker with version=N");
if (ends.length !== 1) fail("AGENTS-section.md: need exactly one end marker");

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

for (const name of skills) {
  if (name === "pm-setup") continue;
  const text = read("skills", name, "SKILL.md");
  if (/(^|[^\w.-])pm\/[A-Za-z]/.test(text.replace(/`pm-[a-z]+`/g, ""))) fail(`skills/${name}/SKILL.md: literal pm/ path`);
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`validate: ${skills.length} skills OK`);
