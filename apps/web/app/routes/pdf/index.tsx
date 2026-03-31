import { Link } from "react-router";
import { PrivacyBanner } from "~/components/layout/privacy-banner";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { ToolIcon } from "~/components/marketing/tool-icon";
import { buildMeta, SITE_URL } from "~/lib/seo/meta";
import { gridTools } from "~/lib/tools";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"PDF Tools — Free Online PDF Split, Merge, Rotate & More | NoUploads",
		description:
			"Free online PDF tools that run in your browser. Split, merge, rotate, watermark, compress, and extract text from PDFs. No upload, no signup.",
		path: "/pdf",
		keywords:
			"pdf tools online, free pdf converter, merge pdf online, split pdf online, rotate pdf, pdf watermark, pdf to text, compress pdf online, pdf editor no upload, private pdf tools",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "PDF Tools — NoUploads",
				url: `${SITE_URL}/pdf`,
				description:
					"Free online PDF tools that run in your browser. Split, merge, rotate, watermark, compress, and extract text from PDFs. No upload, no signup.",
				isPartOf: {
					"@type": "WebSite",
					name: "NoUploads",
					url: SITE_URL,
				},
			},
		],
	});
}

const pdfTools = gridTools.filter((t) => t.href.startsWith("/pdf/"));

const conversionLinks = [
	{ href: "/pdf/pdf-to-jpg", label: "PDF → JPG" },
	{ href: "/pdf/pdf-to-png", label: "PDF → PNG" },
	{ href: "/pdf/pdf-to-text", label: "PDF → Text" },
];

const editingLinks = [
	{ href: "/pdf/reorder", label: "Reorder Pages" },
	{ href: "/pdf/page-numbers", label: "Add Page Numbers" },
	{ href: "/pdf/watermark", label: "Add Watermark" },
	{ href: "/pdf/protect", label: "Password Protect" },
	{ href: "/pdf/unlock", label: "Remove Password" },
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

export default function PdfCategoryPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
				<div className="mb-6">
					<PrivacyBanner />
				</div>

				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight mb-3">PDF Tools</h1>
					<p className="text-muted-foreground max-w-2xl">
						Split, merge, rotate, watermark, compress, and extract text from PDF
						files directly in your browser. Every operation runs locally — your
						documents are never uploaded to any server. All tools are free,
						unlimited, and work offline after the first page load.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{pdfTools.map((tool) => {
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
							Quick links to PDF format conversion tools.
						</p>
						<PillLinks links={conversionLinks} />
					</div>

					<div>
						<h2 className="text-xl font-semibold mb-3">Editing & Security</h2>
						<p className="text-sm text-muted-foreground mb-4">
							Add page numbers, watermarks, or manage password protection.
						</p>
						<PillLinks links={editingLinks} />
					</div>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
