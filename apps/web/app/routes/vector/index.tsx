import { Link } from "react-router";
import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import { PrivacyBanner } from "~/components/layout/privacy-banner";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { ToolIcon } from "~/components/marketing/tool-icon";
import { buildMeta, SITE_URL } from "~/lib/seo/meta";
import { gridTools } from "~/lib/tools";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Vector Tools — Free Online SVG Optimizer | NoUploads",
		description:
			"Free browser-based vector tools for SVG optimization and format conversion. Minify, compress to SVGZ, and clean up design tool exports — no upload needed.",
		path: "/vector",
		keywords:
			"vector tools online, free svg converter, svg to png, vector to raster, svg optimizer, private vector tools, browser-based vector converter",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "Vector Tools — NoUploads",
				url: `${SITE_URL}/vector`,
				description:
					"Free online vector tools that run in your browser. Convert, optimize, and rasterize SVG and other vector formats with no upload, no signup.",
				isPartOf: {
					"@type": "WebSite",
					name: "NoUploads",
					url: SITE_URL,
				},
			},
		],
	});
}

const vectorTools = gridTools.filter((t) => t.href.startsWith("/vector/"));

export default function VectorCategoryPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
				<Breadcrumbs />

				<div className="mb-6">
					<PrivacyBanner />
				</div>

				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight mb-3">
						Vector Tools
					</h1>
					<p className="text-muted-foreground max-w-2xl">
						Free online vector tools that run entirely in your browser. Convert
						vector formats like SVG, AI, EMF, and WMF to raster images or
						optimize them for the web — without uploading anything to a server.
						All tools are free, unlimited, and work offline.
					</p>
				</div>

				{vectorTools.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{vectorTools.map((tool) => {
							const content = (
								<div className="flex items-start gap-3">
									<ToolIcon
										icon={tool.icon}
										iconColor={tool.iconColor}
										iconBg={tool.iconBg}
									/>
									<div className="min-w-0">
										<h2 className="font-semibold text-card-foreground group-hover:text-primary transition-colors flex items-center gap-2">
											{tool.title}
											{tool.comingSoon && (
												<span className="text-xs font-normal bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
													Soon
												</span>
											)}
										</h2>
										<p className="text-sm text-muted-foreground mt-1">
											{tool.description}
										</p>
									</div>
								</div>
							);

							if (tool.comingSoon) {
								return (
									<div
										key={tool.href}
										className="group block rounded-lg border bg-card p-5 opacity-60 cursor-default"
									>
										{content}
									</div>
								);
							}

							return (
								<Link
									key={tool.href}
									to={tool.href}
									className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
								>
									{content}
								</Link>
							);
						})}
					</div>
				) : (
					<div className="rounded-lg border bg-card p-8 text-center">
						<p className="text-muted-foreground">
							Vector tools are coming soon. Check back shortly for SVG
							conversion, optimization, and more.
						</p>
					</div>
				)}

				<p className="text-sm text-muted-foreground mt-8">
					Need raster image tools?{" "}
					<Link
						to="/image"
						className="underline hover:text-foreground transition-colors"
					>
						Image Tools
					</Link>
				</p>
			</main>
			<SiteFooter />
		</>
	);
}
