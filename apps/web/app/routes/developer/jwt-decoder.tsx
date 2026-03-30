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
import type { Route } from "./+types/jwt-decoder";

const JwtDecoderTool = lazy(
	() => import("~/features/developer-tools/components/jwt-decoder-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "JWT Decoder Online — Free, Private, No Upload | NoUploads",
		description:
			"Decode JWT tokens and inspect header, payload, and expiration status. Free, private, runs in your browser.",
		path: "/developer/jwt-decoder",
		keywords:
			"jwt decoder, jwt debugger, decode jwt token, jwt viewer, jwt online, json web token decoder, jwt inspector",
		jsonLdName: "JWT Decoder",
	});
}

const faqItems = [
	{
		question: "What is a JWT token?",
		answer:
			"A JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information between parties as a compact, URL-safe JSON object. It consists of three parts separated by dots: a header (algorithm and token type), a payload (claims like user ID and expiration), and a cryptographic signature. JWTs are widely used for authentication and authorization in web applications.",
	},
	{
		question: "Can this tool verify JWT signatures?",
		answer:
			"This tool decodes and displays the token contents but does not verify the cryptographic signature. Signature verification requires the secret key or public key used to sign the token, which should never be shared in a browser tool. Use this decoder to inspect token structure, check claims, and debug expiration issues — then verify signatures on your backend.",
	},
	{
		question: "Is it safe to paste my JWT token here?",
		answer:
			"Yes. This tool runs entirely in your browser — the token never leaves your device. There is no server request, no logging, and no storage. The decoding happens with the browser's built-in base64 API (atob). You can verify this by disconnecting from the internet and using the tool offline.",
	},
	{
		question: "What do the exp, iat, and sub claims mean?",
		answer:
			"These are standard JWT claims defined in RFC 7519. 'exp' (expiration time) is a Unix timestamp after which the token should be rejected. 'iat' (issued at) records when the token was created. 'sub' (subject) identifies the principal — typically a user ID. This tool automatically checks the exp claim and shows whether the token is still valid or has expired.",
	},
	{
		question: "Why use NoUploads instead of other JWT decoder tools?",
		answer:
			"Most JWT decoders send your token to a server for processing — that means your authentication credentials pass through third-party infrastructure. NoUploads decodes entirely in your browser using JavaScript's built-in atob function. No network requests, no server logs, no cookies, no tracking. The source code is open for inspection, it works offline, and there are no limits or signups required.",
	},
];

export default function JwtDecoderPage() {
	return (
		<ToolPageLayout
			title="JWT Decoder"
			description="Decode and inspect JSON Web Tokens — view header, payload, and expiration status — free, private, no upload required."
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<JwtDecoderTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					Paste any JWT token and instantly see its decoded header, payload, and
					signature. The decoder checks the exp claim and shows whether the
					token is currently valid or expired, so you can quickly debug
					authentication issues. Everything runs client-side using the browser's
					built-in Base64 decoding — your tokens never leave your device. Useful
					for developers working with OAuth, API authentication, or any system
					that uses JSON Web Tokens.
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
					href="https://developer.mozilla.org/en-US/docs/Web/API/Window/atob"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					Base64 decoding API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
