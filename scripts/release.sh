#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/release.sh patch   — bug fix (0.1.0 → 0.1.1)
#   ./scripts/release.sh minor   — new tools/features (0.1.0 → 0.2.0)
#   ./scripts/release.sh major   — milestone (0.12.0 → 1.0.0)
#
# Bumps every workspace package.json + root in lockstep (via
# scripts/bump-workspace-versions.mjs), rewrites CHANGELOG.md, commits,
# tags, and pushes. The tag push triggers .github/workflows/release.yml
# which publishes the public workspace packages to npm and creates the
# GitHub Release.

BUMP_TYPE="${1:-minor}"

# --- Read current version from root package.json ---
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# --- Calculate new version ---
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
  major)
    NEW_VERSION="$((MAJOR + 1)).0.0"
    ;;
  minor)
    NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
    ;;
  patch)
    NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
    ;;
  *)
    echo "Usage: $0 [major|minor|patch]"
    exit 1
    ;;
esac

echo "New version: $NEW_VERSION"

# --- Get the last release tag (or all commits if none) ---
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  COMMIT_RANGE="HEAD"
  echo "No previous tags found. Including all commits."
else
  COMMIT_RANGE="${LAST_TAG}..HEAD"
  echo "Changes since $LAST_TAG:"
fi

# --- Build changelog entry from commits ---
DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE"$'\n'

FEATURES=$(git log "$COMMIT_RANGE" --pretty=format:"%s" --no-merges | grep -iE "^feat:" | sed 's/^feat: *//i' || true)
FIXES=$(git log "$COMMIT_RANGE" --pretty=format:"%s" --no-merges | grep -iE "^fix:" | sed 's/^fix: *//i' || true)
OTHER=$(git log "$COMMIT_RANGE" --pretty=format:"%s" --no-merges | grep -ivE "^(feat|fix|chore|ci|docs|style|refactor|test|build):" || true)
CHORES=$(git log "$COMMIT_RANGE" --pretty=format:"%s" --no-merges | grep -iE "^(chore|ci|docs|style|refactor|test|build):" | sed 's/^[a-z]*: *//i' || true)

if [ -n "$FEATURES" ]; then
  CHANGELOG_ENTRY+=$'\n'"### Added"$'\n'
  while IFS= read -r line; do
    CHANGELOG_ENTRY+="- $line"$'\n'
  done <<< "$FEATURES"
fi

if [ -n "$FIXES" ]; then
  CHANGELOG_ENTRY+=$'\n'"### Fixed"$'\n'
  while IFS= read -r line; do
    CHANGELOG_ENTRY+="- $line"$'\n'
  done <<< "$FIXES"
fi

if [ -n "$OTHER" ]; then
  CHANGELOG_ENTRY+=$'\n'"### Other"$'\n'
  while IFS= read -r line; do
    CHANGELOG_ENTRY+="- $line"$'\n'
  done <<< "$OTHER"
fi

if [ -n "$CHORES" ]; then
  CHANGELOG_ENTRY+=$'\n'"### Maintenance"$'\n'
  while IFS= read -r line; do
    CHANGELOG_ENTRY+="- $line"$'\n'
  done <<< "$CHORES"
fi

# --- Show summary ---
COMMIT_COUNT=$(git rev-list --count "$COMMIT_RANGE" --no-merges 2>/dev/null || echo "all")
echo ""
echo "========================================="
echo "  Releasing v$NEW_VERSION"
echo "  $COMMIT_COUNT commits since last release"
echo "========================================="
echo ""
echo "$CHANGELOG_ENTRY"
echo ""

# --- Confirm ---
read -p "Proceed? (y/N) " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- Bump every workspace package.json + root in lockstep ---
node scripts/bump-workspace-versions.mjs "$NEW_VERSION"

# --- Prepend to CHANGELOG.md ---
if [ -f CHANGELOG.md ]; then
  TMPFILE=$(mktemp)
  echo "# Changelog" > "$TMPFILE"
  echo "" >> "$TMPFILE"
  echo "$CHANGELOG_ENTRY" >> "$TMPFILE"
  tail -n +2 CHANGELOG.md >> "$TMPFILE"
  mv "$TMPFILE" CHANGELOG.md
else
  echo "# Changelog" > CHANGELOG.md
  echo "" >> CHANGELOG.md
  echo "$CHANGELOG_ENTRY" >> CHANGELOG.md
fi

# --- Commit, tag, push ---
git add package.json apps/web/package.json packages/*/package.json CHANGELOG.md
git commit -m "chore: release v$NEW_VERSION"
git tag "v$NEW_VERSION"
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "Released v$NEW_VERSION"
echo "   GitHub Actions will publish to npm + create the GitHub Release."
echo "   https://github.com/nouploads/nouploads/releases/tag/v$NEW_VERSION"
echo "   https://www.npmjs.com/package/nouploads/v/$NEW_VERSION (after workflow finishes)"
