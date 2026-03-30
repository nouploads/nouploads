import { Check, Clock, Copy, ShieldAlert, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { type DecodedJwt, decodeJwt } from "../processors/jwt-decoder";

// ─── Copy button ──────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => setCopied(false), 2000);
	}, [text]);

	useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleCopy}
			className="gap-1.5"
		>
			{copied ? (
				<Check className="h-3.5 w-3.5" />
			) : (
				<Copy className="h-3.5 w-3.5" />
			)}
			{copied ? "Copied" : (label ?? "Copy")}
		</Button>
	);
}

// ─── Expiration badge ─────────────────────────────────────────

function ExpirationBadge({ decoded }: { decoded: DecodedJwt }) {
	if (decoded.isExpired === null) {
		return (
			<Badge variant="secondary" className="gap-1">
				<Clock className="h-3 w-3" />
				No Expiry
			</Badge>
		);
	}

	if (decoded.isExpired) {
		return (
			<Badge variant="destructive" className="gap-1">
				<ShieldAlert className="h-3 w-3" />
				Expired{" "}
				{decoded.expiresAt
					? decoded.expiresAt.toLocaleString(undefined, {
							dateStyle: "medium",
							timeStyle: "short",
						})
					: ""}
			</Badge>
		);
	}

	return (
		<Badge className="gap-1 bg-green-600 text-white dark:bg-green-700">
			<ShieldCheck className="h-3 w-3" />
			Valid — expires{" "}
			{decoded.expiresAt
				? decoded.expiresAt.toLocaleString(undefined, {
						dateStyle: "medium",
						timeStyle: "short",
					})
				: ""}
		</Badge>
	);
}

// ─── Decoded section ──────────────────────────────────────────

function DecodedSection({
	title,
	content,
	copyText,
	bgClass,
}: {
	title: string;
	content: string;
	copyText: string;
	bgClass: string;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">{title}</h3>
				<CopyButton text={copyText} />
			</div>
			<pre
				className={`rounded-lg border p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all ${bgClass}`}
			>
				{content}
			</pre>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────

export default function JwtDecoderTool() {
	const [input, setInput] = useState("");
	const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const value = e.target.value;
			setInput(value);

			const trimmed = value.trim();
			if (!trimmed) {
				setDecoded(null);
				setError(null);
				return;
			}

			try {
				const result = decodeJwt(trimmed);
				setDecoded(result);
				setError(null);
			} catch (err) {
				setDecoded(null);
				setError(err instanceof Error ? err.message : "Failed to decode JWT");
			}
		},
		[],
	);

	return (
		<div className="space-y-6">
			{/* Input */}
			<div className="space-y-2">
				<label htmlFor="jwt-input" className="text-sm font-medium">
					Paste JWT token
				</label>
				<Textarea
					id="jwt-input"
					value={input}
					onChange={handleChange}
					placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIi..."
					className="font-mono text-xs h-32 resize-none"
				/>
			</div>

			{/* Error */}
			{error && (
				<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
					{error}
				</div>
			)}

			{/* Decoded output */}
			{decoded && (
				<div className="space-y-6">
					{/* Expiration badge */}
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">Status:</span>
						<ExpirationBadge decoded={decoded} />
					</div>

					{/* Header */}
					<DecodedSection
						title="Header"
						content={JSON.stringify(decoded.header, null, 2)}
						copyText={JSON.stringify(decoded.header, null, 2)}
						bgClass="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
					/>

					{/* Payload */}
					<DecodedSection
						title="Payload"
						content={JSON.stringify(decoded.payload, null, 2)}
						copyText={JSON.stringify(decoded.payload, null, 2)}
						bgClass="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
					/>

					{/* Signature */}
					<DecodedSection
						title="Signature"
						content={decoded.signature}
						copyText={decoded.signature}
						bgClass="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
					/>
				</div>
			)}
		</div>
	);
}
