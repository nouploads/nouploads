#!/bin/bash
# Pre-push gate for Claude Code: mirrors CI checks before allowing git push.
# Called as a PreToolUse hook — blocks the push if any check fails.

# Only gate on git push commands
if ! echo "$CLAUDE_TOOL_INPUT" | grep -q 'git push'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Pre-push gate: running full CI checks..."

# Stash uncommitted changes so checks run against the committed state.
# This prevents auto-fixed files in the working tree from masking errors.
STASH_NAME="pre-push-gate-$(date +%s)"
git stash push -q --keep-index --include-untracked -m "$STASH_NAME"
STASHED=$?

cleanup() {
  if [ "$STASHED" -eq 0 ] && git stash list | grep -q "$STASH_NAME"; then
    git stash pop -q
  fi
}
trap cleanup EXIT

echo "→ Typecheck"
if ! pnpm --filter @nouploads/web typecheck 2>&1; then
  echo "BLOCKED: TypeScript typecheck failed."
  exit 1
fi

echo "→ Lint"
if ! pnpm exec biome check . 2>&1; then
  echo "BLOCKED: Lint check failed."
  exit 1
fi

echo "→ Build"
if ! pnpm build 2>&1; then
  echo "BLOCKED: Build failed."
  exit 1
fi

echo "→ Unit tests"
if ! pnpm test 2>&1; then
  echo "BLOCKED: Unit tests failed."
  exit 1
fi

echo "→ E2E smoke"
if ! pnpm --filter @nouploads/web exec playwright test tests/e2e/homepage.spec.ts tests/e2e/navigation.spec.ts tests/e2e/404.spec.ts --project=chromium 2>&1; then
  echo "BLOCKED: E2E smoke tests failed."
  exit 1
fi

echo "→ Lighthouse"
if ! node apps/web/scripts/lighthouse-ci.mjs 2>&1; then
  echo "BLOCKED: Lighthouse checks failed."
  exit 1
fi

echo "Pre-push gate: all checks passed."
exit 0
