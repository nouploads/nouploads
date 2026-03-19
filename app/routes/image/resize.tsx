import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/resize";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Resize Images Online — Free, Private, No Upload | NoUploads",
		description:
			"Resize images online for free by pixels, percentage, or social media presets. No upload, no signup — files never leave your device.",
		path: "/image/resize",
		keywords:
			"resize image, image resizer online, resize image for instagram, resize image pixels, free image resizer, private image resizer",
		jsonLdName: "Image Resizer",
	});
}

export default function ResizePage() {
	return (
		<ToolPageLayout
			title="Image Resize"
			description="Resize images online by pixels, percentage, or social media presets — free and private."
		>
			<p className="text-sm text-muted-foreground">Coming soon.</p>
		</ToolPageLayout>
	);
}
