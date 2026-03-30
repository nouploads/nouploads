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
import type { Route } from "./+types/png-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PNG to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PNG images to JPG for smaller file sizes. Free, private, no server upload required.",
		path: "/image/png-to-jpg",
		keywords:
			"png to jpg, png to jpeg, convert png to jpg online, png to jpg converter, reduce png file size",
		jsonLdName: "PNG to JPG Converter",
	});
}

const ACCEPT = { "image/png": [".png"] };

const faqItems = [
	{
		question: "Why convert PNG to JPG?",
		answer:
			"JPG files are significantly smaller than PNGs for photographic content. If you have screenshots or photos saved as PNG and need to reduce file size for email, web uploads, or storage, converting to JPG is the fastest way to shrink them.",
	},
	{
		question: "What happens to transparent areas?",
		answer:
			"JPG doesn't support transparency. Any transparent areas in your PNG will be filled with a white background during conversion. If you need to preserve transparency, consider WebP or keep the PNG format.",
	},
	{
		question: "How much smaller will my files be?",
		answer:
			"It depends on the image content. Photographs converted from PNG to JPG typically shrink by 50–90%. Simple graphics with flat colors see less dramatic savings because JPG compression is optimized for continuous-tone images.",
	},
	{
		question: "Can I convert multiple PNGs at once?",
		answer:
			"Yes. Select or drag multiple PNG files and they'll all be converted to JPG in a batch. Download each result individually or grab everything at once.",
	},
	{
		question: "Why use NoUploads instead of other PNG to JPG tools?",
		answer:
			"Screenshots regularly capture things you would never share intentionally — visible passwords, private DMs, confidential code, patient records on a second monitor. Uploading those PNGs to a conversion site puts all of that data on a third-party server you do not control. With NoUploads the Canvas API re-encodes the pixels to JPG right on your machine, so sensitive information in the screenshot never touches the network. No account is needed and the tool keeps working after you disconnect from the internet.",
	},
];

export default function PngToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert PNG to JPG"
			description="Convert PNG images to compact JPG format — free, private, no upload required."
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
					Re-encodes PNG images as JPG through the browser's Canvas API,
					compositing any transparent regions onto a white background before
					JPEG compression. Photographs saved as PNG typically shrink by 50--90%
					after conversion because JPG's lossy DCT compression is far more
					efficient for continuous-tone imagery than PNG's lossless deflate. The
					quality slider lets you balance sharpness against file size — 85% is a
					good starting point for screenshots destined for Slack or email.
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
