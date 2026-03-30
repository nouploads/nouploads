import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("PDF Protect — happy path", () => {
	test("should protect a PDF with a password and show download button", async ({
		page,
	}) => {
		await page.goto("/pdf/protect");
		// Wait for lazy component to hydrate (password fields prove React is ready)
		await expect(
			page.getByText("User Password (required to open)"),
		).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		// Enter a user password before uploading — auto-processing requires at least one password
		await page
			.getByPlaceholder("Enter password to open the PDF")
			.fill("test123");

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify result info is shown
		await expect(page.getByText("Original")).toBeVisible();
		await expect(page.getByText("Protected")).toBeVisible();
		await expect(page.getByText(/pages? protected/i)).toBeVisible();

		await expect(
			page.getByRole("button", { name: /protect another/i }),
		).toBeVisible();
	});

	test("should show hint when file uploaded without password", async ({
		page,
	}) => {
		await page.goto("/pdf/protect");
		await expect(
			page.getByText("User Password (required to open)"),
		).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Without a password, the tool shows a hint instead of processing
		await expect(
			page.getByText("Enter at least one password to protect the PDF"),
		).toBeVisible();
	});
});
