import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToolState } from "~/hooks/use-tool-state";

describe("useToolState", () => {
	it("should start in idle phase with no files", () => {
		const { result } = renderHook(() => useToolState());

		expect(result.current.phase).toBe("idle");
		expect(result.current.files).toEqual([]);
		expect(result.current.result).toBeNull();
		expect(result.current.error).toBeNull();
		expect(result.current.isSingleFile).toBe(false);
		expect(result.current.isBatch).toBe(false);
	});

	it("should transition to ready when files are added", () => {
		const { result } = renderHook(() => useToolState());
		const file = new File(["data"], "test.heic", { type: "image/heic" });

		act(() => result.current.handleFiles([file]));

		expect(result.current.phase).toBe("ready");
		expect(result.current.files).toEqual([file]);
		expect(result.current.isSingleFile).toBe(true);
		expect(result.current.isBatch).toBe(false);
	});

	it("should detect batch mode with multiple files", () => {
		const { result } = renderHook(() => useToolState());
		const files = [
			new File(["a"], "a.heic", { type: "image/heic" }),
			new File(["b"], "b.heic", { type: "image/heic" }),
		];

		act(() => result.current.handleFiles(files));

		expect(result.current.isSingleFile).toBe(false);
		expect(result.current.isBatch).toBe(true);
	});

	it("should ignore empty file arrays", () => {
		const { result } = renderHook(() => useToolState());

		act(() => result.current.handleFiles([]));

		expect(result.current.phase).toBe("idle");
		expect(result.current.files).toEqual([]);
	});

	it("should transition through processing to done with result", () => {
		const { result } = renderHook(() => useToolState<string>());
		const file = new File(["data"], "test.heic");

		act(() => result.current.handleFiles([file]));
		act(() => result.current.startProcessing());
		expect(result.current.phase).toBe("processing");

		act(() => result.current.finish("converted-blob"));
		expect(result.current.phase).toBe("done");
		expect(result.current.result).toBe("converted-blob");
	});

	it("should transition to error phase on failure", () => {
		const { result } = renderHook(() => useToolState());
		const file = new File(["data"], "test.heic");

		act(() => result.current.handleFiles([file]));
		act(() => result.current.startProcessing());
		act(() => result.current.fail("Invalid file"));

		expect(result.current.phase).toBe("error");
		expect(result.current.error).toBe("Invalid file");
	});

	it("should clear error when startProcessing is called", () => {
		const { result } = renderHook(() => useToolState());
		const file = new File(["data"], "test.heic");

		act(() => result.current.handleFiles([file]));
		act(() => result.current.fail("some error"));
		act(() => result.current.startProcessing());

		expect(result.current.error).toBeNull();
	});

	it("should fully reset to idle", () => {
		const { result } = renderHook(() => useToolState<string>());
		const file = new File(["data"], "test.heic");

		act(() => result.current.handleFiles([file]));
		act(() => result.current.finish("done"));
		act(() => result.current.reset());

		expect(result.current.phase).toBe("idle");
		expect(result.current.files).toEqual([]);
		expect(result.current.result).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it("should clear previous result/error when new files are added", () => {
		const { result } = renderHook(() => useToolState<string>());

		act(() => result.current.handleFiles([new File(["a"], "a.heic")]));
		act(() => result.current.finish("old-result"));

		act(() => result.current.handleFiles([new File(["b"], "b.heic")]));

		expect(result.current.phase).toBe("ready");
		expect(result.current.result).toBeNull();
		expect(result.current.error).toBeNull();
	});
});
