## Description

<!-- What does this PR do? Why is it needed? -->

## Type of change

- [ ] Bug fix
- [ ] New tool
- [ ] Enhancement to existing tool
- [ ] Documentation
- [ ] Refactoring
- [ ] Other (describe):

## Routes affected

<!-- Which routes were added or changed? -->

## Checklist

- [ ] **CLA**: I have read and agree to the [Contributor License Agreement](../CLA.md)
- [ ] **Client-side only**: All file processing happens in the browser — no server uploads, no external API calls with user file data
- [ ] **Processor separation**: Processing logic is in `app/features/*/processors/`, not in route files or React components
- [ ] **Dynamic imports**: Heavy libraries are dynamically imported, not bundled at top level or in shared modules
- [ ] **Bundle boundaries**: Users of other tools do not download this tool's dependencies
- [ ] **Route meta**: Public routes export `meta()` using `buildMeta()`
- [ ] **Prerender**: Public routes are listed in `react-router.config.ts` prerender config
- [ ] **Responsive**: UI works on mobile and desktop
- [ ] **Dark mode**: Tested in both light and dark mode
- [ ] **Accessibility**: Interactive elements are keyboard-accessible, drag/drop has file-picker fallback
- [ ] **Guardrails**: File size/count limits are defined, large input fails gracefully

## Tests

- [ ] Unit tests for processor/helper logic
- [ ] Component test for main UI behavior
- [ ] Playwright happy-path E2E test
- [ ] Invalid input test case
- [ ] Route smoke test passes
- [ ] `npm run build` — production build succeeds

## Dependencies

<!-- List any new dependencies added and justify each one -->
<!-- If none, write "No new dependencies" -->

## Bundle/Performance

<!-- Any concerns about bundle size, loading time, or memory usage? -->
<!-- If none, write "No concerns" -->
