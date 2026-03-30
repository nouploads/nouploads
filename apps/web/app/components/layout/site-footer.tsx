import { Link } from "react-router";
import { GITHUB_URL } from "~/lib/seo/meta";

export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t py-8 mt-16">
			<div className="mx-auto max-w-6xl px-4">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-4">
						<Link to="/" className="hover:text-foreground transition-colors">
							Home
						</Link>
						<Link
							to="/about"
							className="hover:text-foreground transition-colors"
						>
							About
						</Link>
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground transition-colors"
						>
							GitHub
						</a>
					</div>
					<p>
						&copy; {year} NoUploads &middot; Open source under{" "}
						<a
							href={`${GITHUB_URL}/blob/main/LICENSE`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-foreground transition-colors"
						>
							AGPL-3.0
						</a>{" "}
						&middot;{" "}
						<a
							href={`${GITHUB_URL}/releases`}
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground transition-colors"
						>
							Version {__APP_VERSION__}
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
