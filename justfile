default:
    @just --list

# Verify the required tools exist, then install the git hooks.
install: check-prerequisites
    lefthook install

check-prerequisites:
    @command -v bun >/dev/null || { echo "bun is required: https://bun.sh"; exit 1; }
    @command -v bunx >/dev/null || { echo "bunx is required (ships with bun)"; exit 1; }
    @command -v lefthook >/dev/null || { echo "lefthook is required: https://lefthook.dev/installation"; exit 1; }

# Clear and re-link this repo's pm-* skills into .claude/ and .agents/ (--cli: use the skills CLI, which copies).
setup-skills *args:
    bun scripts/setup-skills.ts {{args}}

# Check skill structure and cross-references.
validate:
    bun scripts/validate.ts

# Test the skills' scripts (pm-export's exporter and pm-lint, against their fixtures).
test:
    bun test scripts/ skills/pm-export/ skills/pm-lint/

# Check planning/ against the PM file format rules (pm-lint). `just pm-lint fix` repairs the layout ones.
pm-lint command="check":
    bun skills/pm-lint/scripts/lint.ts {{command}}

# Lint Markdown, validate skills, test their scripts, and lint planning/. Used by the lefthook pre-push hook.
lint-check: validate test pm-lint package-test
    bunx markdownlint-cli2 "**/*.md" "#node_modules"

# Lint all Markdown and apply automatic fixes.
lint-fix:
    bunx markdownlint-cli2 --fix "**/*.md" "#node_modules"

# Bump package.json: patch, minor, major, prepatch, preminor, premajor, prerelease [--preid <id>], release, or set <version>. Raising the major also bumps the rules version.
bump part *args:
    bun scripts/bump-version.ts {{part}} {{args}}

# Check the version against main (default: the merge base with origin/main). Used by the lefthook pre-push hook.
version-check base="":
    bun scripts/check-version.ts {{base}}

# Serve the project site (plan, README, every skill) at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('docs-site')]
docs:
    bun install --frozen-lockfile
    bun run dev

# Build the project site with its search index, then serve the build at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('docs-site')]
docs-preview:
    bun install --frozen-lockfile
    bun run build
    bun run preview

# Check the project site against the pm-docs-site templates, then test, type-check and build it.
[group('Docs')]
[working-directory('docs-site')]
docs-check:
    bun ../skills/pm-docs-site/scripts/site.ts check .
    bun install --frozen-lockfile
    bun run test
    bun run check
    bun run build

# Test and type-check the pm-docs-site package (published from publish-pm-docs-site.yml), then run its browser tests in Chromium. Its builds need Node 22 or later.
[group('Docs')]
[working-directory('packages/pm-docs-site')]
package-test:
    bun install --frozen-lockfile
    bun test
    bun run check
    bunx playwright install chromium
    bun run test:browser