/**
 * GroupSettingsSheet — edit shared fields (brand, material, printer_slot, notes)
 * across an entire spool group and apply changes to all spools in the group.
 */
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Layers } from "lucide-react";
import { swatchStyle, swatchBorderStyle } from "@/components/SpoolSwatch";

const BASE_MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU"];

export default function GroupSettingsSheet({ spools, onClose, onSaved }) {
  const sample = spools[0];

  const [form, setForm] = useState({
    brand: sample.brand || "",
    material: sample.material || "PLA",
    printer_slot: sample.printer_slot || "",
    notes: sample.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Spool.bulkUpdate(
      spools.map(s => ({ id: s.id, ...form }))
    );
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ ...swatchStyle(sample), ...swatchBorderStyle }} />
            <div>
              <p className="font-bold text-foreground text-sm">{sample.color_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="w-3 h-3" />
                <span>Editing all {spools.length} spool{spools.length !== 1 ? "s" : ""} in this group</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground bg-primary/10 text-primary rounded-lg px-3 py-2">
          ✏️ Changes apply to all {spools.length} spool{spools.length !== 1 ? "s" : ""} in this color group.
        </p>

        {/* Brand */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Brand</Label>
          <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Bambu, Prusament" className="h-11 bg-muted border-border text-foreground" />
        </div>

        {/* Material */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Material</Label>
          <div className="flex flex-wrap gap-2">
            {BASE_MATERIALS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => set("material", m)}
                className={`px-3 py-1.5 rounded-full text-sm font-mono font-semibold border transition-colors ${form.material === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Printer Slot */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Printer Slot <span className="text-muted-foreground/50">(optional)</span></Label>
          <Input value={form.printer_slot} onChange={e => set("printer_slot", e.target.value)} placeholder="e.g. Slot 1, AMS 2" className="h-11 bg-muted border-border text-foreground" />
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Notes <span className="text-muted-foreground/50">(optional)</span></Label>
          <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes" className="h-11 bg-muted border-border text-foreground" />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 border-border text-foreground">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-11">
            {saving ? "Saving…" : `Apply to ${spools.length} Spool${spools.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}