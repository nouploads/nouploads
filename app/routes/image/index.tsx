import { Link } from "react-router";
import { PrivacyBanner } from "~/components/layout/privacy-banner";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { ToolIcon } from "~/components/marketing/tool-icon";
import { buildMeta } from "~/lib/seo/meta";
import { gridTools } from "~/lib/tools";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Image Tools — Free Online Image Converter, Compressor & More | NoUploads",
		description:
			"Free online image tools that run in your browser. Convert, compress, resize images with no upload, no signup. Private, unlimited, works offline.",
		path: "/image",
		keywords:
			"image tools online, free image converter, compress image online, resize image online, image editor no upload, private image tools, batch image converter",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "Image Tools — NoUploads",
				url: "https://nouploads.com/image",
				description:
					"Free online image tools that run in your browser. Convert, compress, resize images with no upload, no signup. Private, unlimited, works offline.",
				isPartOf: {
					"@type": "WebSite",
					name: "NoUploads",
					url: "https://nouploads.com",
				},
			},
		],
	});
}

const imageTools = gridTools.filter((t) => t.href.startsWith("/image/"));

const conversionLinks = [
	{ href: "/image/heic-to-jpg", label: "HEIC → JPG" },
	{ href: "/image/jpg-to-png", label: "JPG → PNG" },
	{ href: "/image/png-to-jpg", label: "PNG → JPG" },
	{ href: "/image/webp-to-jpg", label: "WebP → JPG" },
	{ href: "/image/webp-to-png", label: "WebP → PNG" },
	{ href: "/image/jpg-to-webp", label: "JPG → WebP" },
	{ href: "/image/png-to-webp", label: "PNG → WebP" },
	{ href: "/image/svg-to-png", label: "SVG → PNG" },
	{ href: "/image/avif-to-jpg", label: "AVIF → JPG" },
	{ href: "/image/avif-to-png", label: "AVIF → PNG" },
	{ href: "/image/gif-to-jpg", label: "GIF → JPG" },
];

const compressionLinks = [
	{ href: "/image/compress-jpg", label: "Compress JPG" },
	{ href: "/image/compress-png", label: "Compress PNG" },
	{ href: "/image/compress-webp", label: "Compress WebP" },
	{ href: "/image/compress-gif", label: "Compress GIF" },
];

function PillLinks({ links }: { links: { href: string; label: string }[] }) {
	return (
		<div className="flex flex-wrap gap-2">
			{links.map((link) => (
				<Link
					key={link.href}
					to={link.href}
					className="inline-flex items-center rounded-md border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
				>
					{link.label}
				</Link>
			))}
		</div>
	);
}

export default function ImageCategoryPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
				<div className="mb-6">
					<PrivacyBanner />
				</div>

				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight mb-3">
						Image Tools
					</h1>
					<p className="text-muted-foreground max-w-2xl">
						Free online image tools that run entirely in your browser. Convert,
						compress, resize, and edit images without uploading files to any
						server. All tools are free, unlimited, and work offline.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{imageTools.map((tool) => {
						const content = (
							<div className="flex items-start gap-3">
								<ToolIcon
									icon={tool.icon}
									iconColor={tool.iconColor}
									iconBg={tool.iconBg}
								/>
								<div className="min-w-0">
									<h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors flex items-center gap-2">
										{tool.title}
										{tool.comingSoon && (
											<span className="text-xs font-normal bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
												Soon
											</span>
										)}
									</h3>
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

				<div className="mt-12 space-y-8">
					<div>
						<h2 className="text-xl font-semibold mb-3">Popular Conversions</h2>
						<p className="text-sm text-muted-foreground mb-4">
							Quick links to common format conversion pairs.
						</p>
						<PillLinks links={conversionLinks} />
					</div>

					<div>
						<h2 className="text-xl font-semibold mb-3">Popular Compressions</h2>
						<p className="text-sm text-muted-foreground mb-4">
							Format-specific compression with optimized settings.
						</p>
						<PillLinks links={compressionLinks} />
					</div>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
