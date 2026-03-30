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
		question: "What Markdown features are supported?",
		answer:
			"The editor supports full GitHub Flavored Markdown (GFM): headings, bold, italic, strikethrough, links, images, ordered and unordered lists, task lists with checkboxes, tables, blockquotes, inline code, fenced code blocks, and horizontal rules. The preview updates in real time as you type.",
	},
	{
		question: "Can I edit and preview Markdown files from my computer?",
		answer:
			"Yes. Click the 'Upload .md' button or drag and drop any .md, .txt, or .markdown file onto the editor. The file is read locally using the browser's FileReader API — it never leaves your device. Once loaded, you can edit the Markdown and see the rendered output side by side.",
	},
	{
		question: "How do I get the rendered HTML?",
		answer:
			"Click the 'Copy HTML' button in the toolbar to copy the rendered HTML to your clipboard. This is useful when you need the HTML output for a CMS, blog platform, email template, or documentation site. You can also download the raw Markdown as a .md file.",
	},
	{
		question: "Is the preview accurate to how GitHub renders Markdown?",
		answer:
			"The editor uses the same GFM specification that GitHub follows. Tables, task lists, strikethrough, and fenced code blocks all render correctly. Minor visual differences in styling may occur since the preview uses its own CSS, but the underlying HTML structure matches GitHub's interpretation of the Markdown.",
	},
	{
		question: "Why use NoUploads instead of other Markdown preview tools?",
		answer:
			"Most online Markdown editors send your text to a server for rendering or require an account. NoUploads renders everything client-side — your Markdown never leaves your browser tab. There is no server processing, no data collection, no signup, and no usage limits. The tool works offline after the initial page load and the source code is fully open.",
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
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					marked
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
