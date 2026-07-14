import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Build unique filament groups from spools (brand+material+color_name)
function buildGroups(spools) {
  const map = {};
  for (const s of spools) {
    if (s.is_empty) continue;
    const key = `${s.material}||${s.color_name}||${s.brand || ""}`;
    if (!map[key]) {
      map[key] = {
        key,
        brand: s.brand || "",
        material: s.material,
        color_name: s.color_name,
        color_hex: s.color_hex || "#888",
        totalGrams: 0,
        label: `${s.brand ? s.brand + " " : ""}${s.color_name} (${s.material})`,
      };
    }
    map[key].totalGrams += s.current_weight_grams || 0;
  }
  return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
}

export default function QuickJobForm({ spools, initialData, onSave, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const groups = useMemo(() => buildGroups(spools), [spools]);

  // Convert existing usages (which used spool_id) to group keys on load
  const [usages, setUsages] = useState(() => {
    if (initialData?.usages?.length > 0) {
      return initialData.usages.map(u => {
        // Try to match back to a group
        const grp = groups.find(g => g.key === u.group_key) ||
          groups.find(g => g.material === u.material && g.color_name === u.color_name);
        return {
          group_key: u.group_key || grp?.key || "",
          label: u.spool_label || grp?.label || "",
          color_hex: u.spool_color_hex || grp?.color_hex || "#888",
          material: u.material || grp?.material || "",
          color_name: u.color_name || grp?.color_name || "",
          brand: u.brand || grp?.brand || "",
          grams: u.grams || "",
        };
      });
    }
    return [{ group_key: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "", grams: "" }];
  });

  const [saving, setSaving] = useState(false);

  const setUsageGrams = (i, val) => {
    setUsages(prev => prev.map((u, idx) => idx === i ? { ...u, grams: val } : u));
  };

  const selectGroup = (i, key) => {
    const grp = groups.find(g => g.key === key);
    if (!grp) return;
    setUsages(prev => prev.map((u, idx) => idx === i ? {
      ...u,
      group_key: grp.key,
      label: grp.label,
      color_hex: grp.color_hex,
      material: grp.material,
      color_name: grp.color_name,
      brand: grp.brand,
    } : u));
  };

  const addRow = () => setUsages(prev => [
    ...prev,
    { group_key: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "", grams: "" }
  ]);

  const removeRow = (i) => setUsages(prev => prev.filter((_, idx) => idx !== i));

  // How many times can this job run given current stock?
  const runsAvailable = useMemo(() => {
    const validUsages = usages.filter(u => u.group_key && parseFloat(u.grams) > 0);
    if (validUsages.length === 0) return null;
    let min = Infinity;
    for (const u of validUsages) {
      const grp = groups.find(g => g.key === u.group_key);
      const total = grp?.totalGrams || 0;
      const needed = parseFloat(u.grams);
      min = Math.min(min, Math.floor(total / needed));
    }
    return min === Infinity ? 0 : min;
  }, [usages, groups]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validUsages = usages
      .filter(u => u.group_key && parseFloat(u.grams) > 0)
      .map(u => ({
        group_key: u.group_key,
        spool_label: u.label,
        spool_color_hex: u.color_hex,
        material: u.material,
        color_name: u.color_name,
        brand: u.brand,
        grams: parseFloat(u.grams),
      }));
    if (!name.trim() || validUsages.length === 0) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), usages: validUsages });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">{initialData ? "Edit Job" : "New Quick Job"}</span>
      </div>

      <form onSubmit={handleSubmit} className="p-4 pb-32 space-y-5">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {u.group_key && (
                      <div className="w-4 h-4 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: u.color_hex }} />
                    )}
                    <span className="text-xs text-muted-foreground">{u.label || "Select filament group…"}</span>
                  </div>
                  {usages.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="p-1 rounded active:bg-muted">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                <select
                  value={u.group_key}
                  onChange={e => selectGroup(i, e.target.value)}
                  className="w-full h-11 bg-muted border border-border text-foreground text-sm rounded-md px-3"
                >
                  <option value="">Choose filament…</option>
                  {groups.map(g => (
                    <option key={g.key} value={g.key}>
                      {g.label} — {Math.round(g.totalGrams)}g total
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={u.grams}
                    onChange={e => setUsageGrams(i, e.target.value)}
                    placeholder="Grams needed"
                    min="0.1"
                    step="0.1"
                    className="h-11 bg-muted border-border text-foreground"
                  />
                  <span className="text-sm text-muted-foreground flex-shrink-0">g</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="mt-3 w-full h-11 border border-dashed border-border rounded-xl text-sm text-muted-foreground flex items-center justify-center gap-2 active:bg-muted"
          >
            <Plus className="w-4 h-4" /> Add another filament
          </button>
        </div>

        {runsAvailable !== null && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${runsAvailable > 0 ? "bg-green-950/50 border border-green-800/50 text-green-300" : "bg-red-950/50 border border-red-800/50 text-red-300"}`}>
            {runsAvailable > 0
              ? `✓ Current stock can run this job ${runsAvailable} time${runsAvailable !== 1 ? "s" : ""}`
              : "✗ Not enough filament in stock to run this job"}
          </div>
        )}

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