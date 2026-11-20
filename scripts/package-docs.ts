// Keeps the consumer docs' pinned @purview-dev/pm-docs-site example equal to
// the package's own version, so the docs never name a stale release. Used by
// scripts/validate.ts.

const PIN = /"@purview-dev\/pm-docs-site":\s*"([^"]+)"/g;

/** Every version in a `"@purview-dev/pm-docs-site": "<v>"` dependency line. */
export function pinnedVersions(markdown: string): string[] {
  return [...markdown.matchAll(PIN)].map((match) => match[1]!);
}

/** One message per pin in `markdown` that differs from `version`, or one when there is no pin. */
export function versionDrift(file: string, markdown: string, version: string): string[] {
  const pins = pinnedVersions(markdown);

  if (pins.length === 0) return [`${file}: no pinned @purview-dev/pm-docs-site example`];

  return pins
    .filter((pin) => pin !== version)
    .map((pin) => `${file}: pins @purview-dev/pm-docs-site ${pin}, package.json is ${version}`);
}
