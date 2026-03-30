import type { DecodedImage } from "./types";

/* ------------------------------------------------------------------ */
/*  EMF record type constants (MS-EMF specification)                  */
/* ------------------------------------------------------------------ */

const EMR_HEADER = 0x0001;
const EMR_POLYGON = 0x0003;
const EMR_POLYLINE = 0x0004;
const EMR_SETWINDOWEXTEX = 0x0009;
const EMR_SETWINDOWORGEX = 0x000a;
const EMR_SETVIEWPORTEXTEX = 0x000c;
const EMR_SETVIEWPORTORGEX = 0x000d;
const EMR_EOF = 0x000e;
const EMR_SETBKMODE = 0x0012;
const EMR_SETTEXTCOLOR = 0x0018;
const EMR_MOVETOEX = 0x001b;
const EMR_SELECTOBJECT = 0x0025;
const EMR_CREATEPEN = 0x0026;
const EMR_CREATEBRUSHINDIRECT = 0x0027;
const EMR_DELETEOBJECT = 0x0028;
const EMR_ELLIPSE = 0x002a;
const EMR_RECTANGLE = 0x002b;
const EMR_LINETO = 0x0036;
const EMR_BEGINPATH = 0x003b;
const EMR_ENDPATH = 0x003c;
const EMR_CLOSEFIGURE = 0x003d;
const EMR_FILLPATH = 0x003e;
const EMR_STROKEANDFILLPATH = 0x003f;
const EMR_STROKEPATH = 0x0040;
const EMR_SELECTCLIPPATH = 0x0043;
const EMR_EXTCREATEPEN = 0x005f;
const EMR_STRETCHDIBITS = 0x0051;
const EMR_SAVEDC = 0x0021;
const EMR_RESTOREDC = 0x0022;
const EMR_SETMAPMODE = 0x0011;

/* Stock GDI objects: high-bit set + index */
const STOCK_OBJECT_FLAG = 0x80000000;

/* ------------------------------------------------------------------ */
/*  GDI state                                                         */
/* ------------------------------------------------------------------ */

interface Pen {
	kind: "pen";
	color: string;
	width: number;
}

interface Brush {
	kind: "brush";
	color: string;
	/** 0=BS_SOLID, 1=BS_NULL/BS_HOLLOW */
	style: number;
}

type GdiObject = Pen | Brush;

interface GdiState {
	pen: Pen;
	brush: Brush;
	textColor: string;
	bkMode: number; // 1=TRANSPARENT, 2=OPAQUE
	curX: number;
	curY: number;
	windowOrg: { x: number; y: number };
	windowExt: { x: number; y: number };
	viewportOrg: { x: number; y: number };
	viewportExt: { x: number; y: number };
	inPath: boolean;
	path: Path2D | null;
}

const DEFAULT_PEN: Pen = { kind: "pen", color: "#000000", width: 1 };
const DEFAULT_BRUSH: Brush = { kind: "brush", color: "#ffffff", style: 0 };

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Read a COLORREF (4 bytes, 0xBBGGRR00 stored as RGBX little-endian) */
function colorRef(view: DataView, offset: number): string {
	const r = view.getUint8(offset);
	const g = view.getUint8(offset + 1);
	const b = view.getUint8(offset + 2);
	return `rgb(${r},${g},${b})`;
}

function stockPen(index: number): Pen {
	// Stock pen indices: 0=WHITE, 1=BLACK, 2=NULL
	switch (index) {
		case 0:
			return { kind: "pen", color: "#ffffff", width: 1 };
		case 1:
			return { kind: "pen", color: "#000000", width: 1 };
		case 2:
			return { kind: "pen", color: "transparent", width: 0 };
		default:
			return DEFAULT_PEN;
	}
}

function stockBrush(index: number): Brush {
	// Stock brush indices: 0=WHITE, 1=LTGRAY, 2=GRAY, 3=DKGRAY, 4=BLACK, 5=NULL
	switch (index) {
		case 0:
			return { kind: "brush", color: "#ffffff", style: 0 };
		case 1:
			return { kind: "brush", color: "#c0c0c0", style: 0 };
		case 2:
			return { kind: "brush", color: "#808080", style: 0 };
		case 3:
			return { kind: "brush", color: "#404040", style: 0 };
		case 4:
			return { kind: "brush", color: "#000000", style: 0 };
		case 5:
			return { kind: "brush", color: "transparent", style: 1 };
		default:
			return DEFAULT_BRUSH;
	}
}

/**
 * Apply the current GDI pen style to the canvas context.
 */
function applyPen(ctx: CanvasRenderingContext2D, pen: Pen): void {
	ctx.strokeStyle = pen.color;
	ctx.lineWidth = Math.max(pen.width, 1);
}

/**
 * Apply the current GDI brush style to the canvas context.
 */
function applyBrush(ctx: CanvasRenderingContext2D, brush: Brush): void {
	if (brush.style === 1) {
		// BS_NULL — no fill
		ctx.fillStyle = "transparent";
	} else {
		ctx.fillStyle = brush.color;
	}
}

/* ------------------------------------------------------------------ */
/*  Embedded DIB (BMP) parser for EMR_STRETCHDIBITS                   */
/* ------------------------------------------------------------------ */

function parseDib(
	view: DataView,
	bmpOffset: number,
	bmpSize: number,
): ImageData | null {
	if (bmpSize < 40) return null;

	const headerSize = view.getInt32(bmpOffset, true);
	if (headerSize < 40) return null;

	const dibW = view.getInt32(bmpOffset + 4, true);
	const dibHRaw = view.getInt32(bmpOffset + 8, true);
	const topDown = dibHRaw < 0;
	const dibH = Math.abs(dibHRaw);

	if (dibW <= 0 || dibH <= 0 || dibW > 16384 || dibH > 16384) return null;

	const bpp = view.getUint16(bmpOffset + 14, true);
	const compression = view.getInt32(bmpOffset + 16, true);

	// Only handle uncompressed (BI_RGB=0) and BI_BITFIELDS=3
	if (compression !== 0 && compression !== 3) return null;

	let pixelDataOffset = bmpOffset + headerSize;

	// BI_BITFIELDS: 3 DWORD masks follow the header for 16/32 bpp
	if (compression === 3 && (bpp === 16 || bpp === 32)) {
		pixelDataOffset = bmpOffset + headerSize + 12;
	}

	// Color table for <= 8 bpp
	let colorTable: Uint8Array[] | null = null;
	if (bpp <= 8) {
		const numColors = 1 << bpp;
		colorTable = [];
		let ctOff = bmpOffset + headerSize;
		for (let i = 0; i < numColors; i++) {
			if (ctOff + 4 > view.byteLength) break;
			const b = view.getUint8(ctOff);
			const g = view.getUint8(ctOff + 1);
			const r = view.getUint8(ctOff + 2);
			colorTable.push(new Uint8Array([r, g, b, 255]));
			ctOff += 4;
		}
		pixelDataOffset = ctOff;
	}

	const rowBytes = Math.ceil((dibW * bpp) / 8);
	const stride = (rowBytes + 3) & ~3; // rows padded to 4-byte boundary

	const imageData = new ImageData(dibW, dibH);
	const out = imageData.data;

	for (let y = 0; y < dibH; y++) {
		const srcRow = topDown ? y : dibH - 1 - y;
		const rowStart = pixelDataOffset + srcRow * stride;
		for (let x = 0; x < dibW; x++) {
			const dstIdx = (y * dibW + x) * 4;

			if (bpp === 32) {
				const off = rowStart + x * 4;
				if (off + 4 > view.byteLength) continue;
				out[dstIdx] = view.getUint8(off + 2); // R
				out[dstIdx + 1] = view.getUint8(off + 1); // G
				out[dstIdx + 2] = view.getUint8(off); // B
				out[dstIdx + 3] = view.getUint8(off + 3) || 255; // A
			} else if (bpp === 24) {
				const off = rowStart + x * 3;
				if (off + 3 > view.byteLength) continue;
				out[dstIdx] = view.getUint8(off + 2);
				out[dstIdx + 1] = view.getUint8(off + 1);
				out[dstIdx + 2] = view.getUint8(off);
				out[dstIdx + 3] = 255;
			} else if (bpp === 16) {
				const off = rowStart + x * 2;
				if (off + 2 > view.byteLength) continue;
				const val = view.getUint16(off, true);
				out[dstIdx] = ((val >> 10) & 0x1f) * 8;
				out[dstIdx + 1] = ((val >> 5) & 0x1f) * 8;
				out[dstIdx + 2] = (val & 0x1f) * 8;
				out[dstIdx + 3] = 255;
			} else if (bpp === 8 && colorTable) {
				const off = rowStart + x;
				if (off >= view.byteLength) continue;
				const idx = view.getUint8(off);
				if (idx < colorTable.length) {
					out[dstIdx] = colorTable[idx][0];
					out[dstIdx + 1] = colorTable[idx][1];
					out[dstIdx + 2] = colorTable[idx][2];
					out[dstIdx + 3] = 255;
				}
			} else if (bpp === 4 && colorTable) {
				const off = rowStart + (x >> 1);
				if (off >= view.byteLength) continue;
				const b = view.getUint8(off);
				const idx = x % 2 === 0 ? (b >> 4) & 0x0f : b & 0x0f;
				if (idx < colorTable.length) {
					out[dstIdx] = colorTable[idx][0];
					out[dstIdx + 1] = colorTable[idx][1];
					out[dstIdx + 2] = colorTable[idx][2];
					out[dstIdx + 3] = 255;
				}
			} else if (bpp === 1 && colorTable) {
				const off = rowStart + (x >> 3);
				if (off >= view.byteLength) continue;
				const b = view.getUint8(off);
				const idx = (b >> (7 - (x & 7))) & 1;
				if (idx < colorTable.length) {
					out[dstIdx] = colorTable[idx][0];
					out[dstIdx + 1] = colorTable[idx][1];
					out[dstIdx + 2] = colorTable[idx][2];
					out[dstIdx + 3] = 255;
				}
			}
		}
	}

	return imageData;
}

/* ------------------------------------------------------------------ */
/*  Main decoder                                                      */
/* ------------------------------------------------------------------ */

const MAX_DIMENSION = 16384;
const MIN_DIMENSION = 1;

/**
 * Decode an EMF (Enhanced Metafile) file to raw RGBA pixels.
 *
 * NARROW implementation — supports the most common EMF records:
 * shapes (rectangle, ellipse, polygon, polyline), lines, paths,
 * pen/brush/object management, embedded bitmaps (STRETCHDIBITS),
 * and basic coordinate transforms.
 *
 * Complex features like text layout, clipping regions, world transforms,
 * gradients, and advanced raster operations are not implemented.
 * Unrecognized records are silently skipped.
 */
export async function decodeEmf(
	input: Blob,
	signal?: AbortSignal,
): Promise<DecodedImage> {
	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const buffer = await input.arrayBuffer();

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	const view = new DataView(buffer);

	if (buffer.byteLength < 88) {
		throw new Error(
			"This EMF file could not be decoded. The header is too short.",
		);
	}

	/* ---- Parse EMR_HEADER (record type 1) ---- */
	const headerType = view.getUint32(0, true);
	if (headerType !== EMR_HEADER) {
		throw new Error(
			"This EMF file could not be decoded. Missing EMR_HEADER record.",
		);
	}

	// Bounds RECTL: 4 x int32 at offset 8
	const boundsLeft = view.getInt32(8, true);
	const boundsTop = view.getInt32(12, true);
	const boundsRight = view.getInt32(16, true);
	const boundsBottom = view.getInt32(20, true);

	// Validate the EMF signature (should be " EMF" = 0x20454D46 at offset 40)
	const signature = view.getUint32(40, true);
	if (signature !== 0x464d4520) {
		throw new Error(
			"This EMF file could not be decoded. Invalid EMF signature.",
		);
	}

	let canvasWidth = boundsRight - boundsLeft;
	let canvasHeight = boundsBottom - boundsTop;

	// Fallback: if bounds are degenerate, try the frame RECTL (0.01mm units at offset 24)
	if (canvasWidth <= 0 || canvasHeight <= 0) {
		const frameLeft = view.getInt32(24, true);
		const frameTop = view.getInt32(28, true);
		const frameRight = view.getInt32(32, true);
		const frameBottom = view.getInt32(36, true);

		// Device resolution at offset 72,76 (pixels) and millimeters at offset 80,84
		const deviceWidth = view.getInt32(72, true) || 1;
		const deviceHeight = view.getInt32(76, true) || 1;
		const mmWidth = view.getInt32(80, true) || 1;
		const mmHeight = view.getInt32(84, true) || 1;

		canvasWidth = Math.round(
			((frameRight - frameLeft) * deviceWidth) / (mmWidth * 100),
		);
		canvasHeight = Math.round(
			((frameBottom - frameTop) * deviceHeight) / (mmHeight * 100),
		);
	}

	if (
		canvasWidth < MIN_DIMENSION ||
		canvasHeight < MIN_DIMENSION ||
		canvasWidth > MAX_DIMENSION ||
		canvasHeight > MAX_DIMENSION
	) {
		throw new Error(
			`EMF canvas dimensions ${canvasWidth}x${canvasHeight} are outside supported range (${MIN_DIMENSION}–${MAX_DIMENSION}px).`,
		);
	}

	/* ---- Set up Canvas + GDI state ---- */
	const canvas = document.createElement("canvas");
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not get canvas 2D context");

	// White background (matches Windows GDI default)
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	// Translate so bounds origin maps to (0,0)
	ctx.translate(-boundsLeft, -boundsTop);

	const objectTable: Map<number, GdiObject> = new Map();

	const state: GdiState = {
		pen: { ...DEFAULT_PEN },
		brush: { ...DEFAULT_BRUSH },
		textColor: "#000000",
		bkMode: 1,
		curX: 0,
		curY: 0,
		windowOrg: { x: 0, y: 0 },
		windowExt: { x: canvasWidth, y: canvasHeight },
		viewportOrg: { x: 0, y: 0 },
		viewportExt: { x: canvasWidth, y: canvasHeight },
		inPath: false,
		path: null,
	};

	/* ---- Walk records ---- */
	let offset = 0;
	const maxRecords = 100_000; // safety limit
	let recordCount = 0;

	while (offset + 8 <= buffer.byteLength && recordCount < maxRecords) {
		if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

		const recType = view.getUint32(offset, true);
		const recSize = view.getUint32(offset + 4, true);

		// Sanity: record size must be at least 8 and not exceed remaining bytes
		if (recSize < 8 || offset + recSize > buffer.byteLength) break;

		switch (recType) {
			case EMR_EOF:
				// End of metafile
				offset = buffer.byteLength; // force loop exit
				break;

			case EMR_HEADER:
				// Already parsed above; skip
				break;

			case EMR_SETWINDOWORGEX:
				if (recSize >= 16) {
					state.windowOrg.x = view.getInt32(offset + 8, true);
					state.windowOrg.y = view.getInt32(offset + 12, true);
				}
				break;

			case EMR_SETWINDOWEXTEX:
				if (recSize >= 16) {
					state.windowExt.x = view.getInt32(offset + 8, true);
					state.windowExt.y = view.getInt32(offset + 12, true);
				}
				break;

			case EMR_SETVIEWPORTORGEX:
				if (recSize >= 16) {
					state.viewportOrg.x = view.getInt32(offset + 8, true);
					state.viewportOrg.y = view.getInt32(offset + 12, true);
				}
				break;

			case EMR_SETVIEWPORTEXTEX:
				if (recSize >= 16) {
					state.viewportExt.x = view.getInt32(offset + 8, true);
					state.viewportExt.y = view.getInt32(offset + 12, true);
				}
				break;

			case EMR_SETBKMODE:
				if (recSize >= 12) {
					state.bkMode = view.getUint32(offset + 8, true);
				}
				break;

			case EMR_SETTEXTCOLOR:
				if (recSize >= 12) {
					state.textColor = colorRef(view, offset + 8);
				}
				break;

			case EMR_MOVETOEX:
				if (recSize >= 16) {
					state.curX = view.getInt32(offset + 8, true);
					state.curY = view.getInt32(offset + 12, true);
					if (state.inPath && state.path) {
						state.path.moveTo(state.curX, state.curY);
					}
				}
				break;

			case EMR_LINETO:
				if (recSize >= 16) {
					const lx = view.getInt32(offset + 8, true);
					const ly = view.getInt32(offset + 12, true);
					if (state.inPath && state.path) {
						state.path.lineTo(lx, ly);
					} else {
						applyPen(ctx, state.pen);
						ctx.beginPath();
						ctx.moveTo(state.curX, state.curY);
						ctx.lineTo(lx, ly);
						ctx.stroke();
					}
					state.curX = lx;
					state.curY = ly;
				}
				break;

			case EMR_RECTANGLE:
				if (recSize >= 24) {
					const rl = view.getInt32(offset + 8, true);
					const rt = view.getInt32(offset + 12, true);
					const rr = view.getInt32(offset + 16, true);
					const rb = view.getInt32(offset + 20, true);
					if (state.inPath && state.path) {
						state.path.rect(rl, rt, rr - rl, rb - rt);
					} else {
						applyBrush(ctx, state.brush);
						if (state.brush.style !== 1) {
							ctx.fillRect(rl, rt, rr - rl, rb - rt);
						}
						applyPen(ctx, state.pen);
						ctx.strokeRect(rl, rt, rr - rl, rb - rt);
					}
				}
				break;

			case EMR_ELLIPSE:
				if (recSize >= 24) {
					const el = view.getInt32(offset + 8, true);
					const et = view.getInt32(offset + 12, true);
					const er = view.getInt32(offset + 16, true);
					const eb = view.getInt32(offset + 20, true);
					const cx = (el + er) / 2;
					const cy = (et + eb) / 2;
					const rx = (er - el) / 2;
					const ry = (eb - et) / 2;
					if (state.inPath && state.path) {
						state.path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
					} else {
						ctx.beginPath();
						ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
						applyBrush(ctx, state.brush);
						if (state.brush.style !== 1) ctx.fill();
						applyPen(ctx, state.pen);
						ctx.stroke();
					}
				}
				break;

			case EMR_POLYGON:
				if (recSize >= 28) {
					// offset+8: bounds RECTL (16 bytes), offset+24: count, offset+28: points
					const polyCount = view.getUint32(offset + 24, true);
					if (polyCount >= 2 && recSize >= 28 + polyCount * 8) {
						if (state.inPath && state.path) {
							for (let i = 0; i < polyCount; i++) {
								const px = view.getInt32(offset + 28 + i * 8, true);
								const py = view.getInt32(offset + 28 + i * 8 + 4, true);
								if (i === 0) state.path.moveTo(px, py);
								else state.path.lineTo(px, py);
							}
							state.path.closePath();
						} else {
							ctx.beginPath();
							for (let i = 0; i < polyCount; i++) {
								const px = view.getInt32(offset + 28 + i * 8, true);
								const py = view.getInt32(offset + 28 + i * 8 + 4, true);
								if (i === 0) ctx.moveTo(px, py);
								else ctx.lineTo(px, py);
							}
							ctx.closePath();
							applyBrush(ctx, state.brush);
							if (state.brush.style !== 1) ctx.fill();
							applyPen(ctx, state.pen);
							ctx.stroke();
						}
					}
				}
				break;

			case EMR_POLYLINE:
				if (recSize >= 28) {
					const plCount = view.getUint32(offset + 24, true);
					if (plCount >= 2 && recSize >= 28 + plCount * 8) {
						if (state.inPath && state.path) {
							for (let i = 0; i < plCount; i++) {
								const px = view.getInt32(offset + 28 + i * 8, true);
								const py = view.getInt32(offset + 28 + i * 8 + 4, true);
								if (i === 0) state.path.moveTo(px, py);
								else state.path.lineTo(px, py);
							}
						} else {
							applyPen(ctx, state.pen);
							ctx.beginPath();
							for (let i = 0; i < plCount; i++) {
								const px = view.getInt32(offset + 28 + i * 8, true);
								const py = view.getInt32(offset + 28 + i * 8 + 4, true);
								if (i === 0) ctx.moveTo(px, py);
								else ctx.lineTo(px, py);
							}
							ctx.stroke();
						}
					}
				}
				break;

			case EMR_CREATEPEN: {
				// offset+8: ihPen (uint32), offset+12: style (uint32),
				// offset+16: width.x (int32), offset+20: width.y (int32),
				// offset+24: COLORREF (4 bytes)
				if (recSize >= 28) {
					const ihPen = view.getUint32(offset + 8, true);
					const penWidth = Math.max(view.getInt32(offset + 16, true), 1);
					const penColor = colorRef(view, offset + 24);
					objectTable.set(ihPen, {
						kind: "pen",
						color: penColor,
						width: penWidth,
					});
				}
				break;
			}

			case EMR_EXTCREATEPEN: {
				// More complex pen: offset+8: ihPen,
				// offset+12: offBmi, offset+16: cbBmi, offset+20: offBits, offset+24: cbBits
				// offset+28: EXTLOGPEN starts: style(u32), width(u32), brushStyle(u32),
				// COLORREF(4), ...
				if (recSize >= 52) {
					const ihPen = view.getUint32(offset + 8, true);
					const penWidth = Math.max(view.getUint32(offset + 32, true), 1);
					const penColor = colorRef(view, offset + 40);
					objectTable.set(ihPen, {
						kind: "pen",
						color: penColor,
						width: penWidth,
					});
				}
				break;
			}

			case EMR_CREATEBRUSHINDIRECT: {
				// offset+8: ihBrush, offset+12: style (uint32), offset+16: COLORREF, offset+20: hatch
				if (recSize >= 24) {
					const ihBrush = view.getUint32(offset + 8, true);
					const brushStyle = view.getUint32(offset + 12, true);
					const brushColor = colorRef(view, offset + 16);
					objectTable.set(ihBrush, {
						kind: "brush",
						color: brushColor,
						style: brushStyle,
					});
				}
				break;
			}

			case EMR_SELECTOBJECT: {
				if (recSize >= 12) {
					const ihObject = view.getUint32(offset + 8, true);
					if (ihObject & STOCK_OBJECT_FLAG) {
						const stockIdx = ihObject & 0x7fffffff;
						// Stock objects: 0-4 are brushes, 5-? are not brushes
						// WHITE_BRUSH=0, LTGRAY_BRUSH=1, GRAY_BRUSH=2, DKGRAY_BRUSH=3, BLACK_BRUSH=4, NULL_BRUSH=5
						// WHITE_PEN=6, BLACK_PEN=7, NULL_PEN=8
						if (stockIdx <= 5) {
							state.brush = stockBrush(stockIdx);
						} else if (stockIdx >= 6 && stockIdx <= 8) {
							state.pen = stockPen(stockIdx - 6);
						}
					} else {
						const obj = objectTable.get(ihObject);
						if (obj) {
							if (obj.kind === "pen") state.pen = obj;
							else if (obj.kind === "brush") state.brush = obj;
						}
					}
				}
				break;
			}

			case EMR_DELETEOBJECT: {
				if (recSize >= 12) {
					const ihDelete = view.getUint32(offset + 8, true);
					objectTable.delete(ihDelete);
				}
				break;
			}

			case EMR_BEGINPATH:
				state.inPath = true;
				state.path = new Path2D();
				break;

			case EMR_ENDPATH:
				state.inPath = false;
				break;

			case EMR_CLOSEFIGURE:
				if (state.path) {
					state.path.closePath();
				}
				break;

			case EMR_FILLPATH:
				if (state.path) {
					applyBrush(ctx, state.brush);
					if (state.brush.style !== 1) ctx.fill(state.path);
					state.path = null;
				}
				break;

			case EMR_STROKEPATH:
				if (state.path) {
					applyPen(ctx, state.pen);
					ctx.stroke(state.path);
					state.path = null;
				}
				break;

			case EMR_STROKEANDFILLPATH:
				if (state.path) {
					applyBrush(ctx, state.brush);
					if (state.brush.style !== 1) ctx.fill(state.path);
					applyPen(ctx, state.pen);
					ctx.stroke(state.path);
					state.path = null;
				}
				break;

			case EMR_STRETCHDIBITS: {
				// EMR_STRETCHDIBITS record layout:
				// +8: bounds RECTL (16 bytes)
				// +24: xDest (int32), +28: yDest (int32)
				// +32: xSrc (int32), +36: ySrc (int32)
				// +40: cxSrc (int32), +44: cySrc (int32)
				// +48: offBmiSrc (uint32), +52: cbBmiSrc (uint32)
				// +56: offBitsSrc (uint32), +60: cbBitsSrc (uint32)
				// +64: iUsageSrc (uint32)
				// +68: dwRop (uint32)
				// +72: cxDest (int32), +76: cyDest (int32)
				if (recSize >= 80) {
					const xDest = view.getInt32(offset + 24, true);
					const yDest = view.getInt32(offset + 28, true);
					const offBmiSrc = view.getUint32(offset + 48, true);
					const cxDest = view.getInt32(offset + 72, true);
					const cyDest = view.getInt32(offset + 76, true);

					if (offBmiSrc > 0 && offset + offBmiSrc < buffer.byteLength) {
						const bmpDataStart = offset + offBmiSrc;
						const bmpDataLen = buffer.byteLength - bmpDataStart;
						const imageData = parseDib(view, bmpDataStart, bmpDataLen);
						if (imageData) {
							ctx.putImageData(imageData, 0, 0);
							// If dest size differs from image size, use drawImage for scaling
							if (cxDest !== imageData.width || cyDest !== imageData.height) {
								// Create a temp canvas for the DIB and draw scaled
								const tmpCanvas = document.createElement("canvas");
								tmpCanvas.width = imageData.width;
								tmpCanvas.height = imageData.height;
								const tmpCtx = tmpCanvas.getContext("2d");
								if (tmpCtx) {
									tmpCtx.putImageData(imageData, 0, 0);
									ctx.drawImage(tmpCanvas, xDest, yDest, cxDest, cyDest);
								}
							} else {
								ctx.putImageData(imageData, xDest, yDest);
							}
						}
					}
				}
				break;
			}

			// Records we recognize but intentionally skip (no-ops for rendering)
			case EMR_SAVEDC:
			case EMR_RESTOREDC:
			case EMR_SETMAPMODE:
			case EMR_SELECTCLIPPATH:
				break;

			default:
				// Unrecognized record — skip
				break;
		}

		offset += recSize;
		recordCount++;
	}

	if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

	/* ---- Extract pixels ---- */
	const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

	return {
		data: new Uint8Array(
			imageData.data.buffer,
			imageData.data.byteOffset,
			imageData.data.byteLength,
		),
		width: canvasWidth,
		height: canvasHeight,
	};
}
