// The session map: which skills and PM files each session type loads.
// Data lives in ../references/sessions.json; this file loads and checks it.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SessionId = "always" | "resume" | "claim" | "checkpoint" | "review";

export interface SessionSpec {
  id: SessionId;
  agentFile?: true;
  skills?: string[];
  handoff?: string;
  pmFiles?: string[];
  partial?: string[];
  brief?: true;
  decisions?: true;
  inbox?: true;
}

export interface SessionMap {
  version: 1;
  sessions: SessionSpec[];
  tidy: { "LOG.md": number; "ROADMAP.md": number; brief: number };
}

export class MapError extends Error {}

export const SESSION_IDS: readonly SessionId[] = ["always", "resume", "claim", "checkpoint", "review"];
const SESSION_KEYS = ["id", "agentFile", "skills", "handoff", "pmFiles", "partial", "brief", "decisions", "inbox"];
const LIST_KEYS = ["skills", "pmFiles", "partial"] as const;
const FLAG_KEYS = ["agentFile", "brief", "decisions", "inbox"] as const;
const TIDY_KEYS = ["LOG.md", "ROADMAP.md", "brief"] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function onlyKeys(value: Record<string, unknown>, keys: readonly string[], path: string) {
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new MapError(`${path}: unknown key "${key}"`);
}

/** Check the shape of a parsed sessions.json; throws MapError with the first problem. */
export function parseMap(json: unknown): SessionMap {
  if (!isObject(json)) throw new MapError("sessions.json: not an object");
  onlyKeys(json, ["version", "sessions", "tidy"], "sessions.json");
  if (json.version !== 1) throw new MapError("version: must be 1");
  if (!Array.isArray(json.sessions)) throw new MapError("sessions: must be an array");

  const seen = new Set<string>();
  json.sessions.forEach((session, i) => {
    const path = `sessions[${i}]`;
    if (!isObject(session)) throw new MapError(`${path}: not an object`);
    onlyKeys(session, SESSION_KEYS, path);
    if (!SESSION_IDS.includes(session.id as SessionId)) throw new MapError(`${path}.id: must be one of ${SESSION_IDS.join(", ")}`);
    if (seen.has(session.id as string)) throw new MapError(`${path}.id: duplicate "${session.id}"`);
    seen.add(session.id as string);
    for (const key of LIST_KEYS) {
      const list = session[key];
      if (list !== undefined && (!Array.isArray(list) || !list.every((x) => typeof x === "string" && x !== "")))
        throw new MapError(`${path}.${key}: must be an array of names`);
    }
    for (const key of FLAG_KEYS) if (session[key] !== undefined && session[key] !== true) throw new MapError(`${path}.${key}: must be true`);
    if (session.handoff !== undefined && (typeof session.handoff !== "string" || session.handoff === ""))
      throw new MapError(`${path}.handoff: must be a stage name`);
  });
  for (const id of SESSION_IDS) if (!seen.has(id)) throw new MapError(`sessions: missing "${id}"`);

  if (!isObject(json.tidy)) throw new MapError("tidy: must be an object");
  onlyKeys(json.tidy, TIDY_KEYS, "tidy");
  for (const key of TIDY_KEYS) {
    const limit = json.tidy[key];
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit <= 0) throw new MapError(`tidy.${key}: must be a positive integer`);
  }

  const order = (s: { id: unknown }) => SESSION_IDS.indexOf(s.id as SessionId);
  return { ...(json as unknown as SessionMap), sessions: [...(json.sessions as SessionSpec[])].sort((a, b) => order(a) - order(b)) };
}

/** Load and check the map; defaults to ../references/sessions.json beside this script. */
export function loadMap(path = join(import.meta.dir, "..", "references", "sessions.json")): SessionMap {
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new MapError(`${path}: ${(error as Error).message}`);
  }
  return parseMap(json);
}
