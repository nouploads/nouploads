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
import type { Route } from "./+types/uuid-generator";

const UuidGeneratorTool = lazy(
	() => import("~/features/developer-tools/components/uuid-generator-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "UUID Generator Online — Free, Instant | NoUploads",
		description:
			"Generate UUID v4 and v7 identifiers in your browser — free, with bulk generation and one-click copy. No data sent to any server. Includes validation and parse.",
		path: "/developer/uuid-generator",
		keywords:
			"uuid generator, uuid v4, uuid v7, random uuid, guid generator, unique id generator, bulk uuid, uuid validator, rfc 9562",
		jsonLdName: "UUID Generator",
		faq: [
			{
				question: "How did UUIDs originate?",
				answer:
					"Universally Unique Identifiers were originally created for the Apollo Network Computing System in the 1980s, then standardized as RFC 4122 in 2005. Version 4 (random) UUIDs are the most commonly generated today — with 122 bits of randomness, the probability of a collision is so vanishingly small that you could generate one billion UUIDs per second for 85 years before reaching a 50% chance of a single duplicate.",
			},
			{
				question: "What is the difference between UUID v4 and v7?",
				answer:
					"UUID v4 is entirely random — 122 bits of randomness with version and variant markers. It provides the strongest uniqueness guarantee but has no built-in ordering. UUID v7 (RFC 9562) encodes a Unix timestamp in the first 48 bits, so UUIDs generated later sort after earlier ones. This makes v7 ideal as database primary keys because inserts remain sequential, keeping B-tree indexes efficient and avoiding page splits.",
			},
			{
				question: "Can I use UUID v7 as a database primary key?",
				answer:
					"Yes, and that is one of the main reasons v7 was standardized. Traditional auto-increment IDs leak row counts and create hotspot contention in distributed systems. UUID v4 works but fragments indexes because values are random. UUID v7 gives you globally unique, k-sortable identifiers — new rows always land at the end of the index, matching the sequential insert pattern databases are optimized for.",
			},
			{
				question: "How does the UUID validator work?",
				answer:
					"It checks the input against the standard UUID format (8-4-4-4-12 hex characters), then inspects the version nibble (position 13) and variant bits (position 17) to determine which RFC version was used. For v7 UUIDs, it also extracts and decodes the 48-bit timestamp embedded in the first segment, showing the exact time the UUID was created.",
			},
		],
	});
}

const faqItems = [
	{
		question: "How did UUIDs originate?",
		answer: (
			<>
				Universally Unique Identifiers were originally created for the Apollo
				Network Computing System in the 1980s, then standardized as RFC 4122 in
				2005. Version 4 (random) UUIDs are the most commonly generated today —
				with 122 bits of randomness, the probability of a collision is so
				vanishingly small that you could generate one billion UUIDs per second
				for 85 years before reaching a 50% chance of a single duplicate. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Universally_unique_identifier"
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
		question: "What is the difference between UUID v4 and v7?",
		answer:
			"UUID v4 is entirely random — 122 bits of randomness with version and variant markers. It provides the strongest uniqueness guarantee but has no built-in ordering. UUID v7 (RFC 9562) encodes a Unix timestamp in the first 48 bits, so UUIDs generated later sort after earlier ones. This makes v7 ideal as database primary keys because inserts remain sequential, keeping B-tree indexes efficient and avoiding page splits.",
	},
	{
		question: "Can I use UUID v7 as a database primary key?",
		answer:
			"Yes, and that is one of the main reasons v7 was standardized. Traditional auto-increment IDs leak row counts and create hotspot contention in distributed systems. UUID v4 works but fragments indexes because values are random. UUID v7 gives you globally unique, k-sortable identifiers — new rows always land at the end of the index, matching the sequential insert pattern databases are optimized for.",
	},
	{
		question: "How does the UUID validator work?",
		answer:
			"It checks the input against the standard UUID format (8-4-4-4-12 hex characters), then inspects the version nibble (position 13) and variant bits (position 17) to determine which RFC version was used. For v7 UUIDs, it also extracts and decodes the 48-bit timestamp embedded in the first segment, showing the exact time the UUID was created.",
	},
];

export default function UuidGeneratorPage() {
	return (
		<ToolPageLayout
			title="UUID Generator"
			description="Generate random UUID v4 or time-sortable UUID v7 identifiers — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<UuidGeneratorTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The UUID Generator creates universally unique identifiers in two
					flavors: v4 (fully random, ideal for opaque tokens and session IDs)
					and v7 (timestamp-ordered per RFC 9562, ideal for database primary
					keys and distributed systems). Generate a single UUID or up to 1,000
					at once, copy them individually or in bulk, and download the list as a
					plain text file. The validator tab lets you paste any UUID to check
					its version, variant, and — for v7 — the embedded creation timestamp.
					Everything runs client-side using the Web Crypto API with no external
					dependencies.
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
					href="https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Web Crypto API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
