import {
	CircleCheck,
	Infinity as InfinityIcon,
	Lock,
	Power,
	Star,
} from "lucide-react";
import { Link } from "react-router";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { ToolIcon } from "~/components/marketing/tool-icon";
import type { Tool } from "~/lib/search";
import { buildMeta, GITHUB_URL, SITE_URL } from "~/lib/seo/meta";
import { gridTools } from "~/lib/tools";
import type { Route } from "./+types/home";

const popularTools = [
	{
		title: "HEIC to JPG",
		description: "Convert iPhone photos to JPG",
		href: "/image/heic-to-jpg",
	},
	{
		title: "Image Compress",
		description: "Reduce image file size",
		href: "/image/compress",
	},
	{
		title: "Merge PDF",
		description: "Combine multiple PDFs",
		href: "/pdf/merge",
	},
	{
		title: "PDF to JPG",
		description: "Convert PDF pages to images",
		href: "/pdf/pdf-to-jpg",
	},
	{
		title: "Image Resize",
		description: "Resize by pixels or percentage",
		href: "/image/resize",
	},
	{
		title: "PNG to JPG",
		description: "Convert PNG to compact JPG",
		href: "/image/png-to-jpg",
	},
];

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Free Online File Tools — No Upload, No Limits | NoUploads",
		description:
			"Free browser-based file tools — convert images, compress PDFs, and more with no upload, no signup, no file size limits. Open source and works offline.",
		path: "/",
		keywords:
			"online file tools, free image converter, compress image online, privacy file tools, no upload file converter, client-side file tools, browser-based file tools, open source file tools, offline file tools, NoUploads",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "NoUploads",
				url: SITE_URL,
				description:
					"Free online file tools that run 100% in your browser. Convert, compress, and resize images with no upload, no signup, no servers. Open source and works offline.",
				potentialAction: {
					"@type": "SearchAction",
					target: `${SITE_URL}/?q={search_term_string}`,
					"query-input": "required name=search_term_string",
				},
				creator: {
					"@type": "Organization",
					name: "NoUploads",
					url: SITE_URL,
				},
			},
			{
				"@context": "https://schema.org",
				"@type": "Organization",
				name: "NoUploads",
				url: SITE_URL,
				logo: `${SITE_URL}/favicon.svg`,
				sameAs: [GITHUB_URL],
			},
			{
				"@context": "https://schema.org",
				"@type": "SoftwareApplication",
				name: "NoUploads",
				url: SITE_URL,
				applicationCategory: "UtilitiesApplication",
				operatingSystem: "Any",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
				author: {
					"@type": "Organization",
					name: "NoUploads",
					url: SITE_URL,
				},
				license: "https://www.gnu.org/licenses/agpl-3.0.html",
				codeRepository: GITHUB_URL,
			},
		],
	});
}

function ToolCard({ tool }: { tool: Tool }) {
	const content = (
		<div className="flex items-start gap-3">
			<ToolIcon
				icon={tool.icon}
				iconColor={tool.iconColor}
				iconBg={tool.iconBg}
			/>
			<div className="min-w-0">
				<h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
					{tool.title}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
			</div>
		</div>
	);

	return (
		<Link
			to={tool.href}
			className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
		>
			{content}
		</Link>
	);
}

function groupByCategory(tools: Tool[]) {
	const groups: { name: string; href: string; tools: Tool[] }[] = [];
	const seen = new Map<string, number>();

	for (const tool of tools) {
		const cat = tool.category ?? "Other";
		const catHref = tool.categoryHref ?? "/";
		const idx = seen.get(cat);
		if (idx !== undefined) {
			groups[idx].tools.push(tool);
		} else {
			seen.set(cat, groups.length);
			groups.push({ name: cat, href: catHref, tools: [tool] });
		}
	}
	return groups;
}

const groups = groupByCategory(gridTools);

export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4">
				{/* Hero */}
				<section className="py-16 md:py-24 text-center">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
						Free Online File Tools
						<br />
						<span className="text-primary">No Upload Required</span>
					</h1>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
						Convert, compress, and edit files entirely in your browser.
						<br className="hidden sm:inline" />
						No upload, no signup, no file size limits.
						<br />
						Open source and works offline.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
						<span className="flex items-center gap-1.5">
							<Lock className="h-4 w-4 text-primary" />
							No uploads
						</span>
						<span className="text-border">|</span>
						<span className="flex items-center gap-1.5">
							<InfinityIcon className="h-4 w-4 text-primary" />
							No limits*
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
					<p className="text-xs text-muted-foreground/60 mt-2">
						*Limited only by your device&rsquo;s memory
					</p>
				</section>

				{/* Popular Tools */}
				<section className="pb-16">
					<h2 className="text-2xl font-bold mb-6">Popular Tools</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{popularTools.map((tool) => (
							<Link
								key={tool.href}
								to={tool.href}
								className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
							>
								<h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
									{tool.title}
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{tool.description}
								</p>
							</Link>
						))}
					</div>
				</section>

				{/* Tool Grid */}
				<section className="pb-16">
					<div className="space-y-10">
						{groups.map((group) => (
							<div key={group.name}>
								<h2 className="text-2xl font-bold mb-6">
									<Link
										to={group.href}
										className="hover:text-primary transition-colors"
									>
										{group.name}
									</Link>
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{group.tools.map((tool) => (
										<ToolCard key={tool.href} tool={tool} />
									))}
								</div>
							</div>
						))}
					</div>
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

				{/* Open Source */}
				<section className="pb-16 max-w-2xl mx-auto text-center">
					<h2 className="text-xl font-bold mb-3">
						Open Source &amp; Self-Hostable
					</h2>
					<p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
						NoUploads is open source under AGPL-3.0. Inspect every line of code
						on GitHub, self-host with Docker, or build from source for
						air-gapped networks and compliance requirements.
					</p>
					<div className="flex items-center justify-center gap-4">
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener"
							className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary/40 hover:text-foreground transition-colors text-muted-foreground"
						>
							<Star className="h-4 w-4" />
							Star on GitHub
						</a>
						<Link
							to="/self-hosting"
							className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							Self-hosting guide &rarr;
						</Link>
					</div>
				</section>
			</main>
			<SiteFooter />
		</>
	);
}
