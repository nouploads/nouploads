import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { buildMeta, GITHUB_URL } from "~/lib/seo/meta";
import type { Route } from "./+types/self-hosting";

export function meta(_args: Route.MetaArgs) {
	return buildMeta({
		title: "Self-Host NoUploads — Docker & Static Deploy",
		description:
			"Run NoUploads on your own infrastructure — static files, no backend, no database. Deploy with Docker or any web server. Ideal for air-gapped networks and compliance.",
		path: "/self-hosting",
		keywords:
			"self-hosted file converter, self-hosted image converter, self-hosted PDF tools, self-host NoUploads, private file tools docker",
	});
}

export default function SelfHostingPage() {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
				<Breadcrumbs />
				<h1 className="text-3xl font-bold mb-8">Self-Host NoUploads</h1>

				<div className="space-y-8 text-muted-foreground">
					<section>
						<p>
							NoUploads is a fully static web application. There is no backend
							server, no database, no API that touches your files. The build
							output is a folder of HTML, CSS, JavaScript, and WebAssembly files
							that can be served by any web server. This makes self-hosting
							simple: put the files behind a web server and you&rsquo;re done.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Why self-host?
						</h2>
						<ul className="list-disc list-inside space-y-2">
							<li>
								<strong className="text-foreground">Air-gapped networks</strong>{" "}
								— Facilities without internet access can run NoUploads on an
								internal server. All processing is client-side, so no external
								requests are needed after the initial page load.
							</li>
							<li>
								<strong className="text-foreground">
									Compliance requirements
								</strong>{" "}
								— Organizations subject to HIPAA, GDPR, or internal data
								policies can host NoUploads on their own infrastructure,
								ensuring files never transit through third-party servers.
							</li>
							<li>
								<strong className="text-foreground">Internal tooling</strong> —
								Give your team a private instance for converting medical images,
								legal documents, or other sensitive files without relying on
								external services.
							</li>
							<li>
								<strong className="text-foreground">Full control</strong> — Pin
								a specific version, customize the tool set, or integrate with
								your existing intranet.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Docker
						</h2>
						<p className="mb-3">
							The fastest way to get started. The Dockerfile builds the
							application and serves it with a lightweight web server.
						</p>
						<div className="space-y-3">
							<div>
								<p className="font-medium text-foreground text-sm mb-1">
									Using docker-compose (recommended)
								</p>
								<pre className="bg-muted rounded px-4 py-3 text-sm overflow-x-auto">
									<code>{`git clone ${GITHUB_URL}.git
cd nouploads
docker compose up -d`}</code>
								</pre>
								<p className="text-sm mt-1">
									Serves on{" "}
									<code className="bg-muted px-1 rounded">
										http://localhost:3000
									</code>
								</p>
							</div>
							<div>
								<p className="font-medium text-foreground text-sm mb-1">
									Using Docker directly
								</p>
								<pre className="bg-muted rounded px-4 py-3 text-sm overflow-x-auto">
									<code>{`docker build -t nouploads .
docker run -d -p 3000:3000 nouploads`}</code>
								</pre>
							</div>
						</div>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Build from source
						</h2>
						<p className="mb-3">
							If you prefer to build and serve the static files yourself:
						</p>
						<pre className="bg-muted rounded px-4 py-3 text-sm overflow-x-auto">
							<code>{`git clone ${GITHUB_URL}.git
cd nouploads
npm install
npm run build`}</code>
						</pre>
						<p className="mt-3">
							The build output is in{" "}
							<code className="bg-muted px-1 rounded">
								apps/web/build/client/
							</code>
							. Serve this directory with any static file server — Nginx,
							Apache, Caddy, or even{" "}
							<code className="bg-muted px-1 rounded">
								npx serve apps/web/build/client
							</code>
							.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							Static hosting
						</h2>
						<p>
							Because NoUploads is entirely static, you can deploy the build
							output to any static hosting platform:
						</p>
						<ul className="list-disc list-inside mt-3 space-y-1">
							<li>AWS S3 + CloudFront</li>
							<li>Cloudflare Pages</li>
							<li>Netlify or Vercel</li>
							<li>GitHub Pages</li>
							<li>Any internal file server</li>
						</ul>
						<p className="mt-3">
							All routes are pre-rendered as static HTML files with client-side
							hydration. No server-side rendering is needed at runtime.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							How NoUploads differs from other self-hosted tools
						</h2>
						<p>
							Most self-hosted file conversion tools (like{" "}
							<a
								href="https://github.com/C4illin/ConvertX"
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								ConvertX
							</a>{" "}
							or{" "}
							<a
								href="https://github.com/nicholasgasior/HRConvert2"
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								HRConvert2
							</a>
							) process files on the server. This means the server needs
							sufficient CPU and memory to handle conversions, and files must be
							uploaded to the server for processing.
						</p>
						<p className="mt-2">
							NoUploads is different: even when self-hosted, all file processing
							happens in the user&rsquo;s browser. The server only serves static
							files. This means:
						</p>
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>Minimal server resources (any web server works)</li>
							<li>No file size limits imposed by the server</li>
							<li>No temporary files stored on disk</li>
							<li>
								Zero server-side attack surface for file processing
								vulnerabilities
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-foreground mb-3">
							License
						</h2>
						<p>
							NoUploads is licensed under{" "}
							<a
								href={`${GITHUB_URL}/blob/main/LICENSE`}
								target="_blank"
								rel="noopener"
								className="text-primary underline underline-offset-2"
							>
								AGPL-3.0
							</a>
							. You can self-host it freely for personal or organizational use.
							If you modify the source code and make the modified version
							available over a network, you must release your changes under the
							same license.
						</p>
					</section>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
