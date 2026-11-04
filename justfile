set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

default:
    @just --list

# Verify the required tools exist, then install the git hooks.
install: check-prerequisites
    lefthook install

[unix]
check-prerequisites:
    @command -v bun >/dev/null || { echo "bun is required: https://bun.sh"; exit 1; }
    @command -v bunx >/dev/null || { echo "bunx is required (ships with bun)"; exit 1; }
    @command -v lefthook >/dev/null || { echo "lefthook is required: https://lefthook.dev/installation"; exit 1; }

[windows]
check-prerequisites:
    @foreach ($tool in 'bun','bunx','lefthook') { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Write-Error "$tool is required"; exit 1 } }

# Check skill structure and cross-references.
validate:
    bun scripts/validate.ts

# Lint Markdown and validate skills. Used by the lefthook pre-push hook.
lint-check: validate
    bunx markdownlint-cli2 "**/*.md" "#node_modules"

# Lint all Markdown and apply automatic fixes.
lint-fix:
    bunx markdownlint-cli2 --fix "**/*.md" "#node_modules"

# Bump the release version in package.json (patch, minor, or major).
bump part:
    bun scripts/bump-version.ts {{part}}
