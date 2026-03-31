import {
	BROWSER_APIS,
	type BrowserApiId,
	PACKAGES,
	type PackageId,
} from "~/lib/attribution";

type PackageRef = PackageId | { id: PackageId; prefix?: string };

interface LibraryAttributionProps {
	packages?: PackageRef[];
	browserApi?: BrowserApiId;
}

function AttrLink({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener"
			className="underline hover:text-foreground transition-colors"
		>
			{children}
		</a>
	);
}

export function LibraryAttribution({
	packages,
	browserApi,
}: LibraryAttributionProps) {
	if (browserApi) {
		const api = BROWSER_APIS[browserApi];
		return (
			<p className="text-xs text-muted-foreground mt-8">
				Processed using the browser's built-in{" "}
				<AttrLink href={api.mdnUrl}>{api.name}</AttrLink> — no external
				libraries
			</p>
		);
	}

	if (!packages || packages.length === 0) return null;

	return (
		<p className="text-xs text-muted-foreground mt-8">
			{packages.map((ref, i) => {
				const id = typeof ref === "string" ? ref : ref.id;
				const prefix =
					typeof ref === "object" && ref.prefix
						? ref.prefix
						: i === 0
							? "Powered by"
							: null;
				const pkg = PACKAGES[id];

				return (
					<span key={id}>
						{i > 0 && " / "}
						{prefix && `${prefix} `}
						<AttrLink href={pkg.repoUrl}>{pkg.name}</AttrLink> · {pkg.license}{" "}
						License
					</span>
				);
			})}
		</p>
	);
}
