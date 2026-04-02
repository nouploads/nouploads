#!/bin/bash
# Pre-push gate for Claude Code: runs typecheck + lint before allowing git push.
# Called as a PreToolUse hook — blocks the push if checks fail.

# Only gate on git push commands
if ! echo "$CLAUDE_TOOL_INPUT" | grep -q 'git push'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Pre-push gate: running typecheck..."
if ! pnpm --filter @nouploads/web typecheck 2>&1; then
  echo ""
  echo "BLOCKED: TypeScript typecheck failed. Fix type errors before pushing."
  exit 1
fi

echo "Pre-push gate: running lint..."
if ! pnpm exec biome check . 2>&1; then
  echo ""
  echo "BLOCKED: Lint check failed. Run 'pnpm lint:fix' and fix remaining errors before pushing."
  exit 1
fi

echo "Pre-push gate: all checks passed."
exit 0
