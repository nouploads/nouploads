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
import type { Route } from "./+types/psd-converter";

const ImageConverterTool = lazy(
	() => import("~/features/image-tools/components/image-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Convert PSD Online — Free, Private, No Upload | NoUploads",
		description:
			"Convert PSD files to JPG, PNG, WebP, or AVIF entirely in your browser. No upload, no signup, no limits.",
		path: "/image/psd-converter",
		keywords:
			"psd to jpg, psd to png, psd converter online, open psd file, psd to webp, convert psd free",
		jsonLdName: "PSD Converter",
	});
}

const ACCEPT = { "image/vnd.adobe.photoshop": [".psd"] };

const faqItems = [
	{
		question: "How did Photoshop and the PSD format get started?",
		answer: (
			<>
				Photoshop was created by brothers Thomas and John Knoll. Thomas wrote
				the original program in 1987 as a graduate student at the University of
				Michigan, and his brother John — a visual effects artist at Industrial
				Light & Magic — recognized its potential for film production. Adobe
				acquired the distribution license in 1988, and Photoshop 1.0 shipped in
				1990, creating the PSD format that remains the standard for layered
				image editing.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Adobe_Photoshop"
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
		question: "How does this handle PSD layers?",
		answer:
			"The converter composites all visible layers into a single flattened image, respecting layer order and opacity. The result looks exactly like opening the PSD in Photoshop and choosing File > Export. Individual layers cannot be extracted separately.",
	},
	{
		question: "Does it support CMYK PSD files?",
		answer:
			"Yes. CMYK color data is automatically converted to RGB during compositing so the output works correctly in web browsers, email clients, and standard image viewers. No manual color profile conversion is needed.",
	},
	{
		question: "How large of a PSD file can this handle?",
		answer:
			"There is no server-imposed limit since everything runs in your browser. In practice, PSD files up to roughly 200MB process well on modern devices. Very large PSDs (500MB+) may run slowly or exceed browser memory on older machines or mobile devices.",
	},
];

export default function PsdConverterPage() {
	return (
		<ToolPageLayout
			title="Convert PSD"
			description="Convert Adobe Photoshop PSD files to JPG, PNG, WebP, or AVIF — free, private, no upload required."
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
					Opens Adobe Photoshop PSD files and composites all visible layers into
					a single flattened image you can export as JPG, PNG, WebP, or AVIF.
					Useful for designers who need to share work with clients who don't
					have Photoshop, or for quickly previewing layered files on any device.
					CMYK documents are converted to RGB automatically, and files up to
					200MB work well on modern hardware. All decoding and encoding happens
					locally in your browser — nothing leaves your device.
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

			<LibraryAttribution packages={["@webtoon/psd"]} />
		</ToolPageLayout>
	);
}
