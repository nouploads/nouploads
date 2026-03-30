import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

// ─── Hook ────────────────────────────────────────────────────

interface UseFullscreenOptions {
	/** Only bind keyboard listeners when true (default: true). */
	enabled?: boolean;
}

export function useFullscreen({ enabled = true }: UseFullscreenOptions = {}) {
	const [fullscreen, setFullscreen] = useState(false);

	const toggleFullscreen = useCallback(() => {
		setFullscreen((prev) => !prev);
	}, []);

	const exitFullscreen = useCallback(() => {
		setFullscreen(false);
	}, []);

	// F key toggles, Escape exits
	useEffect(() => {
		if (!enabled) return;
		function onKeyDown(e: KeyboardEvent) {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				return;
			}
			if (e.key === "f" || e.key === "F") {
				e.preventDefault();
				setFullscreen((prev) => !prev);
			}
			if (e.key === "Escape") {
				setFullscreen(false);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [enabled]);

	// Lock body scroll
	useEffect(() => {
		if (fullscreen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [fullscreen]);

	return { fullscreen, toggleFullscreen, exitFullscreen } as const;
}

// ─── Toggle button (icon-only with tooltip) ──────────────────

const TOGGLE_STYLES = {
	/** Floats over a preview area (absolute positioned). */
	overlay:
		"absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer",
	/** Sits in a button row alongside other controls. */
	inline:
		"ml-auto flex items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer",
} as const;

export function FullscreenToggle({
	fullscreen,
	onToggle,
	variant = "overlay",
}: {
	fullscreen: boolean;
	onToggle: () => void;
	/** "overlay" floats over a preview area; "inline" sits in a button row. */
	variant?: keyof typeof TOGGLE_STYLES;
}) {
	const label = fullscreen ? "Exit full screen" : "Full screen";
	const iconSize = variant === "overlay" ? "h-4 w-4" : "h-3 w-3";

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onToggle();
						}}
						onPointerDown={(e) => e.stopPropagation()}
						className={TOGGLE_STYLES[variant]}
						aria-label={label}
					>
						{fullscreen ? (
							<Minimize className={iconSize} />
						) : (
							<Maximize className={iconSize} />
						)}
						{variant === "inline" && label}
					</button>
				</TooltipTrigger>
				<TooltipContent>
					{label}{" "}
					<kbd className="relative z-10 ml-1 inline-flex h-5 items-center align-middle rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
						F
					</kbd>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

// ─── Overlay wrapper ─────────────────────────────────────────

export function FullscreenOverlay({
	children,
	className = "",
	visible = true,
}: {
	children: React.ReactNode;
	className?: string;
	/** When false the overlay is rendered but hidden (keeps children mounted). */
	visible?: boolean;
}) {
	return (
		<div
			className={`fixed inset-0 z-50 bg-black flex items-center justify-center ${className} ${!visible ? "hidden" : ""}`}
		>
			{children}
		</div>
	);
}
