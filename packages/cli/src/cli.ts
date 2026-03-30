/**
 * CLI entry point.
 *
 * Primary syntax:
 *   nouploads <from> <to> <file> [options]
 *   nouploads heic jpg photo.heic --quality 80
 *   nouploads pdf png document.pdf --dpi 300
 *   nouploads heic jpg *.heic --quality 90
 *
 * Interactive mode:
 *   nouploads
 *   nouploads --interactive
 *
 * List available tools:
 *   nouploads --list
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { createSharpBackend } from "@nouploads/backend-sharp";
import { findToolByFormats, getAllTools, getTool } from "@nouploads/core";
import { program } from "commander";

const VERSION = "0.1.0";

program
	.name("nouploads")
	.description("Convert and process files locally — no uploads, no servers.")
	.version(VERSION)
	.option("-i, --interactive", "Launch interactive mode")
	.option("-l, --list", "List all available conversion tools")
	.option("--info <tool>", "Show detailed help for a specific tool")
	.option("-o, --output <path>", "Output file or directory path")
	.option("-q, --quality <number>", "Output quality (1-100)", Number.parseInt)
	.option("--dpi <number>", "DPI for rasterization", Number.parseInt)
	.option("--width <number>", "Output width in pixels", Number.parseInt)
	.option("--height <number>", "Output height in pixels", Number.parseInt)
	.option("--text <string>", "Text input (for QR code generation, etc.)")
	.option("--multipass", "Enable multipass optimization (for SVG optimizer)")
	.option(
		"--colors <number>",
		"Number of colors for PNG quantization (2-256)",
		Number.parseInt,
	)
	.option("--x <number>", "Crop X offset in pixels", Number.parseInt)
	.option("--y <number>", "Crop Y offset in pixels", Number.parseInt)
	.option(
		"--fit <mode>",
		"Resize fit mode (contain, cover, fill, inside, outside)",
	)
	.option("--format <fmt>", "Output format override (jpg, png, webp, avif)")
	.argument("[from]", "Source format or tool ID (e.g., heic, optimize-svg)")
	.argument("[to]", "Target format (e.g., jpg, png, webp)")
	.argument("[files...]", "Input file(s) — supports glob patterns")
	.action(async (from, to, files, opts) => {
		// --list: show all tools
		if (opts.list) {
			listTools();
			return;
		}

		// --info: show detailed help for a tool
		if (opts.info) {
			showToolInfo(opts.info);
			return;
		}

		// --interactive or no args: launch TUI
		if (opts.interactive || (!from && !to)) {
			await interactiveMode();
			return;
		}

		// Validate from/to
		if (!from) {
			console.error("Usage: nouploads <from> <to> <file> [options]");
			console.error("       nouploads <tool-id> <file> [options]");
			console.error("Example: nouploads heic jpg photo.heic --quality 80");
			console.error("         nouploads optimize-svg input.svg");
			process.exit(1);
		}

		// Try looking up by tool ID first (e.g. "optimize-svg", "merge-pdf")
		let tool = getTool(from);
		let inputFiles = files ?? [];

		if (tool) {
			// Tool found by ID — "to" and "files" are all file arguments
			if (to) inputFiles = [to, ...inputFiles];
		} else {
			// Not a tool ID — treat as format pair (from/to)
			if (!to) {
				console.error(
					`Error: Unknown tool "${from}". Run \`nouploads --list\` for available tools.`,
				);
				process.exit(1);
			}
			tool = findToolByFormats(from, to);
			if (!tool) {
				console.error(`Error: No converter found for ${from} → ${to}`);
				console.error("Run `nouploads --list` to see available conversions.");
				process.exit(1);
			}
		}

		if (inputFiles.length === 0) {
			console.error("Error: No input files specified.");
			process.exit(1);
		}

		const backend = createSharpBackend();
		const toolOptions: Record<string, unknown> = {};
		if (opts.quality !== undefined) toolOptions.quality = opts.quality;
		if (opts.dpi !== undefined) toolOptions.dpi = opts.dpi;
		if (opts.width !== undefined) toolOptions.width = opts.width;
		if (opts.height !== undefined) toolOptions.height = opts.height;
		if (opts.text !== undefined) toolOptions.text = opts.text;
		if (opts.multipass !== undefined) toolOptions.multipass = opts.multipass;
		if (opts.colors !== undefined) toolOptions.colors = opts.colors;
		if (opts.x !== undefined) toolOptions.x = opts.x;
		if (opts.y !== undefined) toolOptions.y = opts.y;
		if (opts.fit !== undefined) toolOptions.fit = opts.fit;
		if (opts.format !== undefined) toolOptions.format = opts.format;

		// Multi-input tools (e.g. merge-pdf): read all files, call executeMulti
		if (tool.executeMulti && inputFiles.length > 1) {
			try {
				const inputs: Uint8Array[] = [];
				for (const filePath of inputFiles) {
					inputs.push(new Uint8Array(await readFile(filePath)));
				}
				const result = await tool.executeMulti(inputs, toolOptions, {
					imageBackend: backend,
					onProgress: (pct) => {
						process.stdout.write(`\r  Processing: ${pct}%`);
					},
				});
				const outputPath = opts.output ?? `output${result.extension}`;
				await mkdir(dirname(outputPath), { recursive: true });
				await writeFile(outputPath, result.output);
				console.log(`\r  ${inputFiles.length} files → ${outputPath}`);
			} catch (err) {
				console.error(`\r  Error: ${(err as Error).message}`);
			}
			return;
		}

		// Single-input tools: process each file individually
		for (const filePath of inputFiles) {
			try {
				const input = new Uint8Array(await readFile(filePath));

				const result = await tool.execute(input, toolOptions, {
					imageBackend: backend,
					onProgress: (pct) => {
						process.stdout.write(`\r  ${basename(filePath)}: ${pct}%`);
					},
				});

				// Determine output path
				const inputBase = basename(filePath, extname(filePath));
				const outputName = `${inputBase}${result.extension}`;
				const outputPath = opts.output
					? opts.output.endsWith("/")
						? join(opts.output, outputName)
						: inputFiles.length > 1
							? join(opts.output, outputName)
							: opts.output
					: join(dirname(filePath), outputName);

				await mkdir(dirname(outputPath), { recursive: true });
				await writeFile(outputPath, result.output);
				console.log(`\r  ${basename(filePath)} → ${outputPath}`);
			} catch (err) {
				console.error(
					`\r  Error processing ${filePath}: ${(err as Error).message}`,
				);
			}
		}
	});

function listTools() {
	const tools = getAllTools();
	console.log("\nAvailable conversions:\n");
	const categories = new Map<string, typeof tools>();
	for (const tool of tools) {
		const cat = tool.category;
		const list = categories.get(cat) ?? [];
		list.push(tool);
		categories.set(cat, list);
	}
	for (const [category, catTools] of categories) {
		console.log(`  ${category.toUpperCase()}`);
		for (const tool of catTools) {
			const formats =
				tool.from && tool.to ? `${tool.from} → ${tool.to}` : tool.id;
			const badge = tool.capabilities?.includes("browser")
				? " [browser-only]"
				: "";
			console.log(`    ${formats.padEnd(20)} ${tool.description}${badge}`);
		}
		console.log();
	}
}

function showToolInfo(toolId: string) {
	// Try exact match first, then format-pair match
	let tool = getTool(toolId);
	if (!tool && toolId.includes("-to-")) {
		const [from, to] = toolId.split("-to-");
		tool = findToolByFormats(from, to) ?? undefined;
	}
	if (!tool) {
		console.error(`Unknown tool: ${toolId}`);
		console.error("Run `nouploads --list` to see available tools.");
		process.exit(1);
	}

	console.log(`\n  ${tool.name}`);
	console.log(`  ${tool.description}`);
	console.log();
	console.log(`  ID:         ${tool.id}`);
	console.log(`  Category:   ${tool.category}`);
	if (tool.from) console.log(`  From:       ${tool.from}`);
	if (tool.to) console.log(`  To:         ${tool.to}`);
	console.log(`  Formats:    ${tool.inputExtensions.join(", ") || "(any)"}`);
	if (tool.capabilities?.length) {
		console.log(`  Requires:   ${tool.capabilities.join(", ")}`);
	}
	if (tool.executeMulti) {
		console.log("  Multi-file: yes");
	}

	if (tool.options.length > 0) {
		console.log("\n  Options:");
		for (const opt of tool.options) {
			const def = opt.default !== undefined ? ` (default: ${opt.default})` : "";
			const range =
				opt.min !== undefined && opt.max !== undefined
					? ` [${opt.min}-${opt.max}]`
					: "";
			const choices = opt.choices ? ` (${opt.choices.join("|")})` : "";
			console.log(
				`    --${opt.name.padEnd(16)} ${opt.description}${def}${range}${choices}`,
			);
		}
	}

	if (tool.from && tool.to) {
		console.log(
			`\n  Usage: nouploads ${tool.from} ${tool.to} <file> [options]`,
		);
	} else {
		console.log(`\n  Usage: nouploads ${tool.id} <file> [options]`);
	}
	console.log();
}

async function interactiveMode() {
	const {
		intro,
		outro,
		select,
		text,
		confirm,
		spinner: createSpinner,
		isCancel,
		log,
	} = await import("@clack/prompts");
	const { readFile: readFileAsync, writeFile: writeFileAsync } = await import(
		"node:fs/promises"
	);
	const { resolve } = await import("node:path");

	intro("nouploads — Convert and process files locally");

	const tools = getAllTools().filter(
		(t) => !t.capabilities?.includes("browser"),
	);

	// Step 1: Pick a category
	const categories = [...new Set(tools.map((t) => t.category))];
	const category = await select({
		message: "What would you like to do?",
		options: categories.map((cat) => ({
			value: cat,
			label: cat.charAt(0).toUpperCase() + cat.slice(1),
			hint: `${tools.filter((t) => t.category === cat).length} tools`,
		})),
	});
	if (isCancel(category)) {
		outro("Cancelled.");
		return;
	}

	// Step 2: Pick a tool
	const catTools = tools.filter((t) => t.category === category);
	const toolId = await select({
		message: "Pick a tool:",
		options: catTools.map((t) => ({
			value: t.id,
			label:
				t.from && t.to
					? `${t.from.toUpperCase()} → ${t.to.toUpperCase()}`
					: t.name,
			hint: t.description.slice(0, 60),
		})),
	});
	if (isCancel(toolId)) {
		outro("Cancelled.");
		return;
	}

	const tool = getTool(toolId as string);
	if (!tool) {
		log.error("Tool not found.");
		return;
	}

	log.info(`Selected: ${tool.name}`);

	// Step 3: Get input file(s)
	const isMulti = !!tool.executeMulti;
	const filePaths: string[] = [];

	const firstFile = await text({
		message: isMulti ? "Enter first file path:" : "Enter file path:",
		placeholder: "./photo.jpg",
	});
	if (isCancel(firstFile)) {
		outro("Cancelled.");
		return;
	}
	filePaths.push(resolve(firstFile as string));

	if (isMulti) {
		let addMore = true;
		while (addMore) {
			const more = await confirm({
				message: "Add another file?",
			});
			if (isCancel(more) || !more) {
				addMore = false;
				break;
			}
			const nextFile = await text({
				message: "Enter file path:",
				placeholder: "./another-file.pdf",
			});
			if (isCancel(nextFile)) break;
			filePaths.push(resolve(nextFile as string));
		}
	}

	// Step 4: Collect tool options
	const toolOptions: Record<string, unknown> = {};
	for (const opt of tool.options) {
		if (opt.choices) {
			const val = await select({
				message: `${opt.description}:`,
				options: opt.choices.map((c) => ({ value: c, label: c })),
			});
			if (isCancel(val)) {
				outro("Cancelled.");
				return;
			}
			toolOptions[opt.name] = val;
		} else if (opt.type === "boolean") {
			const val = await confirm({
				message: `${opt.description}?`,
			});
			if (isCancel(val)) {
				outro("Cancelled.");
				return;
			}
			toolOptions[opt.name] = val;
		} else if (opt.type === "number") {
			const val = await text({
				message: `${opt.description}:`,
				placeholder: String(opt.default ?? ""),
			});
			if (isCancel(val)) {
				outro("Cancelled.");
				return;
			}
			toolOptions[opt.name] = val
				? Number.parseInt(val as string, 10)
				: opt.default;
		} else {
			const val = await text({
				message: `${opt.description}:`,
				placeholder: String(opt.default ?? ""),
			});
			if (isCancel(val)) {
				outro("Cancelled.");
				return;
			}
			toolOptions[opt.name] = val || opt.default;
		}
	}

	// Step 5: Ask for output path
	const outputPath = await text({
		message: "Output path (leave empty for default):",
		placeholder: isMulti ? "./output.pdf" : "",
	});
	if (isCancel(outputPath)) {
		outro("Cancelled.");
		return;
	}

	// Step 6: Run the tool
	const s = createSpinner();
	const backend = createSharpBackend();

	try {
		if (isMulti && tool.executeMulti) {
			s.start(`Processing ${filePaths.length} files...`);
			const inputs: Uint8Array[] = [];
			for (const fp of filePaths) {
				inputs.push(new Uint8Array(await readFileAsync(fp)));
			}
			const result = await tool.executeMulti(inputs, toolOptions, {
				imageBackend: backend,
			});
			const out = (outputPath as string) || `output${result.extension}`;
			await writeFileAsync(out, result.output);
			s.stop(`Done! ${filePaths.length} files → ${out}`);
		} else {
			const fp = filePaths[0];
			s.start(`Processing ${basename(fp)}...`);
			const input = new Uint8Array(await readFileAsync(fp));
			const result = await tool.execute(input, toolOptions, {
				imageBackend: backend,
			});
			const inputBase = basename(fp, extname(fp));
			const out =
				(outputPath as string) ||
				join(dirname(fp), `${inputBase}${result.extension}`);
			await writeFileAsync(out, result.output);
			s.stop(`Done! ${basename(fp)} → ${out}`);
		}
	} catch (err) {
		s.stop(`Error: ${(err as Error).message}`);
	}

	outro("No files were uploaded. Everything ran locally.");
}

program.parse();
