import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Page Numbers — happy path", () => {
	test("should add page numbers to a PDF and show download button", async ({
		page,
	}) => {
		await page.goto("/pdf/page-numbers");
		// Wait for lazy component to hydrate (controls prove React is ready)
		await expect(page.getByText("Position", { exact: true })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify page preview image appears
		await expect(page.getByAltText("Page 1 preview")).toBeVisible({
			timeout: 15000,
		});

		// Verify result info is shown
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("With Numbers")).toBeVisible();
		await expect(page.getByText(/pages? numbered/i).first()).toBeVisible();

		await expect(
			page.getByRole("button", { name: /number another/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Number another", async ({
		page,
	}) => {
		await page.goto("/pdf/page-numbers");
		await expect(page.getByText("Position", { exact: true })).toBeVisible({
			timeout: 10000,
		});
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		await page.getByRole("button", { name: /number another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible({
			timeout: 10000,
		});
	});
});
