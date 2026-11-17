// pm-export's script: write, check, validate, and query <PM root>/planning.json.
//
//   bun <skill>/scripts/export.ts write    [--root <dir>] [--pm-root <dir>] [--dry-run]
//   bun <skill>/scripts/export.ts check    [--root <dir>] [--pm-root <dir>]
//   bun <skill>/scripts/export.ts validate [<file>] [--schema <file>]
//   bun <skill>/scripts/export.ts get      [<path>] [--fresh] [--root <dir>] [--pm-root <dir>]
//   bun <skill>/scripts/export.ts find     <ID> [--fresh] [--root <dir>] [--pm-root <dir>]
//   bun <skill>/scripts/export.ts summary  [--fresh] [--root <dir>] [--pm-root <dir>]
//
// `write` is the only command that writes, and it writes only the export and
// its schema. It never commits: the skill that runs it makes the PM commit.
// Exit codes: 0 done or current, 1 invalid, stale, or failed, 2 usage.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { build, detectPmRoot, normalisePmRoot, SCHEMA_PATH, serialise } from "./planning.ts";
import { formatErrors, validate } from "./schema.ts";

const USAGE = `usage: bun export.ts <write | check | validate | get | find | summary> [options]

  write     Build planning.json from the Markdown PM state, validate it, and write it with its schema.
            --dry-run prints the document instead of writing it.
  check     Read-only. Validate the export against the schema, then compare it with the Markdown.
  validate  Read-only. Validate one file (default: the export) against the schema.
  get       Print the value at a path (\`counts\`, \`roadmap.next[0].title\`); no path prints the document.
  find      Print every entry with an ID: R-NNN, M1, RK-NNN, B1, A1, V1.
  summary   Print a short status from the export.

  --root <dir>     The repository or worktree root (default: the current directory).
  --pm-root <dir>  The PM root (default: from AGENTS.md or CLAUDE.md, else planning/).
  --fresh          get, find, summary: build from the Markdown instead of reading the export.
  --schema <file>  validate: the schema (default: the one beside the export, else pm-export's).`;

interface Args {
  command: string;
  positional: string[];
  flags: Map<string, string | true>;
}

function parseArgs(argv: string[]): Args {
  const [command = "", ...rest] = argv;
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (!arg.startsWith("--")) positional.push(arg);
    else if (["--root", "--pm-root", "--schema"].includes(arg)) flags.set(arg, rest[++i] ?? "");
    else flags.set(arg, true);
  }
  return { command, positional, flags };
}

const readJson = (path: string, label: string) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Failure(`${label} is not valid JSON (${(error as Error).message}).`);
  }
};

class Failure extends Error {}

/** `roadmap.next[0].title` → the value, or undefined. */
export function at(document: unknown, path: string): unknown {
  if (!path) return document;
  let node: any = document;
  for (const part of path.match(/[^.[\]]+/g) ?? []) {
    if (node === null || typeof node !== "object") return undefined;
    node = node[/^\d+$/.test(part) ? Number(part) : part];
  }
  return node;
}

/** The first path where two documents differ, with both values, or null. */
export function firstDifference(expected: unknown, actual: unknown, path = ""): { path: string; expected: unknown; actual: unknown } | null {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return null;
  if (expected && actual && typeof expected === "object" && typeof actual === "object" && Array.isArray(expected) === Array.isArray(actual)) {
    if (Array.isArray(expected) && Array.isArray(actual)) {
      for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
        const found = firstDifference(expected[i], actual[i], `${path}[${i}]`);
        if (found) return found;
      }
    } else {
      const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual as object)])];
      const order = (object: object) => Object.keys(object).join(",");
      if (order(expected) !== order(actual as object) && keys.every((key) => key in expected && key in (actual as object))) {
        return { path: path || "(document)", expected: `keys ${order(expected)}`, actual: `keys ${order(actual as object)}` };
      }
      for (const key of keys) {
        const found = firstDifference((expected as any)[key], (actual as any)[key], path ? `${path}.${key}` : key);
        if (found) return found;
      }
    }
  }
  return { path: path || "(document)", expected, actual };
}

/** Every entry carrying `id`, with its path: the roadmap, Now, the log, milestones, risks, bets, assumptions, V lines, briefs. */
export function findId(document: any, id: string): { at: string; value: unknown }[] {
  const wanted = id.toUpperCase();
  const out: { at: string; value: unknown }[] = [];
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) node.forEach((child, i) => walk(child, `${path}[${i}]`));
    else if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (typeof record.id === "string" && record.id.toUpperCase() === wanted && !/^board\./.test(path)) out.push({ at: path, value: node });
      for (const [key, child] of Object.entries(record)) walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(document, "");
  return out;
}

function options(args: Args) {
  const root = resolve(String(args.flags.get("--root") ?? "."));
  const flag = args.flags.get("--pm-root");
  const pmRoot = typeof flag === "string" && flag ? normalisePmRoot(flag) : detectPmRoot(root);
  return { root, pmRoot, exportPath: join(root, pmRoot, "planning.json"), schemaPath: join(root, pmRoot, "planning.schema.json") };
}

const schema = () => readJson(SCHEMA_PATH, SCHEMA_PATH);

function readExport(args: Args) {
  const { root, pmRoot, exportPath } = options(args);
  if (args.flags.has("--fresh")) return build({ root, pmRoot }).document;
  if (!existsSync(exportPath)) throw new Failure(`No export at ${pmRoot}planning.json. Run pm-export.`);
  return readJson(exportPath, `${pmRoot}planning.json`);
}

const describe = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));
const print = (value: unknown) => console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));

function write(args: Args): number {
  const { root, pmRoot, exportPath, schemaPath } = options(args);
  const { document, assumptions } = build({ root, pmRoot });
  const errors = formatErrors(validate(document, schema()));
  if (errors.length) {
    console.error(`Not written: the export would not match the schema.\n${errors.map((line) => `invalid: ${line}`).join("\n")}`);
    for (const line of assumptions) console.error(`assumption: ${line}`);
    return 1;
  }
  const text = serialise(document);
  if (args.flags.has("--dry-run")) {
    process.stdout.write(text);
    return 0;
  }
  const reference = readFileSync(SCHEMA_PATH, "utf8").replace(/\r\n/g, "\n");
  const schemaState = !existsSync(schemaPath) ? "written" : readFileSync(schemaPath, "utf8").replace(/\r\n/g, "\n") === reference ? "unchanged" : "refreshed";
  if (schemaState !== "unchanged") writeFileSync(schemaPath, reference);
  writeFileSync(exportPath, text);
  const items = document.roadmap.next.length + document.roadmap.later.length;
  console.log(`wrote: ${pmRoot}planning.json (${items} items, ${document.inbox.length} inbox, ${document.briefs.length} briefs, ${document.risks.open.length + document.risks.closed.length} risks)`);
  console.log(`schema: ${pmRoot}planning.schema.json ${schemaState}`);
  for (const line of assumptions) console.log(`assumption: ${line}`);
  return 0;
}

function check(args: Args): number {
  const { root, pmRoot, exportPath, schemaPath } = options(args);
  for (const path of [exportPath, schemaPath]) {
    if (!existsSync(path)) {
      console.log(`No export at ${path.slice(root.length + 1).replace(/\\/g, "/")}. Run pm-export.`);
      return 1;
    }
  }
  const exported = readJson(exportPath, `${pmRoot}planning.json`);
  const reference = readFileSync(SCHEMA_PATH, "utf8").replace(/\r\n/g, "\n");
  if (readFileSync(schemaPath, "utf8").replace(/\r\n/g, "\n") !== reference) {
    console.log(`${pmRoot}planning.schema.json differs from pm-export's schema. Run pm-export.`);
    return 1;
  }
  const errors = formatErrors(validate(exported, schema()));
  if (errors.length) {
    console.log(errors.map((line) => `invalid: ${line}`).join("\n"));
    return 1;
  }
  // Rebuild as of the export's own time and branch, so the board window, Review due, and drift compare like for like.
  const generatedAt = typeof exported.generatedAt === "string" ? exported.generatedAt : undefined;
  const { document } = build({
    root,
    pmRoot,
    now: generatedAt ? new Date(generatedAt) : undefined,
    today: generatedAt?.slice(0, 10),
    branch: exported.source?.branch ?? null,
    head: exported.source?.head ?? null,
  });
  document.generatedAt = exported.generatedAt;
  const difference = firstDifference(document, exported);
  if (difference) {
    console.log(`${difference.path} is ${describe(difference.expected)} from the Markdown and ${describe(difference.actual)} in ${pmRoot}planning.json.`);
    return 1;
  }
  console.log("current");
  const head = Bun.spawnSync(["git", "-C", root, "rev-parse", "HEAD"], { stdout: "pipe" }).stdout.toString().trim();
  if (head && exported.source?.head && head !== exported.source.head) {
    console.log(`note: exported at ${String(exported.source.head).slice(0, 7)}; HEAD is ${head.slice(0, 7)} (expected after the PM commit that carried it).`);
  }
  return 0;
}

function validateCommand(args: Args): number {
  const { root, pmRoot, exportPath, schemaPath } = options(args);
  const file = args.positional[0] ? resolve(args.positional[0]) : exportPath;
  if (!existsSync(file)) throw new Failure(`No file at ${file}.`);
  const schemaFile = typeof args.flags.get("--schema") === "string" ? resolve(String(args.flags.get("--schema"))) : file === exportPath && existsSync(schemaPath) ? schemaPath : SCHEMA_PATH;
  const errors = formatErrors(validate(readJson(file, file), readJson(schemaFile, schemaFile)));
  const label = file === exportPath ? `${pmRoot}planning.json` : file.slice(root.length + 1).replace(/\\/g, "/") || file;
  if (errors.length) {
    console.log(errors.map((line) => `invalid: ${line}`).join("\n"));
    return 1;
  }
  console.log(`valid: ${label}`);
  return 0;
}

function summary(args: Args): number {
  const d = readExport(args);
  const c = d.counts;
  const now = d.now.item ? `${d.now.item.id} ${d.now.item.title} (${d.now.stage ?? "no stage"}${d.plan ? `, ${d.plan.checked}/${d.plan.total} steps` : ""})` : "idle";
  const focus = d.strategy.focus.milestone ?? "none set";
  const claimable = d.checks.claimable.map((id: string) => `${id} ${d.roadmap.next.find((item: any) => item.id === id)?.title ?? ""}`.trim());
  print(
    [
      `Exported: ${d.generatedAt} from ${d.source.branch ?? "a detached HEAD"} at ${String(d.source.head ?? "unknown").slice(0, 7)}`,
      `Now: ${now}`,
      `Focus: ${focus}`,
      `Next: ${c.next}/${c.nextMax}. Later: ${c.later}. Done: ${c.done}. Dropped: ${c.dropped}. Blocked: ${c.blockers}.`,
      `Claimable: ${claimable.length ? claimable.join(", ") : "none"}`,
      `Inbox: ${c.openInbox} open, ${c.discuss} to discuss. Briefs shaping: ${c.shapingBriefs}.`,
      `Risks: ${c.openRisks} open (${c.redRisks} red, ${c.amberRisks} amber, ${c.greenRisks} green).`,
      `Review: ${d.checks.reviewDue ? "due" : "not due"} (last: ${d.checks.lastReview ?? "never"}). Drift: ${d.checks.drift ? "yes" : "no"}.`,
    ].join("\n"),
  );
  return 0;
}

export function main(argv: string[]): number {
  const args = parseArgs(argv);
  try {
    switch (args.command) {
      case "write":
        return write(args);
      case "check":
        return check(args);
      case "validate":
        return validateCommand(args);
      case "get": {
        const value = at(readExport(args), args.positional[0] ?? "");
        if (value === undefined) throw new Failure(`No value at ${args.positional[0]}.`);
        print(value);
        return 0;
      }
      case "find": {
        if (!args.positional[0]) break;
        const found = findId(readExport(args), args.positional[0]);
        if (!found.length) throw new Failure(`No entry with the ID ${args.positional[0]}.`);
        print(found);
        return 0;
      }
      case "summary":
        return summary(args);
    }
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
  console.error(USAGE);
  return 2;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
