import { loadAllTools } from "@nouploads/core/load-all-tools";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
	await loadAllTools();
});

describe("programmatic API", () => {
	it("should export convertFile function", async () => {
		const api = await import("../src/index");
		expect(typeof api.convertFile).toBe("function");
	});

	it("should export getAllTools", async () => {
		const api = await import("../src/index");
		expect(typeof api.getAllTools).toBe("function");
		const tools = api.getAllTools();
		expect(tools.length).toBeGreaterThan(0);
	});

	it("should export getTool", async () => {
		const api = await import("../src/index");
		expect(typeof api.getTool).toBe("function");
	});

	it("should export findToolByFormats", async () => {
		const api = await import("../src/index");
		expect(typeof api.findToolByFormats).toBe("function");
	});

	it("should export createSharpBackend", async () => {
		const api = await import("../src/index");
		expect(typeof api.createSharpBackend).toBe("function");
	});

	it("should export getToolsByCategory", async () => {
		const api = await import("../src/index");
		expect(typeof api.getToolsByCategory).toBe("function");
	});

	it("should export convert function via core re-export", async () => {
		const api = await import("../src/index");
		expect(typeof api.convert).toBe("function");
	});
});
