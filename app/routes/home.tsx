import { CircleCheck, Lock, Power } from "lucide-react";
import { Link } from "react-router";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import ToolFilter from "~/components/marketing/tool-filter";
import { buildMeta } from "~/lib/seo/meta";
import { gridTools } from "~/lib/tools";
import type { Route } from "./+types/home";

const issuesUrl = import.meta.env.VITE_GITHUB_URL
	? `${import.meta.env.VITE_GITHUB_URL}/issues`
	: "https://github.com/nouploads/nouploads/issues";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "NoUploads — Free Online File Tools | Private & No Upload Required",
		description:
			"Free online file tools that run 100% in your browser. Convert, compress, and resize images with no upload, no signup, no servers. Open source and works offline.",
		path: "/",
		keywords:
			"online file tools, free image converter, compress image online, privacy file tools, no upload file converter, client-side file tools, browser-based file tools, open source file tools, offline file tools, NoUploads",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "NoUploads",
				url: "https://nouploads.com",
				description:
					"Free online file tools that run 100% in your browser. Convert, compress, and resize images with no upload, no signup, no servers. Open source and works offline.",
				potentialAction: {
					"@type": "SearchAction",
					target: "https://nouploads.com/?q={search_term_string}",
					"query-input": "required name=search_term_string",
				},
				creator: {
					"@type": "Organization",
					name: "NoUploads",
					url: "https://nouploads.com",
				},
			},
			{
				"@context": "https://schema.org",
				"@type": "Organization",
				name: "NoUploads",
				url: "https://nouploads.com",
				logo: "https://nouploads.com/favicon.svg",
				sameAs: ["https://github.com/nouploads/nouploads"],
			},
		],
	});
}

export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4">
				{/* Hero */}
				<section className="py-16 md:py-24 text-center">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
						Privacy-first file tools.
						<br />
						<span className="text-primary">
							Everything runs in your browser.
						</span>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
						Other tools upload your files to someone else&rsquo;s server &mdash;
						<br className="hidden sm:inline" />
						your personal photos, work documents, private files.
						<br />
						We don&rsquo;t. Your files never leave your device.
					</p>
					<div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<Lock className="h-4 w-4 text-primary" />
							No uploads
						</span>
						<span className="text-border">|</span>
						<span className="flex items-center gap-1.5">
							<CircleCheck className="h-4 w-4 text-primary" />
							Free &amp; open source
						</span>
						<span className="text-border">|</span>
						<span className="flex items-center gap-1.5">
							<Power className="h-4 w-4 text-primary" />
							Works offline
						</span>
					</div>
				</section>

				{/* Tool Grid with Filter */}
				<section className="pb-16">
					<ToolFilter tools={gridTools} issuesUrl={issuesUrl} />
				</section>

				{/* How it works */}
				<section className="pb-16 max-w-3xl mx-auto">
					<h2 className="text-2xl font-bold mb-6 text-center">How it works</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
						<div>
							<div className="text-3xl mb-2">1</div>
							<h3 className="font-semibold mb-1">Choose a tool</h3>
							<p className="text-sm text-muted-foreground">
								Pick from our growing collection of file conversion and
								manipulation tools.
							</p>
						</div>
						<div>
							<div className="text-3xl mb-2">2</div>
							<h3 className="font-semibold mb-1">Drop your files</h3>
							<p className="text-sm text-muted-foreground">
								Drag and drop your files. Nothing leaves your device. Ever.
							</p>
						</div>
						<div>
							<div className="text-3xl mb-2">3</div>
							<h3 className="font-semibold mb-1">Download results</h3>
							<p className="text-sm text-muted-foreground">
								Processing happens instantly in your browser. Download the
								result when it&rsquo;s done.
							</p>
						</div>
					</div>
				</section>

				{/* Verify */}
				<section className="pb-16 max-w-2xl mx-auto">
					<div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
						<h2 className="text-xl font-bold mb-2">
							Don&rsquo;t trust us? Verify yourself.
						</h2>
						<p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
							Open your browser&rsquo;s Network tab (F12 &rarr; Network) while
							using any tool. You&rsquo;ll see zero file uploads. Or turn on
							airplane mode after the page loads &mdash; everything still works.
						</p>
						<Link
							to="/about"
							className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							Learn more &rarr;
						</Link>
					</div>
				</section>
			</main>
			<SiteFooter />
		</>
	);
}
