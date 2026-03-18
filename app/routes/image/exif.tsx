import type { Route } from "./+types/exif";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "EXIF Viewer — View & Strip Photo Metadata | NoUploads",
    description: "View and strip photo metadata locally in your browser. No upload required.",
    path: "/image/exif",
  });
}

export default function ExifPage() {
  return (
    <ToolPageLayout
      title="EXIF Viewer"
      description="View and strip photo metadata locally in your browser."
    >
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </ToolPageLayout>
  );
}
