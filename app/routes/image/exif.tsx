import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/exif";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"EXIF Viewer Online — View & Strip Photo Metadata, Free & Private | NoUploads",
		description:
			"View and strip EXIF metadata from photos online for free. No upload, no signup — files never leave your device.",
		path: "/image/exif",
		keywords:
			"exif viewer, exif remover, strip exif data, remove photo metadata, photo metadata viewer, private exif stripper, free exif tool",
		jsonLdName: "EXIF Metadata Viewer",
	});
}

export default function ExifPage() {
	return (
		<ToolPageLayout
			title="EXIF Viewer"
			description="View and strip EXIF metadata from photos — free, private, no upload required."
		>
			<p className="text-sm text-muted-foreground">Coming soon.</p>
		</ToolPageLayout>
	);
}
