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

		// Upload the file first
		await uploadViaDropzone(page, join(fixtures, "sample.pdf"));

		// Verify the hint appears (no password yet)
		await expect(
			page.getByText("Enter at least one password to protect the PDF"),
		).toBeVisible({ timeout: 10000 });

		// Now type a password — auto-processing starts when both file and password are present
		const passwordInput = page.getByPlaceholder(
			"Enter password to open the PDF",
		);
		await passwordInput.fill("test123");

		const downloadBtn = page.getByRole("button", { name: /download/i });
		await expect(downloadBtn).toBeVisible({ timeout: 30000 });

		// Verify result info is shown
		await expect(page.getByText("Original", { exact: true })).toBeVisible();
		await expect(page.getByText("Protected", { exact: true })).toBeVisible();
		await expect(page.getByText(/pages? protected/i).first()).toBeVisible();

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
