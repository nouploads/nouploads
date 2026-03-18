# Prompt: Fix Failing Tests

Use this template when asking an AI agent to fix failing tests.

---

## Template

```
Task: fix failing tests.

Failing test output:
{paste exact test output here}

Changed files:
{list recently changed files}

Requirements:
- fix only the failing scope
- do not change public behavior elsewhere
- do not refactor unrelated code
- do not change test expectations unless the implementation intentionally changed behavior
- keep the fix as small as possible
- rerun the failing tests to confirm the fix

Self-check:
- verify fix addresses the root cause, not just the symptom
- verify no unrelated files were changed
- verify all tests pass after the fix
```

---

## Usage Notes

- Always include the exact error output — do not paraphrase
- Include the list of recently changed files for context
- If the failure is caused by an intentional behavior change, say so explicitly
- Never say "something broke, fix it" — be specific
