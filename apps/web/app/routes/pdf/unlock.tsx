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
import type { Route } from "./+types/unlock";

const PdfUnlockTool = lazy(
	() => import("~/features/pdf-tools/components/pdf-unlock-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Unlock PDF Online — Remove Password Protection | Free, Private | NoUploads",
		description:
			"Remove password protection from PDFs in your browser. No upload, no server — your files stay on your device.",
		path: "/pdf/unlock",
		keywords:
			"unlock pdf, remove pdf password, pdf password remover, unprotect pdf, decrypt pdf online, free pdf unlock tool, private pdf unlocker",
		jsonLdName: "PDF Unlock Tool",
	});
}

const faqItems = [
	{
		question: "How did PDF encryption evolve?",
		answer: (
			<>
				PDF encryption (introduced in PDF 1.1 in 1994) scrambles the document's
				content streams using a key derived from the password. The specification
				defines two passwords: the "owner password" controls permissions like
				printing and copying, while the "user password" gates access entirely.
				Interestingly, many PDFs in the wild use only an owner password —
				meaning the content is restricted but the decryption key can be derived
				without any password at all.{" "}
				<a
					href="https://en.wikipedia.org/wiki/PDF#Security_and_signatures"
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
		question: "Do I need to know the password to unlock the PDF?",
		answer:
			"For PDFs that require a password just to open (user-password protection), yes — you must enter the correct password. For PDFs that open normally but restrict printing or copying (owner-password protection), you can often unlock them without entering any password at all.",
	},
	{
		question: "What types of PDF protection can this tool remove?",
		answer:
			"This tool handles two common types of PDF protection: owner-password restrictions (which block printing, copying, or editing) and user-password encryption (which prevents opening the file without a password). Owner-password restrictions can typically be removed without the password, while user-password encryption requires the correct password.",
	},
	{
		question: "Is the unlocked PDF identical to the original?",
		answer:
			"The content — text, images, layout, and page count — remains the same. The file size may differ slightly because the encryption metadata is stripped and the PDF is re-saved. Fonts, annotations, and form fields are preserved.",
	},
];

export default function UnlockPdfPage() {
	return (
		<ToolPageLayout
			title="Unlock PDF"
			description="Remove password protection from a PDF — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<PdfUnlockTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This tool strips password protection from PDF files so you can print,
					copy, and edit them without restrictions. It handles both
					owner-password restrictions (print/copy locks) and user-password
					encryption when you provide the correct password. Everything runs
					locally in your browser using pdf-lib — your documents are never sent
					to any server, making it safe for confidential files.
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
