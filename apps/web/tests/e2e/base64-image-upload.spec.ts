import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { uploadViaDropzone } from "./helpers/upload-file";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test.describe("Base64 Image — encode flow", () => {
	test("should encode a PNG to base64 and show copy button", async ({
		page,
	}) => {
		await page.goto("/developer/base64-image", { waitUntil: "networkidle" });

		// Wait for the Encode tab to be active and dropzone to be ready
		await expect(
			page.getByRole("tab", { name: /Encode Image to Base64/ }),
		).toBeVisible();
		await expect(page.getByText(/drop a file here/i)).toBeVisible();

		await uploadViaDropzone(page, join(fixtures, "sample.png"));

		// Wait for base64 output to appear
		const dataUriTextarea = page.locator("textarea[readonly]").first();
		await expect(dataUriTextarea).toBeVisible({ timeout: 10000 });
		const value = await dataUriTextarea.inputValue();
		expect(value).toMatch(/^data:image\/png;base64,/);

		// Copy button should be visible
		await expect(
			page.getByRole("button", { name: "Copy" }).first(),
		).toBeVisible();
	});
});

test.describe("Base64 Image — decode flow", () => {
	test("should decode a base64 string and show image preview", async ({
		page,
	}) => {
		await page.goto("/developer/base64-image", { waitUntil: "networkidle" });

		// Switch to the Decode tab
		await page.getByRole("tab", { name: /Decode Base64 to Image/ }).click();

		// Paste a known 1x1 PNG base64 data URI
		const dataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
		await page.locator("#base64-input").fill(dataUri);

		// Wait for the decoded image preview
		await expect(page.getByAltText("Decoded output")).toBeVisible({
			timeout: 10000,
		});

		// Format should be detected
		await expect(page.getByText("Format: image/png")).toBeVisible();

		// Download button should be visible
		await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
	});
});
