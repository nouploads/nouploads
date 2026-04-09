import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("SVG Optimizer — upload and optimize", () => {
	test("should optimize an SVG file and show results", async ({ page }) => {
		await page.goto("/vector/svg-optimizer");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.svg"));

		// File name should appear
		await expect(page.getByText("sample.svg")).toBeVisible();

		// Wait for optimization to complete — size comparison should appear
		await expect(page.getByText(/Original:/)).toBeVisible({
			timeout: 15000,
		});
		await expect(page.getByText(/Optimized:/)).toBeVisible({
			timeout: 15000,
		});

		// Download SVG button should be visible
		const downloadButton = page.getByRole("button", {
			name: /Download SVG \(/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 10000 });

		// Download SVGZ button should also appear
		const svgzButton = page.getByRole("button", {
			name: /Download SVGZ/i,
		});
		await expect(svgzButton).toBeVisible({ timeout: 10000 });
	});

	test("should optimize complex SVGs with arc paths without errors", async ({
		page,
	}) => {
		await page.goto("/vector/svg-optimizer");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample-arcs.svg"));

		await expect(page.getByText("sample-arcs.svg")).toBeVisible();

		// Must show optimization results, not an error
		await expect(page.getByText(/Original:/)).toBeVisible({
			timeout: 15000,
		});
		await expect(page.getByText(/Optimized:/)).toBeVisible();

		// No error should be displayed (the error container has this specific structure)
		const errorEl = page.locator(".text-destructive");
		await expect(errorEl).toHaveCount(0);

		// Download button must work
		await expect(
			page.getByRole("button", { name: /Download SVG \(/i }),
		).toBeVisible();
	});
});
