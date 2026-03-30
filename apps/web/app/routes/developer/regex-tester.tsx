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
import type { Route } from "./+types/regex-tester";

const RegexTesterTool = lazy(
	() => import("~/features/developer-tools/components/regex-tester-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Regex Tester Online — Free Regular Expression Tester | NoUploads",
		description:
			"Test regex patterns with real-time match highlighting and capture groups. Free, private, runs in your browser.",
		path: "/developer/regex-tester",
		keywords:
			"regex tester, regular expression tester, regex match, regex online, test regex, regex debugger, regex capture groups, regex flags",
		jsonLdName: "Regex Tester",
	});
}

const faqItems = [
	{
		question: "How does the regex tester work?",
		answer:
			"The tester uses your browser's built-in RegExp engine and String.matchAll() to evaluate the pattern you enter against your test string. As you type, it runs the regex in real time and highlights every match directly in the output. Capture groups — both numbered and named — are extracted and displayed in a results table. No data leaves your browser at any point.",
	},
	{
		question: "What regex flags are supported?",
		answer:
			"Five commonly used flags are available as toggle buttons: g (global — find all matches, not just the first), i (case insensitive), m (multiline — ^ and $ match line boundaries), s (dotAll — the dot character matches newlines), and u (unicode — enables full Unicode matching and proper handling of surrogate pairs). You can combine any number of flags for a single test.",
	},
	{
		question: "What are capture groups and how do I see them?",
		answer:
			"Capture groups are portions of a regex wrapped in parentheses, like (\\d{4}) or (?<year>\\d{4}). When the pattern matches, the tester extracts the value each group captured and shows it in the Match Details table. Numbered groups appear as $1, $2, etc. Named groups (using the (?<name>...) syntax) display with their name. This makes it easy to verify that your pattern pulls out the right substrings.",
	},
	{
		question: "Is there a size limit for the test string?",
		answer:
			"The tool handles test strings up to 1 MB, which covers most real-world use cases such as log files, CSV snippets, and code blocks. Performance depends on the complexity of the regex and the number of matches — simple patterns run instantly even on large inputs, while highly backtracking patterns may take longer. Everything processes on your device.",
	},
	{
		question: "Why use NoUploads instead of other regex testers?",
		answer:
			"Most online regex testers send your test strings to a server, which can be a concern when you're matching against log data, credentials, or proprietary source code. NoUploads runs the entire evaluation in your browser tab using the native JavaScript RegExp engine — nothing is transmitted, stored, or logged. It's completely free with no usage caps, works offline once loaded, requires no account, and the source code is open for inspection.",
	},
];

export default function RegexTesterPage() {
	return (
		<ToolPageLayout
			title="Regex Tester"
			description="Test regular expressions with real-time match highlighting and capture group display — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<RegexTesterTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Regex Tester lets you build and debug regular expressions against
					sample text right in your browser. Paste or type a pattern and a test
					string to see every match highlighted instantly, with numbered and
					named capture groups broken out in a detail table. Ideal for crafting
					patterns for form validation, log parsing, or data extraction. All
					processing uses the browser's native RegExp engine — no data leaves
					your device, and there are no usage limits.
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
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					RegExp API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
