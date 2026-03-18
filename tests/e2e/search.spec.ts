import { test, expect } from '@playwright/test';

test.describe('Tool Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should have a search input', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await expect(input).toBeVisible();
  });

  test('should filter tools when typing', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await input.fill('heic');

    // Wait for filter count indicator to confirm filter has applied
    await expect(page.getByText(/1 of 6/)).toBeVisible();
    await expect(page.getByText('HEIC to JPG')).toBeVisible();
  });

  test('should show no-results message for unmatched query', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await input.fill('xyznonexistent');

    await expect(page.getByText(/no tools found/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open an issue/i })).toBeVisible();
  });

  test('should restore all tools when search is cleared', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await input.fill('heic');
    // Wait for filter count indicator to confirm filter has applied
    await expect(page.getByText(/1 of 6/)).toBeVisible();

    await input.fill('');
    // Count indicator disappears when showing all tools
    await expect(page.getByText(/1 of 6/)).not.toBeVisible();
    await expect(page.getByText('Image Compress')).toBeVisible();
    await expect(page.getByText('HEIC to JPG')).toBeVisible();
  });

  test('should handle fuzzy search with typos', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await input.fill('heix');

    await expect(page.getByText('HEIC to JPG')).toBeVisible();
  });
});
