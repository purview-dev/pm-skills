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

# Lint Markdown and validate skills. Used by the lefthook pre-push hook.
lint-check: validate
    bunx markdownlint-cli2 "**/*.md" "#node_modules"

# Lint all Markdown and apply automatic fixes.
lint-fix:
    bunx markdownlint-cli2 --fix "**/*.md" "#node_modules"

# Bump package.json (patch, minor, or major; major also bumps the rules version).
bump part:
    bun scripts/bump-version.ts {{part}}

# Check the version against main (default: the merge base with origin/main). Used by the lefthook pre-push hook.
version-check base="":
    bun scripts/check-version.ts {{base}}

# Serve the project site (plan, README, every skill) at http://localhost:4321. Requires Bun.
[group('Docs')]
[working-directory('docs-site')]
docs:
    bun install --frozen-lockfile
    bun run dev

# Check the project site against the pm-docs-site templates, then test, type-check and build it.
[group('Docs')]
[working-directory('docs-site')]
docs-check:
    bun ../skills/pm-docs-site/scripts/site.ts check .
    bun install --frozen-lockfile
    bun run test
    bun run check
    bun run build