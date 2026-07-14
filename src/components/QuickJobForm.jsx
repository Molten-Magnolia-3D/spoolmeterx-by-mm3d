import { useState, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Layers, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NativeSelect from "@/components/NativeSelect";

// Build unique filament groups from spools (material+color_name+brand)
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

function spoolLabel(s) {
  const weight = Math.round(s.current_weight_grams || 0);
  return `${s.brand ? s.brand + " " : ""}${s.color_name} (${s.material}) — ${weight}g`;
}

const EMPTY_ROW = { mode: "group", group_key: "", spool_id: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "", grams: "" };

export default function QuickJobForm({ spools, initialData, onSave, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const activeSpools = useMemo(() => spools.filter(s => !s.is_empty), [spools]);
  const groups = useMemo(() => buildGroups(spools), [spools]);

  const [usages, setUsages] = useState(() => {
    if (initialData?.usages?.length > 0) {
      return initialData.usages.map(u => {
        // Individual spool usage (has spool_id but no group_key)
        if (u.spool_id && !u.group_key) {
          const s = spools.find(sp => sp.id === u.spool_id);
          return {
            mode: "individual",
            group_key: "",
            spool_id: u.spool_id,
            label: u.spool_label || s ? spoolLabel(s) : "",
            color_hex: u.spool_color_hex || s?.color_hex || "#888",
            material: u.material || s?.material || "",
            color_name: u.color_name || s?.color_name || "",
            brand: u.brand || s?.brand || "",
            grams: u.grams || "",
          };
        }
        // Group usage
        const grp = groups.find(g => g.key === u.group_key) ||
          groups.find(g => g.material === u.material && g.color_name === u.color_name);
        return {
          mode: "group",
          group_key: u.group_key || grp?.key || "",
          spool_id: "",
          label: u.spool_label || grp?.label || "",
          color_hex: u.spool_color_hex || grp?.color_hex || "#888",
          material: u.material || grp?.material || "",
          color_name: u.color_name || grp?.color_name || "",
          brand: u.brand || grp?.brand || "",
          grams: u.grams || "",
        };
      });
    }
    return [{ ...EMPTY_ROW }];
  });

  const [saving, setSaving] = useState(false);

  const updateRow = (i, patch) =>
    setUsages(prev => prev.map((u, idx) => idx === i ? { ...u, ...patch } : u));

  const selectGroup = (i, key) => {
    const grp = groups.find(g => g.key === key);
    if (!grp) { updateRow(i, { group_key: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "" }); return; }
    updateRow(i, { group_key: grp.key, spool_id: "", label: grp.label, color_hex: grp.color_hex, material: grp.material, color_name: grp.color_name, brand: grp.brand });
  };

  const selectSpool = (i, id) => {
    const s = spools.find(sp => sp.id === id);
    if (!s) { updateRow(i, { spool_id: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "" }); return; }
    updateRow(i, { spool_id: s.id, group_key: "", label: spoolLabel(s), color_hex: s.color_hex || "#888", material: s.material, color_name: s.color_name, brand: s.brand || "" });
  };

  const setMode = (i, mode) => {
    updateRow(i, { mode, group_key: "", spool_id: "", label: "", color_hex: "#888", material: "", color_name: "", brand: "" });
  };

  // IDs already picked in individual mode (excluding row i)
  const usedSpoolIds = (excludeIdx) => new Set(
    usages.filter((u, i) => i !== excludeIdx && u.mode === "individual" && u.spool_id).map(u => u.spool_id)
  );
  // Group keys already picked (excluding row i)
  const usedGroupKeys = (excludeIdx) => new Set(
    usages.filter((u, i) => i !== excludeIdx && u.mode === "group" && u.group_key).map(u => u.group_key)
  );

  const addRow = () => setUsages(prev => [...prev, { ...EMPTY_ROW }]);
  const removeRow = (i) => setUsages(prev => prev.filter((_, idx) => idx !== i));

  // Runs possible calculation
  const runsAvailable = useMemo(() => {
    const valid = usages.filter(u => (u.group_key || u.spool_id) && parseFloat(u.grams) > 0);
    if (valid.length === 0) return null;
    let min = Infinity;
    for (const u of valid) {
      const needed = parseFloat(u.grams);
      let available = 0;
      if (u.mode === "individual" && u.spool_id) {
        const s = spools.find(sp => sp.id === u.spool_id);
        available = s?.current_weight_grams || 0;
      } else if (u.group_key) {
        const grp = groups.find(g => g.key === u.group_key);
        available = grp?.totalGrams || 0;
      }
      min = Math.min(min, Math.floor(available / needed));
    }
    return min === Infinity ? 0 : Math.max(0, min);
  }, [usages, groups, spools]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validUsages = usages
      .filter(u => (u.group_key || u.spool_id) && parseFloat(u.grams) > 0)
      .map(u => ({
        mode: u.mode,
        group_key: u.group_key || "",
        spool_id: u.spool_id || "",
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
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 pb-3 flex items-center gap-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
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
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Mode toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-border text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setMode(i, "group")}
                      className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${u.mode === "group" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Layers className="w-3 h-3" /> Group
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode(i, "individual")}
                      className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${u.mode === "individual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Package className="w-3 h-3" /> Specific
                    </button>
                  </div>
                  {usages.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="p-1 rounded active:bg-muted ml-auto">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                {/* Color preview + selection label */}
                {(u.group_key || u.spool_id) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10" style={{ backgroundColor: u.color_hex }} />
                    <span className="text-xs text-muted-foreground truncate">{u.label}</span>
                  </div>
                )}

                {/* Selector */}
                {u.mode === "group" ? (
                  <NativeSelect
                    value={u.group_key}
                    onChange={v => selectGroup(i, v)}
                    placeholder="Choose filament group…"
                    className="h-11"
                    options={groups.map(g => {
                      const taken = usedGroupKeys(i).has(g.key);
                      return { value: g.key, label: `${taken ? "✗ " : ""}${g.label} — ${Math.round(g.totalGrams)}g total` };
                    })}
                  />
                ) : (
                  <NativeSelect
                    value={u.spool_id}
                    onChange={v => selectSpool(i, v)}
                    placeholder="Choose specific spool…"
                    className="h-11"
                    options={activeSpools.map(s => {
                      const taken = usedSpoolIds(i).has(s.id);
                      return { value: s.id, label: `${taken ? "✗ " : ""}${spoolLabel(s)}` };
                    })}
                  />
                )}

                {/* Grams input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={u.grams}
                    onChange={e => updateRow(i, { grams: e.target.value })}
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