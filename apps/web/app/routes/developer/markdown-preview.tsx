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
import type { Route } from "./+types/markdown-preview";

const MarkdownPreviewTool = lazy(
	() => import("~/features/developer-tools/components/markdown-preview-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Markdown Preview Online — Live Editor with GFM Support | Free, Private | NoUploads",
		description:
			"Edit and preview Markdown with live rendering, GFM tables, task lists, and code blocks. Runs entirely in your browser.",
		path: "/developer/markdown-preview",
		keywords:
			"markdown preview, markdown editor, markdown to html, gfm, github flavored markdown, markdown live preview, markdown renderer, markdown online",
		jsonLdName: "Markdown Preview",
	});
}

const faqItems = [
	{
		question: "Who created Markdown?",
		answer: (
			<>
				Markdown was created by John Gruber and Aaron Swartz in 2004 as a
				lightweight markup language designed to read naturally as plain text
				while converting cleanly to HTML. Gruber described it as "a text-to-HTML
				conversion tool for web writers." Today Markdown has become ubiquitous —
				it powers documentation on GitHub, posts on Stack Overflow and Reddit,
				and note-taking in tools like Obsidian and Notion.{" "}
				<a
					href="https://en.wikipedia.org/wiki/Markdown"
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
		question: "Is the preview accurate to how GitHub renders Markdown?",
		answer:
			"The editor uses the same GFM specification that GitHub follows. Tables, task lists, strikethrough, and fenced code blocks all render correctly. Minor visual differences in styling may occur since the preview uses its own CSS, but the underlying HTML structure matches GitHub's interpretation of the Markdown.",
	},
	{
		question: "What happens to images and links in the preview?",
		answer:
			"Image references render as actual images if they point to accessible URLs, but local file paths won't resolve since the preview runs in a sandboxed browser context. Relative links work within the preview but won't navigate anywhere. If you're previewing a README destined for GitHub, absolute URLs are the safest choice for images.",
	},
];

export default function MarkdownPreviewPage() {
	return (
		<ToolPageLayout
			title="Markdown Preview"
			description="Edit and preview Markdown with live rendering — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<MarkdownPreviewTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Markdown Preview tool gives you a split-pane editor with live
					rendering powered by GitHub Flavored Markdown. Paste or type Markdown
					on the left and instantly see the formatted result on the right —
					including tables, task lists, code blocks, and more. Use the toolbar
					to insert common syntax, upload existing .md files, copy the rendered
					HTML, or download your work. Everything runs in your browser with no
					server round-trips and no data stored anywhere.
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
				Powered by{" "}
				<a
					href="https://github.com/markedjs/marked"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					marked
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
