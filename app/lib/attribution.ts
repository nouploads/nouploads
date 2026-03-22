/**
 * Registry of npm packages and browser APIs used by tools.
 * Used by the LibraryAttribution component to render consistent attribution lines.
 *
 * Keys are npm package names so they can be validated against package.json in tests.
 */

export interface PackageAttribution {
	name: string;
	repoUrl: string;
	license: string;
}

export interface BrowserApiAttribution {
	name: string;
	mdnUrl: string;
}

export const PACKAGES = {
	heic2any: {
		name: "heic2any",
		repoUrl: "https://github.com/alexcorvi/heic2any",
		license: "MIT",
	},
	"image-q": {
		name: "image-q",
		repoUrl: "https://github.com/ibezkrovnyi/image-quantization",
		license: "MIT",
	},
	"gifuct-js": {
		name: "gifuct-js",
		repoUrl: "https://github.com/matt-way/gifuct-js",
		license: "MIT",
	},
	"react-colorful": {
		name: "react-colorful",
		repoUrl: "https://github.com/omgovich/react-colorful",
		license: "MIT",
	},
	culori: {
		name: "culori",
		repoUrl: "https://github.com/Evercoder/culori",
		license: "MIT",
	},
	"gifsicle-wasm-browser": {
		name: "gifsicle-wasm-browser",
		repoUrl: "https://github.com/renzhezhilu/gifsicle-wasm-browser",
		license: "MIT",
	},
	"@jsquash/avif": {
		name: "@jsquash/avif",
		repoUrl: "https://github.com/jamsinclair/jSquash",
		license: "Apache-2.0",
	},
} as const satisfies Record<string, PackageAttribution>;

export type PackageId = keyof typeof PACKAGES;

export const BROWSER_APIS = {
	canvas: {
		name: "Canvas API",
		mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API",
	},
} as const satisfies Record<string, BrowserApiAttribution>;

export type BrowserApiId = keyof typeof BROWSER_APIS;
