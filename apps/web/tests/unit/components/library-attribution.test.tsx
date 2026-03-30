import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LibraryAttribution } from "~/components/tool/library-attribution";

describe("LibraryAttribution", () => {
	it("renders single package attribution", () => {
		render(<LibraryAttribution packages={["heic2any"]} />);
		const link = screen.getByRole("link", { name: "heic2any" });
		expect(link).toHaveAttribute(
			"href",
			"https://github.com/alexcorvi/heic2any",
		);
		expect(screen.getByText(/MIT License/)).toBeInTheDocument();
		expect(screen.getByText(/Powered by/)).toBeInTheDocument();
	});

	it("renders multiple packages with custom prefix", () => {
		render(
			<LibraryAttribution
				packages={["react-colorful", { id: "culori", prefix: "Color math by" }]}
			/>,
		);
		expect(
			screen.getByRole("link", { name: "react-colorful" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "culori" })).toBeInTheDocument();
		expect(screen.getByText(/Color math by/)).toBeInTheDocument();
		expect(screen.getByText(/Powered by/)).toBeInTheDocument();
	});

	it("renders browser API attribution", () => {
		render(<LibraryAttribution browserApi="canvas" />);
		const link = screen.getByRole("link", { name: "Canvas API" });
		expect(link).toHaveAttribute(
			"href",
			"https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API",
		);
		expect(screen.getByText(/no external libraries/)).toBeInTheDocument();
	});

	it("renders nothing when no props given", () => {
		const { container } = render(<LibraryAttribution />);
		expect(container.innerHTML).toBe("");
	});
});
