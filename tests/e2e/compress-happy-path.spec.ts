import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Compress JPG — happy path", () => {
	test("should compress a JPG file and show download button", async ({
		page,
	}) => {
		await page.goto("/image/compress-jpg");
		// Wait for lazy component to hydrate (slider proves React is ready)
		await expect(page.getByText("Quality: 80%")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /compress more/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Compress more", async ({
		page,
	}) => {
		await page.goto("/image/compress-jpg");
		await expect(page.getByText("Quality: 80%")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.jpg"));

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 15000,
		});

		await page.getByRole("button", { name: /compress more/i }).click();
		await expect(page.getByText(/drop files here/i)).toBeVisible();
	});
});

test.describe("Compress PNG — happy path", () => {
	test("should compress a PNG file and show download button", async ({
		page,
	}) => {
		await page.goto("/image/compress-png");
		await expect(page.getByText(/Colors:/i)).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /compress more/i }),
		).toBeVisible();
	});
});

test.describe("Compress WebP — happy path", () => {
	test("should compress a WebP file and show download button", async ({
		page,
	}) => {
		await page.goto("/image/compress-webp");
		await expect(page.getByText("Quality: 80%")).toBeVisible();
		await expect(page.getByText(/drop files here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.webp"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 15000 });

		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Result")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /compress more/i }),
		).toBeVisible();
	});
});
