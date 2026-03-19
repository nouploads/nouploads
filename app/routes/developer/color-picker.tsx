import { lazy, Suspense } from "react";
import { ToolPageLayout } from "~/components/tool/tool-page-layout";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Spinner } from "~/components/ui/spinner";
import { buildMeta } from "~/lib/seo/meta";
import type { Route } from "./+types/color-picker";

const ColorPickerTool = lazy(
	() => import("~/features/developer-tools/components/color-picker-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title:
			"Color Picker Online — HEX, RGB, HSL, OKLCH | Free & Private | NoUploads",
		description:
			"Pick colors and convert between HEX, RGB, HSL, and OKLCH formats. Free, no signup, works offline.",
		path: "/developer/color-picker",
		keywords:
			"color picker online, hex color picker, rgb to hex, hsl color picker, oklch color picker, color converter, free color tool",
		jsonLdName: "Color Picker",
	});
}

const faqItems = [
	{
		question: "What color formats does this picker support?",
		answer:
			"Eleven formats: HEX, RGB, HSL, HSV, HWB, CMYK, LAB (CIELAB), LCH (CIELCh), XYZ (CIE 1931), LUV (CIELUV), and OKLCH. All values are shown simultaneously in a grid so you can copy whichever you need. You can also type any valid CSS color into the input and the picker updates instantly.",
	},
	{
		question: "What is OKLCH and when should I use it?",
		answer:
			"OKLCH is a perceptually uniform color space defined by Lightness, Chroma, and Hue. Unlike HSL, equal steps in OKLCH lightness look equally different to the human eye. It's supported in all modern browsers via CSS and is ideal for building consistent design palettes, accessible color scales, and smooth gradients that don't muddy in the middle.",
	},
	{
		question: "How does the contrast checker work?",
		answer:
			"The tool calculates the WCAG 2.1 contrast ratio between your selected color and both white and black text. It shows whichever text color has higher contrast, the numeric ratio (e.g. 4.5:1), and the WCAG compliance level — AAA (7:1+), AA (4.5:1+), or Fail. This helps you verify that text on your chosen background is readable.",
	},
	{
		question: "Can I type a color value instead of using the picker?",
		answer:
			"Yes. The text input accepts any valid CSS color — hex codes, rgb(), hsl(), oklch(), and even named colors like 'tomato' or 'cornflowerblue'. The visual picker updates in real time as you type.",
	},
	{
		question: "Why use NoUploads instead of other color picker tools?",
		answer:
			"NoUploads runs entirely in your browser with no server communication, no tracking, and no cookie banners. It works offline after the first load, your format preference is saved locally, and the source code is open for anyone to inspect. It's a developer tool that gets out of your way.",
	},
];

export default function ColorPickerPage() {
	return (
		<ToolPageLayout
			title="Color Picker"
			description="Pick any color and get its value in HEX, RGB, HSL, and OKLCH — free, open source, privacy-first."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[460px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<ColorPickerTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The NoUploads Color Picker lets you visually select a color or type
					any valid CSS value and instantly see its representation in HEX, RGB,
					HSL, and OKLCH. Designed for developers and designers who need to grab
					accurate color values without leaving the browser. Includes a WCAG
					contrast checker to verify text readability, a random color generator
					for quick inspiration, and persistent format preferences so the tool
					remembers how you work.
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

			<p className="text-xs text-muted-foreground mt-8">
				Powered by{" "}
				<a
					href="https://github.com/omgovich/react-colorful"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					react-colorful
				</a>{" "}
				· MIT License · Color math by{" "}
				<a
					href="https://github.com/Evercoder/culori"
					target="_blank"
					rel="noopener noreferrer"
					className="underline hover:text-foreground transition-colors"
				>
					culori
				</a>{" "}
				· MIT License
			</p>
		</ToolPageLayout>
	);
}
