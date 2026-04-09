export const SITE_URL =
	import.meta.env.VITE_SITE_URL || "https://nouploads.com";
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || "NoUploads";
export const GITHUB_URL =
	import.meta.env.VITE_GITHUB_URL || "https://github.com/nouploads/nouploads";

/** Human-readable names for URL category segments. */
const CATEGORY_LABELS: Record<string, string> = {
	image: "Image Tools",
	pdf: "PDF Tools",
	developer: "Developer Tools",
	vector: "Vector Tools",
	about: "About",
	privacy: "Privacy",
	"self-hosting": "Self-Hosting",
};

/**
 * Build BreadcrumbList JSON-LD from a URL path.
 * e.g. "/image/heic-to-jpg" → Home > Image Tools > HEIC to JPG
 */
function buildBreadcrumbs(
	path: string,
	title: string,
): Record<string, unknown> | null {
	if (path === "/") return null;

	const segments = path.split("/").filter(Boolean);
	const items: Record<string, unknown>[] = [
		{
			"@type": "ListItem",
			position: 1,
			name: "Home",
			item: SITE_URL,
		},
	];

	if (segments.length >= 1) {
		const category = segments[0];
		const categoryLabel = CATEGORY_LABELS[category] ?? category;
		if (segments.length === 1) {
			// Category page itself — no item URL on last element
			items.push({
				"@type": "ListItem",
				position: 2,
				name: categoryLabel,
			});
		} else {
			items.push({
				"@type": "ListItem",
				position: 2,
				name: categoryLabel,
				item: `${SITE_URL}/${category}`,
			});
			// Tool page — derive name from title (strip modifiers/brand suffix)
			const toolName =
				title
					.replace(/\s+Online\b.*$/, "")
					.replace(/\s+—.*$/, "")
					.replace(/\s+\|.*$/, "")
					.trim() || title;
			items.push({
				"@type": "ListItem",
				position: 3,
				name: toolName,
			});
		}
	}

	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items,
	};
}

interface MetaOptions {
	title: string;
	description: string;
	path: string;
	ogImage?: string;
	keywords?: string;
	/** Display name for JSON-LD WebApplication, e.g. "HEIC to JPG Converter" */
	jsonLdName?: string;
	/** Additional JSON-LD blocks to include (for non-WebApplication schemas) */
	jsonLd?: Record<string, unknown>[];
	/** Plain-text FAQ pairs for FAQPage JSON-LD structured data */
	faq?: Array<{ question: string; answer: string }>;
}

export function buildMeta(opts: MetaOptions) {
	const canonical = `${SITE_URL}${opts.path}`;
	const slug =
		opts.path === "/"
			? "home"
			: opts.path.replace(/^\//, "").replace(/\//g, "-");
	const ogImage = opts.ogImage
		? `${SITE_URL}${opts.ogImage}`
		: `${SITE_URL}/og/${slug}.png`;

	const meta: Record<string, unknown>[] = [
		{ title: opts.title },
		{ name: "description", content: opts.description },
		{ property: "og:type", content: "website" },
		{ property: "og:title", content: opts.title },
		{ property: "og:description", content: opts.description },
		{ property: "og:url", content: canonical },
		{ property: "og:site_name", content: SITE_NAME },
		{ property: "og:image", content: ogImage },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: opts.title },
		{ name: "twitter:description", content: opts.description },
		{ name: "twitter:image", content: ogImage },
		{ tagName: "link", rel: "canonical", href: canonical },
	];

	if (opts.keywords) {
		meta.push({ name: "keywords", content: opts.keywords });
	}

	if (opts.jsonLdName) {
		meta.push({
			"script:ld+json": {
				"@context": "https://schema.org",
				"@type": "WebApplication",
				name: `${opts.jsonLdName} — ${SITE_NAME}`,
				url: canonical,
				description: opts.description,
				applicationCategory: "UtilitiesApplication",
				operatingSystem: "Any",
				offers: {
					"@type": "Offer",
					price: "0",
					priceCurrency: "USD",
				},
				creator: {
					"@type": "Organization",
					name: SITE_NAME,
					url: SITE_URL,
				},
				browserRequirements:
					"Requires a modern web browser with JavaScript and WebAssembly support",
				permissions: "none",
			},
		});
	}

	if (opts.faq?.length) {
		meta.push({
			"script:ld+json": {
				"@context": "https://schema.org",
				"@type": "FAQPage",
				mainEntity: opts.faq.map((item) => ({
					"@type": "Question",
					name: item.question,
					acceptedAnswer: {
						"@type": "Answer",
						text: item.answer,
					},
				})),
			},
		});
	}

	if (opts.jsonLd) {
		for (const block of opts.jsonLd) {
			meta.push({ "script:ld+json": block });
		}
	}

	// Auto-generate BreadcrumbList JSON-LD from path
	const breadcrumbs = buildBreadcrumbs(opts.path, opts.title);
	if (breadcrumbs) {
		meta.push({ "script:ld+json": breadcrumbs });
	}

	return meta;
}
