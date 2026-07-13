import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MATERIALS = ["PLA", "PETG", "ABS", "ASA", "TPU"];
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

export default function SpoolForm({ initialData = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    brand: "",
    material: "PLA",
    color_name: "",
    color_hex: "#3182ce",
    starting_weight_grams: 1000,
    current_weight_grams: 1000,
    purchase_price_per_kg: "",
    printer_slot: "",
    barcode: "",
    notes: "",
    date_opened: new Date().toISOString().split("T")[0],
    is_empty: false,
    ...initialData,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    data.starting_weight_grams = parseFloat(data.starting_weight_grams) || 0;
    data.current_weight_grams = parseFloat(data.current_weight_grams) || 0;
    if (data.purchase_price_per_kg) data.purchase_price_per_kg = parseFloat(data.purchase_price_per_kg);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Brand *</Label>
        <Input
          value={form.brand}
          onChange={e => set("brand", e.target.value)}
          placeholder="e.g. Bambu, Prusament, Hatchbox"
          required
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      {/* Material */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Material *</Label>
        <Select value={form.material} onValueChange={v => set("material", v)}>
          <SelectTrigger className="h-12 bg-muted border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {MATERIALS.map(m => (
              <SelectItem key={m} value={m} className="text-foreground">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Color Name *</Label>
        <Input
          value={form.color_name}
          onChange={e => set("color_name", e.target.value)}
          placeholder="e.g. Galaxy Black, Cool Grey"
          required
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

      {/* Color Hex Picker */}
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Color</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => { set("color_hex", c.hex); set("color_name", form.color_name || c.name); }}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{
                backgroundColor: c.hex,
                borderColor: form.color_hex === c.hex ? "white" : "transparent",
              }}
              title={c.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.color_hex}
            onChange={e => set("color_hex", e.target.value)}
            className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
          />
          <Input
            value={form.color_hex}
            onChange={e => set("color_hex", e.target.value)}
            className="h-10 bg-muted border-border text-foreground font-mono text-sm"
          />
          <div className="w-10 h-10 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: form.color_hex }} />
        </div>
      </div>

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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-muted-foreground mb-1 block">Price per kg ($)</Label>
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
          <Label className="text-sm text-muted-foreground mb-1 block">Printer Slot</Label>
          <Input
            value={form.printer_slot}
            onChange={e => set("printer_slot", e.target.value)}
            placeholder="e.g. A1, Slot 2"
            className="h-12 bg-muted border-border text-foreground"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">Barcode</Label>
        <Input
          value={form.barcode}
          onChange={e => set("barcode", e.target.value)}
          placeholder="Barcode value"
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
        <Label className="text-sm text-muted-foreground mb-1 block">Notes</Label>
        <Input
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Optional notes"
          className="h-12 bg-muted border-border text-foreground"
        />
      </div>

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