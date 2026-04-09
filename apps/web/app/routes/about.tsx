import { Link } from "react-router";
import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { buildMeta, GITHUB_URL } from "~/lib/seo/meta";
import type { Route } from "./+types/about";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "About NoUploads — Privacy-First File Tools",
		description:
			"NoUploads processes files in your browser with JavaScript and WebAssembly — no servers, no tracking, no accounts. Open source so you can verify every claim.",
		path: "/about",
	});
}

export default function AboutPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
				<Breadcrumbs />
				<h1 className="text-3xl font-bold mb-8">About NoUploads</h1>

				<div className="space-y-8 text-muted-foreground">
					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Your files never leave your device
						</h2>
						<p>
							NoUploads is a collection of file tools — image converters,
							compressors, PDF utilities, and more — that process everything{" "}
							<strong className="text-foreground">100% in your browser</strong>.
						</p>
						<p className="mt-2">
							When you use a tool on NoUploads, your files are processed locally
							using JavaScript, WebAssembly, and native browser APIs. Nothing is
							uploaded to any server. There is no backend. There is no API that
							touches your files. The entire application is static HTML, CSS,
							and JavaScript.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Verify it yourself
						</h2>
						<p>
							We don&rsquo;t ask you to trust us — we ask you to verify.
							Here&rsquo;s how:
						</p>
						<ol className="list-decimal list-inside mt-3 space-y-2">
							<li>
								<strong className="text-foreground">
									Check the Network tab.
								</strong>{" "}
								Open your browser&rsquo;s developer tools (F12 &rarr; Network
								tab), then use any tool. You&rsquo;ll see zero file upload
								requests.
							</li>
							<li>
								<strong className="text-foreground">Go offline.</strong> Turn on
								airplane mode after the page loads. Every tool still works —
								because nothing depends on a server.
							</li>
							<li>
								<strong className="text-foreground">
									Read the source code.
								</strong>{" "}
								NoUploads is fully open source. Inspect every line at{" "}
								<a
									href={GITHUB_URL}
									className="text-primary underline underline-offset-2"
									target="_blank"
									rel="noopener"
								>
									GitHub
								</a>
								.
							</li>
						</ol>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							How it works technically
						</h2>
						<p>
							The site is built with React Router (static pre-rendering) and
							React. Each tool page is a pre-rendered HTML file with a React
							component for the interactive file processing widget.
						</p>
						<p className="mt-2">
							Processing libraries are loaded on demand — when you visit the
							HEIC converter, only the HEIC conversion library is downloaded.
							Heavy libraries are fetched only when you use that specific tool,
							then cached by your browser for instant subsequent use.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Open source
						</h2>
						<p>
							NoUploads is open source under the{" "}
							<a
								href={`${GITHUB_URL}/blob/main/LICENSE`}
								className="text-primary underline underline-offset-2"
								target="_blank"
								rel="noopener"
							>
								AGPL-3.0 license
							</a>
							. You can self-host it, inspect the code, and contribute
							improvements.
						</p>
						<p className="mt-2">
							Self-hosting is simple — it&rsquo;s just static files. Serve the
							build output with any web server, or use our Docker image.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Self-hosting
						</h2>
						<p>
							Self-hosting is simple — it&rsquo;s just static files. Build from
							source or use Docker. Even when self-hosted, all file processing
							remains client-side.
						</p>
						<p className="mt-2">
							<Link
								to="/self-hosting"
								className="text-primary underline underline-offset-2"
							>
								Read the self-hosting guide &rarr;
							</Link>
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							NoUploads vs. alternatives
						</h2>
						<div className="overflow-x-auto">
							<table className="w-full text-sm border-collapse">
								<thead>
									<tr className="border-b">
										<th className="text-left py-2 pr-4 font-medium text-foreground">
											Feature
										</th>
										<th className="text-left py-2 px-3 font-medium text-foreground">
											NoUploads
										</th>
										<th className="text-left py-2 px-3 font-medium text-foreground">
											ILovePDF
										</th>
										<th className="text-left py-2 px-3 font-medium text-foreground">
											TinyPNG
										</th>
										<th className="text-left py-2 px-3 font-medium text-foreground">
											Squoosh
										</th>
										<th className="text-left py-2 px-3 font-medium text-foreground">
											CloudConvert
										</th>
									</tr>
								</thead>
								<tbody className="[&_td]:py-2 [&_td]:px-3 [&_tr]:border-b">
									<tr>
										<td className="pr-4">Files uploaded to server</td>
										<td className="text-green-500 font-medium">No</td>
										<td>Yes</td>
										<td>Yes</td>
										<td className="text-green-500 font-medium">No</td>
										<td>Yes</td>
									</tr>
									<tr>
										<td className="pr-4">Open source</td>
										<td className="text-green-500 font-medium">
											Yes (AGPL-3.0)
										</td>
										<td>No</td>
										<td>No</td>
										<td className="text-green-500 font-medium">
											Yes (Apache-2.0)
										</td>
										<td>No</td>
									</tr>
									<tr>
										<td className="pr-4">Self-hostable</td>
										<td className="text-green-500 font-medium">Yes</td>
										<td>No</td>
										<td>No</td>
										<td className="text-green-500 font-medium">Yes</td>
										<td>No</td>
									</tr>
									<tr>
										<td className="pr-4">File size limit</td>
										<td className="text-green-500 font-medium">None*</td>
										<td>100 MB free</td>
										<td>5 MB free</td>
										<td className="text-green-500 font-medium">None</td>
										<td>Varies</td>
									</tr>
									<tr>
										<td className="pr-4">Signup required</td>
										<td className="text-green-500 font-medium">No</td>
										<td>No (limited)</td>
										<td>No (limited)</td>
										<td className="text-green-500 font-medium">No</td>
										<td>No (limited)</td>
									</tr>
									<tr>
										<td className="pr-4">Works offline</td>
										<td className="text-green-500 font-medium">Yes</td>
										<td>No</td>
										<td>No</td>
										<td className="text-green-500 font-medium">Yes</td>
										<td>No</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p className="text-xs mt-3">
							*Limited only by device memory. Competitor data verified April
							2026 — limits may change.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							For organizations
						</h2>
						<p>
							Organizations subject to data handling policies (HIPAA, GDPR,
							internal compliance) can{" "}
							<Link
								to="/self-hosting"
								className="text-primary underline underline-offset-2"
							>
								self-host NoUploads
							</Link>{" "}
							on their own infrastructure. All file processing remains
							client-side even when self-hosted — the server only serves static
							files. No data leaves the user&rsquo;s device.
						</p>
						<p className="mt-2">
							NoUploads is licensed under{" "}
							<a
								href={`${GITHUB_URL}/blob/main/LICENSE`}
								className="text-primary underline underline-offset-2"
								target="_blank"
								rel="noopener"
							>
								AGPL-3.0
							</a>
							. For commercial licensing inquiries, open an issue on GitHub.
						</p>
					</section>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
