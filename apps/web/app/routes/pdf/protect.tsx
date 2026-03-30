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
import type { Route } from "./+types/protect";

const PdfProtectTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-protect-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Protect PDF Online — Add Password Protection | Free, Private | NoUploads",
		description:
			"Add password protection and permission restrictions to a PDF. Set open and owner passwords, control printing, copying, and editing. Free, private, no upload.",
		path: "/pdf/protect",
		keywords:
			"protect pdf, password protect pdf, encrypt pdf, pdf password, lock pdf, restrict pdf printing, restrict pdf copying, free pdf protection, private pdf encrypt",
		jsonLdName: "PDF Password Protection Tool",
	});
}

const faqItems = [
	{
		question: "How does the PDF password protection work?",
		answer:
			"The tool uses the PDF Standard Security Handler (RC4-128) to add password protection directly inside your browser. It computes encryption keys from your passwords and embeds them in the PDF's security dictionary. The entire process runs client-side — your PDF and passwords never leave your device.",
	},
	{
		question: "What is the difference between user and owner passwords?",
		answer:
			"The user password (also called the open password) is required to open and view the PDF. The owner password controls who can change the document's security settings and permissions. You can set just a user password if you only want to restrict opening, or set both to have full control over access and permissions.",
	},
	{
		question: "What permissions can I restrict on the protected PDF?",
		answer:
			"You can control three permission categories: printing (whether the document can be printed), copying (whether text and images can be selected and copied), and editing (whether the document content can be modified). Uncheck any permission to restrict that action for users who open the PDF with the user password.",
	},
	{
		question: "Will the protected PDF work in all PDF viewers?",
		answer:
			"The protection follows the PDF specification's standard security handler, which is supported by all major PDF readers including Adobe Acrobat, Preview on macOS, Chrome's built-in viewer, and most third-party PDF apps. The file uses RC4-128 encryption, which has been part of the PDF standard since version 1.4.",
	},
	{
		question: "Why use NoUploads instead of other PDF protection tools?",
		answer:
			"When you password-protect a document, the last thing you want is to upload it to a third-party server along with your chosen passwords. NoUploads processes everything in your browser — the PDF bytes and passwords never leave your machine. There is no server, no account, no daily limit. It works offline once the page loads, and the source code is open for anyone to audit.",
	},
];

export default function ProtectPdfPage() {
	return (
		<ToolPageLayout
			title="Protect PDF"
			description="Add password protection and permission restrictions to a PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfProtectTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool lets you lock a PDF with a password and restrict what
					viewers can do with it. Set an open password so only authorized people
					can read the file, and configure permissions to prevent printing,
					copying, or editing. Everything runs in your browser using pdf-lib and
					standard PDF encryption — no server involved, no data transmitted, no
					file size limits.
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

			<LibraryAttribution packages={["pdf-lib"]} />
		</ToolPageLayout>
	);
}
