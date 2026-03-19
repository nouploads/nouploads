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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 512 512"
						fill="none"
						stroke="currentColor"
						className="h-7 w-7 text-foreground"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={32}
							d="M93.72 183.25C49.49 198.05 16 233.1 16 288c0 66 54 112 120 112h184.37m147.45-22.26C485.24 363.3 496 341.61 496 312c0-59.82-53-85.76-96-88c-8.89-89.54-71-144-144-144c-26.16 0-48.79 6.93-67.6 18.14"
						/>
						<path
							strokeLinecap="round"
							strokeMiterlimit={10}
							strokeWidth={32}
							d="M448 448L64 64"
						/>
					</svg>
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
