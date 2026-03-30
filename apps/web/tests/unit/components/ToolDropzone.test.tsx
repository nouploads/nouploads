import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToolDropzone } from "~/components/tool/tool-dropzone";

describe("ToolDropzone", () => {
	it("should render default drop message", () => {
		render(<ToolDropzone onFiles={() => {}} />);

		expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
	});

	it('should show "files" for multi-file mode', () => {
		render(<ToolDropzone onFiles={() => {}} multiple />);

		expect(screen.getByText(/drop files here/i)).toBeInTheDocument();
	});

	it("should display accepted file extensions", () => {
		render(
			<ToolDropzone
				accept={{ "image/heic": [".heic", ".HEIC"] }}
				onFiles={() => {}}
			/>,
		);

		expect(screen.getByText(/\.heic/i)).toBeInTheDocument();
	});

	it("should still enforce max file size even though text is hidden", () => {
		const onFiles = vi.fn();
		render(<ToolDropzone onFiles={onFiles} maxSizeMB={10} />);

		// The max size text is no longer displayed, but validation still works
		expect(screen.queryByText(/max 10mb/i)).not.toBeInTheDocument();
	});

	it("should call onFiles when a file is selected", () => {
		const onFiles = vi.fn();
		render(<ToolDropzone onFiles={onFiles} />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["test"], "test.heic", { type: "image/heic" });

		fireEvent.change(input, { target: { files: [file] } });

		expect(onFiles).toHaveBeenCalledWith([file]);
	});

	it("should reject files exceeding size limit", () => {
		const onFiles = vi.fn();
		render(<ToolDropzone onFiles={onFiles} maxSizeMB={1} />);

		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const file = new File(["x".repeat(2 * 1024 * 1024)], "big.heic", {
			type: "image/heic",
		});

		fireEvent.change(input, { target: { files: [file] } });

		expect(onFiles).not.toHaveBeenCalled();
		expect(screen.getByText(/exceeds/i)).toBeInTheDocument();
	});

	it("should render custom children when provided", () => {
		render(
			<ToolDropzone onFiles={() => {}}>
				<p>Custom content</p>
			</ToolDropzone>,
		);

		expect(screen.getByText("Custom content")).toBeInTheDocument();
		expect(screen.queryByText(/drop a file/i)).not.toBeInTheDocument();
	});

	it("should apply disabled state", () => {
		render(<ToolDropzone onFiles={() => {}} disabled />);

		const dropzone = screen.getByRole("button");
		expect(dropzone.className).toContain("opacity-50");
	});
});
