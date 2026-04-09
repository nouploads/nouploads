import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/global.css";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<Meta />
				<Links />
				{/* Inline theme script — must run before paint to prevent FOUC */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: inline script required to prevent theme FOUC
					dangerouslySetInnerHTML={{
						__html: `
              (function() {
                var theme = (function() {
                  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                    return localStorage.getItem('theme');
                  }
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                })();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
					}}
				/>
			</head>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: body-level drag prevention is intentional */}
			<body
				className="flex min-h-screen flex-col bg-background text-foreground antialiased"
				onDragOver={(e) => e.preventDefault()}
				onDrop={(e) => e.preventDefault()}
			>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	const is404 = isRouteErrorResponse(error) && error.status === 404;

	if (isRouteErrorResponse(error)) {
		message = is404 ? "404" : "Error";
		details = is404 ? "Page not found" : error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="mx-auto max-w-6xl px-4 pt-16">
			<h1 className="text-4xl font-bold mb-4">{message}</h1>
			<p className="text-muted-foreground">{details}</p>
			{is404 && (
				<Link to="/" className="mt-4 inline-block text-primary hover:underline">
					Back to tools
				</Link>
			)}
			{stack && (
				<pre className="mt-4 w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
