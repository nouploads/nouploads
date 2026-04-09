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
		title: "Favicon Generator Online — Free, No Limits | NoUploads",
		description:
			"Generate multi-size ICO favicons with 16, 32, and 48px icons packed into one file in your browser — free, no upload. Grab individual PNGs for each size too.",
		path: "/image/favicon-generator",
		keywords:
			"favicon generator, ico generator, favicon maker, create favicon, image to ico, favicon online free, private favicon tool",
		jsonLdName: "Favicon Generator",
		faq: [
			{
				question: "Why is designing tiny icons so difficult?",
				answer:
					"Designing icons at 16x16 or 32x32 pixels is a specialized discipline closely related to pixel art — each individual pixel matters because there are so few of them. Professional icon designers often hand-edit icons pixel by pixel at small sizes rather than simply scaling down a larger image, because automatic downscaling produces blurry, unrecognizable results. Apple, Google, and Microsoft all publish detailed human interface guidelines for icon design at various resolutions.",
			},
			{
				question: "What sizes are included in the generated favicon?",
				answer:
					"The tool generates three sizes: 16x16 pixels (used in browser tabs), 32x32 pixels (used in bookmark menus and taskbar shortcuts), and 48x48 pixels (used by Windows for desktop shortcuts). All three are packed into a single .ico file that works across browsers and operating systems.",
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
		],
	});
}

const faqItems = [
	{
		question: "Why is designing tiny icons so difficult?",
		answer: (
			<>
				Designing icons at 16×16 or 32×32 pixels is a specialized discipline
				closely related to pixel art — each individual pixel matters because
				there are so few of them. Professional icon designers often hand-edit
				icons pixel by pixel at small sizes rather than simply scaling down a
				larger image, because automatic downscaling produces blurry,
				unrecognizable results. Apple, Google, and Microsoft all publish
				detailed human interface guidelines for icon design at various
				resolutions. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Pixel_art"
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
		question: "What sizes are included in the generated favicon?",
		answer:
			"The tool generates three sizes: 16x16 pixels (used in browser tabs), 32x32 pixels (used in bookmark menus and taskbar shortcuts), and 48x48 pixels (used by Windows for desktop shortcuts). All three are packed into a single .ico file that works across browsers and operating systems.",
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
