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
import type { Route } from "./+types/xwindow-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Convert X Window Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Open and convert XBM, XPM, and XWD files from the X Window System in your browser. No server, no signup.",
		path: "/image/xwindow-converter",
		keywords:
			"xbm converter, xpm converter, xwd converter, x window image, x11 bitmap, x pixmap, x window dump, convert xbm online, convert xpm online",
		jsonLdName: "X Window Image Converter",
		faq: [
			{
				question: "What's unusual about the XBM file format?",
				answer:
					"XBM, XPM, and XWD are image formats from the X Window System — the graphical framework that has powered Unix and Linux desktops since 1984. XBM files are unique in that they are actually valid C source code: the pixel data is stored as a C array that can be compiled directly into applications without needing any image parsing library whatsoever.",
			},
			{
				question: "How does in-browser X Window format conversion work?",
				answer:
					"Each format has a dedicated parser written in JavaScript that runs entirely in your browser. XBM and XPM are C source files — the parser reads the text, extracts width/height defines and pixel data, and reconstructs the image locally. XWD is a binary format — the parser reads the header fields, optional colormap, and raw pixel bytes. No file ever leaves your device.",
			},
			{
				question: "Where do X Window image files come from?",
				answer:
					"XBM files were widely used for cursor and icon bitmaps in X11 applications. XPM became the standard for color icons and pixmaps in toolkits like Motif and early GTK. XWD files are produced by the xwd screenshot utility on X11 systems — developers and sysadmins used them to capture window contents for bug reports and documentation. You may encounter these files in old Unix archives, retro computing projects, or legacy X11 application source trees.",
			},
		],
	});
}

const ACCEPT = {
	"image/x-xbitmap": [".xbm"],
	"image/x-xpixmap": [".xpm"],
	"image/x-xwindowdump": [".xwd"],
};

const faqItems = [
	{
		question: "What's unusual about the XBM file format?",
		answer: (
			<>
				XBM, XPM, and XWD are image formats from the X Window System — the
				graphical framework that has powered Unix and Linux desktops since 1984.
				XBM files are unique in that they are actually valid C source code: the
				pixel data is stored as a C array that can be compiled directly into
				applications without needing any image parsing library whatsoever.{" "}
				<a
					href="https://en.wikipedia.org/wiki/X_BitMap"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Source: Wikipedia
				</a>
			</>
		),
	},
	{
		question: "How does in-browser X Window format conversion work?",
		answer:
			"Each format has a dedicated parser written in JavaScript that runs entirely in your browser. XBM and XPM are C source files — the parser reads the text, extracts width/height defines and pixel data, and reconstructs the image locally. XWD is a binary format — the parser reads the header fields, optional colormap, and raw pixel bytes. No file ever leaves your device.",
	},
	{
		question: "Where do X Window image files come from?",
		answer:
			"XBM files were widely used for cursor and icon bitmaps in X11 applications. XPM became the standard for color icons and pixmaps in toolkits like Motif and early GTK. XWD files are produced by the `xwd` screenshot utility on X11 systems — developers and sysadmins used them to capture window contents for bug reports and documentation. You may encounter these files in old Unix archives, retro computing projects, or legacy X11 application source trees.",
	},
];

export default function XWindowConverterPage() {
	return (
		<ToolPageLayout
			title="Convert X Window Images"
			description="Open and convert XBM, XPM, and XWD files from the X Window System to modern formats — free, private, no upload required."
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
					Converts three image formats from the X Window System that modern
					applications and operating systems cannot open natively. Handles XBM
					monochrome bitmaps stored as C source code, XPM color pixmaps with
					character-based color mapping, and XWD binary window dump screenshots.
					Each format is decoded with a purpose-built parser running entirely in
					your browser — no file leaves your device, no external library is
					loaded, and output is available as JPG, PNG, or WebP.
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
