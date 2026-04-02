import { Slider } from "~/components/ui/slider";
import type { ConvertOutputFormat } from "../processors/convert-image";

export interface QualityConfig {
	defaultValue: number;
	min: number;
	max: number;
	step: number;
	label: (value: number) => string;
}

export const FORMAT_QUALITY: Record<ConvertOutputFormat, QualityConfig> = {
	"image/jpeg": {
		defaultValue: 92,
		min: 10,
		max: 100,
		step: 1,
		label: (v) => `JPG Quality: ${v}%`,
	},
	"image/png": {
		defaultValue: 256,
		min: 2,
		max: 256,
		step: 1,
		label: (v) => `Colors: ${v}`,
	},
	"image/webp": {
		defaultValue: 80,
		min: 10,
		max: 100,
		step: 1,
		label: (v) => `WebP Quality: ${v}%`,
	},
	"image/avif": {
		defaultValue: 80,
		min: 10,
		max: 100,
		step: 1,
		label: (v) => `AVIF Quality: ${v}%`,
	},
};

interface QualitySliderProps {
	format: ConvertOutputFormat;
	value: number;
	onChange: (value: number) => void;
}

export function QualitySlider({ format, value, onChange }: QualitySliderProps) {
	const config = FORMAT_QUALITY[format];

	return (
		<div className="space-y-2 max-w-sm">
			<span className="text-sm font-medium">{config.label(value)}</span>
			<Slider
				aria-label="Quality"
				value={[value]}
				onValueChange={(v) => onChange(v[0])}
				min={config.min}
				max={config.max}
				step={config.step}
			/>
		</div>
	);
}
