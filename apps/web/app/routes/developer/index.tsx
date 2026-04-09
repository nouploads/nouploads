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
		title: "Developer Tools — Free, No Upload | NoUploads",
		description:
			"Free browser-based developer tools — JSON formatter, color picker, hash generator, regex tester, and more. No data leaves your device. Works offline, no signup.",
		path: "/developer",
		keywords:
			"developer tools online, free color picker, json formatter, hash generator, jwt decoder, code formatter, online dev tools, private developer tools, browser-based dev tools",
		jsonLd: [
			{
				"@context": "https://schema.org",
				"@type": "CollectionPage",
				name: "Developer Tools — NoUploads",
				url: `${SITE_URL}/developer`,
				description:
					"Free browser-based developer utilities. Color picker, JSON formatter, hash generator, JWT decoder, and more — no upload, no signup, works offline.",
				isPartOf: {
					"@type": "WebSite",
					name: "NoUploads",
					url: SITE_URL,
				},
			},
		],
	});
}

const devTools = gridTools.filter((t) => t.href.startsWith("/developer/"));

const quickLinks = [
	{ href: "/developer/regex-tester", label: "Regex Tester" },
	{ href: "/developer/timestamp-converter", label: "Timestamp Converter" },
	{ href: "/developer/uuid-generator", label: "UUID Generator" },
	{ href: "/developer/url-encoder", label: "URL Encoder" },
	{ href: "/developer/text-diff", label: "Text Diff" },
	{ href: "/developer/markdown-preview", label: "Markdown Preview" },
	{ href: "/developer/word-counter", label: "Word Counter" },
	{ href: "/developer/css-formatter", label: "CSS Formatter" },
	{ href: "/developer/case-converter", label: "Case Converter" },
	{ href: "/developer/cron-parser", label: "CRON Parser" },
	{ href: "/developer/json-csv", label: "JSON ↔ CSV" },
	{ href: "/developer/yaml-json", label: "YAML ↔ JSON" },
	{ href: "/developer/lorem-ipsum", label: "Lorem Ipsum" },
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

export default function DeveloperCategoryPage() {
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
						Developer Tools
					</h1>
					<p className="text-muted-foreground max-w-2xl">
						Handy utilities for developers and designers that run entirely in
						your browser. Pick colors, format JSON, generate hashes, decode
						JWTs, test regex, convert timestamps, and more — without sending
						anything to a server.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{devTools.map((tool) => {
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
						<h2 className="text-xl font-semibold mb-3">Quick Links</h2>
						<p className="text-sm text-muted-foreground mb-4">
							Jump straight to a tool.
						</p>
						<PillLinks links={quickLinks} />
					</div>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
