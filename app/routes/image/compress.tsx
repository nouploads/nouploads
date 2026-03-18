import type { Route } from "./+types/compress";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "Compress Images Online — Free, Private, No Upload | NoUploads",
    description: "Reduce image file size with adjustable quality. No upload required.",
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
