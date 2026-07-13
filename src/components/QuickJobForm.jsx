import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickJobForm({ spools, initialData, onSave, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [usages, setUsages] = useState(
    initialData?.usages?.length > 0
      ? initialData.usages
      : [{ spool_id: "", spool_label: "", spool_color_hex: "", grams: "" }]
  );
  const [saving, setSaving] = useState(false);

  const setUsage = (i, key, val) => {
    setUsages(prev => prev.map((u, idx) => idx === i ? { ...u, [key]: val } : u));
  };

  const selectSpool = (i, spoolId) => {
    const spool = spools.find(s => s.id === spoolId);
    if (!spool) return;
    setUsages(prev => prev.map((u, idx) => idx === i ? {
      ...u,
      spool_id: spool.id,
      spool_label: `${spool.brand} ${spool.color_name} (${spool.material})`,
      spool_color_hex: spool.color_hex || "#888",
    } : u));
  };

  const addRow = () => setUsages(prev => [...prev, { spool_id: "", spool_label: "", spool_color_hex: "", grams: "" }]);
  const removeRow = (i) => setUsages(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validUsages = usages.filter(u => u.spool_id && u.grams > 0).map(u => ({
      ...u,
      grams: parseFloat(u.grams),
    }));
    if (!name.trim() || validUsages.length === 0) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), usages: validUsages });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">{initialData ? "Edit Job" : "New Quick Job"}</span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-10 space-y-5">
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Job Name *</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Benchy, Client Bracket v3"
            required
            className="h-12 bg-muted border-border text-foreground"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Description (optional)</Label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Standard 0.2mm profile"
            className="h-12 bg-muted border-border text-foreground"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Filament Usage *</Label>
          <div className="space-y-3">
            {usages.map((u, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {u.spool_color_hex && (
                    <div className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: u.spool_color_hex }} />
                  )}
                  <span className="text-xs text-muted-foreground flex-1 truncate">{u.spool_label || "Select a spool"}</span>
                  {usages.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="p-1 rounded active:bg-muted">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                <Select value={u.spool_id} onValueChange={v => selectSpool(i, v)}>
                  <SelectTrigger className="h-11 bg-muted border-border text-foreground">
                    <SelectValue placeholder="Choose spool…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {spools.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
                          <span>{s.brand} {s.color_name} ({s.material}) — {Math.round(s.current_weight_grams)}g left</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={u.grams}
                    onChange={e => setUsage(i, "grams", e.target.value)}
                    placeholder="Grams"
                    min="0.1"
                    step="0.1"
                    className="h-11 bg-muted border-border text-foreground"
                  />
                  <span className="text-sm text-muted-foreground">g</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 w-full h-11 border border-dashed border-border rounded-xl text-sm text-muted-foreground flex items-center justify-center gap-2 active:bg-muted"
          >
            <Plus className="w-4 h-4" /> Add another spool
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 border-border text-foreground">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 h-12 bg-primary text-primary-foreground font-semibold">
            {saving ? "Saving…" : "Save Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}