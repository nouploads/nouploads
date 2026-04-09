import { useState } from "react";
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
		title: "Image Tools — Free, No Upload | NoUploads",
		description:
			"Free browser-based image tools — convert, compress, and resize JPG, PNG, WebP, AVIF, and HEIC. No files leave your device. Batch processing with no size limits.",
		path: "/image",
		keywords:
			"image tools online, free image converter, compress image online, resize image online, image editor no upload, private image tools, batch image converter",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "Image Tools — NoUploads",
				url: `${SITE_URL}/image`,
				description:
					"Free online image tools that run in your browser. Convert, compress, resize images with no upload, no signup. Private, unlimited, works offline.",
				isPartOf: {
					"@type": "WebSite",
					name: "NoUploads",
					url: SITE_URL,
				},
			},
		],
	});
}

const imageTools = gridTools.filter((t) => t.href.startsWith("/image/"));

const conversionLinks = [
	{ href: "/image/heic-to-jpg", label: "HEIC → JPG" },
	{ href: "/image/heic-to-png", label: "HEIC → PNG" },
	{ href: "/image/heic-to-webp", label: "HEIC → WebP" },
	{ href: "/image/jpg-to-png", label: "JPG → PNG" },
	{ href: "/image/png-to-jpg", label: "PNG → JPG" },
	{ href: "/image/webp-to-jpg", label: "WebP → JPG" },
	{ href: "/image/webp-to-png", label: "WebP → PNG" },
	{ href: "/image/jpg-to-webp", label: "JPG → WebP" },
	{ href: "/image/png-to-webp", label: "PNG → WebP" },
	{ href: "/image/svg-to-png", label: "SVG → PNG" },
	{ href: "/image/svg-to-jpg", label: "SVG → JPG" },
	{ href: "/image/svg-to-webp", label: "SVG → WebP" },
	{ href: "/image/avif-to-jpg", label: "AVIF → JPG" },
	{ href: "/image/avif-to-png", label: "AVIF → PNG" },
	{ href: "/image/gif-to-jpg", label: "GIF → JPG" },
	{ href: "/image/gif-to-png", label: "GIF → PNG" },
	{ href: "/image/bmp-to-jpg", label: "BMP → JPG" },
	{ href: "/image/bmp-to-png", label: "BMP → PNG" },
	{ href: "/image/bmp-to-webp", label: "BMP → WebP" },
	{ href: "/image/tiff-to-jpg", label: "TIFF → JPG" },
	{ href: "/image/tiff-to-png", label: "TIFF → PNG" },
	{ href: "/image/ico-to-png", label: "ICO → PNG" },
	{ href: "/image/ico-to-webp", label: "ICO → WebP" },
	{ href: "/image/jxl-to-jpg", label: "JXL → JPG" },
	{ href: "/image/jxl-to-png", label: "JXL → PNG" },
];

const nicheFormatLinks = [
	{
		href: "/image/raw-converter",
		label: "Camera RAW",
		desc: "CR2, NEF, ARW, DNG & 20+ formats",
	},
	{ href: "/image/psd-converter", label: "PSD", desc: "Adobe Photoshop" },
	{
		href: "/image/psb-converter",
		label: "PSB",
		desc: "Photoshop Large Document",
	},
	{ href: "/image/exr-converter", label: "EXR", desc: "OpenEXR (VFX/3D)" },
	{ href: "/image/hdr-converter", label: "HDR", desc: "Radiance HDR" },
	{
		href: "/image/dcm-converter",
		label: "DICOM",
		desc: "Medical imaging (DCM)",
	},
	{
		href: "/image/fits-converter",
		label: "FITS",
		desc: "Astronomy images",
	},
	{ href: "/image/tga-converter", label: "TGA", desc: "Targa textures" },
	{
		href: "/image/dds-converter",
		label: "DDS",
		desc: "DirectX game textures",
	},
	{ href: "/image/pcx-converter", label: "PCX", desc: "Legacy bitmap" },
	{
		href: "/image/netpbm-converter",
		label: "Netpbm",
		desc: "PBM, PGM, PPM, PNM, PAM, PFM",
	},
	{
		href: "/image/jp2-converter",
		label: "JP2",
		desc: "JPEG 2000 (JP2, J2K)",
	},
	{
		href: "/image/icns-converter",
		label: "ICNS",
		desc: "macOS App Icons",
	},
	{
		href: "/image/eps-converter",
		label: "EPS",
		desc: "Encapsulated PostScript",
	},
	{
		href: "/image/legacy-converter",
		label: "Legacy Formats",
		desc: "SGI, Sun Raster, WBMP, PCD, PICT, SFW",
	},
	{ href: "/image/xcf-converter", label: "XCF", desc: "GIMP project files" },
	{
		href: "/image/xwindow-converter",
		label: "X Window",
		desc: "XBM, XPM, XWD",
	},
	{
		href: "/image/ai-converter",
		label: "AI",
		desc: "Adobe Illustrator",
	},
	{
		href: "/image/xps-converter",
		label: "XPS",
		desc: "XML Paper Specification",
	},
	{ href: "/image/odg-converter", label: "ODG", desc: "OpenDocument Graphics" },
	{
		href: "/image/svgz-converter",
		label: "SVGZ",
		desc: "Compressed SVG",
	},
	{ href: "/image/cdr-converter", label: "CDR", desc: "CorelDRAW" },
	{
		href: "/image/vsd-converter",
		label: "Visio",
		desc: "VSD / VSDX diagrams",
	},
	{
		href: "/image/pub-converter",
		label: "PUB",
		desc: "Microsoft Publisher",
	},
	{
		href: "/image/emf-converter",
		label: "EMF",
		desc: "Enhanced Metafile",
	},
];

const compressionLinks = [
	{ href: "/image/compress-jpg", label: "Compress JPG" },
	{ href: "/image/compress-png", label: "Compress PNG" },
	{ href: "/image/compress-webp", label: "Compress WebP" },
	{ href: "/image/compress-gif", label: "Compress GIF" },
];

const editingLinks = [
	{ href: "/image/resize", label: "Resize" },
	{ href: "/image/crop", label: "Crop" },
	{ href: "/image/rotate", label: "Rotate & Flip" },
	{ href: "/image/filters", label: "Filters & Effects" },
	{ href: "/image/watermark", label: "Watermark" },
	{ href: "/image/remove-background", label: "Remove Background" },
	{ href: "/image/exif", label: "EXIF Viewer" },
	{ href: "/image/strip-metadata", label: "Strip Metadata" },
	{ href: "/image/color-palette", label: "Color Palette" },
	{ href: "/image/favicon-generator", label: "Favicon Generator" },
	{ href: "/image/to-pdf", label: "Images to PDF" },
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

function NicheFormatsSection() {
	const [open, setOpen] = useState(false);
	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 text-xl font-semibold mb-3 hover:text-primary transition-colors"
			>
				<span className="text-sm">{open ? "▼" : "▶"}</span>
				All Supported Formats (70+)
			</button>
			<p className="text-sm text-muted-foreground mb-4">
				Professional, scientific, and legacy format converters. All processing
				runs locally in your browser.
			</p>
			{open && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{nicheFormatLinks.map((item) => (
						<Link
							key={item.href}
							to={item.href}
							className="flex items-center justify-between rounded-md border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40"
						>
							<span className="font-medium">{item.label}</span>
							<span className="text-muted-foreground text-xs">{item.desc}</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

export default function ImageCategoryPage() {
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

					<div>
						<h2 className="text-xl font-semibold mb-3">Editing & Effects</h2>
						<p className="text-sm text-muted-foreground mb-4">
							Resize, crop, apply filters, add watermarks, and more.
						</p>
						<PillLinks links={editingLinks} />
					</div>

					<NicheFormatsSection />
				</div>

				<p className="text-sm text-muted-foreground mt-8">
					Looking for vector format conversion?{" "}
					<Link
						to="/vector"
						className="underline hover:text-foreground transition-colors"
					>
						Vector Tools
					</Link>
				</p>
			</main>
			<SiteFooter />
		</>
	);
}
