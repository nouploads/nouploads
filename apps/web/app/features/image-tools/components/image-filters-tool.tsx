import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageCompareSlider } from "~/components/tool/image-compare-slider";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { ACCEPT_IMAGES_RASTER } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";
import {
	applyImageFilters,
	type ImageFiltersResult,
} from "../processors/image-filters";

interface FilterState {
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	hueRotate: number;
	grayscale: number;
	sepia: number;
	invert: number;
}

const DEFAULT_FILTERS: FilterState = {
	brightness: 100,
	contrast: 100,
	saturation: 100,
	blur: 0,
	hueRotate: 0,
	grayscale: 0,
	sepia: 0,
	invert: 0,
};

const PRESETS: { label: string; filters: Partial<FilterState> }[] = [
	{ label: "Reset All", filters: { ...DEFAULT_FILTERS } },
	{
		label: "Grayscale",
		filters: { ...DEFAULT_FILTERS, grayscale: 100 },
	},
	{
		label: "Sepia",
		filters: { ...DEFAULT_FILTERS, sepia: 100 },
	},
	{
		label: "Invert",
		filters: { ...DEFAULT_FILTERS, invert: 100 },
	},
	{
		label: "Vintage",
		filters: {
			...DEFAULT_FILTERS,
			sepia: 40,
			contrast: 120,
			brightness: 110,
		},
	},
	{
		label: "High Contrast",
		filters: { ...DEFAULT_FILTERS, contrast: 180 },
	},
];

const SLIDERS: {
	key: keyof FilterState;
	label: string;
	min: number;
	max: number;
	unit: string;
}[] = [
	{ key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
	{ key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%" },
	{ key: "saturation", label: "Saturation", min: 0, max: 200, unit: "%" },
	{ key: "blur", label: "Blur", min: 0, max: 20, unit: "px" },
	{
		key: "hueRotate",
		label: "Hue Rotate",
		min: 0,
		max: 360,
		unit: "\u00B0",
	},
	{ key: "grayscale", label: "Grayscale", min: 0, max: 100, unit: "%" },
	{ key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
	{ key: "invert", label: "Invert", min: 0, max: 100, unit: "%" },
];

export default function ImageFiltersTool() {
	const [file, setFile] = useState<File | null>(null);
	const [filters, setFilters] = useState<FilterState>({
		...DEFAULT_FILTERS,
	});

	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	const [resultUrl, setResultUrl] = useState<string | null>(null);
	const [resultBlob, setResultBlob] = useState<Blob | null>(null);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasResult = resultUrl !== null;

	// Debounce ref for slider changes
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [debouncedFilters, setDebouncedFilters] = useState<FilterState>({
		...DEFAULT_FILTERS,
	});

	const handleFiles = useCallback((incoming: File[]) => {
		if (incoming.length === 0) return;
		setFile(incoming[0]);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setFilters({ ...DEFAULT_FILTERS });
		setDebouncedFilters({ ...DEFAULT_FILTERS });
	}, []);

	// Create original preview URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Debounce filter changes by 200ms
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			setDebouncedFilters({ ...filters });
		}, 200);
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [filters]);

	// Determine output format from input MIME type
	const outputFormat =
		file?.type === "image/jpeg"
			? "image/jpeg"
			: file?.type === "image/webp"
				? "image/webp"
				: "image/png";

	// Process filters
	useEffect(() => {
		if (!file) return;

		const controller = new AbortController();
		setProcessing(true);
		setError(null);

		(async () => {
			try {
				const result: ImageFiltersResult = await applyImageFilters(file, {
					...debouncedFilters,
					outputFormat,
					quality: 0.92,
					signal: controller.signal,
				});
				if (controller.signal.aborted) return;

				setResultBlob(result.blob);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return URL.createObjectURL(result.blob);
				});
				setProcessing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setError(
					err instanceof Error ? err.message : "Filter processing failed",
				);
				setResultBlob(null);
				setResultUrl((prev) => {
					if (prev) URL.revokeObjectURL(prev);
					return null;
				});
				setProcessing(false);
			}
		})();

		return () => controller.abort();
	}, [file, debouncedFilters, outputFormat]);

	const updateFilter = useCallback((key: keyof FilterState, value: number) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	}, []);

	const applyPreset = useCallback((preset: Partial<FilterState>) => {
		setFilters((prev) => ({ ...prev, ...preset }));
	}, []);

	const reset = useCallback(() => {
		setFile(null);
		setOriginalUrl(null);
		setResultUrl(null);
		setResultBlob(null);
		setError(null);
		setFilters({ ...DEFAULT_FILTERS });
		setDebouncedFilters({ ...DEFAULT_FILTERS });
	}, []);

	const outputFilename = file
		? file.name.replace(/\.[^.]+$/, "-filtered$&")
		: "";

	return (
		<div className="space-y-6">
			{!file && (
				<div className="h-[460px]">
					<ToolDropzone
						accept={ACCEPT_IMAGES_RASTER}
						onFiles={handleFiles}
						multiple={false}
						maxSizeMB={50}
					/>
				</div>
			)}

			{file && (
				<>
					{/* Preset buttons */}
					<div className="flex flex-wrap gap-2">
						{PRESETS.map((preset) => (
							<Button
								key={preset.label}
								variant="outline"
								size="sm"
								onClick={() => applyPreset(preset.filters)}
							>
								{preset.label}
							</Button>
						))}
					</div>

					{/* Sliders */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">
						{SLIDERS.map((s) => (
							<div key={s.key} className="space-y-2">
								<span className="text-sm font-medium">
									{s.label}: {filters[s.key]}
									{s.unit}
								</span>
								<Slider
									aria-label={s.label}
									value={[filters[s.key]]}
									onValueChange={(v) => updateFilter(s.key, v[0])}
									min={s.min}
									max={s.max}
									step={1}
								/>
							</div>
						))}
					</div>

					{/* Result label */}
					<div className="flex justify-between">
						<div>
							<p className="text-sm font-medium">Original</p>
							<p className="text-xs text-muted-foreground">
								{file.name} — {formatFileSize(file.size)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm font-medium">Result</p>
							<p className="text-xs text-muted-foreground relative">
								<span
									className="inline-flex items-center gap-1.5 transition-opacity duration-300"
									style={{ opacity: processing ? 1 : 0 }}
								>
									{file.name} — <Spinner className="size-3 inline" /> Applying
									filters...
								</span>
								{resultBlob && (
									<span
										className="absolute right-0 top-0 whitespace-nowrap transition-opacity duration-300"
										style={{
											opacity: processing ? 0 : 1,
										}}
									>
										{formatFileSize(resultBlob.size)}
									</span>
								)}
							</p>
						</div>
					</div>

					{/* Preview */}
					{processing && !hasResult ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							{originalUrl ? (
								<div className="relative h-full w-full">
									<img
										src={originalUrl}
										alt="Original"
										className="h-full w-full object-contain opacity-60"
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50">
										<Spinner className="size-6" />
										<p className="text-sm text-muted-foreground">
											Loading preview...
										</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2 p-4">
									<Spinner className="size-6" />
									<p className="text-sm text-muted-foreground">
										Loading preview...
									</p>
								</div>
							)}
						</div>
					) : error ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							<div className="flex flex-col items-center gap-2 p-4 text-center">
								<AlertCircle className="h-6 w-6 text-destructive" />
								<p className="text-sm text-destructive">{error}</p>
							</div>
						</div>
					) : originalUrl && resultUrl ? (
						<div className="relative">
							<div
								className="transition-opacity duration-300"
								style={{
									opacity: processing ? 0.25 : 1,
								}}
							>
								<ImageCompareSlider
									originalSrc={originalUrl}
									resultSrc={resultUrl}
									height={400}
								/>
							</div>
							<div
								className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
								style={{
									opacity: processing ? 1 : 0,
								}}
							>
								<Spinner className="size-10" />
							</div>
						</div>
					) : originalUrl ? (
						<div className="rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center h-[400px]">
							<img
								src={originalUrl}
								alt="Original"
								className="max-w-full max-h-full object-contain"
							/>
						</div>
					) : null}

					{/* Actions */}
					<div className="flex items-center gap-3 h-9">
						{resultBlob && (
							<DownloadButton
								blob={resultBlob}
								filename={outputFilename}
								disabled={processing}
							/>
						)}
						<Button variant="outline" onClick={reset}>
							Choose another
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
