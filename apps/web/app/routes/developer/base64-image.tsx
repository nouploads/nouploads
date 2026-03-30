import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/base64-image";

const Base64ImageTool = lazy(
	() => import("~/features/developer-tools/components/base64-image-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Base64 Image Encoder & Decoder Online — Free & Private | NoUploads",
		description:
			"Encode images to base64 data URIs or decode base64 strings back to images. Free, private, runs in your browser.",
		path: "/developer/base64-image",
		keywords:
			"base64 image encoder, base64 decoder, image to base64, data uri converter, base64 to image, encode image base64 online",
		jsonLdName: "Base64 Image Encoder/Decoder",
	});
}

const faqItems = [
	{
		question: "What is base64 encoding?",
		answer:
			"Base64 is a binary-to-text encoding scheme that represents binary data as a string of printable ASCII characters. Each group of three bytes becomes four characters from a 64-character alphabet (A-Z, a-z, 0-9, +, /). It's commonly used to embed images directly in HTML, CSS, or JSON without needing a separate file request.",
	},
	{
		question: "When should I use base64 images?",
		answer:
			"Base64 images are useful for small icons, logos, or UI elements where eliminating an extra HTTP request improves performance. They're also handy for embedding images in email templates, single-file HTML documents, CSS data URIs, and API payloads. For images larger than a few KB, a regular file is usually more efficient since base64 adds roughly 33% overhead.",
	},
	{
		question: "Does base64 encoding increase file size?",
		answer:
			"Yes. Base64 encoding increases the data size by approximately 33% because every 3 bytes of binary data become 4 bytes of text. A 30 KB image becomes about 40 KB as a base64 string. This trade-off is acceptable for small assets but can slow down page loads when used for large images.",
	},
	{
		question: "What image formats can I encode?",
		answer:
			"This tool encodes any image your browser can read — PNG, JPG, WebP, GIF, AVIF, BMP, SVG, and TIFF. It preserves the original MIME type in the data URI prefix so the browser knows how to render it when decoded.",
	},
	{
		question: "Why use NoUploads instead of other base64 tools?",
		answer:
			"Most base64 encoders upload your image to a server for processing. NoUploads converts everything directly in your browser using the FileReader API — your files never leave your device. There is no server, no tracking, no file size limits, and no signup required. It works offline after the first visit, and the source code is open for anyone to audit.",
	},
];

export default function Base64ImagePage() {
	return (
		<ToolPageLayout
			title="Base64 Image Encoder/Decoder"
			description="Encode images to base64 data URIs or decode base64 strings back to images — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<Base64ImageTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Base64 Image Encoder/Decoder converts images to base64 data URI
					strings and decodes base64 text back into downloadable image files.
					Useful for embedding images in CSS, HTML, or JSON payloads without
					separate file requests, and for inspecting data URIs from API
					responses. Supports all common formats including PNG, JPG, WebP, GIF,
					and SVG. Everything runs client-side using the browser's FileReader
					API — no files are uploaded, no data leaves your device.
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

			<p className="text-xs text-muted-foreground mt-8">
				Processed using the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/API/FileReader"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					FileReader API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
