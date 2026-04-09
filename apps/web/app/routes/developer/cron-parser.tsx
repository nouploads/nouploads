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
import type { Route } from "./+types/cron-parser";

const CronParserTool = lazy(
	() => import("~/features/developer-tools/components/cron-parser-tool"),
);

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Cron Parser Online — Free, Instant | NoUploads",
		description:
			"Parse cron expressions into plain-English schedules in your browser — free, with upcoming run times in your timezone. No data sent to any server. Five fields.",
		path: "/developer/cron-parser",
		keywords:
			"cron parser, cron expression, crontab, cron schedule, cron syntax, cron next run, parse cron online, cron to human readable",
		jsonLdName: "CRON Expression Parser",
		faq: [
			{
				question: "What is the origin of the cron scheduling system?",
				answer:
					'Cron was created by Ken Thompson for Version 7 Unix in 1979. The name comes from the Greek word "chronos" meaning time. The original cron daemon woke up every minute to check a single system-wide crontab file. Modern implementations like Vixie cron (written by Paul Vixie in 1987) added per-user crontab files, environment variable support, and the five-field syntax that became the de facto standard used today.',
			},
			{
				question: "What do the five fields in a cron expression represent?",
				answer:
					"The five fields are, in order: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, where 0 is Sunday). Each field accepts a single value, a range (1-5), a step (*/15), a comma-separated list (1,3,5), or an asterisk (*) meaning every possible value. Some extended implementations add a sixth field for seconds, but the standard five-field format covers most scheduling needs.",
			},
			{
				question: "How do step values and combined ranges work in cron?",
				answer:
					"Step values use the slash notation — for example, */15 in the minute field means every 15 minutes (0, 15, 30, 45). You can combine steps with ranges: 1-30/5 means every 5 minutes from minute 1 through 30 (1, 6, 11, 16, 21, 26). This is useful for staggering jobs — instead of flooding at minute 0, you can spread load across an interval. The parser expands these into the full set of matching values to calculate exact run times.",
			},
		],
	});
}

const faqItems = [
	{
		question: "What is the origin of the cron scheduling system?",
		answer: (
			<>
				Cron was created by Ken Thompson for Version 7 Unix in 1979. The name
				comes from the Greek word "chronos" meaning time. The original cron
				daemon woke up every minute to check a single system-wide crontab file.
				Modern implementations like Vixie cron (written by Paul Vixie in 1987)
				added per-user crontab files, environment variable support, and the
				five-field syntax that became the de facto standard used today. Source:{" "}
				<a
					href="https://en.wikipedia.org/wiki/Cron"
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
		question: "What do the five fields in a cron expression represent?",
		answer:
			"The five fields are, in order: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, where 0 is Sunday). Each field accepts a single value, a range (1-5), a step (*/15), a comma-separated list (1,3,5), or an asterisk (*) meaning every possible value. Some extended implementations add a sixth field for seconds, but the standard five-field format covers most scheduling needs.",
	},
	{
		question: "How do step values and combined ranges work in cron?",
		answer:
			"Step values use the slash notation — for example, */15 in the minute field means every 15 minutes (0, 15, 30, 45). You can combine steps with ranges: 1-30/5 means every 5 minutes from minute 1 through 30 (1, 6, 11, 16, 21, 26). This is useful for staggering jobs — instead of flooding at minute 0, you can spread load across an interval. The parser expands these into the full set of matching values to calculate exact run times.",
	},
];

export default function CronParserPage() {
	return (
		<ToolPageLayout
			title="CRON Expression Parser"
			description="Parse cron expressions into human-readable schedules with next run times — free, private, no upload required."
			showPrivacyBanner={false}
		>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-[300px]">
						<Spinner className="size-6" />
					</div>
				}
			>
				<CronParserTool />
			</Suspense>

			<section className="mt-12 mb-8">
				<h2 className="text-lg font-semibold mb-2">About this tool</h2>
				<p className="text-muted-foreground">
					The CRON Expression Parser decodes standard five-field cron
					expressions into plain-English schedules and lists the next 10
					upcoming run times in both local and UTC. Built for sysadmins, DevOps
					engineers, and developers who configure scheduled jobs via crontab,
					CI/CD pipelines, or cloud schedulers. Everything runs client-side in
					your browser — your expressions are never sent to any server, and
					there are no usage limits.
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
				Processed using the browser's built-in{" "}
				<a
					href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"
					target="_blank"
					rel="noopener"
					className="underline hover:text-foreground transition-colors"
				>
					Date API
				</a>{" "}
				— no external libraries
			</p>
		</ToolPageLayout>
	);
}
