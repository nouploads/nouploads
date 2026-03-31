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
import type { Route } from "./+types/ico-to-jpg";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert ICO to JPG Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert ICO favicon files to JPG images in your browser. Extracts the largest icon frame as a photo.",
		path: "/image/ico-to-jpg",
		keywords:
			"ico to jpg, convert ico to jpeg, favicon to jpg, ico to jpg converter, icon to jpg online",
		jsonLdName: "ICO to JPG Converter",
		faq: [
			{
				question: "Where does the ICO file format come from?",
				answer:
					"The ICO format was introduced by Microsoft with Windows 1.0 in 1985 to store icons for the new graphical user interface. A single ICO file can contain multiple images at different sizes and color depths, letting the operating system choose the most appropriate version for each display context — from tiny taskbar icons to high-resolution desktop shortcuts.",
			},
			{
				question: "When should I convert ICO to JPG instead of PNG?",
				answer:
					"Choose JPG when you need the smallest possible file size and the icon is a photograph or has complex gradients. For logos and icons with flat colors or transparency, PNG is usually the better choice since JPG discards transparency and can introduce artifacts around sharp edges.",
			},
			{
				question: "What happens to the transparent background?",
				answer:
					"JPG does not support transparency. Any transparent areas in the ICO are composited onto a white background before encoding. If you need to keep the transparent background, use the ICO to PNG converter instead.",
			},
			{
				question: "Which icon size does it extract?",
				answer:
					"The tool automatically selects the highest-resolution frame embedded in the ICO file. Modern favicons typically include a 256x256 PNG-compressed frame alongside smaller BMP versions, so you get the best quality available.",
			},
		],
	});
}

const ACCEPT = { "image/x-icon": [".ico", ".cur"] };

const faqItems = [
	{
		question: "Where does the ICO file format come from?",
		answer: (
			<>
				The ICO format was introduced by Microsoft with Windows 1.0 in 1985 to
				store icons for the new graphical user interface. A single ICO file can
				contain multiple images at different sizes and color depths, letting the
				operating system choose the most appropriate version for each display
				context — from tiny taskbar icons to high-resolution desktop shortcuts.{" "}
				Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/ICO_(file_format)"
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
		question: "When should I convert ICO to JPG instead of PNG?",
		answer:
			"Choose JPG when you need the smallest possible file size and the icon is a photograph or has complex gradients. For logos and icons with flat colors or transparency, PNG is usually the better choice since JPG discards transparency and can introduce artifacts around sharp edges.",
	},
	{
		question: "What happens to the transparent background?",
		answer:
			"JPG does not support transparency. Any transparent areas in the ICO are composited onto a white background before encoding. If you need to keep the transparent background, use the ICO to PNG converter instead.",
	},
	{
		question: "Which icon size does it extract?",
		answer:
			"The tool automatically selects the highest-resolution frame embedded in the ICO file. Modern favicons typically include a 256x256 PNG-compressed frame alongside smaller BMP versions, so you get the best quality available.",
	},
];

export default function IcoToJpgPage() {
	return (
		<ToolPageLayout
			title="Convert ICO to JPG"
			description="Extract the highest-resolution image from ICO favicon files as JPG — free, private, no upload required."
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
					Extracts the highest-resolution frame from ICO and CUR files and
					encodes it as a standard JPG image with adjustable quality.
					Transparent regions are filled with a white background since JPG does
					not support alpha channels. Useful when you need a quick JPG from a
					favicon for presentations, documentation, or social media posts. All
					processing happens in your browser.
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
