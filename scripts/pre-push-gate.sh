#!/bin/bash
# Pre-push gate for Claude Code: mirrors CI checks before allowing git push.
# Called as a PreToolUse hook — blocks the push if any check fails.

# Only gate on git push commands
if ! echo "$CLAUDE_TOOL_INPUT" | grep -q 'git push'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Pre-push gate: running full CI checks..."

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

echo "→ Lighthouse"
if ! (cd apps/web && npx lhci autorun 2>&1); then
  echo "BLOCKED: Lighthouse checks failed."
  exit 1
fi

echo "Pre-push gate: all checks passed."
exit 0
