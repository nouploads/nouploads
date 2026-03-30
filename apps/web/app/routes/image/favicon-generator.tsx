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
import type { Route } from "./+types/favicon-generator";

const FaviconGeneratorTool = lazy(
	() => import("~/features/image-tools/components/favicon-generator-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Favicon Generator Online — Free, Private, No Upload | NoUploads",
		description:
			"Generate multi-size ICO favicons from any image for free. Pack 16x16, 32x32, and 48x48 icons into one .ico file. Files never leave your device.",
		path: "/image/favicon-generator",
		keywords:
			"favicon generator, ico generator, favicon maker, create favicon, image to ico, favicon online free, private favicon tool",
		jsonLdName: "Favicon Generator",
	});
}

const faqItems = [
	{
		question: "What sizes are included in the generated favicon?",
		answer:
			"The tool generates three sizes: 16x16 pixels (used in browser tabs), 32x32 pixels (used in bookmark menus and taskbar shortcuts), and 48x48 pixels (used by Windows for desktop shortcuts). All three are packed into a single .ico file that works across browsers and operating systems.",
	},
	{
		question: "What image formats can I use as input?",
		answer:
			"You can use any common image format as your source: PNG, JPG, WebP, SVG, GIF, BMP, AVIF, or TIFF. Square images produce the best results since favicons are square. Non-square images will be scaled to fit, which may crop edges.",
	},
	{
		question: "How do I add the favicon to my website?",
		answer:
			'Place the .ico file in your website\'s root directory and add this line inside the <head> tag of your HTML: <link rel="icon" href="/favicon.ico" type="image/x-icon">. Most browsers also check for favicon.ico at the root automatically, even without the link tag.',
	},
	{
		question: "Can I download individual PNG sizes separately?",
		answer:
			"Yes. After generating the favicon, each size (16x16, 32x32, 48x48) is shown as a preview with its own download button. You can grab individual PNGs for use as Apple touch icons, Android icons, or anywhere else that needs a specific size.",
	},
	{
		question: "Why use NoUploads instead of other favicon generators?",
		answer:
			"Most favicon generators upload your image to a server for processing — your logo or brand asset passes through third-party infrastructure. NoUploads generates the favicon entirely in your browser using the Canvas API and manual ICO binary packing. Your images never leave your device, there are no daily limits, no watermarks, and no signup required. It works offline once loaded, and the source code is open for anyone to verify.",
	},
];

export default function FaviconGeneratorPage() {
	return (
		<ToolPageLayout
			title="Favicon Generator"
			description="Generate multi-size .ico favicons from any image — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<FaviconGeneratorTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Favicon Generator converts any image into a
					browser-ready .ico file containing 16x16, 32x32, and 48x48 pixel
					icons. Upload a PNG, JPG, SVG, or WebP and the tool resizes it to each
					target dimension, then packs all sizes into a single ICO file using
					the standard binary format. You can also download individual PNG files
					for each size. Everything runs client-side in a Web Worker — your
					images are never sent to any server.
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
