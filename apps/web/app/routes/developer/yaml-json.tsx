import { lazy, Suspense } from "react";
import { LibraryAttribution } from "~/components/tool/library-attribution";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/yaml-json";

const YamlJsonTool = lazy(
	() => import("~/features/developer-tools/components/yaml-json-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"YAML to JSON Converter Online \u2014 Free, Private, No Upload | NoUploads",
		description:
			"Convert between YAML and JSON with validation and formatting. Handles anchors, aliases, and complex structures. Free, private.",
		path: "/developer/yaml-json",
		keywords:
			"yaml to json, json to yaml, yaml converter, yaml parser, yaml validator, convert yaml online, yaml json online, kubernetes yaml",
		jsonLdName: "YAML to JSON Converter",
		faq: [
			{
				question: "What is the story behind YAML's name?",
				answer:
					'YAML was first proposed in 2001 by Clark Evans, Oren Ben-Kiki, and Ingy d\u00f6t Net. It originally stood for "Yet Another Markup Language," but was later backronymed to "YAML Ain\'t Markup Language" to emphasize that it is data-oriented rather than document markup. The recursive acronym deliberately echoes GNU\'s "GNU\'s Not Unix" tradition.',
			},
			{
				question:
					"How are YAML anchors and aliases handled during conversion to JSON?",
				answer:
					"YAML anchors (defined with &name) and aliases (referenced with *name) are fully resolved before the JSON output is produced. This means the JSON contains the expanded values everywhere an alias was used \u2014 JSON has no equivalent of anchors, so each reference becomes a separate copy of the data. Merge keys (<<: *name) that combine multiple anchors into one mapping are also expanded.",
			},
			{
				question:
					"What YAML features are preserved when round-tripping through JSON?",
				answer:
					"JSON supports objects, arrays, strings, numbers, booleans, and null \u2014 so those survive perfectly. YAML-specific features like comments, multi-line block scalars (| and >), custom tags, anchors/aliases, and ordered mappings are lost during the YAML\u2192JSON step because JSON has no way to represent them. Converting the JSON back to YAML will produce valid YAML but without the original formatting or comments.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What is the story behind YAML's name?",
		answer: (
			<>
				YAML was first proposed in 2001 by Clark Evans, Oren Ben-Kiki, and Ingy
				d{"\u00F6"}t Net. It originally stood for "Yet Another Markup Language,"
				but was later backronymed to "YAML Ain't Markup Language" to emphasize
				that it is data-oriented rather than document markup. The recursive
				acronym deliberately echoes GNU's "GNU's Not Unix" tradition. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/YAML"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Wikipedia
				</a>
			</>
		),
	},
	{
		question:
			"How are YAML anchors and aliases handled during conversion to JSON?",
		answer:
			"YAML anchors (defined with &name) and aliases (referenced with *name) are fully resolved before the JSON output is produced. This means the JSON contains the expanded values everywhere an alias was used \u2014 JSON has no equivalent of anchors, so each reference becomes a separate copy of the data. Merge keys (<<: *name) that combine multiple anchors into one mapping are also expanded.",
	},
	{
		question:
			"What YAML features are preserved when round-tripping through JSON?",
		answer:
			"JSON supports objects, arrays, strings, numbers, booleans, and null \u2014 so those survive perfectly. YAML-specific features like comments, multi-line block scalars (| and >), custom tags, anchors/aliases, and ordered mappings are lost during the YAML\u2192JSON step because JSON has no way to represent them. Converting the JSON back to YAML will produce valid YAML but without the original formatting or comments.",
	},
];

export default function YamlJsonPage() {
	return (
		<ToolPageLayout
			title="YAML \u2194 JSON Converter"
			description="Convert between YAML and JSON with validation and formatting \u2014 free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<YamlJsonTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					This converter transforms YAML to JSON and JSON to YAML directly in
					your browser. Drop in a Kubernetes manifest, Docker Compose file,
					Ansible playbook, or any CI/CD pipeline config and get clean,
					validated JSON instantly — or go the other way to convert API
					responses into readable YAML. Anchors, aliases, and merge keys are
					fully resolved during conversion. No data leaves your device.
				</p>
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<Accordion type="multiple">
					{faqItems.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list never changes
						<AccordionItem key={i} value={`faq-${i}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>
							<AccordionContent>
								<p className="text-muted-foreground">{item.answer}</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			<LibraryAttribution packages={["js-yaml"]} />
		</ToolPageLayout>
	);
}
