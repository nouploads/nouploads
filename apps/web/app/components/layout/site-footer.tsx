import { Link } from "react-router";
import { GITHUB_URL } from "~/lib/seo/meta";

export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t py-8 mt-16">
			<div className="mx-auto max-w-6xl px-4">
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
						<div>
							<p className="font-medium text-foreground mb-2">Tools</p>
							<ul className="space-y-1.5 text-muted-foreground">
								<li>
									<Link
										to="/image/heic-to-jpg"
										className="hover:text-foreground transition-colors"
									>
										HEIC to JPG
									</Link>
								</li>
								<li>
									<Link
										to="/image/compress"
										className="hover:text-foreground transition-colors"
									>
										Image Compress
									</Link>
								</li>
								<li>
									<Link
										to="/pdf/merge"
										className="hover:text-foreground transition-colors"
									>
										Merge PDF
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<p className="font-medium text-foreground mb-2">Categories</p>
							<ul className="space-y-1.5 text-muted-foreground">
								<li>
									<Link
										to="/image"
										className="hover:text-foreground transition-colors"
									>
										Image Tools
									</Link>
								</li>
								<li>
									<Link
										to="/pdf"
										className="hover:text-foreground transition-colors"
									>
										PDF Tools
									</Link>
								</li>
								<li>
									<Link
										to="/developer"
										className="hover:text-foreground transition-colors"
									>
										Developer Tools
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<p className="font-medium text-foreground mb-2">Project</p>
							<ul className="space-y-1.5 text-muted-foreground">
								<li>
									<Link
										to="/about"
										className="hover:text-foreground transition-colors"
									>
										About
									</Link>
								</li>
								<li>
									<Link
										to="/privacy"
										className="hover:text-foreground transition-colors"
									>
										Privacy
									</Link>
								</li>
								<li>
									<Link
										to="/self-hosting"
										className="hover:text-foreground transition-colors"
									>
										Self-Hosting
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<p className="font-medium text-foreground mb-2">Open Source</p>
							<ul className="space-y-1.5 text-muted-foreground">
								<li>
									<a
										href={GITHUB_URL}
										target="_blank"
										rel="noopener"
										className="hover:text-foreground transition-colors"
									>
										GitHub
									</a>
								</li>
								<li>
									<a
										href={`${GITHUB_URL}/blob/main/LICENSE`}
										target="_blank"
										rel="noopener"
										className="hover:text-foreground transition-colors"
									>
										AGPL-3.0
									</a>
								</li>
								<li>
									<a
										href={`${GITHUB_URL}/releases`}
										target="_blank"
										rel="noopener"
										className="hover:text-foreground transition-colors"
									>
										Releases
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
						<p>&copy; {year} NoUploads</p>
						<a
							href={`${GITHUB_URL}/releases`}
							target="_blank"
							rel="noopener"
							className="hover:text-foreground transition-colors"
						>
							Version {__APP_VERSION__}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
