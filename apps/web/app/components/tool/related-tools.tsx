import { Link } from "react-router";

interface RelatedTool {
	title: string;
	href: string;
}

export function RelatedTools({ tools }: { tools: RelatedTool[] }) {
	if (tools.length === 0) return null;

	return (
		<section className="mt-12 border-t pt-8">
			<h2 className="text-lg font-semibold mb-4">Related Tools</h2>
			<div className="flex flex-wrap gap-2">
				{tools.map((tool) => (
					<Link
						key={tool.href}
						to={tool.href}
						className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
					>
						{tool.title}
					</Link>
				))}
			</div>
		</section>
	);
}
