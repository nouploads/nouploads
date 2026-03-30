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
			name: /Download SVG/i,
		});
		await expect(downloadButton).toBeVisible({ timeout: 10000 });

		// Download SVGZ button should also appear
		const svgzButton = page.getByRole("button", {
			name: /Download SVGZ/i,
		});
		await expect(svgzButton).toBeVisible({ timeout: 10000 });
	});
});
