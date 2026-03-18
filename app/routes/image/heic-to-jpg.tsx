import { lazy, Suspense } from "react";
import type { Route } from "./+types/heic-to-jpg";
import { buildMeta } from "~/lib/seo/meta";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import { Spinner } from "~/components/ui/spinner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "~/components/ui/accordion";

const HeicToJpgTool = lazy(
  () => import("~/features/image-tools/components/heic-to-jpg-tool")
);

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: "Convert HEIC to JPG Online — Free, Private, No Upload | NoUploads",
    description:
      "Convert iPhone HEIC photos to JPG format instantly in your browser. No upload, no server, 100% private. Works offline.",
    path: "/image/heic-to-jpg",
  });
}

const faqItems = [
  {
    question: "What is a HEIC file?",
    answer:
      "HEIC (High Efficiency Image Container) is the default photo format on iPhones and iPads since iOS 11. It offers better compression than JPG while maintaining image quality, but isn't universally supported by all apps and websites.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Your files never leave your device. All conversion happens directly in your browser using WebAssembly — no server upload, no cloud processing, no data collection.",
  },
  {
    question: "What quality setting should I use?",
    answer:
      "92% (the default) is a good balance between file size and quality. Use 100% for lossless-quality JPG output. For web use or sharing, 80–85% gives significantly smaller files with minimal visible difference.",
  },
  {
    question: "Can I convert multiple files at once?",
    answer:
      "Yes. Drop or select multiple HEIC files and they'll all be converted in a batch. You can download each result individually or all at once.",
  },
  {
    question: "Does this work offline?",
    answer:
      "Yes. After the page loads once, the conversion engine is cached in your browser. You can convert HEIC files even without an internet connection.",
  },
];

export default function HeicToJpgPage() {
  return (
    <ToolPageLayout
      title="HEIC to JPG"
      description="Convert HEIC images to JPG right in your browser."
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[460px]">
            <Spinner className="size-6" />
          </div>
        }
      >
        <HeicToJpgTool />
      </Suspense>

      <section className="mt-12">
        <h2 className="text-lg font-semibold mb-4">
          Frequently Asked Questions
        </h2>
        <Accordion type="multiple">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </ToolPageLayout>
  );
}
