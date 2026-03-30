import { lazy, Suspense } from "react";
import { Link } from "react-router";
import { allTools } from "~/lib/tools";
import { GitHubLink } from "./github-link";
import { ThemeToggle } from "./theme-toggle";

const CommandPalette = lazy(() =>
	import("./command-palette").then((m) => ({ default: m.CommandPalette })),
);

const GITHUB_URL = "https://github.com/nouploads/nouploads";

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<Link to="/" className="flex items-center gap-2 font-bold text-lg">
					<img
						src="/favicon.svg"
						alt=""
						className="h-7 w-7"
						aria-hidden="true"
					/>
					<span>
						<span className="text-primary">No</span>Uploads
					</span>
				</Link>

				<div className="flex items-center gap-2">
					<Suspense>
						<CommandPalette tools={allTools} />
					</Suspense>
					<GitHubLink href={GITHUB_URL} />
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
