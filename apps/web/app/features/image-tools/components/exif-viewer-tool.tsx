import { Camera, MapPin, Shield, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DownloadButton } from "~/components/tool/tool-actions";
import { ToolDropzone } from "~/components/tool/tool-dropzone";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { ExifData } from "~/features/image-tools/processors/exif-metadata";
import { ACCEPT_IMAGES } from "~/lib/accept";
import { formatFileSize } from "~/lib/utils";

function MetadataTable({
	data,
}: {
	data: Record<string, string | number | boolean>;
}) {
	const entries = Object.entries(data);
	if (entries.length === 0)
		return (
			<p className="text-sm text-muted-foreground">No data in this section</p>
		);
	return (
		<div className="rounded-lg border overflow-hidden">
			<table className="w-full text-sm">
				<tbody>
					{entries.map(([key, value]) => (
						<tr key={key} className="border-b last:border-b-0">
							<td className="px-3 py-2 font-medium bg-muted/30 w-1/3">{key}</td>
							<td className="px-3 py-2 break-all">{String(value)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function AllMetadataTable({ raw }: { raw: Record<string, unknown> }) {
	const entries = Object.entries(raw).filter(
		([, v]) => v !== undefined && v !== null,
	);
	if (entries.length === 0)
		return <p className="text-sm text-muted-foreground">No metadata found</p>;
	return (
		<div className="rounded-lg border overflow-hidden max-h-96 overflow-y-auto">
			<table className="w-full text-sm">
				<tbody>
					{entries.map(([key, value]) => (
						<tr key={key} className="border-b last:border-b-0">
							<td className="px-3 py-2 font-medium bg-muted/30 w-1/3">{key}</td>
							<td className="px-3 py-2 break-all">
								{typeof value === "object"
									? JSON.stringify(value)
									: String(value)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function generateOutputFilename(name: string): string {
	const base = name.replace(/\.[^.]+$/, "");
	const ext = name.match(/\.[^.]+$/)?.[0] ?? ".png";
	return `${base}-clean${ext}`;
}

export default function ExifViewerTool() {
	const [file, setFile] = useState<File | null>(null);
	const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
	const [exifData, setExifData] = useState<ExifData | null>(null);
	const [parsing, setParsing] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);

	const [stripping, setStripping] = useState(false);
	const [strippedBlob, setStrippedBlob] = useState<Blob | null>(null);
	const [stripError, setStripError] = useState<string | null>(null);

	const handleFiles = useCallback((files: File[]) => {
		const f = files[0];
		setFile(f);
		setExifData(null);
		setParseError(null);
		setStrippedBlob(null);
		setStripError(null);
	}, []);

	// Create thumbnail URL
	useEffect(() => {
		if (!file) return;
		const url = URL.createObjectURL(file);
		setThumbnailUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	// Parse EXIF data when file changes
	useEffect(() => {
		if (!file) return;
		const controller = new AbortController();
		setParsing(true);
		setParseError(null);
		setExifData(null);

		(async () => {
			try {
				const { parseExifData } = await import(
					"~/features/image-tools/processors/exif-metadata"
				);
				if (controller.signal.aborted) return;
				const data = await parseExifData(file);
				if (controller.signal.aborted) return;
				setExifData(data);
				setParsing(false);
			} catch (err) {
				if (controller.signal.aborted) return;
				setParseError(
					err instanceof Error ? err.message : "Failed to parse metadata",
				);
				setParsing(false);
			}
		})();

		return () => controller.abort();
	}, [file]);

	const handleStrip = useCallback(async () => {
		if (!file) return;

		setStripping(true);
		setStripError(null);
		setStrippedBlob(null);

		try {
			const { stripMetadata } = await import(
				"~/features/image-tools/processors/exif-metadata"
			);
			const blob = await stripMetadata(file);
			setStrippedBlob(blob);
			setStripping(false);
		} catch (err) {
			setStripError(
				err instanceof Error ? err.message : "Failed to strip metadata",
			);
			setStripping(false);
		}
	}, [file]);

	const reset = useCallback(() => {
		setFile(null);
		setThumbnailUrl(null);
		setExifData(null);
		setParseError(null);
		setStrippedBlob(null);
		setStripError(null);
	}, []);

	const isEmpty =
		exifData && Object.keys(exifData.raw).length === 0 && !exifData.hasGps;

	return (
		<div className="space-y-6">
			<div className="min-h-[460px]">
				{!file && (
					<div className="h-[460px]">
						<ToolDropzone accept={ACCEPT_IMAGES} onFiles={handleFiles} />
					</div>
				)}

				{file && (
					<div className="space-y-6">
						{/* File info */}
						<div className="flex items-center gap-4 rounded-lg border bg-card p-4">
							{thumbnailUrl && (
								<img
									src={thumbnailUrl}
									alt={file.name}
									className="size-16 rounded-lg object-cover shrink-0"
								/>
							)}
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium truncate">{file.name}</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(file.size)} · {file.type || "unknown type"}
								</p>
							</div>
						</div>

						{/* Parsing state */}
						{parsing && (
							<div className="flex items-center gap-2 py-8 justify-center">
								<Spinner className="size-5" />
								<span className="text-sm text-muted-foreground">
									Reading metadata...
								</span>
							</div>
						)}

						{/* Parse error */}
						{parseError && (
							<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
								<p className="text-sm text-destructive">{parseError}</p>
							</div>
						)}

						{/* No metadata found */}
						{exifData && isEmpty && (
							<div className="rounded-lg border bg-muted/30 p-6 text-center">
								<Shield className="size-8 mx-auto text-muted-foreground mb-2" />
								<p className="text-sm font-medium">
									No metadata found in this image
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									This image doesn't contain EXIF, XMP, IPTC, or other embedded
									metadata.
								</p>
							</div>
						)}

						{/* Metadata display */}
						{exifData && !isEmpty && (
							<div className="space-y-4">
								{/* GPS warning */}
								{exifData.hasGps && (
									<div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 flex items-center gap-2">
										<MapPin className="h-4 w-4 text-amber-600 shrink-0" />
										<p className="text-sm text-amber-700 dark:text-amber-400">
											This image contains GPS location data. Consider stripping
											metadata before sharing.
										</p>
									</div>
								)}

								<Tabs defaultValue="camera">
									<TabsList className="flex-wrap">
										<TabsTrigger value="camera">
											<Camera className="size-3.5 mr-1" />
											Camera
										</TabsTrigger>
										<TabsTrigger value="exposure">Exposure</TabsTrigger>
										<TabsTrigger value="lens">Lens</TabsTrigger>
										{exifData.hasGps && (
											<TabsTrigger value="gps">GPS</TabsTrigger>
										)}
										<TabsTrigger value="image">Image</TabsTrigger>
										<TabsTrigger value="all">All</TabsTrigger>
									</TabsList>

									<TabsContent value="camera" className="mt-4">
										<MetadataTable data={exifData.camera ?? {}} />
									</TabsContent>

									<TabsContent value="exposure" className="mt-4">
										<MetadataTable data={exifData.exposure ?? {}} />
									</TabsContent>

									<TabsContent value="lens" className="mt-4">
										<MetadataTable data={exifData.lens ?? {}} />
									</TabsContent>

									{exifData.hasGps && (
										<TabsContent value="gps" className="mt-4">
											<MetadataTable data={exifData.gps ?? {}} />
										</TabsContent>
									)}

									<TabsContent value="image" className="mt-4">
										<MetadataTable data={exifData.image ?? {}} />
									</TabsContent>

									<TabsContent value="all" className="mt-4">
										<AllMetadataTable raw={exifData.raw} />
									</TabsContent>
								</Tabs>
							</div>
						)}

						{/* Strip metadata section */}
						{exifData && !isEmpty && (
							<div className="space-y-3">
								<h3 className="text-sm font-semibold">Strip Metadata</h3>

								{stripError && (
									<div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
										<p className="text-sm text-destructive">{stripError}</p>
									</div>
								)}

								{strippedBlob && (
									<div className="rounded-lg border bg-muted/30 p-4 space-y-2">
										<div className="flex items-center gap-4 text-sm">
											<span className="text-muted-foreground">
												Original: {formatFileSize(file.size)}
											</span>
											<span className="text-muted-foreground">→</span>
											<span className="font-medium">
												Clean: {formatFileSize(strippedBlob.size)}
											</span>
										</div>
									</div>
								)}

								<div className="flex items-center gap-3">
									{!stripping && !strippedBlob && (
										<Button onClick={handleStrip} className="gap-2">
											<Trash2 className="size-4" />
											Strip Metadata
										</Button>
									)}

									{stripping && (
										<Button disabled className="gap-2">
											<Spinner className="size-4" />
											Stripping...
										</Button>
									)}

									{strippedBlob && (
										<DownloadButton
											blob={strippedBlob}
											filename={generateOutputFilename(file.name)}
											disabled={stripping}
										/>
									)}
								</div>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center gap-3">
							<Button variant="outline" onClick={reset}>
								View another
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
