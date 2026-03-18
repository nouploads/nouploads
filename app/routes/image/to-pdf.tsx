import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/to-pdf";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Images to PDF — Combine Images into PDF | NoUploads",
		description:
			"Combine multiple images into a single PDF locally in your browser. No upload required.",
		path: "/image/to-pdf",
	});
}

export default function ToPdfPage() {
	return (
		<ToolPageLayout
			title="Images to PDF"
			description="Combine multiple images into a single PDF locally in your browser."
		>
			<p className="text-sm text-muted-foreground">Coming soon.</p>
		</ToolPageLayout>
	);
}
