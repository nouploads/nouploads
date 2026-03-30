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
import type { Route } from "./+types/url-encoder";

const UrlEncoderTool = lazy(
	() => import("~/features/developer-tools/components/url-encoder-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "URL Encoder / Decoder Online — Free, Private | NoUploads",
		description:
			"Encode and decode URLs or URL components instantly in your browser. Parses query parameters, supports full URL and component modes.",
		path: "/developer/url-encoder",
		keywords:
			"url encoder, url decoder, encode url online, decode url, percent encoding, urlencode, urldecode, query string parser, url parser",
		jsonLdName: "URL Encoder / Decoder",
	});
}

const faqItems = [
	{
		question: "What is the difference between component and full URL encoding?",
		answer:
			"Component encoding (encodeURIComponent) encodes every special character including slashes, colons, and ampersands — use it for individual query parameter values or path segments. Full URL encoding (encodeURI) leaves structural characters like ://?#&= intact and only encodes characters that are not valid anywhere in a URL. Use component mode when encoding a value to embed in a URL, and full URL mode when encoding an entire URL that already has the right structure.",
	},
	{
		question: "What characters does URL encoding convert?",
		answer:
			"URL encoding (also called percent-encoding) replaces unsafe characters with a percent sign followed by two hex digits. Spaces become %20, ampersands become %26, equals signs become %3D, and non-ASCII characters like accented letters are encoded as multi-byte UTF-8 sequences. The encoded form is safe to use in URLs, form submissions, and HTTP headers without ambiguity.",
	},
	{
		question: "How does the URL breakdown work?",
		answer:
			"When you enter or decode a valid URL, the tool parses it using the browser's built-in URL constructor and displays each component separately — protocol, host, path, hash, and all query parameters with their decoded values. This makes it easy to inspect complex URLs with many parameters or deeply nested encoded values.",
	},
	{
		question:
			"Can I encode non-ASCII characters like emoji or accented letters?",
		answer:
			"Yes. The encoder handles the full Unicode range. Characters outside the ASCII set are first encoded as UTF-8 bytes, then each byte is percent-encoded. For example, the emoji flag character or a Japanese kanji will produce a series of %XX sequences that any standards-compliant server can decode back to the original character.",
	},
	{
		question: "Why use NoUploads instead of other URL encoder tools?",
		answer:
			"Most online URL encoders send your input to a server for processing — meaning API keys, tokens, and private query parameters pass through third-party infrastructure. NoUploads runs entirely in your browser using the native encodeURIComponent and decodeURIComponent APIs. Nothing is transmitted, there is no server, no account required, no usage limits, and it works offline after the first load. The source code is open for inspection.",
	},
];

export default function UrlEncoderPage() {
	return (
		<ToolPageLayout
			title="URL Encoder / Decoder"
			description="Encode and decode URL components or full URLs instantly — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<UrlEncoderTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The URL Encoder / Decoder converts text to and from percent-encoded
					format directly in your browser. Switch between component mode (for
					encoding individual values like query parameters) and full URL mode
					(for encoding complete URLs while preserving their structure). Paste
					any URL to see a parsed breakdown of protocol, host, path, and every
					query parameter with its decoded value. Everything runs client-side
					using native browser APIs — no data is sent to any server, and there
					are no usage limits.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					encodeURIComponent API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
