import { lazy, Suspense } from "react";
import { LibraryAttribution } from "~/components/tool/library-attribution";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/ico-to-png";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert ICO to PNG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert ICO favicon files to PNG images in your browser. Extracts the highest resolution frame.",
		path: "/image/ico-to-png",
		keywords:
			"ico to png, convert ico to png, favicon to png, ico converter online, extract favicon image, ico to png free",
		jsonLdName: "ICO to PNG Converter",
	});
}

const ACCEPT = { "image/x-icon": [".ico", ".cur"] };

const faqItems = [
	{
		question: "What is an ICO file?",
		answer:
			"ICO is the icon format used by Windows and web browsers for favicons. A single ICO file can contain multiple images at different sizes (16x16, 32x32, 48x48, 256x256) so the system can pick the right one for each context. This tool extracts the largest, highest-quality version.",
	},
	{
		question: "Why convert ICO to PNG?",
		answer:
			"Developers and designers often need a favicon as a standard image — for documentation, brand guides, or social media. PNG gives you a clean, transparent image from the ICO that any image editor or platform can open.",
	},
	{
		question: "Does it keep the transparent background?",
		answer:
			"Yes. Most favicons have transparent backgrounds, and PNG fully supports per-pixel transparency. The extracted image preserves the original alpha channel without flattening it to white.",
	},
	{
		question: "Can I convert CUR (cursor) files too?",
		answer:
			"Yes. CUR files use the same container format as ICO but include cursor hotspot metadata. The tool extracts the image data the same way — the hotspot information is simply ignored since it only applies to mouse cursors.",
	},
	{
		question: "Why use NoUploads instead of other ICO converters?",
		answer:
			"Developers typically need this when auditing a site's favicon or rebuilding a brand kit — quick, low-friction tasks that do not warrant creating an account on a converter service. NoUploads parses the ICO binary with the decode-ico library right in your browser, inspects every embedded frame, and automatically selects the highest resolution available. It handles both legacy BMP-encoded frames and modern PNG-compressed frames inside the same ICO container, which many online tools get wrong. Once the page is cached you can keep extracting favicons on a plane.",
	},
];

export default function IcoToPngPage() {
	return (
		<ToolPageLayout
			title="Convert ICO to PNG"
			description="Extract the highest-resolution image from ICO favicon files as PNG — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/png" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					ICO files are multi-frame containers: a single .ico can bundle 16x16,
					32x32, 48x48, and 256x256 versions of the same icon, each stored as
					either a BMP bitmap or an embedded PNG. The decode-ico library reads
					the binary header, walks every directory entry, and this tool
					automatically picks the largest frame for export. CUR cursor files use
					the same container layout and are handled identically. The extracted
					PNG preserves the full alpha channel, so transparent favicon
					backgrounds stay transparent in whatever editor you open next.
				</p>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<Accordion type="multiple">
					{faqItems.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list never changes
						<AccordionItem key={i} value={`faq-${i}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground">{item.answer}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<LibraryAttribution packages={["decode-ico"]} />
		</ToolPageLayout>
	);
}
