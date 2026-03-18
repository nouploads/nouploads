import { Link } from "react-router";
import { Lock } from "lucide-react";

export function PrivacyBanner() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
      <Lock className="h-4 w-4 text-primary shrink-0" />
      <span className="text-muted-foreground">
        <strong className="text-foreground">
          Your files never leave your device.
        </strong>{" "}
        All processing happens in your browser.{" "}
        <Link
          to="/about"
          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors whitespace-nowrap"
        >
          Verify&nbsp;&rarr;
        </Link>
      </span>
    </div>
  );
}
