import type { LoaderFunctionArgs } from "react-router";
import { allTools } from "~/lib/tools";

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const toolPath = url.searchParams.get("path") || "/";

	const tool = allTools.find((t) => t.href === toolPath);

	const title = tool?.title || "NoUploads";
	const description =
		tool?.description || "Privacy-first file tools that run in your browser";

	const svg = generateOgSvg(title, description);

	return new Response(svg, {
		headers: {
			"Content-Type": "image/svg+xml",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Wrap text to fit within a given width (approximate character-based wrapping).
 * Returns an array of lines.
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
	const words = text.split(" ");
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		if (current.length + word.length + 1 > maxCharsPerLine) {
			if (current) lines.push(current);
			current = word;
		} else {
			current = current ? `${current} ${word}` : word;
		}
	}
	if (current) lines.push(current);
	return lines.slice(0, 3);
}

function generateOgSvg(title: string, description: string): string {
	const t = escapeXml(title);
	const descLines = wrapText(description, 55);

	const descTspans = descLines
		.map(
			(line, i) =>
				`<tspan x="110" dy="${i === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`,
		)
		.join("\n    ");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="80" y="200" width="6" height="100" rx="3" fill="url(#accent)"/>
  <text x="110" y="255" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="56" font-weight="700" fill="#fafafa">${t}</text>
  <text x="110" y="320" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" fill="#a1a1aa">
    ${descTspans}
  </text>
  <text x="80" y="550" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="28" fill="#6366f1" font-weight="600">nouploads.com</text>
  <text x="1120" y="550" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="20" fill="#52525b" text-anchor="end">Free &amp; Private &amp; No Upload</text>
</svg>`;
}
