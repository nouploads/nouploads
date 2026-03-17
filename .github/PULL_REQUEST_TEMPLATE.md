## Description

<!-- What does this PR do? Why is it needed? -->

## Type of change

- [ ] Bug fix
- [ ] New tool
- [ ] Enhancement to existing tool
- [ ] Documentation
- [ ] Refactoring
- [ ] Other (describe):

## Checklist

- [ ] **CLA**: I have read and agree to the [Contributor License Agreement](../CLA.md)
- [ ] **Client-side only**: All file processing happens in the browser — no server uploads, no external API calls with user file data
- [ ] **Processor separation**: Processing logic is in `src/processors/`, not in React components
- [ ] **Dynamic imports**: Heavy libraries are dynamically imported, not bundled at top level
- [ ] **Loading states**: Libraries >500KB show a progress bar during loading
- [ ] **Responsive**: UI works on mobile and desktop
- [ ] **Dark mode**: Tested in both light and dark mode
- [ ] **Accessibility**: Interactive elements are keyboard-accessible
- [ ] **SEO metadata**: Tool pages have unique title, description, and OG tags
- [ ] **Static content**: Tool pages include explanation text and FAQ section in the Astro template

## Testing

<!-- How did you test this? -->

- [ ] `npm run dev` — dev server works
- [ ] `npm run build` — production build succeeds
- [ ] Tested the tool with real files
- [ ] Verified no network requests are made with user file data (checked Network tab)
