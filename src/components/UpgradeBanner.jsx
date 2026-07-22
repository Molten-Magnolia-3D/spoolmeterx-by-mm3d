import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

export default function UpgradeBanner({ className = "" }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`w-full rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Go ad-free with Pro</p>
        <p className="text-xs text-muted-foreground">Unlock automation and remove this banner.</p>
      </div>
      <Link
        to="/pricing"
        className="flex-shrink-0 text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg active:opacity-80"
      >
        Upgrade
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground active:opacity-70"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
