import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

const REASONS = [
  "I no longer need this app",
  "It's missing features I need",
  "I found a better alternative",
  "It's too complicated to use",
  "I have privacy concerns",
  "I'm getting too many notifications",
  "Other",
];

export default function DeleteAccountDialog({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [other, setOther] = useState("");
  const [step, setStep] = useState("reason"); // "reason" | "confirm"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canContinue = selected !== null && (selected !== "Other" || other.trim().length > 0);

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await base44.auth.me();
      // Log feedback before deletion
      await base44.entities.Feedback.create({
        user_email: user?.email || "",
        user_id: user?.id || "",
        type: "general",
        message: `[Account Deletion] Reason: ${selected}${selected === "Other" ? ` — ${other.trim()}` : ""}`,
        status: "new",
      });
      // Scrub all user-owned entity data in parallel
      await Promise.all([
        base44.entities.Spool.deleteMany({}),
        base44.entities.QuickJob.deleteMany({}),
        base44.entities.UsageLog.deleteMany({}),
        base44.entities.BarcodeMapping.deleteMany({}),
        base44.entities.UserSubscription.deleteMany({}),
      ]);
      // Sign out — platform removes the auth session server-side
      await base44.auth.logout("/login");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-bold text-foreground">
            {step === "reason" ? "Before you go…" : "Are you sure?"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full active:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {step === "reason" ? (
          <>
            <p className="px-5 text-sm text-muted-foreground mb-4">
              Help us improve! Why are you deleting your account?
            </p>
            <div className="px-5 space-y-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                    selected === r
                      ? "bg-primary/20 border-primary text-foreground"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
              {selected === "Other" && (
                <textarea
                  autoFocus
                  placeholder="Tell us more…"
                  value={other}
                  onChange={e => setOther(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <Button variant="outline" className="flex-1 border-border text-foreground" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={!canContinue}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pb-3 space-y-3">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <p className="font-semibold mb-1">This cannot be undone.</p>
                <p>All your spools, usage logs, and settings will be permanently deleted.</p>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <Button variant="outline" className="flex-1 border-border text-foreground" onClick={() => setStep("reason")} disabled={loading}>
                Go Back
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
                {loading ? "Deleting…" : "Delete Account"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}