# Prompt: Add New Tool

Use this template when asking an AI agent to add a new tool to NoUploads.

---

## Template

```
Task: add `/image/{tool-slug}`.

Follow the exact structure and conventions used by the canonical example tool (`/image/heic-to-jpg`).

Allowed to change:
- apps/web/app/routes/image/{tool-slug}.tsx
- apps/web/app/features/image-tools/components/{tool-slug}-tool.tsx
- apps/web/app/features/image-tools/processors/{tool-slug}.ts
- apps/web/app/lib/tools.ts (add tool entry, set comingSoon: false)
- apps/web/app/components/marketing/tool-icon.tsx (add icon to iconMap)
- packages/core/src/tools/{tool-slug}.ts (core tool definition)
- packages/core/tests/{tool-slug}.test.ts (core tests)
- packages/core/src/index.ts (register side-effect import)
- apps/web/tests/unit/processors/{tool-slug}.test.ts
- apps/web/tests/unit/components/tools/{ToolName}Tool.test.tsx
- apps/web/tests/e2e/{tool-slug}.spec.ts
- apps/web/tests/e2e/fixtures/ (add test files as needed)
- apps/web/react-router.config.ts (add prerender entry)

Do not change:
- shared layout components
- global route patterns
- existing processors
- existing tests
- package.json (unless a new dependency is justified)

Requirements:
- write unit tests first (spec-first)
- use shared ToolPageLayout
- export route meta() using buildMeta()
- keep route file under 120 lines
- heavy dependencies must use dynamic import()
- invalid file behavior required
- large file behavior required (guardrails)
- preserve bundle boundaries
- pass typecheck, Vitest, and Playwright

Self-check before reporting done:
- verify imports are route-local where needed
- verify no shared barrel imported heavy libs
- verify route exports meta()
- verify tests cover happy path + invalid file
- verify no unrelated files changed
- run build to confirm
```

---

## Usage Notes

- Replace `{tool-slug}` with the actual tool name (e.g., `compress`, `resize`, `remove-metadata`)
- For PDF tools, change `image-tools` to `pdf-tools` and route prefix to `/pdf/`
- For developer tools, change `image-tools` to `developer-tools` and route prefix to `/developer/`
- For vector tools, change `image-tools` to `vector-tools` and route prefix to `/vector/`
- If a new dependency is truly needed, add justification to the prompt
- Always inspect the canonical example first before running this prompt
