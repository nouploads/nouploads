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
import type { Route } from "./+types/timestamp-converter";

const TimestampConverterTool = lazy(
	() =>
		import("~/features/developer-tools/components/timestamp-converter-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Unix Timestamp Converter Online — Free, Private | NoUploads",
		description:
			"Convert Unix timestamps to readable dates and back. Detects seconds vs milliseconds automatically. Free, private, no server.",
		path: "/developer/timestamp-converter",
		keywords:
			"unix timestamp converter, epoch converter, timestamp to date, date to timestamp, unix time, epoch time, unix epoch converter online",
		jsonLdName: "Timestamp Converter",
		faq: [
			{
				question: "Why does Unix time start on January 1, 1970?",
				answer:
					'Unix time counts the number of seconds elapsed since midnight UTC on January 1, 1970 — a moment known as the "Unix epoch." This zero-point was chosen by early Unix developers at Bell Labs as a simple numerical reference that any system could understand. The original 32-bit timestamp will overflow on January 19, 2038 at 03:14:07 UTC, an event known as the Year 2038 problem.',
			},
			{
				question: "How does the tool detect seconds vs milliseconds?",
				answer:
					"The converter checks whether the input value is larger than 1 trillion (1e12). Timestamps in seconds won't reach that magnitude until the year 33658, so any value above 1e12 is almost certainly in milliseconds. When the tool detects milliseconds, it shows a badge indicating the detected unit and converts accordingly. You can enter either format — the results always show both.",
			},
			{
				question: "What date formats can I use in the Date to Timestamp panel?",
				answer:
					"The text input accepts any format that the browser's Date parser understands, including ISO 8601 (2023-11-14T22:13:20Z), RFC 2822 (Tue, 14 Nov 2023 22:13:20 GMT), and common formats like '2023-11-14' or 'November 14, 2023'. For reliable results across all browsers, ISO 8601 is recommended. The date picker provides a calendar interface that avoids format ambiguity entirely.",
			},
			{
				question: "Does the converter account for my local timezone?",
				answer:
					"Yes. The tool displays your detected timezone at the top of the page and shows both UTC and local-time representations. When you use the date picker, the selected date and time are interpreted in your local timezone. The ISO 8601 output always includes the timezone offset so there is no ambiguity. Unix timestamps themselves are always UTC-based.",
			},
		],
	});
}

const faqItems = [
	{
		question: "Why does Unix time start on January 1, 1970?",
		answer: (
			<>
				Unix time counts the number of seconds elapsed since midnight UTC on
				January 1, 1970 — a moment known as the "Unix epoch." This zero-point
				was chosen by early Unix developers at Bell Labs as a simple numerical
				reference that any system could understand. The original 32-bit
				timestamp will overflow on January 19, 2038 at 03:14:07 UTC, an event
				known as the Year 2038 problem.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Unix_time"
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
		question: "How does the tool detect seconds vs milliseconds?",
		answer:
			"The converter checks whether the input value is larger than 1 trillion (1e12). Timestamps in seconds won't reach that magnitude until the year 33658, so any value above 1e12 is almost certainly in milliseconds. When the tool detects milliseconds, it shows a badge indicating the detected unit and converts accordingly. You can enter either format — the results always show both.",
	},
	{
		question: "What date formats can I use in the Date to Timestamp panel?",
		answer:
			"The text input accepts any format that the browser's Date parser understands, including ISO 8601 (2023-11-14T22:13:20Z), RFC 2822 (Tue, 14 Nov 2023 22:13:20 GMT), and common formats like '2023-11-14' or 'November 14, 2023'. For reliable results across all browsers, ISO 8601 is recommended. The date picker provides a calendar interface that avoids format ambiguity entirely.",
	},
	{
		question: "Does the converter account for my local timezone?",
		answer:
			"Yes. The tool displays your detected timezone at the top of the page and shows both UTC and local-time representations. When you use the date picker, the selected date and time are interpreted in your local timezone. The ISO 8601 output always includes the timezone offset so there is no ambiguity. Unix timestamps themselves are always UTC-based.",
	},
];

export default function TimestampConverterPage() {
	return (
		<ToolPageLayout
			title="Timestamp Converter"
			description="Convert between Unix timestamps and human-readable dates — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<TimestampConverterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Timestamp Converter translates Unix epoch timestamps into
					human-readable dates and vice versa, directly in your browser. Paste a
					numeric timestamp and instantly see ISO 8601, RFC 2822, local time,
					UTC, and relative time representations. The tool auto-detects whether
					input is in seconds or milliseconds. Developers debugging API
					responses, log entries, or database records can convert values without
					leaving the browser or exposing data to external services — everything
					runs client-side with zero dependencies.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Date API
				</a>{" "}
				and{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Intl.DateTimeFormat
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
