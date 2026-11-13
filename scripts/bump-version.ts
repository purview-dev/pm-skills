import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const pkgPath = join(root, "package.json");
const sectionPath = join(root, "skills", "pm-setup", "references", "AGENTS-section.md");
const configPath = join(root, "skills", "pm-init", "templates", "config.md");
const parts = ["patch", "minor", "major"] as const;

type Part = (typeof parts)[number];

const part = process.argv[2];
if (!part || !parts.includes(part as Part)) {
  console.error(`usage: bun scripts/bump-version.ts <${parts.join("|")}>`);
  process.exit(1);
}

const text = readFileSync(pkgPath, "utf8");
const match = /^(\s*"version":\s*")([^"]+)(")/m.exec(text);
if (!match) {
  console.error("package.json: no version field");
  process.exit(1);
}

const current = match[2];
const semver = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
if (!semver) {
  console.error(`package.json: version "${current}" is not MAJOR.MINOR.PATCH`);
  process.exit(1);
}

// The major is the rules/skills version (the version=N marker), so a major
// bump is a rules bump: it moves the marker and the config template with it.
const section = readFileSync(sectionPath, "utf8");
const marker = /<!-- pm-skills:start version=(\d+) -->/.exec(section);
if (!marker) {
  console.error("AGENTS-section.md: no version=N start marker");
  process.exit(1);
}
const rules = Number(marker[1]);

const [major, minor, patch] = semver.slice(1).map(Number);
if (major !== rules) {
  console.error(`package.json major ${major} != rules version ${rules}. Set package.json to ${rules}.0.0 first.`);
  process.exit(1);
}
const next =
  part === "major"
    ? `${rules + 1}.0.0`
    : part === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

// The Release workflow tags v{version}, so an existing tag means the version
// is spent and the merge would be a no-op release.
const tagged = execFileSync("git", ["tag", "--list", `v${next}`], {
  cwd: root,
  encoding: "utf8",
}).trim();
if (tagged) {
  console.error(`v${next} already exists. Bump a larger part, or delete the tag.`);
  process.exit(1);
}

writeFileSync(pkgPath, text.replace(match[0], `${match[1]}${next}${match[3]}`));
console.log(`v${current} -> v${next}`);

if (part === "major") {
  writeFileSync(sectionPath, section.replace(marker[0], `<!-- pm-skills:start version=${rules + 1} -->`));
  const config = readFileSync(configPath, "utf8");
  writeFileSync(configPath, config.replace(/^- Rules version: \d+$/m, `- Rules version: ${rules + 1}`));
  console.log(`rules v${rules} -> v${rules + 1}. Run pm-setup to install them here (AGENTS.md and planning/config.md).`);
}
