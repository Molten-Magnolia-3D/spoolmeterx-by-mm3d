import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Full-screen overlay paywall shown when a free user tries to access a Pro feature
export default function ProPaywall({ feature = "this feature", onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur flex items-end justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 mb-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Crown className="w-7 h-7 text-yellow-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Pro Feature</h2>
          <p className="text-sm text-muted-foreground">
            <span className="capitalize font-medium text-foreground">{feature}</span> is available on the Pro plan.
            Upgrade for <strong className="text-foreground">$5.99/mo</strong> — no ads, unlimited Quick Jobs, and full access.
          </p>
        </div>
        <Link to="/pricing" className="block">
          <Button className="w-full h-12 font-semibold bg-yellow-500 hover:bg-yellow-400 text-black">
            Upgrade to Pro — $5.99/mo
          </Button>
        </Link>
        <button onClick={onClose} className="w-full text-sm text-muted-foreground py-1 active:opacity-70">
          Maybe later
        </button>
      </div>
    </div>
  );
}