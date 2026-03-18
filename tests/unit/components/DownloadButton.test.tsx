import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DownloadButton } from "~/components/tool/tool-actions";

describe("DownloadButton", () => {
	it("should render with file size", () => {
		const blob = new Blob(["test content"], { type: "image/jpeg" });
		render(<DownloadButton blob={blob} filename="test.jpg" />);

		expect(screen.getByRole("button")).toBeInTheDocument();
		expect(screen.getByText(/download/i)).toBeInTheDocument();
	});

	it("should display custom label when provided", () => {
		const blob = new Blob(["test"]);
		render(
			<DownloadButton blob={blob} filename="test.jpg" label="Save file" />,
		);

		expect(screen.getByText("Save file")).toBeInTheDocument();
	});

	it("should format file sizes correctly", () => {
		// Small file (bytes)
		const smallBlob = new Blob(["hi"]);
		const { rerender } = render(
			<DownloadButton blob={smallBlob} filename="a.jpg" />,
		);
		expect(screen.getByText(/\d+ B/)).toBeInTheDocument();

		// KB file
		const kbBlob = new Blob(["x".repeat(2048)]);
		rerender(<DownloadButton blob={kbBlob} filename="b.jpg" />);
		expect(screen.getByText(/KB/)).toBeInTheDocument();
	});

	it("should trigger download on click", () => {
		const blob = new Blob(["test"], { type: "image/jpeg" });

		const createObjectURL = vi.fn(() => "blob:test-url");
		const revokeObjectURL = vi.fn();
		globalThis.URL.createObjectURL = createObjectURL;
		globalThis.URL.revokeObjectURL = revokeObjectURL;

		const appendChildSpy = vi.spyOn(document.body, "appendChild");
		const removeChildSpy = vi.spyOn(document.body, "removeChild");

		render(<DownloadButton blob={blob} filename="photo.jpg" />);

		fireEvent.click(screen.getByRole("button"));

		expect(createObjectURL).toHaveBeenCalledWith(blob);
		expect(appendChildSpy).toHaveBeenCalled();
		const anchor = appendChildSpy.mock.calls
			.map((call) => call[0])
			.find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement);
		expect(anchor).toBeDefined();
		expect(anchor?.download).toBe("photo.jpg");
		expect(anchor?.href).toContain("blob:");
		expect(removeChildSpy).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalled();

		appendChildSpy.mockRestore();
		removeChildSpy.mockRestore();
	});
});
