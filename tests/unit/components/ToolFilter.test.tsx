import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import ToolFilter from "~/components/marketing/tool-filter";
import { gridTools } from "~/lib/tools";

const issuesUrl = "https://github.com/nouploads/nouploads/issues";

function renderWithRouter(ui: React.ReactElement) {
	return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("ToolFilter", () => {
	it("should render all tools when no search query", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		expect(screen.getByText("Image Convert")).toBeInTheDocument();
		expect(screen.getByText("Image Compress")).toBeInTheDocument();
		expect(screen.getByText("Image Resize")).toBeInTheDocument();
		expect(screen.getByText("EXIF Viewer")).toBeInTheDocument();
		expect(screen.getByText("Images to PDF")).toBeInTheDocument();
		expect(screen.getByText("Color Picker")).toBeInTheDocument();
	});

	it("should render a search input with placeholder", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		expect(input).toBeInTheDocument();
	});

	it("should filter tools by exact match", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "convert" } });

		expect(screen.getByText("Image Convert")).toBeInTheDocument();
		expect(screen.queryByText("Image Compress")).not.toBeInTheDocument();
		expect(screen.queryByText("Image Resize")).not.toBeInTheDocument();
	});

	it("should filter tools by description match", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "metadata" } });

		expect(screen.getByText("EXIF Viewer")).toBeInTheDocument();
		expect(screen.queryByText("Image Convert")).not.toBeInTheDocument();
	});

	it("should handle fuzzy search with typos", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "compres" } });

		expect(screen.getByText("Image Compress")).toBeInTheDocument();
	});

	it("should show result count when searching", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "compress" } });

		expect(screen.getByText(/of 6/)).toBeInTheDocument();
	});

	it("should show no-results message with issue link for unmatched query", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "xyznonexistent" } });

		expect(screen.getByText(/no tools found/i)).toBeInTheDocument();
		const issueLink = screen.getByRole("link", { name: /open an issue/i });
		expect(issueLink).toHaveAttribute(
			"href",
			expect.stringContaining(issuesUrl),
		);
		expect(issueLink).toHaveAttribute(
			"href",
			expect.stringContaining("xyznonexistent"),
		);
	});

	it("should show all tools again when search is cleared", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const input = screen.getByPlaceholderText(/filter tools/i);
		fireEvent.change(input, { target: { value: "convert" } });
		expect(screen.queryByText("Image Compress")).not.toBeInTheDocument();

		fireEvent.change(input, { target: { value: "" } });
		expect(screen.getByText("Image Compress")).toBeInTheDocument();
		expect(screen.getByText("Image Convert")).toBeInTheDocument();
	});

	it('should mark coming-soon tools with a "Soon" badge', () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const badges = screen.getAllByText("Soon");
		expect(badges.length).toBe(3); // Resize, EXIF, Images to PDFDF
	});

	it("should use Link for active tools and div for coming-soon tools", () => {
		renderWithRouter(<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />);

		const convertLink = screen.getByText("Image Convert").closest("a");
		expect(convertLink).toHaveAttribute("href", "/image/convert");

		const compressLink = screen.getByText("Image Compress").closest("a");
		expect(compressLink).toHaveAttribute("href", "/image/compress");

		const colorPickerLink = screen.getByText("Color Picker").closest("a");
		expect(colorPickerLink).toHaveAttribute("href", "/developer/color-picker");

		const resizeEl = screen.getByText("Image Resize").closest("a");
		expect(resizeEl).toBeNull(); // coming-soon uses div, not Link
	});
});
