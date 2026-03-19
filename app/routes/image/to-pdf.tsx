import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/to-pdf";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Images to PDF Online — Combine Images into PDF, Free & Private | NoUploads",
		description:
			"Combine multiple images into a PDF online for free. No upload, no signup — files never leave your device.",
		path: "/image/to-pdf",
		keywords:
			"images to pdf, combine images pdf, jpg to pdf, png to pdf, free image to pdf converter, private pdf creator, merge images into pdf",
		jsonLdName: "Images to PDF Converter",
	});
}

export default function ToPdfPage() {
	return (
		<ToolPageLayout
			title="Images to PDF"
			description="Combine multiple images into a single PDF — free, private, no upload required."
		>
			<p className="text-sm text-muted-foreground">Coming soon.</p>
		</ToolPageLayout>
	);
}
