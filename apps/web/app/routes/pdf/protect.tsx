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
		faq: [
			{
				question: "How did PDF encryption evolve over the years?",
				answer:
					'PDF supports two distinct levels of password protection: a "user password" required to open the file at all, and an "owner password" that restricts specific actions like printing, copying text, or editing. The encryption has evolved from 40-bit RC4 in early versions to AES-256 in PDF 2.0. The password itself is never stored in the file — instead, it derives the encryption key used to scramble the document\'s content streams.',
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
		],
	});
}

const faqItems = [
	{
		question: "How did PDF encryption evolve over the years?",
		answer: (
			<>
				PDF supports two distinct levels of password protection: a "user
				password" required to open the file at all, and an "owner password" that
				restricts specific actions like printing, copying text, or editing. The
				encryption has evolved from 40-bit RC4 in early versions to AES-256 in
				PDF 2.0. The password itself is never stored in the file — instead, it
				derives the encryption key used to scramble the document's content
				streams. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF#Security_and_signatures"
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
