import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Unlock — happy path", () => {
	test("should unlock a non-encrypted PDF and show download button", async ({
		page,
	}) => {
		await page.goto("/pdf/unlock");
		// Wait for lazy component to hydrate
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// For a non-encrypted PDF, the unlock tool shows the password input and an "Unlock PDF" button
		await expect(page.getByText("PDF Password")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Unlock PDF" }),
		).toBeVisible();

		// Click unlock without a password (non-encrypted PDFs don't need one)
		await page.getByRole("button", { name: "Unlock PDF" }).click();

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify result info is shown
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();

		await expect(
			page.getByRole("button", { name: /unlock another/i }),
		).toBeVisible();
	});

	test("should reset and show dropzone when clicking Unlock another", async ({
		page,
	}) => {
		await page.goto("/pdf/unlock");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		await expect(
			page.getByRole("button", { name: "Unlock PDF" }),
		).toBeVisible();
		await page.getByRole("button", { name: "Unlock PDF" }).click();

		await expect(page.getByRole("button", { name: /download/i })).toBeVisible({
			timeout: 30000,
		});

		await page.getByRole("button", { name: /unlock another/i }).click();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();
	});

	test("should strip encryption from a locked PDF", async ({ page }) => {
		await page.goto("/pdf/unlock");
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample-locked.pdf"));

		await expect(
			page.getByRole("button", { name: "Unlock PDF" }),
		).toBeVisible();
		await page.getByRole("button", { name: "Unlock PDF" }).click();

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Download the result and verify /Encrypt is gone
		const downloadPromise = page.waitForEvent("download");
		await downloadBtn.click();
		const download = await downloadPromise;
		const path = await download.path();
		expect(path).toBeTruthy();

		const fs = await import("node:fs");
		const bytes = fs.readFileSync(path!);
		const content = bytes.toString("latin1");
		expect(content).not.toContain("/Encrypt");
		// Valid PDF magic bytes
		expect(bytes[0]).toBe(0x25);
		expect(bytes[1]).toBe(0x50);
	});
});
