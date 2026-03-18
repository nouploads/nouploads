import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/compress";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Compress Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Reduce image file size with adjustable quality. No upload required.",
		path: "/image/compress",
	});
}

export default function CompressPage() {
	return (
		<ToolPageLayout
			title="Image Compress"
			description="Reduce image file size with adjustable quality."
		>
			<p className="text-sm text-muted-foreground">Coming soon.</p>
		</ToolPageLayout>
	);
}
