import type { Route } from "./+types/convert";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "Convert Images Online — Free, Private, No Upload | NoUploads",
    description: "Convert between PNG, JPG, WebP, AVIF, and more. No upload required.",
    path: "/image/convert",
  });
}

export default function ConvertPage() {
  return (
    <ToolPageLayout
      title="Image Convert"
      description="Convert between PNG, JPG, WebP, AVIF, and more."
    >
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </ToolPageLayout>
  );
}
