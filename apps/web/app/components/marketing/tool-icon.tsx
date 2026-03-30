import type { LucideIcon } from "lucide-react";
import {
	ArrowDownToLine,
	Braces,
	Camera,
	Code,
	Crop,
	Eraser,
	FileArchive,
	FileImage,
	FileOutput,
	FileText,
	Merge,
	Minimize2,
	Palette,
	QrCode,
	RefreshCw,
	RotateCw,
	Scaling,
	ScanSearch,
	Scissors,
	Stamp,
} from "lucide-react";

/**
 * Icon registry — add new icons here when adding tools to app/lib/tools.ts.
 * Import only the icons you need to keep the bundle small.
 */
const iconMap: Record<string, LucideIcon> = {
	ArrowDownToLine,
	Braces,
	Camera,
	Code,
	Crop,
	Eraser,
	FileArchive,
	FileImage,
	FileOutput,
	FileText,
	Merge,
	Minimize2,
	Palette,
	QrCode,
	RefreshCw,
	RotateCw,
	Scaling,
	ScanSearch,
	Scissors,
	Stamp,
};

interface ToolIconProps {
	icon: string;
	iconColor: string;
	iconBg: string;
	size?: "sm" | "md";
}

export function ToolIcon({
	icon,
	iconColor,
	iconBg,
	size = "md",
}: ToolIconProps) {
	const LucideIcon = iconMap[icon];
	if (!LucideIcon) {
		if (import.meta.env.DEV) {
			console.warn(
				`[ToolIcon] Missing icon "${icon}" — add it to iconMap in tool-icon.tsx`,
			);
		}
		return null;
	}

	const sizeClasses =
		size === "sm" ? "h-8 w-8 rounded-md" : "h-11 w-11 rounded-xl";

	const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

	return (
		<div
			className={`${sizeClasses} ${iconBg} flex items-center justify-center shrink-0`}
		>
			<LucideIcon className={`${iconSize} ${iconColor}`} />
		</div>
	);
}
