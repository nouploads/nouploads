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
import type { Route } from "./+types/hash-generator";

const HashGeneratorTool = lazy(
	() => import("~/features/developer-tools/components/hash-generator-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Hash Generator Online — Free, Instant | NoUploads",
		description:
			"Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files in your browser — free, using the Web Crypto API. No data sent to any server.",
		path: "/developer/hash-generator",
		keywords:
			"hash generator, md5 hash, sha256 hash, sha512 hash, sha1 hash, file hash checker, checksum generator, online hash tool",
		jsonLdName: "Hash Generator",
		faq: [
			{
				question: "What's the story behind the SHA-2 family?",
				answer:
					"A cryptographic hash function produces a fixed-size fingerprint from any input, designed so that even changing a single bit produces a completely different output — a property called the avalanche effect. SHA-256, designed by the NSA and published by NIST in 2001 as part of the SHA-2 family, generates a 256-bit digest that is computationally infeasible to reverse or forge, making it a cornerstone of digital signatures, password storage, and blockchain systems.",
			},
			{
				question: "Which hash algorithm should I use?",
				answer:
					"For file integrity checks and general-purpose hashing, SHA-256 is the standard choice — it's fast, widely supported, and considered secure. SHA-512 offers a wider output for applications that need it. SHA-1 and MD5 are included for compatibility with legacy systems, but both have known collision vulnerabilities and should not be used for security-sensitive purposes.",
			},
			{
				question: "Is MD5 still safe to use?",
				answer:
					"MD5 is cryptographically broken — researchers can generate two different inputs that produce the same MD5 hash. It should never be used for password hashing, digital signatures, or certificate verification. However, MD5 is still commonly used as a quick checksum to verify file transfers, where collision resistance is not a concern. This tool includes MD5 because many download sites still publish MD5 checksums.",
			},
			{
				question: "Can I hash large files?",
				answer:
					"Yes. The tool reads the entire file into memory and computes all five hashes in parallel using the Web Crypto API. Files up to several hundred megabytes work on most devices. Very large files (1 GB+) may cause browser memory pressure on mobile devices or older hardware.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What's the story behind the SHA-2 family?",
		answer: (
			<>
				A cryptographic hash function produces a fixed-size fingerprint from any
				input, designed so that even changing a single bit produces a completely
				different output — a property called the avalanche effect. SHA-256,
				designed by the NSA and published by NIST in 2001 as part of the SHA-2
				family, generates a 256-bit digest that is computationally infeasible to
				reverse or forge, making it a cornerstone of digital signatures,
				password storage, and blockchain systems. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/SHA-2"
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
		question: "Which hash algorithm should I use?",
		answer:
			"For file integrity checks and general-purpose hashing, SHA-256 is the standard choice — it's fast, widely supported, and considered secure. SHA-512 offers a wider output for applications that need it. SHA-1 and MD5 are included for compatibility with legacy systems, but both have known collision vulnerabilities and should not be used for security-sensitive purposes.",
	},
	{
		question: "Is MD5 still safe to use?",
		answer:
			"MD5 is cryptographically broken — researchers can generate two different inputs that produce the same MD5 hash. It should never be used for password hashing, digital signatures, or certificate verification. However, MD5 is still commonly used as a quick checksum to verify file transfers, where collision resistance is not a concern. This tool includes MD5 because many download sites still publish MD5 checksums.",
	},
	{
		question: "Can I hash large files?",
		answer:
			"Yes. The tool reads the entire file into memory and computes all five hashes in parallel using the Web Crypto API. Files up to several hundred megabytes work on most devices. Very large files (1 GB+) may cause browser memory pressure on mobile devices or older hardware.",
	},
];

export default function HashGeneratorPage() {
	return (
		<ToolPageLayout
			title="Hash Generator"
			description="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<HashGeneratorTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The Hash Generator computes MD5, SHA-1, SHA-256, SHA-384, and SHA-512
					digests from any text input or uploaded file. Useful for verifying
					file downloads against published checksums, comparing content without
					revealing it, or generating deterministic identifiers. All hashing
					runs client-side via the Web Crypto API — your data never leaves the
					browser, and no external libraries are loaded.
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
					href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest"
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
