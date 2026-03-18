# Test Templates

Copy these patterns when writing tests for a new tool. Replace `{tool-slug}` and `{ToolName}`.

---

## Unit Test: Processor (`tests/unit/processors/{tool-slug}.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock heavy dependency if needed
vi.mock('{heavy-lib}', () => ({
  default: vi.fn(),
}));

import { {processorFn} } from '~/features/image-tools/processors/{tool-slug}';

describe('{processorFn}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a valid file', async () => {
    const input = new Blob(['data'], { type: 'image/png' });
    const result = await {processorFn}(input);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should use default options when none provided', async () => {
    const input = new Blob(['data']);
    const result = await {processorFn}(input);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should throw on invalid input', async () => {
    const input = new Blob(['not-valid']);
    await expect({processorFn}(input)).rejects.toThrow();
  });
});

// If batch processor exists:
describe('{processorFn}Batch', () => {
  it('should process multiple files', async () => {
    const inputs = [new Blob(['a']), new Blob(['b'])];
    const results = await {processorFn}Batch(inputs);
    expect(results).toHaveLength(2);
  });

  it('should return Error for failed files without stopping batch', async () => {
    // Mock one success, one failure
    const results = await {processorFn}Batch([validBlob, invalidBlob]);
    expect(results[0]).toBeInstanceOf(Blob);
    expect(results[1]).toBeInstanceOf(Error);
  });

  it('should call progress callback', async () => {
    const onProgress = vi.fn();
    await {processorFn}Batch([blob1, blob2], opts, onProgress);
    expect(onProgress).toHaveBeenCalledWith(0, 2);
    expect(onProgress).toHaveBeenCalledWith(1, 2);
  });
});
```

---

## Component Test (`tests/unit/components/tools/{ToolName}Tool.test.tsx`)

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { dropFile, dropFiles } from '../../helpers/drop-file';

// Use vi.hoisted() so mocks are available when vi.mock factory runs
const { mockedProcessor, mockedBatchProcessor } = vi.hoisted(() => ({
  mockedProcessor: vi.fn(),
  mockedBatchProcessor: vi.fn(),
}));

vi.mock('~/features/image-tools/processors/{tool-slug}', () => ({
  {processorFn}: mockedProcessor,
  {processorFn}Batch: mockedBatchProcessor,
}));

// Mock URL.createObjectURL/revokeObjectURL for previews
let urlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:preview-${urlCounter++}`);
globalThis.URL.revokeObjectURL = vi.fn();

import {ToolName}Tool from '~/features/image-tools/components/{tool-slug}-tool';

describe('{ToolName}Tool — single file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlCounter = 0;
  });

  afterEach(() => {
    cleanup();
  });

  it('should show dropzone initially', () => {
    render(<{ToolName}Tool />);
    expect(screen.getByText(/drop/i)).toBeInTheDocument();
  });

  it('should process file after drop', async () => {
    mockedProcessor.mockResolvedValue(new Blob(['out'], { type: 'image/png' }));
    render(<{ToolName}Tool />);
    dropFile(new File(['data'], 'input.ext', { type: 'image/png' }));

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error on failure', async () => {
    mockedProcessor.mockRejectedValue(new Error('Processing failed'));
    render(<{ToolName}Tool />);
    dropFile(new File(['bad'], 'bad.ext', { type: 'image/png' }));

    await vi.waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should reset when "Convert more" is clicked', async () => {
    mockedProcessor.mockResolvedValue(new Blob(['out']));
    render(<{ToolName}Tool />);
    dropFile(new File(['data'], 'input.ext'));

    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByRole('button', { name: /convert more|reset/i }));
    expect(screen.getByText(/drop/i)).toBeInTheDocument();
  });
});

describe('{ToolName}Tool — batch mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    urlCounter = 0;
  });

  afterEach(() => {
    cleanup();
  });

  it('should show per-file results', async () => {
    mockedBatchProcessor.mockResolvedValue([new Blob(['a']), new Blob(['b'])]);
    render(<{ToolName}Tool />);
    dropFiles([
      new File(['a'], 'a.ext'),
      new File(['b'], 'b.ext'),
    ]);

    await vi.waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /download/i });
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });
  });
});
```

---

## E2E Test (`tests/e2e/{tool-slug}.spec.ts`)

```ts
import { test, expect } from '@playwright/test';

test.describe('{ToolName} Tool Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image/{tool-slug}');
  });

  test('should display tool heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('{Tool Title}');
  });

  test('should display file dropzone', async ({ page }) => {
    await expect(page.getByText(/drop/i)).toBeVisible();
    const input = page.locator('input[type="file"]');
    await expect(input).toBeAttached();
  });

  test('should have SEO meta description', async ({ page }) => {
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
  });

  test('should have canonical link', async ({ page }) => {
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/image/{tool-slug}');
  });
});
```

---

## Key Patterns

- **`vi.hoisted()`**: Required when `vi.mock()` factory references variables declared with `const`. `vi.mock()` is hoisted above imports, so `const` isn't available yet.
- **`dropFile` / `dropFiles`**: Import from `tests/helpers/drop-file.ts` — simulates file input change events.
- **`URL.createObjectURL` mock**: Required when components create blob URLs for previews.
- **`cleanup()`**: Call in `afterEach` to prevent component leaks between tests.
- **`vi.waitFor({ timeout: 3000 })`**: Use for async operations (processor calls inside useEffect).
