import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";

const CATEGORY_LABELS: Record<string, string> = {
	image: "Image Tools",
	pdf: "PDF Tools",
	developer: "Developer Tools",
	vector: "Vector Tools",
	about: "About",
	privacy: "Privacy",
	"self-hosting": "Self-Hosting",
};

/** Words that should stay uppercase in breadcrumb labels. */
const UPPERCASE_WORDS = new Set([
	"heic",
	"jpg",
	"png",
	"webp",
	"avif",
	"gif",
	"bmp",
	"svg",
	"svgz",
	"tiff",
	"ico",
	"jxl",
	"psd",
	"psb",
	"tga",
	"hdr",
	"exr",
	"dds",
	"pcx",
	"pdf",
	"dcm",
	"eps",
	"ai",
	"emf",
	"cdr",
	"vsd",
	"xps",
	"odg",
	"xcf",
	"pub",
	"jp2",
	"icns",
	"exif",
	"json",
	"csv",
	"yaml",
	"jwt",
	"uuid",
	"url",
	"css",
	"qr",
	"md5",
	"sha",
	"rgb",
	"hsl",
	"hex",
	"oklch",
	"cron",
	"raw",
	"ip",
]);

/** Connectors that should stay lowercase in title case. */
const LOWERCASE_WORDS = new Set(["to", "and", "or", "of", "a", "the"]);

function slugToLabel(slug: string): string {
	return slug
		.replace(/-/g, " ")
		.split(" ")
		.map((word) => {
			const lower = word.toLowerCase();
			if (UPPERCASE_WORDS.has(lower)) return word.toUpperCase();
			if (LOWERCASE_WORDS.has(lower)) return lower;
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}

interface BreadcrumbItem {
	label: string;
	href?: string;
}

function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) return [];

	const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

	if (segments.length === 1) {
		// Category page or top-level page (e.g. /image, /about)
		items.push({
			label: CATEGORY_LABELS[segments[0]] ?? segments[0],
		});
	} else {
		// Tool page (e.g. /image/heic-to-jpg)
		items.push({
			label: CATEGORY_LABELS[segments[0]] ?? segments[0],
			href: `/${segments[0]}`,
		});
		// Last segment as readable name — derived from the slug
		const slug = segments.slice(1).join("/");
		const readable = slugToLabel(slug);
		items.push({ label: readable });
	}

	return items;
}

export function Breadcrumbs() {
	const { pathname } = useLocation();
	const items = buildBreadcrumbItems(pathname);

	if (items.length === 0) return null;

	return (
		<nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
			<ol className="flex items-center gap-1 flex-wrap">
				{items.map((item, i) => (
					<li key={item.label} className="flex items-center gap-1">
						{i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
						{item.href ? (
							<Link
								to={item.href}
								className="hover:text-foreground transition-colors"
							>
								{item.label}
							</Link>
						) : (
							<span className="text-foreground">{item.label}</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
