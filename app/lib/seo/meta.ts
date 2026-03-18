const SITE_URL = import.meta.env.VITE_SITE_URL || "https://nouploads.com";
const SITE_NAME = import.meta.env.VITE_SITE_NAME || "NoUploads";

interface MetaOptions {
	title: string;
	description: string;
	path: string;
	ogImage?: string;
}

export function buildMeta(opts: MetaOptions) {
	const canonical = `${SITE_URL}${opts.path}`;
	const ogImage = `${SITE_URL}${opts.ogImage ?? "/og/default.png"}`;

	return [
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
}
