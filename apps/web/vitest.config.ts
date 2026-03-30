import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./app"),
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/unit/**/*.test.{ts,tsx}"],
	},
});
