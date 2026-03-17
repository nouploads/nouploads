import { test, expect } from '@playwright/test';

test.describe('HEIC to JPG Tool Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image/heic-to-jpg');
  });

  test('should display tool heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Convert HEIC to JPG');
  });

  test('should display file dropzone', async ({ page }) => {
    await expect(page.getByText(/drop a file/i)).toBeVisible();
  });

  test('should display quality slider', async ({ page }) => {
    // The converter should have a quality control
    await expect(page.getByText(/quality/i)).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await expect(page.getByText('What is a HEIC file?')).toBeVisible();
    await expect(page.getByText('Is it safe to convert files here?')).toBeVisible();
  });

  test('should have SEO meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('HEIC');
    expect(description).toContain('JPG');
  });
});
