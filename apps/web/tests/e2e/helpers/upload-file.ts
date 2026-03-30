import type { Page } from "@playwright/test";

/**
 * Upload file(s) to the ToolDropzone component.
 *
 * Waits for the native change listener to be attached (data-listener-ready),
 * then uses setInputFiles + manual event dispatch to trigger processing.
 *
 * Callers MUST wait for the lazy component to hydrate before calling this
 * (e.g. wait for the slider label to be visible).
 */
export async function uploadViaDropzone(
	page: Page,
	filePaths: string | string[],
) {
	const input = page.locator('input[type="file"][data-listener-ready="true"]');
	await input.waitFor({ state: "attached", timeout: 10000 });
	await input.setInputFiles(Array.isArray(filePaths) ? filePaths : [filePaths]);
	// Dispatch change event from JS so the native listener picks it up
	await page.evaluate(() => {
		const el = document.querySelector('input[type="file"]') as HTMLInputElement;
		if (el) el.dispatchEvent(new Event("change", { bubbles: true }));
	});
}
