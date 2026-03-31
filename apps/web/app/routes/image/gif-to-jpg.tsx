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
import type { Route } from "./+types/gif-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert GIF to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert GIF to JPG with frame-by-frame selection. Pick the exact frame you want from animated GIFs. Free and private.",
		path: "/image/gif-to-jpg",
		keywords:
			"gif to jpg, gif to jpeg, convert gif to jpg, gif frame extract, gif to image, gif converter",
		jsonLdName: "GIF to JPG Converter",
	});
}

const ACCEPT = { "image/gif": [".gif"] };

const faqItems = [
	{
		question: "What's the story behind the GIF format?",
		answer: (
			<>
				GIF was introduced by CompuServe in 1987, making it one of the oldest
				image formats still in everyday use. It supports only 256 colors per
				frame but became the de facto standard for short animations on the web.
				The format's pronunciation sparked one of the internet's longest-running
				debates — creator Steve Wilhite insisted it was "jif" with a soft G,
				though most people still say "gif" with a hard G.{" "}
				<a
					href="https://en.wikipedia.org/wiki/GIF"
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
		question: "What happens to animated GIFs?",
		answer:
			"Animated GIFs are parsed frame by frame and displayed in a visual filmstrip. You can scroll through the timeline and click any frame to select it — the selected frame is then converted to a static JPG. If the GIF has only one frame, it's converted directly without showing the selector.",
	},
	{
		question: "Will transparent areas be preserved?",
		answer:
			"No. GIF supports basic transparency (fully transparent or fully opaque pixels), but JPG doesn't support any transparency. Transparent areas become white in the JPG output. If you need transparency, convert to PNG instead.",
	},
];

export default function GifToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert GIF to JPG"
			description="Convert GIF images to compact JPG format — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ImageConverterTool defaultOutputFormat="image/jpeg" accept={ACCEPT} />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Unlike most GIF converters that silently grab the first frame, this
					tool decodes every frame of an animated GIF with gifuct-js and
					displays them in a scrollable visual filmstrip. Click the exact frame
					you want — a mid-laugh reaction shot, a specific step in a tutorial
					recording — and export it as a compressed JPG. Static GIFs skip the
					picker and convert directly. Useful for creating thumbnails, pulling
					stills for presentations, or archiving a lighter copy of oversized GIF
					graphics.
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

			<LibraryAttribution packages={["gifuct-js"]} />
		</ToolPageLayout>
	);
}
