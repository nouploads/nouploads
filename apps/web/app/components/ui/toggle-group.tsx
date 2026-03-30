"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

function ToggleGroup({
	className,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
	return (
		<ToggleGroupPrimitive.Root
			data-slot="toggle-group"
			className={cn("flex items-center gap-1", className)}
			{...props}
		/>
	);
}

function ToggleGroupItem({
	className,
	...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
	return (
		<ToggleGroupPrimitive.Item
			data-slot="toggle-group-item"
			className={cn(
				"inline-flex items-center justify-center rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium transition-colors",
				"hover:bg-accent hover:text-accent-foreground",
				"data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
				"focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
				"disabled:pointer-events-none disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { ToggleGroup, ToggleGroupItem };
