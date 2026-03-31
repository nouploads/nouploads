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
	"pdfjs-dist": {
		name: "PDF.js",
		repoUrl: "https://github.com/mozilla/pdf.js",
		license: "Apache-2.0",
	},
	"pdf-lib": {
		name: "pdf-lib",
		repoUrl: "https://github.com/Hopding/pdf-lib",
		license: "MIT",
	},
	exifr: {
		name: "exifr",
		repoUrl: "https://github.com/MikeKovarik/exifr",
		license: "MIT",
	},
	qrcode: {
		name: "qrcode",
		repoUrl: "https://github.com/soldair/node-qrcode",
		license: "MIT",
	},
	"@imgly/background-removal": {
		name: "@imgly/background-removal",
		repoUrl: "https://github.com/imgly/background-removal-js",
		license: "AGPL-3.0",
	},
	fflate: {
		name: "fflate",
		repoUrl: "https://github.com/101arrowz/fflate",
		license: "MIT",
	},
	utif2: {
		name: "utif2",
		repoUrl: "https://github.com/photopea/UTIF.js",
		license: "MIT",
	},
	"decode-ico": {
		name: "decode-ico",
		repoUrl: "https://github.com/LinusU/decode-ico",
		license: "MIT",
	},
	"jxl-oxide-wasm": {
		name: "jxl-oxide-wasm",
		repoUrl: "https://github.com/tirr-c/jxl-oxide",
		license: "MIT",
	},
	"@webtoon/psd": {
		name: "@webtoon/psd",
		repoUrl: "https://github.com/webtoon/psd",
		license: "MIT",
	},
	daikon: {
		name: "Daikon",
		repoUrl: "https://github.com/rii-mango/Daikon",
		license: "BSD-3-Clause",
	},
	"@cornerstonejs/codec-openjpeg": {
		name: "OpenJPEG WASM",
		repoUrl: "https://github.com/cornerstonejs/codecs",
		license: "MIT",
	},
	jszip: {
		name: "JSZip",
		repoUrl: "https://github.com/Stuk/jszip",
		license: "MIT",
	},
	svgo: {
		name: "svgo",
		repoUrl: "https://github.com/svg/svgo",
		license: "MIT",
	},
	cfb: {
		name: "cfb",
		repoUrl: "https://github.com/SheetJS/js-cfb",
		license: "Apache-2.0",
	},
	marked: {
		name: "marked",
		repoUrl: "https://github.com/markedjs/marked",
		license: "MIT",
	},
} as const satisfies Record<string, PackageAttribution>;

export type PackageId = keyof typeof PACKAGES;

export const BROWSER_APIS = {
	canvas: {
		name: "Canvas API",
		mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API",
	},
	fileReader: {
		name: "FileReader API",
		mdnUrl: "https://developer.mozilla.org/en-US/docs/Web/API/FileReader",
	},
} as const satisfies Record<string, BrowserApiAttribution>;

export type BrowserApiId = keyof typeof BROWSER_APIS;
