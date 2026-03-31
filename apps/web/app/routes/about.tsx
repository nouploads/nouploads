import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { buildMeta, GITHUB_URL } from "~/lib/seo/meta";
import type { Route } from "./+types/about";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "About NoUploads — How It Works & Privacy Guarantee",
		description:
			"Learn how NoUploads processes files 100% in your browser. No uploads, no servers, no tracking. Verify our privacy claims yourself.",
		path: "/about",
	});
}

export default function AboutPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
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
						<p>Run your own instance:</p>
						<div className="mt-3 space-y-3">
							<div>
								<p className="font-medium text-foreground text-sm">Docker</p>
								<code className="block bg-muted rounded px-3 py-2 text-sm mt-1">
									docker run -d -p 8080:80 ghcr.io/nouploads/nouploads:latest
								</code>
							</div>
							<div>
								<p className="font-medium text-foreground text-sm">
									Build from source
								</p>
								<code className="block bg-muted rounded px-3 py-2 text-sm mt-1">
									git clone {GITHUB_URL}.git && cd nouploads && npm install &&
									npm run build
								</code>
							</div>
						</div>
					</section>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
