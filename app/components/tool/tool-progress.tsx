interface ToolProgressProps {
	value?: number;
	message?: string;
	showPercentage?: boolean;
}

export function ToolProgress({
	value,
	message,
	showPercentage = true,
}: ToolProgressProps) {
	const isIndeterminate = value === undefined;

	return (
		<div className="space-y-2">
			{message && <p className="text-sm text-muted-foreground">{message}</p>}
			<div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
				{isIndeterminate ? (
					<div className="h-full w-1/3 rounded-full bg-primary animate-[indeterminate_1.5s_ease-in-out_infinite]" />
				) : (
					<div
						className="h-full bg-primary transition-all duration-300"
						style={{ width: `${value}%` }}
					/>
				)}
			</div>
			{!isIndeterminate && showPercentage && (
				<p className="text-xs text-muted-foreground text-right">
					{Math.round(value)}%
				</p>
			)}
		</div>
	);
}
