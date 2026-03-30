import { useCallback, useEffect, useRef, useState } from "react";
import { FrameScrubber } from "~/components/tool/frame-scrubber";
import { Spinner } from "~/components/ui/spinner";
import {
	type GifFrame,
	type GifFrameData,
	parseGifFrames,
	revokeGifFrameUrls,
} from "../processors/parse-gif-frames";

interface GifFrameSelectorProps {
	file: File;
	onFrameSelect: (frameBlob: Blob) => void;
}

export function GifFrameSelector({
	file,
	onFrameSelect,
}: GifFrameSelectorProps) {
	const [frameData, setFrameData] = useState<GifFrameData | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [parsing, setParsing] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// ─── Parse GIF frames ─────────────────────────────────────
	useEffect(() => {
		const controller = new AbortController();
		setParsing(true);
		setError(null);
		setFrameData(null);
		setSelectedIndex(0);

		(async () => {
			try {
				const data = await parseGifFrames(file, controller.signal);
				if (controller.signal.aborted) return;

				if (data.frames.length <= 1) {
					setParsing(false);
					onFrameSelect(file);
					revokeGifFrameUrls(data.frames);
					return;
				}

				setFrameData(data);
				setParsing(false);
				onFrameSelect(data.frames[0].blob);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(err instanceof Error ? err.message : "Failed to parse GIF");
				setParsing(false);
				onFrameSelect(file);
			}
		})();

		return () => {
			controller.abort();
		};
	}, [file, onFrameSelect]);

	// ─── Cleanup object URLs ──────────────────────────────────
	const prevFramesRef = useRef<GifFrame[]>([]);
	useEffect(() => {
		if (frameData) {
			prevFramesRef.current = frameData.frames;
		}
		return () => {
			revokeGifFrameUrls(prevFramesRef.current);
		};
	}, [frameData]);

	// ─── Frame selection ──────────────────────────────────────
	const handleFrameChange = useCallback(
		(index: number) => {
			if (!frameData) return;
			setSelectedIndex(index);
			onFrameSelect(frameData.frames[index].blob);
		},
		[frameData, onFrameSelect],
	);

	if (parsing) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
				<Spinner className="size-4" />
				Extracting frames...
			</div>
		);
	}

	if (error || !frameData || frameData.frames.length <= 1) {
		return null;
	}

	return (
		<FrameScrubber
			frames={frameData.frames}
			selectedIndex={selectedIndex}
			onFrameChange={handleFrameChange}
		/>
	);
}
