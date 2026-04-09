import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { buildMeta, GITHUB_URL } from "~/lib/seo/meta";
import type { Route } from "./+types/privacy";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Privacy — NoUploads",
		description:
			"NoUploads collects no personal data, sets no cookies, and runs no analytics scripts. Your files are processed locally and never leave your device. Fully open source.",
		path: "/privacy",
	});
}

export default function PrivacyPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
				<Breadcrumbs />
				<h1 className="text-3xl font-bold mb-8">Privacy</h1>

				<div className="space-y-8 text-muted-foreground">
					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							No data collection
						</h2>
						<p>
							NoUploads does not collect, store, or transmit any personal data.
							There are no user accounts, no email fields, no contact forms, and
							no analytics JavaScript on any page.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							No cookies
						</h2>
						<p>
							The site sets no cookies of any kind — no session cookies, no
							tracking cookies, no consent banners. Your browser&rsquo;s local
							storage is used only for theme preference (light/dark mode), which
							never leaves your device.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							No third-party scripts
						</h2>
						<p>
							There are no third-party scripts loaded on any page. No Google
							Analytics, no Facebook Pixel, no Hotjar, no Intercom. The only
							external requests are for fonts and the processing libraries each
							tool needs — both served from our own CDN.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Your files never leave your device
						</h2>
						<p>
							Every tool on NoUploads processes files entirely in your browser
							using JavaScript, WebAssembly, and native browser APIs. No file
							data is uploaded to any server. You can verify this by opening the
							Network tab in your browser&rsquo;s developer tools while using
							any tool, or by turning on airplane mode after the page loads.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Server logs
						</h2>
						<p>
							The site is hosted on AWS CloudFront. CloudFront standard access
							logs record IP addresses, requested URLs, and timestamps —
							standard for any web server. These logs are used only for
							debugging and abuse prevention. They do not contain any file
							content, file names, or processing data.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Open source
						</h2>
						<p>
							The entire source code is available under the{" "}
							<a
								href={`${GITHUB_URL}/blob/main/LICENSE`}
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								AGPL-3.0 license
							</a>
							. You can inspect every line of code that runs on this site at{" "}
							<a
								href={GITHUB_URL}
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								GitHub
							</a>
							. If you don&rsquo;t trust our hosted version, you can{" "}
							<a
								href="/self-hosting"
								className="text-primary underline underline-offset-2"
							>
								self-host your own instance
							</a>
							.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Contact
						</h2>
						<p>
							Questions about privacy?{" "}
							<a
								href={`${GITHUB_URL}/issues`}
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								Open an issue on GitHub
							</a>
							.
						</p>
					</section>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
