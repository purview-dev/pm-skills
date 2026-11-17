// SemVer 2.0 for this repository's releases: parse, compare, and bump
// `package.json`'s version, including prereleases (`19.0.0-pre.1`).
//
// Bumps follow npm's rules, so the result is what `npm version <part>` gives:
//
//   from 2.4.2         patch 2.4.3        prepatch 2.4.3-pre.1   prerelease 2.4.3-pre.1
//                      minor 2.5.0        preminor 2.5.0-pre.1
//                      major 3.0.0        premajor 3.0.0-pre.1   release    (error: already stable)
//   from 2.5.0-pre.2   patch 2.5.0 *      prepatch 2.5.1-pre.1   prerelease 2.5.0-pre.3
//                      minor 2.5.0 *      preminor 2.6.0-pre.1   prerelease --preid rc: 2.5.0-rc.1
//                      major 3.0.0        premajor 3.0.0-pre.1   release    2.5.0
//
//   * A stable bump of a prerelease releases it when the prerelease already
//     carries that part's change (2.5.0-pre.2 is on its way to 2.5.0).

export interface Version {
  major: number;
  minor: number;
  patch: number;
  /** Dot-separated identifiers; empty for a stable version. */
  prerelease: (string | number)[];
}

export const STABLE_PARTS = ["patch", "minor", "major"] as const;
export const PRE_PARTS = ["prepatch", "preminor", "premajor", "prerelease"] as const;
export const PARTS = [...STABLE_PARTS, ...PRE_PARTS, "release"] as const;
export type Part = (typeof PARTS)[number];

/** The prerelease label used when none is given: `2.4.3-pre.1`. */
export const DEFAULT_PREID = "pre";

const IDENTIFIER = /^(0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** The version, or null when it is not SemVer 2.0 (build metadata is not used here). */
export function parse(text: string): Version | null {
  const match = VERSION.exec(text.trim().replace(/^v/, ""));
  if (!match) return null;
  const prerelease = match[4] ? match[4].split(".") : [];
  if (!prerelease.every((id) => IDENTIFIER.test(id))) return null; // no leading zeros in numbers
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: prerelease.map((id) => (/^\d+$/.test(id) ? Number(id) : id)),
  };
}

export const format = (v: Version) => `${v.major}.${v.minor}.${v.patch}${v.prerelease.length ? `-${v.prerelease.join(".")}` : ""}`;

export const isPrerelease = (v: Version) => v.prerelease.length > 0;

/** SemVer precedence: negative when a < b, 0 when equal, positive when a > b. */
export function compare(a: Version, b: Version): number {
  for (const key of ["major", "minor", "patch"] as const) if (a[key] !== b[key]) return a[key] - b[key];
  // A prerelease has lower precedence than its release.
  if (!a.prerelease.length || !b.prerelease.length) return b.prerelease.length - a.prerelease.length;
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    if (x === y) continue;
    if (typeof x === "number" && typeof y === "number") return x - y;
    if (typeof x === "number") return -1; // numbers sort before labels
    if (typeof y === "number") return 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

export function validatePreid(preid: string): void {
  if (!/^[0-9A-Za-z-]+$/.test(preid) || /^\d+$/.test(preid)) {
    throw new Error(`--preid "${preid}" must be letters, digits, or hyphens, and not only digits (for example pre, beta, rc).`);
  }
}

/** The next version for a bump part. Throws when the part does not apply (`release` on a stable version). */
export function bump(current: Version, part: Part, preid = DEFAULT_PREID): Version {
  validatePreid(preid);
  const { major, minor, patch } = current;
  const pre = isPrerelease(current);
  const first = [preid, 1];
  switch (part) {
    case "major":
      // 3.0.0-pre.2 is already on its way to 3.0.0.
      return pre && minor === 0 && patch === 0 ? { major, minor, patch, prerelease: [] } : { major: major + 1, minor: 0, patch: 0, prerelease: [] };
    case "minor":
      return pre && patch === 0 ? { major, minor, patch, prerelease: [] } : { major, minor: minor + 1, patch: 0, prerelease: [] };
    case "patch":
      return pre ? { major, minor, patch, prerelease: [] } : { major, minor, patch: patch + 1, prerelease: [] };
    case "premajor":
      return { major: major + 1, minor: 0, patch: 0, prerelease: first };
    case "preminor":
      return { major, minor: minor + 1, patch: 0, prerelease: first };
    case "prepatch":
      return { major, minor, patch: patch + 1, prerelease: first };
    case "prerelease": {
      if (!pre) return { major, minor, patch: patch + 1, prerelease: first };
      const [label, counter] = current.prerelease;
      // Same label: count up. A new label (pre -> rc) starts again at 1 on the same version.
      if (label === preid && typeof counter === "number" && current.prerelease.length === 2) {
        return { major, minor, patch, prerelease: [preid, counter + 1] };
      }
      if (label === preid && current.prerelease.length === 1) return { major, minor, patch, prerelease: [preid, 1] };
      const next = { major, minor, patch, prerelease: first };
      if (compare(next, current) <= 0) {
        throw new Error(`${format(next)} is not after ${format(current)}; choose a later --preid (for example rc after beta) or bump a part.`);
      }
      return next;
    }
    case "release":
      if (!pre) throw new Error(`${format(current)} is already stable; use patch, minor, or major, or a pre* part to start a prerelease.`);
      return { major, minor, patch, prerelease: [] };
  }
}
