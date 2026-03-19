import { PrivacyBanner } from "~/components/layout/privacy-banner";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";

interface ToolPageLayoutProps {
	title: string;
	description: string;
	category?: string;
	showPrivacyBanner?: boolean;
	children: React.ReactNode;
}

export function ToolPageLayout({
	title,
	description,
	showPrivacyBanner = true,
	children,
}: ToolPageLayoutProps) {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
				{showPrivacyBanner && (
					<div className="mb-6">
						<PrivacyBanner />
					</div>
				)}

				<div className="mb-6">
					<h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
					<p className="text-muted-foreground">{description}</p>
				</div>

				{children}
			</main>
			<SiteFooter />
		</>
	);
}
