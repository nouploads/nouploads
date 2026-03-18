import type { Route } from "./+types/resize";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "Resize Images Online — Free, Private, No Upload | NoUploads",
    description: "Resize images by pixels, percentage, or presets. No upload required.",
    path: "/image/resize",
  });
}

export default function ResizePage() {
  return (
    <ToolPageLayout
      title="Image Resize"
      description="Resize images by pixels, percentage, or presets."
    >
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </ToolPageLayout>
  );
}
