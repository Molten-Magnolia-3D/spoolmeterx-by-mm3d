import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QuickWeightSheet({ spool, onClose, onSaved }) {
  const [grams, setGrams] = useState("");
  const [mode, setMode] = useState("used"); // "used" | "set"
  const [jobName, setJobName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!spool) return null;

  const handleSave = async () => {
    const val = parseFloat(grams);
    if (!val || val <= 0) return;
    setSaving(true);

    const weightBefore = spool.current_weight_grams;
    let weightAfter, gramsUsed;

    if (mode === "used") {
      gramsUsed = val;
      weightAfter = Math.max(0, weightBefore - val);
    } else {
      weightAfter = val;
      gramsUsed = Math.max(0, weightBefore - val);
    }

    // Optimistic close — caller's onSaved updates UI immediately
    onSaved({ ...spool, current_weight_grams: weightAfter });
    onClose();

    try {
      await base44.entities.Spool.update(spool.id, { current_weight_grams: weightAfter });
      await base44.entities.UsageLog.create({
        spool_id: spool.id,
        grams_used: gramsUsed,
        job_name: jobName || "Quick log",
        weight_before: weightBefore,
        weight_after: weightAfter,
      });
    } catch {
      // Revert: reload real data
      onSaved(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="w-full bg-card border-t border-border rounded-t-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{spool.brand} — {spool.color_name}</p>
            <p className="text-xs text-muted-foreground">{spool.material} · {Math.round(spool.current_weight_grams)}g remaining</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg active:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("used")}
            className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-colors ${mode === "used" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
          >
            <Minus className="w-3.5 h-3.5 inline mr-1" />
            Grams used
          </button>
          <button
            onClick={() => setMode("set")}
            className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-colors ${mode === "set" ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
          >
            Set new weight
          </button>
        </div>

        <Input
          type="number"
          min="0"
          placeholder={mode === "used" ? "Grams used (e.g. 45)" : "New weight in grams"}
          value={grams}
          onChange={e => setGrams(e.target.value)}
          className="h-12 bg-muted border-border text-foreground text-lg text-center"
          autoFocus
        />

        <Input
          placeholder="Job name (optional)"
          value={jobName}
          onChange={e => setJobName(e.target.value)}
          className="h-10 bg-muted border-border text-foreground text-sm"
        />

        {grams && parseFloat(grams) > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {mode === "used"
              ? `New weight: ${Math.max(0, Math.round(spool.current_weight_grams - parseFloat(grams)))}g`
              : `Grams used: ${Math.max(0, Math.round(spool.current_weight_grams - parseFloat(grams)))}g`}
          </p>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || !grams || parseFloat(grams) <= 0}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold"
        >
          {saving ? "Saving…" : "Log Usage"}
        </Button>
      </div>
    </div>
  );
}