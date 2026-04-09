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
import type { Route } from "./+types/icns-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert ICNS Online — Free, Instant | NoUploads",
		description:
			"Convert Apple ICNS icon files to JPG, PNG, or WebP in your browser. Extracts the highest-resolution icon from macOS app bundles. No upload, no signup.",
		path: "/image/icns-converter",
		keywords:
			"icns to png, icns converter, apple icon converter, open icns file, mac icon to png",
		jsonLdName: "ICNS Converter",
		faq: [
			{
				question: "What's the story behind Apple's ICNS format?",
				answer:
					"ICNS is Apple's icon format for macOS, in use since Mac OS 8.5 in 1998. Like Windows ICO files, a single ICNS file bundles multiple icon sizes — but ICNS supports much larger resolutions, up to 1024×1024 pixels, to accommodate Apple's Retina displays. Every app icon visible on a Mac is stored as an ICNS file inside the application bundle.",
			},
			{
				question: "How does this tool pick which icon size to extract?",
				answer:
					"The decoder parses every entry in the ICNS container and selects the largest available image. Modern ICNS files (macOS 10.7+) embed full PNG images for the highest resolutions, so you typically get a crisp 512x512 or 1024x1024 icon. Older files use 32-bit ARGB data with PackBits compression, which the decoder also handles.",
			},
			{
				question: "Does it preserve transparency?",
				answer:
					"Yes. macOS icons rely on transparency for their rounded shapes and shadows. The decoder preserves the full alpha channel from both PNG-embedded entries and legacy ARGB+mask entries. Choose PNG or WebP as the output format to keep the transparent areas intact.",
			},
			{
				question: "Where do macOS app icons come from?",
				answer:
					"Every macOS application bundle (.app) contains an ICNS file inside its Contents/Resources folder. You can right-click any app in Finder, choose Show Package Contents, and navigate to find the .icns file. This tool lets you open that file and convert it to a standard image format without installing any software.",
			},
		],
	});
}

const ACCEPT = { "image/x-icns": [".icns"] };

const faqItems = [
	{
		question: "What's the story behind Apple's ICNS format?",
		answer: (
			<>
				ICNS is Apple's icon format for macOS, in use since Mac OS 8.5 in 1998.
				Like Windows ICO files, a single ICNS file bundles multiple icon sizes —
				but ICNS supports much larger resolutions, up to 1024×1024 pixels, to
				accommodate Apple's Retina displays. Every app icon visible on a Mac is
				stored as an ICNS file inside the application bundle. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Apple_Icon_Image_format"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Wikipedia
				</a>
			</>
		),
	},
	{
		question: "How does this tool pick which icon size to extract?",
		answer:
			"The decoder parses every entry in the ICNS container and selects the largest available image. Modern ICNS files (macOS 10.7+) embed full PNG images for the highest resolutions, so you typically get a crisp 512x512 or 1024x1024 icon. Older files use 32-bit ARGB data with PackBits compression, which the decoder also handles.",
	},
	{
		question: "Does it preserve transparency?",
		answer:
			"Yes. macOS icons rely on transparency for their rounded shapes and shadows. The decoder preserves the full alpha channel from both PNG-embedded entries and legacy ARGB+mask entries. Choose PNG or WebP as the output format to keep the transparent areas intact.",
	},
	{
		question: "Where do macOS app icons come from?",
		answer:
			"Every macOS application bundle (.app) contains an ICNS file inside its Contents/Resources folder. You can right-click any app in Finder, choose Show Package Contents, and navigate to find the .icns file. This tool lets you open that file and convert it to a standard image format without installing any software.",
	},
];

export default function IcnsConverterPage() {
	return (
		<ToolPageLayout
			title="Convert ICNS"
			description="Convert Apple ICNS icon files to JPG, PNG, or WebP — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Opens Apple ICNS icon files and converts them to standard image
					formats. The decoder reads the binary container, finds all embedded
					icon variants, and extracts the highest resolution available — up to
					1024x1024 pixels from modern macOS app icons. Supports both
					PNG-embedded entries (macOS 10.7+) and legacy 32-bit ARGB data with
					PackBits decompression and separate alpha masks. Processing runs
					entirely in your browser using a built-in parser.
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

			<LibraryAttribution browserApi="canvas" />
		</ToolPageLayout>
	);
}
