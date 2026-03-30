import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Image Convert — happy path", () => {
	test("should convert a JPG to PNG and show download button", async ({
		page,
	}) => {
		await page.goto("/image/convert");
		// Wait for lazy component to hydrate (format selector proves React is ready)
		await expect(page.getByText("Output format:")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /convert another/i }),
		).toBeVisible();
	});

	test("should convert a PNG via the JPG-to-PNG landing page", async ({
		page,
	}) => {
		await page.goto("/image/jpg-to-png");
		await expect(page.getByText("Output format:")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
	});
});
