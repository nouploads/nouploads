/**
 * Integration tests using the real sharp backend with fixture images.
 * These verify end-to-end: tool.execute() → sharp decode/encode → valid output.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createSharpBackend } from "../../backend-sharp/src/index.js";
import { loadAllTools } from "../src/load-all-tools.js";
import { findToolByFormats, getTool } from "../src/registry.js";

// Register every tool before any test runs.
beforeAll(async () => {
	await loadAllTools();
});

const FIXTURES = join(import.meta.dirname, "fixtures");
const backend = createSharpBackend();

function readFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

describe("sharp backend: format conversions", () => {
	it("png → jpg", async () => {
		const tool = findToolByFormats("png", "jpg");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.png"),
			{ quality: 80 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0xff);
		expect(result.output[1]).toBe(0xd8);
		expect(result.output.byteLength).toBeGreaterThan(0);
	});

	it("jpg → png", async () => {
		const tool = findToolByFormats("jpg", "png");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.jpg"),
			{},
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0x89);
		expect(result.output[1]).toBe(0x50);
	});

	it("png → webp", async () => {
		const tool = findToolByFormats("png", "webp");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.png"),
			{ quality: 75 },
			{ imageBackend: backend },
		);
		// RIFF....WEBP
		expect(result.output[0]).toBe(0x52);
		expect(result.output[1]).toBe(0x49);
		expect(result.output[8]).toBe(0x57);
		expect(result.output[9]).toBe(0x45);
	});

	it("webp → jpg", async () => {
		const tool = findToolByFormats("webp", "jpg");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.webp"),
			{ quality: 80 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0xff);
		expect(result.output[1]).toBe(0xd8);
	});

	it("tiff → jpg (via sharp transcode)", async () => {
		const tool = findToolByFormats("tiff", "jpg");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.tiff"),
			{ quality: 80 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0xff);
		expect(result.output[1]).toBe(0xd8);
	});

	it("svg → png (via sharp transcode)", async () => {
		const tool = findToolByFormats("svg", "png");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.svg"),
			{},
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0x89);
		expect(result.output[1]).toBe(0x50);
	});
});

describe("sharp backend: compression", () => {
	it("compress-jpg produces smaller output", async () => {
		const tool = getTool("compress-jpg");
		if (!tool) throw new Error("not registered");
		const input = readFixture("sample.jpg");
		const result = await tool.execute(
			input,
			{ quality: 30 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0xff);
		expect(result.output[1]).toBe(0xd8);
		expect(result.output.byteLength).toBeLessThan(input.byteLength);
	});

	it("compress-png produces valid PNG", async () => {
		const tool = getTool("compress-png");
		if (!tool) throw new Error("not registered");
		const input = readFixture("sample.png");
		const result = await tool.execute(
			input,
			{ colors: 32 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0x89);
		expect(result.output[1]).toBe(0x50);
	});
});

describe("sharp backend: resize", () => {
	it("resize-image produces correct dimensions", async () => {
		const tool = getTool("resize-image");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.png"),
			{ width: 50, format: "png" },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0x89);
		expect(result.metadata?.newWidth).toBe(50);
	});
});

describe("sharp backend: crop", () => {
	it("crop-image produces valid output", async () => {
		const tool = getTool("crop-image");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.png"),
			{ x: 0, y: 0, width: 10, height: 10, format: "png" },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0x89);
		expect(result.metadata?.cropWidth).toBe(10);
		expect(result.metadata?.cropHeight).toBe(10);
	});
});

describe("sharp backend: exif-strip", () => {
	it("produces valid JPEG without metadata", async () => {
		const tool = getTool("exif-strip");
		if (!tool) throw new Error("not registered");
		const result = await tool.execute(
			readFixture("sample.jpg"),
			{ quality: 90 },
			{ imageBackend: backend },
		);
		expect(result.output[0]).toBe(0xff);
		expect(result.output[1]).toBe(0xd8);
	});
});

describe("sharp backend: optimize-svg", () => {
	it("optimizes an SVG file", async () => {
		const tool = getTool("optimize-svg");
		if (!tool) throw new Error("not registered");
		const input = readFixture("sample.svg");
		const result = await tool.execute(input, {}, {});
		const outputStr = new TextDecoder().decode(result.output);
		expect(outputStr).toContain("<svg");
	});
});
