import { Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { createToolSearcher, searchTools, type Tool } from "~/lib/search";
import { ToolIcon } from "./tool-icon";

interface ToolFilterProps {
	tools: Tool[];
	issuesUrl: string;
}

function ToolCard({ tool }: { tool: Tool }) {
	const content = (
		<div className="flex items-start gap-3">
			<ToolIcon
				icon={tool.icon}
				iconColor={tool.iconColor}
				iconBg={tool.iconBg}
			/>
			<div className="min-w-0">
				<h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors flex items-center gap-2">
					{tool.title}
					{tool.comingSoon && (
						<span className="text-xs font-normal bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
							Soon
						</span>
					)}
				</h3>
				<p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
			</div>
		</div>
	);

	if (tool.comingSoon) {
		return (
			<div className="group block rounded-lg border bg-card p-5 opacity-60 cursor-default">
				{content}
			</div>
		);
	}

	return (
		<Link
			to={tool.href}
			className="group block rounded-lg border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
		>
			{content}
		</Link>
	);
}

/** Group tools by category, preserving insertion order of categories. */
function groupByCategory(tools: Tool[]) {
	const groups: { name: string; href: string; tools: Tool[] }[] = [];
	const seen = new Map<string, number>();

	for (const tool of tools) {
		const cat = tool.category ?? "Other";
		const catHref = tool.categoryHref ?? "/";
		const idx = seen.get(cat);
		if (idx !== undefined) {
			groups[idx].tools.push(tool);
		} else {
			seen.set(cat, groups.length);
			groups.push({ name: cat, href: catHref, tools: [tool] });
		}
	}
	return groups;
}

export default function ToolFilter({ tools, issuesUrl }: ToolFilterProps) {
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target instanceof HTMLElement && e.target.isContentEditable)
			) {
				return;
			}
			if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
				inputRef.current?.focus();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const fuse = useMemo(() => createToolSearcher(tools), [tools]);

	const filtered = useMemo(
		() => searchTools(fuse, query, tools),
		[query, tools, fuse],
	);

	const groups = useMemo(() => groupByCategory(filtered), [filtered]);

	return (
		<div>
			{/* Search input */}
			<div className="relative mb-6 max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<input
					ref={inputRef}
					type="text"
					placeholder="Filter tools... (e.g. compress, resize, jpg)"
					value={query}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setQuery(e.target.value)
					}
					className="h-10 w-full rounded-lg border border-input bg-transparent pl-10 pr-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
				/>
				{query && (
					<button
						type="button"
						onClick={() => {
							setQuery("");
							inputRef.current?.focus();
						}}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Clear filter"
					>
						<XCircle className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Results */}
			{filtered.length > 0 ? (
				<div className="space-y-10">
					{groups.map((group) => (
						<div key={group.name}>
							<h2 className="text-2xl font-bold mb-6">
								<Link
									to={group.href}
									className="hover:text-primary transition-colors"
								>
									{group.name}
								</Link>
								{query.trim() && (
									<span className="text-sm font-normal text-muted-foreground ml-2">
										{filtered.length} of {tools.length}
									</span>
								)}
							</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{group.tools.map((tool) => (
									<ToolCard key={tool.href} tool={tool} />
								))}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-12">
					<p className="text-lg font-medium mb-2">
						No tools found for &ldquo;{query}&rdquo;
					</p>
					<p className="text-sm text-muted-foreground max-w-md mx-auto">
						We don&rsquo;t have that tool yet, but we&rsquo;d love to build it.
						Please{" "}
						<a
							href={`${issuesUrl}/new?title=${encodeURIComponent(`Tool request: ${query}`)}&labels=tool-request`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
						>
							open an issue
						</a>{" "}
						to let us know — community requests help us prioritize what to build
						next.
					</p>
				</div>
			)}
		</div>
	);
}
