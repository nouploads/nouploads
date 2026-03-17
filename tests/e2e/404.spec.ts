import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
  test('should display 404 for non-existent page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });

  test('should have a link back to home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    const backLink = page.getByRole('link', { name: /back to tools/i });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL('/');
  });
});
