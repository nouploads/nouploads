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
		title: "URL Encoder / Decoder Online — Free, Instant | NoUploads",
		description:
			"Encode and decode URLs or components in your browser — free, with query parameter parsing and URL breakdown. No data sent to any server. Full Unicode support.",
		path: "/developer/url-encoder",
		keywords:
			"url encoder, url decoder, encode url online, decode url, percent encoding, urlencode, urldecode, query string parser, url parser",
		jsonLdName: "URL Encoder / Decoder",
		faq: [
			{
				question: "Why do URLs need percent-encoding?",
				answer:
					"URL encoding (also called percent-encoding) was defined in RFC 1738 in 1994. Since URLs can only safely contain ASCII letters, digits, and a handful of special characters, everything else — spaces, accented letters, emoji, and most Unicode — must be represented as a percent sign followed by two hex digits (e.g., %20 for a space). This scheme is what makes it possible to link to resources in any language using the ASCII-only URL syntax.",
			},
			{
				question:
					"What is the difference between component and full URL encoding?",
				answer:
					"Component encoding (encodeURIComponent) encodes every special character including slashes, colons, and ampersands — use it for individual query parameter values or path segments. Full URL encoding (encodeURI) leaves structural characters like ://?#&= intact and only encodes characters that are not valid anywhere in a URL. Use component mode when encoding a value to embed in a URL, and full URL mode when encoding an entire URL that already has the right structure.",
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
		],
	});
}

const faqItems = [
	{
		question: "Why do URLs need percent-encoding?",
		answer: (
			<>
				URL encoding (also called percent-encoding) was defined in RFC 1738 in
				1994. Since URLs can only safely contain ASCII letters, digits, and a
				handful of special characters, everything else — spaces, accented
				letters, emoji, and most Unicode — must be represented as a percent sign
				followed by two hex digits (e.g., %20 for a space). This scheme is what
				makes it possible to link to resources in any language using the
				ASCII-only URL syntax. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Percent-encoding"
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
		question: "What is the difference between component and full URL encoding?",
		answer:
			"Component encoding (encodeURIComponent) encodes every special character including slashes, colons, and ampersands — use it for individual query parameter values or path segments. Full URL encoding (encodeURI) leaves structural characters like ://?#&= intact and only encodes characters that are not valid anywhere in a URL. Use component mode when encoding a value to embed in a URL, and full URL mode when encoding an entire URL that already has the right structure.",
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
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					encodeURIComponent API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
