import '@testing-library/jest-dom/vitest';

// Radix UI primitives use ResizeObserver which jsdom doesn't provide
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
