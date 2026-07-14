import { useState, useEffect } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh.jsx";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubPageHeader from "@/components/SubPageHeader";
import NativeSelect from "@/components/NativeSelect";
import BarcodeScanner from "@/components/BarcodeScanner";

const MATERIALS_DEFAULT = ["PLA", "PETG", "ABS", "ASA", "TPU"];

const BLANK_FORM = { barcode_value: "", brand: "", material: "PLA", color_name: "", color_hex: "", weight_grams: "", notes: "" };

export default function MyBarcodesPage() {

  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState(MATERIALS_DEFAULT);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const load = async () => {
    setLoading(true);
    const [data, types] = await Promise.all([
      base44.entities.BarcodeMapping.list("-created_date", 500),
      base44.entities.FilamentType.filter({ is_active: true }),
    ]);
    setMappings(data);
    if (types.length > 0) {
      setMaterials([...MATERIALS_DEFAULT, ...types.map(t => t.name).filter(n => !MATERIALS_DEFAULT.includes(n))]);
    }
    setLoading(false);
  };

  const { containerProps, PullIndicator } = usePullToRefresh(load);

  useEffect(() => { load(); }, []);

  const filtered = mappings.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.barcode_value?.toLowerCase().includes(q) || m.brand?.toLowerCase().includes(q) || m.color_name?.toLowerCase().includes(q);
  });

  const openNew = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setForm({
      barcode_value: m.barcode_value,
      brand: m.brand,
      material: m.material,
      color_name: m.color_name || "",
      color_hex: m.color_hex || "",
      weight_grams: m.weight_grams || "",
      notes: m.notes || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.barcode_value.trim() || !form.brand.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      barcode_value: form.barcode_value.trim(),
      brand: form.brand.trim(),
      weight_grams: form.weight_grams ? parseFloat(form.weight_grams) : undefined,
    };
    if (editId) {
      await base44.entities.BarcodeMapping.update(editId, payload);
    } else {
      await base44.entities.BarcodeMapping.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this barcode mapping?")) return;
    await base44.entities.BarcodeMapping.delete(id);
    setMappings(prev => prev.filter(m => m.id !== id));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background" {...containerProps}>
      {PullIndicator}
      <SubPageHeader
        title="My Barcodes"
        right={<Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" /> Add</Button>}
      />

      <div className="p-4 space-y-4 pb-24">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search barcode, brand, color…"
          className="h-10 bg-muted border-border text-foreground"
        />

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="font-semibold text-foreground">{editId ? "Edit Barcode" : "New Barcode"}</p>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Barcode Value *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.barcode_value}
                  onChange={e => set("barcode_value", e.target.value)}
                  placeholder="Scan or type barcode"
                  className="h-10 bg-muted border-border text-foreground font-mono flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center active:opacity-70 flex-shrink-0"
                >
                  <ScanBarcode className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Brand *</Label>
              <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Bambu Lab" className="h-10 bg-muted border-border text-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Material</Label>
                <NativeSelect value={form.material} onChange={v => set("material", v)} options={materials} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Color name</Label>
                <Input value={form.color_name} onChange={e => set("color_name", e.target.value)} placeholder="e.g. Matte Black" className="h-10 bg-muted border-border text-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Color hex</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.color_hex || "#888888"} onChange={e => set("color_hex", e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 flex-shrink-0" />
                  <Input value={form.color_hex} onChange={e => set("color_hex", e.target.value)} placeholder="#888888" className="h-10 bg-muted border-border text-foreground font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Weight (g)</Label>
                <Input type="number" value={form.weight_grams} onChange={e => set("weight_grams", e.target.value)} placeholder="1000" className="h-10 bg-muted border-border text-foreground" />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
              <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes" className="h-10 bg-muted border-border text-foreground" />
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground">Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.barcode_value.trim() || !form.brand.trim()} className="flex-1">
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ScanBarcode className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No barcodes saved yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add barcodes to auto-fill spool info when scanning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: m.color_hex || "#888" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{m.brand} — {m.color_name || "Unknown color"}</p>
                  <p className="text-xs text-muted-foreground">{m.material} · {m.weight_grams ? `${m.weight_grams}g` : "weight not set"}</p>
                  <p className="text-xs font-mono text-muted-foreground/70">{m.barcode_value}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { set("barcode_value", code); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}