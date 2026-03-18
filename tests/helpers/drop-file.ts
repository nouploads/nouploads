import { fireEvent } from "@testing-library/react";

/**
 * Simulate selecting a single file via the file input.
 * Finds the first `input[type="file"]` in the document and fires a change event.
 */
export function dropFile(file: File): void {
	const input = document.querySelector(
		'input[type="file"]',
	) as HTMLInputElement;
	if (!input) throw new Error("No file input found in document");
	fireEvent.change(input, { target: { files: [file] } });
}

/**
 * Simulate selecting multiple files via the file input.
 */
export function dropFiles(files: File[]): void {
	const input = document.querySelector(
		'input[type="file"]',
	) as HTMLInputElement;
	if (!input) throw new Error("No file input found in document");
	fireEvent.change(input, { target: { files } });
}
