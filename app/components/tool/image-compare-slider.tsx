import { Maximize, Minimize } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";

interface ImageCompareSliderProps {
	originalSrc: string;
	resultSrc: string;
	originalAlt?: string;
	resultAlt?: string;
	height?: number;
}

/**
 * Before/after image comparison with a draggable slider.
 * Left side shows the original, right side shows the result.
 * Supports fullscreen toggle via button or F key.
 */
export function ImageCompareSlider({
	originalSrc,
	resultSrc,
	originalAlt = "Original",
	resultAlt = "Result",
	height = 350,
}: ImageCompareSliderProps) {
	const [position, setPosition] = useState(50);
	const [fullscreen, setFullscreen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);

	const updatePosition = useCallback((clientX: number) => {
		const container = containerRef.current;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const x = clientX - rect.left;
		const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
		setPosition(pct);
	}, []);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			dragging.current = true;
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
			updatePosition(e.clientX);
		},
		[updatePosition],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragging.current) return;
			updatePosition(e.clientX);
		},
		[updatePosition],
	);

	const onPointerUp = useCallback(() => {
		dragging.current = false;
	}, []);

	const toggleFullscreen = useCallback(() => {
		setFullscreen((prev) => !prev);
	}, []);

	// F key toggles fullscreen, Escape exits
	useEffect(() => {
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
			if (e.key === "Escape" && fullscreen) {
				setFullscreen(false);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [fullscreen]);

	// Lock body scroll when fullscreen
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

	const slider = (
		<div
			ref={containerRef}
			className={`relative select-none overflow-hidden cursor-ew-resize touch-none ${
				fullscreen ? "h-full w-full" : "rounded-lg border bg-muted/30"
			}`}
			style={fullscreen ? undefined : { height }}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
		>
			{/* Result image — clipped to right portion */}
			<img
				src={resultSrc}
				alt={resultAlt}
				className="absolute inset-0 h-full w-full object-contain"
				style={{
					clipPath: `inset(0 0 0 ${position}%)`,
				}}
				draggable={false}
			/>

			{/* Original image — clipped to left portion */}
			<img
				src={originalSrc}
				alt={originalAlt}
				className="absolute inset-0 h-full w-full object-contain"
				style={{
					clipPath: `inset(0 ${100 - position}% 0 0)`,
				}}
				draggable={false}
			/>

			{/* Slider line + handle */}
			<div
				className="absolute top-0 bottom-0 z-10 -translate-x-1/2 pointer-events-none"
				style={{ left: `${position}%` }}
			>
				<div className="h-full w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200">
					<svg
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
						className="text-gray-600"
						aria-hidden="true"
					>
						<path
							d="M4.5 3L1.5 7L4.5 11"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M9.5 3L12.5 7L9.5 11"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</div>

			{/* Fullscreen toggle button */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								toggleFullscreen();
							}}
							onPointerDown={(e) => e.stopPropagation()}
							className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
							aria-label={fullscreen ? "Exit full screen" : "Full screen"}
						>
							{fullscreen ? (
								<Minimize className="h-4 w-4" />
							) : (
								<Maximize className="h-4 w-4" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent>
						{fullscreen ? "Exit full screen" : "Full screen"}{" "}
						<kbd className="relative z-10 ml-1 inline-flex h-5 items-center align-middle rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
							F
						</kbd>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);

	if (fullscreen) {
		return (
			<>
				{/* Placeholder to preserve layout space */}
				<div style={{ height }} />
				{/* Fullscreen overlay */}
				<div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
					{slider}
				</div>
			</>
		);
	}

	return slider;
}
