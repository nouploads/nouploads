import { useCallback, useRef, useState } from "react";
import {
	FullscreenOverlay,
	FullscreenToggle,
	useFullscreen,
} from "~/components/tool/fullscreen";

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
	const { fullscreen, toggleFullscreen } = useFullscreen();
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
			<FullscreenToggle fullscreen={fullscreen} onToggle={toggleFullscreen} />
		</div>
	);

	if (fullscreen) {
		return (
			<>
				{/* Placeholder to preserve layout space */}
				<div style={{ height }} />
				<FullscreenOverlay>{slider}</FullscreenOverlay>
			</>
		);
	}

	return slider;
}
