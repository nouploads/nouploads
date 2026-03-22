import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";

export interface ScrubberFrame {
	thumbnailUrl: string;
	/** Per-frame delay in ms (used for timestamp display). */
	delay: number;
}

interface FrameScrubberProps {
	frames: ScrubberFrame[];
	/** Called when the user selects a different frame. */
	onFrameChange: (index: number) => void;
	/** Controlled selected index (parent owns the state). */
	selectedIndex: number;
}

function buildTimestamps(frames: ScrubberFrame[]): number[] {
	let t = 0;
	return frames.map((f) => {
		const ts = t;
		t += f.delay;
		return ts;
	});
}

function formatTime(ms: number): string {
	const totalSec = ms / 1000;
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return m > 0 ? `${m}:${s.toFixed(1).padStart(4, "0")}` : `${s.toFixed(1)}s`;
}

export function FrameScrubber({
	frames,
	onFrameChange,
	selectedIndex,
}: FrameScrubberProps) {
	const [playing, setPlaying] = useState(false);
	const stripRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// ─── Frame navigation ─────────────────────────────────────
	const goToFrame = useCallback(
		(index: number) => {
			const clamped = Math.max(0, Math.min(index, frames.length - 1));
			onFrameChange(clamped);
		},
		[frames.length, onFrameChange],
	);

	const handleManualNav = useCallback(
		(index: number) => {
			setPlaying(false);
			goToFrame(index);
		},
		[goToFrame],
	);

	const handleManualSlider = useCallback(
		(value: number[]) => {
			setPlaying(false);
			goToFrame(value[0]);
		},
		[goToFrame],
	);

	// ─── Play / pause (fixed 2 fps) ──────────────────────────
	const onFrameChangeRef = useRef(onFrameChange);
	onFrameChangeRef.current = onFrameChange;
	const selectedIndexRef = useRef(selectedIndex);
	selectedIndexRef.current = selectedIndex;

	useEffect(() => {
		if (!playing || frames.length === 0) return;

		const total = frames.length;
		const id = setInterval(() => {
			const next = (selectedIndexRef.current + 1) % total;
			onFrameChangeRef.current(next);
		}, 333);

		return () => clearInterval(id);
	}, [playing, frames.length]);

	const togglePlay = useCallback(() => {
		setPlaying((p) => !p);
	}, []);

	// ─── Keyboard navigation ──────────────────────────────────
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!containerRef.current?.contains(document.activeElement)) return;

			if (e.key === "ArrowLeft") {
				e.preventDefault();
				handleManualNav(selectedIndexRef.current - 1);
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				handleManualNav(selectedIndexRef.current + 1);
			} else if (e.key === " ") {
				e.preventDefault();
				togglePlay();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleManualNav, togglePlay]);

	// ─── Scroll filmstrip to keep selected thumb visible ──────
	useEffect(() => {
		if (!stripRef.current) return;
		const thumb = stripRef.current.children[selectedIndex] as HTMLElement;
		if (thumb) {
			thumb.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [selectedIndex]);

	const timestamps = buildTimestamps(frames);
	const totalDuration =
		timestamps[timestamps.length - 1] + (frames[frames.length - 1].delay || 0);

	return (
		<div
			ref={containerRef}
			className="space-y-2.5 rounded-lg border bg-card p-3"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: container needs focus for keyboard nav
			tabIndex={0}
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Select frame</span>
				<span className="text-xs text-muted-foreground tabular-nums">
					Frame {selectedIndex + 1} / {frames.length}
					{" · "}
					{formatTime(timestamps[selectedIndex])} / {formatTime(totalDuration)}
				</span>
			</div>

			{/* Transport controls + slider */}
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon-xs"
					onClick={togglePlay}
					aria-label={playing ? "Pause" : "Play"}
				>
					{playing ? (
						<Pause className="size-3.5" />
					) : (
						<Play className="size-3.5" />
					)}
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => handleManualNav(selectedIndex - 1)}
					disabled={selectedIndex === 0}
					aria-label="Previous frame"
				>
					<ChevronLeft className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => handleManualNav(selectedIndex + 1)}
					disabled={selectedIndex === frames.length - 1}
					aria-label="Next frame"
				>
					<ChevronRight className="size-4" />
				</Button>

				<div className="flex-1">
					<Slider
						min={0}
						max={frames.length - 1}
						step={1}
						value={[selectedIndex]}
						onValueChange={handleManualSlider}
						aria-label="Frame scrubber"
					/>
				</div>
			</div>

			{/* Filmstrip minimap */}
			<div
				ref={stripRef}
				className="flex gap-1.5 overflow-x-auto p-1.5"
				style={{ scrollbarWidth: "none" }}
			>
				{frames.map((frame, i) => (
					<button
						// biome-ignore lint/suspicious/noArrayIndexKey: frames are positional, never reordered
						key={i}
						type="button"
						onClick={() => handleManualNav(i)}
						className={`shrink-0 rounded-sm overflow-hidden transition-all ${
							i === selectedIndex
								? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
								: "opacity-60 hover:opacity-100"
						}`}
					>
						<img
							src={frame.thumbnailUrl}
							alt={`Frame ${i + 1}`}
							className="h-10 w-auto select-none pointer-events-none"
							draggable={false}
							loading="lazy"
						/>
					</button>
				))}
			</div>

			<p className="text-xs text-muted-foreground">
				← → arrow keys to step · Space to play/pause
			</p>
		</div>
	);
}
