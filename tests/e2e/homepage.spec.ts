import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Privacy-first file tools');
    await expect(page.locator('h1')).toContainText('Everything runs in your browser');
  });

  test('should display privacy badges', async ({ page }) => {
    await expect(page.getByText('No uploads')).toBeVisible();
    await expect(page.getByText('Free & open source')).toBeVisible();
    await expect(page.getByText('Works offline')).toBeVisible();
  });

  test('should display all tools in the grid', async ({ page }) => {
    await expect(page.getByText('HEIC to JPG')).toBeVisible();
    await expect(page.getByText('Image Compress')).toBeVisible();
    await expect(page.getByText('Image Convert')).toBeVisible();
    await expect(page.getByText('Image Resize')).toBeVisible();
    await expect(page.getByText('EXIF Viewer')).toBeVisible();
    await expect(page.getByText('Images to PDF')).toBeVisible();
  });

  test('should display "How it works" section', async ({ page }) => {
    await expect(page.getByText('How it works')).toBeVisible();
    await expect(page.getByText('Choose a tool')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Drop your files' })).toBeVisible();
    await expect(page.getByText('Download results')).toBeVisible();
  });

  test('should have header with logo and GitHub link', async ({ page }) => {
    const header = page.locator('header');
    await expect(header.getByText('NoUploads')).toBeVisible();
    await expect(header.locator('a[href*="github"]')).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should have tool filter search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/filter tools/i)).toBeVisible();
  });

  test('should filter tools when typing in search', async ({ page }) => {
    const input = page.getByPlaceholder(/filter tools/i);
    await input.fill('heic');
    await expect(page.getByText('HEIC to JPG')).toBeVisible();
    await expect(page.getByText('Image Compress')).not.toBeVisible();
  });
});
