import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { swatchStyle } from "@/components/SpoolSwatch";
import ColorHistoryBar from "@/components/ColorHistoryBar";
// Select removed — material uses pill buttons now

const BASE_MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU"];
const PRESET_COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Red", hex: "#e53e3e" },
  { name: "Blue", hex: "#3182ce" },
  { name: "Green", hex: "#38a169" },
  { name: "Yellow", hex: "#d69e2e" },
  { name: "Orange", hex: "#dd6b20" },
  { name: "Purple", hex: "#805ad5" },
  { name: "Pink", hex: "#d53f8c" },
  { name: "Gray", hex: "#718096" },
  { name: "Silver", hex: "#a0aec0" },
  { name: "Transparent", hex: "#c5e0f5" },
];

const CHAR_LIMITS = {
  brand: 60,
  color_name: 60,
  printer_slot: 30,
  barcode: 100,
  notes: 200,
  customMaterial: 20,
};

export default function SpoolForm({ initialData = {}, onSubmit, onCancel, loading, showQuantity = false, maxQuantity = 50 }) {
  const [allMaterials, setAllMaterials] = useState(BASE_MATERIALS);

  useEffect(() => {
    base44.entities.FilamentType.filter({ is_active: true }).then(types => {
      const extras = types.map(t => t.name).filter(n => !BASE_MATERIALS.includes(n));
      setAllMaterials([...BASE_MATERIALS, ...extras]);
    }).catch(() => {});
  }, []);

  // Track whether the user picked "Other" and is typing a custom material
  const isCustomMaterial = (mat, knownList) => mat && !knownList.includes(mat);
  const [customMaterial, setCustomMaterial] = useState(
    isCustomMaterial(initialData.material, BASE_MATERIALS) ? initialData.material : ""
  );
  const [materialMode, setMaterialMode] = useState(
    isCustomMaterial(initialData.material, BASE_MATERIALS) ? "other" : (initialData.material || "PLA")
  );

  const [form, setForm] = useState({
    brand: "",
    material: "PLA",
    color_name: "",
    color_type: "single",
    color_hex: "#3182ce",
    color_hex_list: ["#e53e3e", "#3182ce"],
    starting_weight_grams: 1000,
    current_weight_grams: 1000,
    purchase_price_per_kg: "",
    printer_slot: "",
    barcode: "",
    notes: "",
    date_opened: new Date().toISOString().split("T")[0],
    is_empty: false,
    quantity: 1,
    ...initialData,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    // Resolve material from pill selection or custom input
    data.material = materialMode === "other" ? customMaterial.trim().toUpperCase() : materialMode;
    data.starting_weight_grams = parseFloat(data.starting_weight_grams) || 0;
    data.current_weight_grams = parseFloat(data.current_weight_grams) || 0;
    if (data.purchase_price_per_kg !== "" && data.purchase_price_per_kg != null) {
      data.purchase_price_per_kg = parseFloat(data.purchase_price_per_kg);
    } else {
      delete data.purchase_price_per_kg;
    }
    // keep color_hex in sync for backwards compat
    if (data.color_type === "multi" && data.color_hex_list?.length > 0) data.color_hex = data.color_hex_list[0];
    if (data.color_type === "rainbow") data.color_hex = "#ff7700";
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Brand <span className="text-muted-foreground/50">(optional)</span></Label>
        <Input
          value={form.brand}
          onChange={e => set("brand", e.target.value.slice(0, CHAR_LIMITS.brand))}
          placeholder="e.g. Bambu, Prusament, Hatchbox"
          maxLength={CHAR_LIMITS.brand}
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      {/* Material */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Material *</Label>
        <div className="flex flex-wrap gap-2">
          {allMaterials.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMaterialMode(m)}
              className={`px-3 py-1.5 rounded-full text-sm font-mono font-semibold border transition-colors ${materialMode === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
            >
              {m}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMaterialMode("other")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${materialMode === "other" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}
          >
            Other…
          </button>
        </div>
        {materialMode === "other" && (
          <Input
            value={customMaterial}
            onChange={e => setCustomMaterial(e.target.value.slice(0, CHAR_LIMITS.customMaterial))}
            placeholder="e.g. NYLON, PC, PA12-CF"
            required
            maxLength={CHAR_LIMITS.customMaterial}
            className="h-12 bg-muted border-border text-foreground font-mono uppercase mt-2"
          />
        )}
      </div>

      {/* Color */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Color Name *</Label>
        <Input
          value={form.color_name}
          onChange={e => set("color_name", e.target.value.slice(0, CHAR_LIMITS.color_name))}
          placeholder="e.g. Galaxy Black, Cool Grey"
          required
          maxLength={CHAR_LIMITS.color_name}
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      {/* Color Type */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Color Type</Label>
        <div className="flex gap-2">
          {[
            { value: "single", label: "Single" },
            { value: "multi", label: "Multi" },
            { value: "rainbow", label: "🌈 Rainbow" },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("color_type", opt.value)}
              className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-colors ${form.color_type === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="w-full h-8 rounded-lg border border-border" style={swatchStyle(form)} />

      {/* Single color picker */}
      {form.color_type === "single" && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => { set("color_hex", c.hex); set("color_name", form.color_name || c.name); }}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c.hex, borderColor: form.color_hex === c.hex ? "white" : "transparent" }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color_hex} onChange={e => set("color_hex", e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
              <Input value={form.color_hex} onChange={e => set("color_hex", e.target.value)} className="h-10 bg-muted border-border text-foreground font-mono text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Colors Used</Label>
            <ColorHistoryBar
              currentHex={form.color_hex}
              onSelect={entry => { set("color_hex", entry.hex); if (entry.name && !form.color_name) set("color_name", entry.name); }}
            />
          </div>
        </div>
      )}

      {/* Multi color picker */}
      {form.color_type === "multi" && (
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Colors (2–6)</Label>
          <div className="space-y-2">
            {(form.color_hex_list || []).map((hex, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={hex} onChange={e => {
                  const list = [...(form.color_hex_list || [])];
                  list[i] = e.target.value;
                  set("color_hex_list", list);
                }} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 flex-shrink-0" />
                <Input value={hex} onChange={e => {
                  const list = [...(form.color_hex_list || [])];
                  list[i] = e.target.value;
                  set("color_hex_list", list);
                }} className="h-10 bg-muted border-border text-foreground font-mono text-sm" />
                {(form.color_hex_list || []).length > 2 && (
                  <button type="button" onClick={() => set("color_hex_list", (form.color_hex_list || []).filter((_, idx) => idx !== i))} className="p-1.5 rounded active:bg-muted">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
            {(form.color_hex_list || []).length < 6 && (
              <button type="button" onClick={() => set("color_hex_list", [...(form.color_hex_list || []), "#888888"])} className="flex items-center gap-1.5 text-sm text-muted-foreground px-2 py-1.5 rounded active:bg-muted">
                <Plus className="w-4 h-4" /> Add color
              </button>
            )}
          </div>
        </div>
      )}

      {/* Weights */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Starting Weight (g) *</Label>
          <Input
            type="number"
            value={form.starting_weight_grams}
            onChange={e => set("starting_weight_grams", e.target.value)}
            min="0"
            required
            className="h-12 bg-muted border-border text-foreground"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Current Weight (g) *</Label>
          <Input
            type="number"
            value={form.current_weight_grams}
            onChange={e => set("current_weight_grams", e.target.value)}
            min="0"
            required
            className="h-12 bg-muted border-border text-foreground"
          />
        </div>
      </div>

      {/* Optional fields */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Price per kg ($) <span className="text-muted-foreground/50">(optional)</span></Label>
        <Input
          type="number"
          value={form.purchase_price_per_kg}
          onChange={e => set("purchase_price_per_kg", e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Barcode <span className="text-muted-foreground/50">(optional)</span></Label>
        <Input
          value={form.barcode}
          onChange={e => set("barcode", e.target.value.slice(0, CHAR_LIMITS.barcode))}
          placeholder="Barcode value"
          maxLength={CHAR_LIMITS.barcode}
          className="h-12 bg-muted border-border text-foreground font-mono"
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Date Opened</Label>
        <Input
          type="date"
          value={form.date_opened}
          onChange={e => set("date_opened", e.target.value)}
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Notes <span className="text-muted-foreground/50">(optional)</span></Label>
        <Input
          value={form.notes}
          onChange={e => set("notes", e.target.value.slice(0, CHAR_LIMITS.notes))}
          placeholder="Optional notes"
          maxLength={CHAR_LIMITS.notes}
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      {showQuantity && (
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">How many spools?</Label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("quantity", Math.max(1, (parseInt(form.quantity) || 1) - 1))} className="w-12 h-12 rounded-lg bg-muted border border-border text-xl font-bold text-foreground active:opacity-70">−</button>
            <Input
              type="number"
              value={form.quantity}
              onChange={e => set("quantity", Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
              min="1"
              max={maxQuantity}
              className="h-12 bg-muted border-border text-foreground text-center text-lg font-semibold"
            />
            <button type="button" onClick={() => set("quantity", Math.min(maxQuantity, (parseInt(form.quantity) || 1) + 1))} className="w-12 h-12 rounded-lg bg-muted border border-border text-xl font-bold text-foreground active:opacity-70">+</button>
          </div>
          {(parseInt(form.quantity) || 1) > 1 && (
            <p className="text-xs text-muted-foreground mt-1.5">{form.quantity} identical spools will be added to your inventory.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 border-border text-foreground">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} className="flex-1 h-12 bg-primary text-primary-foreground font-semibold">
          {loading ? "Saving…" : "Save Spool"}
        </Button>
      </div>
    </form>
  );
}