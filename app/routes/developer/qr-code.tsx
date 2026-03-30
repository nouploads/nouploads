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
import type { Route } from "./+types/qr-code";

const QrCodeTool = lazy(
	() => import("~/features/developer-tools/components/qr-code-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "QR Code Generator Online — Free, Private, No Upload | NoUploads",
		description:
			"Generate QR codes from any text or URL. Customize size, colors, error correction. Download as PNG or SVG. Free and private.",
		path: "/developer/qr-code",
		keywords:
			"qr code generator, create qr code, qr code maker, free qr code, qr code online, custom qr code, qr code png svg",
		jsonLdName: "QR Code Generator",
	});
}

const faqItems = [
	{
		question: "What data can I encode in a QR code?",
		answer:
			"You can encode virtually any text: URLs, email addresses, phone numbers, Wi-Fi credentials, plain text messages, vCard contact info, or even JSON payloads. QR codes support up to about 4,296 alphanumeric characters, though shorter content produces simpler codes that scan more reliably.",
	},
	{
		question: "What error correction level should I use?",
		answer:
			"Medium (M) works well for most uses — it recovers up to 15% of damaged data. Choose Low (L) when you need the smallest possible QR code for clean digital display. Use Quartile (Q) or High (H) if the code will be printed on packaging, stickers, or surfaces where scratching and wear are likely. Higher correction increases the code density but makes it more resilient.",
	},
	{
		question: "What's the maximum content length for a QR code?",
		answer:
			"The QR specification supports up to 7,089 numeric digits or 4,296 alphanumeric characters. This generator uses the 4,296 alphanumeric limit. In practice, shorter content is better — a 50-character URL produces a code that scans instantly from a distance, while a 4,000-character payload needs a larger print size and ideal lighting.",
	},
	{
		question: "Should I download PNG or SVG?",
		answer:
			"SVG is ideal for print materials — it scales to any size without pixelation and produces smaller files. PNG is better for digital use: social media posts, emails, websites, and messaging apps that don't support SVG. If you plan to put the QR code on a billboard or large poster, use SVG. For a quick share on Slack or WhatsApp, PNG is simpler.",
	},
	{
		question: "Why use NoUploads instead of other QR code generators?",
		answer:
			"Your text never leaves your device. Most QR generators send your content to a server to render the image — meaning the service sees every URL, credential, and message you encode. NoUploads generates the code entirely in your browser using client-side JavaScript. There is no upload, no server processing, no tracking, and no account required. It works offline after the first load, the source code is open, and there are no limits on how many codes you generate.",
	},
];

export default function QrCodePage() {
	return (
		<ToolPageLayout
			title="QR Code Generator"
			description="Generate QR codes from any text or URL with custom colors, sizes, and error correction — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<QrCodeTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This QR code generator runs entirely in your browser — your text and
					URLs never leave your device. Paste any content up to 4,296 characters
					and get an instant preview that updates as you type. Customize
					foreground and background colors to match your brand, pick from five
					output sizes, and choose an error correction level from 7% to 30%
					damage recovery. Download the result as a crisp PNG for digital
					sharing or a resolution-independent SVG for print. No signup, no
					watermarks, no daily limits.
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
					href="https://github.com/soldair/node-qrcode"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					qrcode
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
