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
import type { Route } from "./+types/text-diff";

const TextDiffTool = lazy(
	() => import("~/features/developer-tools/components/text-diff-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Text Diff Online — Compare Text Side by Side | Free, Private | NoUploads",
		description:
			"Compare two blocks of text and see every changed, added, or removed line highlighted. Runs in your browser — nothing uploaded.",
		path: "/developer/text-diff",
		keywords:
			"text diff, compare text, diff checker, text comparison, online diff tool, side by side diff, unified diff, line diff",
		jsonLdName: "Text Diff",
	});
}

const faqItems = [
	{
		question: "Where does the diff algorithm come from?",
		answer: (
			<>
				The most widely used diff algorithm was published by Eugene Myers in
				1986 in the paper "An O(ND) Difference Algorithm and Its Variations." It
				finds the shortest sequence of insertions and deletions needed to
				transform one text into another. This is the same core algorithm behind
				git diff, which developers around the world use millions of times a day
				to review code changes.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Diff"
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
		question: "What is the difference between unified and side-by-side view?",
		answer:
			"Unified view shows all changes in a single column: removed lines are marked with a red minus, added lines with a green plus, and unchanged lines appear as-is. Side-by-side view splits the output into two columns — the original on the left and the modified on the right — so you can compare them visually. Unified is compact; side-by-side is easier to scan when there are many scattered changes.",
	},
	{
		question: "Is there a size limit on the input?",
		answer:
			"The tool handles up to 10 MB of text per side. For files beyond around 10,000 lines, the LCS algorithm may take a moment because it scales with the product of both line counts. A warning appears for large inputs so you know what to expect. For most configuration files, code diffs, and log comparisons, performance is instantaneous.",
	},
	{
		question: "Can I compare files instead of pasting text?",
		answer:
			"Yes. Each input panel has an Upload button that accepts any text-based file — .txt, .json, .csv, .xml, .html, .py, .js, and many more. The file is read locally with the browser's FileReader API and never leaves your device. You can also drag and drop text into either textarea.",
	},
];

export default function TextDiffPage() {
	return (
		<ToolPageLayout
			title="Text Diff"
			description="Compare two blocks of text with line-level diff highlighting — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<TextDiffTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Text Diff tool compares two blocks of text and highlights every
					added, removed, and unchanged line. Paste code, configuration, logs,
					or any plain text into the two panels and get an instant visual diff —
					in unified or side-by-side layout. Useful for reviewing code changes,
					comparing config file versions, or spotting differences between API
					responses. Everything runs client-side using a custom LCS algorithm —
					no data leaves your browser, and there are no usage limits.
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
				Processed using a built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					JavaScript Array API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
