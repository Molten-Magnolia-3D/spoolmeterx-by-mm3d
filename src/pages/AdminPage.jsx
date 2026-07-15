import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit2, Check, X, RefreshCw, Star, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubPageHeader from "@/components/SubPageHeader";
import NativeSelect from "@/components/NativeSelect";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const TABS = ["Promo Codes", "Users", "Filament Types", "Barcode Library", "All Spools", "Feedback", "Roadmap"];

export default function AdminPage() {
  const [tab, setTab] = useState("Promo Codes");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground mb-2">Access Denied</p>
          <p className="text-muted-foreground mb-4">This page is for admins only.</p>
          <Link to="/" className="text-primary underline">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SubPageHeader title="Admin Panel" />

      {/* Tab bar */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-border">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "Promo Codes" && <PromoCodesTab />}
        {tab === "Users" && <UsersTab />}
        {tab === "Filament Types" && <FilamentTypesTab />}
        {tab === "Barcode Library" && <BarcodeLibraryTab />}
        {tab === "All Spools" && <AllSpoolsTab />}
        {tab === "Feedback" && <FeedbackTab />}
        {tab === "Roadmap" && <RoadmapTab />}
      </div>
    </div>
  );
}

// ── PROMO CODES ────────────────────────────────────────────────────────────────
function PromoCodesTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: "", plan: "pro", duration_days: 30, max_uses: 1, notes: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PromoCode.list("-created_date", 100);
    setCodes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      duration_days: parseInt(form.duration_days) || 30,
      max_uses: parseInt(form.max_uses) || 1,
    };
    if (editId) {
      await base44.entities.PromoCode.update(editId, payload);
    } else {
      await base44.entities.PromoCode.create({ ...payload, uses: 0 });
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm({ code: "", plan: "pro", duration_days: 30, max_uses: 1, notes: "", is_active: true });
    load();
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({ code: c.code, plan: c.plan, duration_days: c.duration_days, max_uses: c.max_uses, notes: c.notes || "", is_active: c.is_active });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promo code?")) return;
    await base44.entities.PromoCode.delete(id);
    load();
  };

  const handleToggle = async (c) => {
    await base44.entities.PromoCode.update(c.id, { is_active: !c.is_active });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{codes.length} codes</p>
        <Button size="sm" onClick={() => { setEditId(null);           setForm({ code: "", plan: "pro", duration_days: 30, max_uses: 1, notes: "", is_active: true }); setShowForm(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Code
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="font-semibold text-foreground">{editId ? "Edit Code" : "New Promo Code"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Code (auto-uppercased)</Label>
              <Input value={form.code} onChange={e => set("code", e.target.value)} placeholder="SUMMER30" className="h-10 bg-muted border-border text-foreground font-mono" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Plan granted</Label>
              <NativeSelect value={form.plan} onChange={v => set("plan", v)} options={["trial","pro"]} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Duration (days)</Label>
              <Input type="number" min="1" value={form.duration_days} onChange={e => set("duration_days", e.target.value)} className="h-10 bg-muted border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Max uses</Label>
              <Input type="number" min="1" value={form.max_uses} onChange={e => set("max_uses", e.target.value)} className="h-10 bg-muted border-border text-foreground" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Notes (internal)</Label>
              <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Who this is for, etc." className="h-10 bg-muted border-border text-foreground" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.code} className="flex-1">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : codes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No promo codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <div key={c.id} className={`bg-card border rounded-xl p-4 ${c.is_active ? "border-border" : "border-border/40 opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-foreground">{c.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">{c.plan}</span>
                    {!c.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Disabled</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.duration_days} days · {c.uses || 0}/{c.max_uses} uses</p>
                  {c.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{c.notes}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleToggle(c)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70" title={c.is_active ? "Disable" : "Enable"}>
                    {c.is_active ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <Check className="w-3.5 h-3.5 text-green-400" />}
                  </button>
                  <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BARCODE LIBRARY ───────────────────────────────────────────────────────────
function BarcodeLibraryTab() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.BarcodeMapping.list("-created_date", 500);
    setMappings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = mappings.filter(m => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return m.barcode_value?.toLowerCase().includes(q) || m.brand?.toLowerCase().includes(q) || m.color_name?.toLowerCase().includes(q);
  });

  const startEdit = (m) => {
    setEditId(m.id);
    setEditForm({ brand: m.brand, material: m.material, color_name: m.color_name, color_hex: m.color_hex || "", weight_grams: m.weight_grams || "", notes: m.notes || "" });
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.BarcodeMapping.update(editId, {
      ...editForm,
      weight_grams: editForm.weight_grams ? parseFloat(editForm.weight_grams) : undefined,
    });
    setSaving(false);
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this barcode mapping?")) return;
    await base44.entities.BarcodeMapping.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mappings.length} barcodes</p>
        <button onClick={load} className="p-2 rounded-lg bg-muted active:opacity-70"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search barcode, brand, color…" className="h-10 bg-muted border-border text-foreground" />

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No barcode mappings found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-4">
              {editId === m.id ? (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground">{m.barcode_value}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Brand</Label>
                      <Input value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Material</Label>
                      <NativeSelect value={editForm.material} onChange={v => setEditForm(f => ({ ...f, material: v }))} options={["PLA","PETG","ABS","ASA","TPU"]} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Color name</Label>
                      <Input value={editForm.color_name} onChange={e => setEditForm(f => ({ ...f, color_name: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Color hex</Label>
                      <Input value={editForm.color_hex} onChange={e => setEditForm(f => ({ ...f, color_hex: e.target.value }))} className="h-9 bg-muted border-border text-foreground font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Weight (g)</Label>
                      <Input type="number" value={editForm.weight_grams} onChange={e => setEditForm(f => ({ ...f, weight_grams: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Notes</Label>
                      <Input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="flex-1 border-border text-foreground">Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: m.color_hex || "#888", boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.18), inset 0 0 0 1.5px rgba(255,255,255,0.12)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.brand} — {m.color_name}</p>
                    <p className="text-xs text-muted-foreground">{m.material} · {m.weight_grams ? `${m.weight_grams}g` : "weight not set"}</p>
                    <p className="text-xs font-mono text-muted-foreground/70">{m.barcode_value}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(m)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
function FeedbackTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Feedback.list("-created_date", 200);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markStatus = async (id, status) => {
    await base44.entities.Feedback.update(id, { status });
    setItems(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    await base44.entities.Feedback.delete(id);
    setItems(prev => prev.filter(f => f.id !== id));
  };

  const filtered = filter === "all" ? items : items.filter(f => f.status === filter);
  const newCount = items.filter(f => f.status === "new").length;

  const typeEmoji = { bug: "🐛", feature: "💡", general: "💬" };
  const statusColors = {
    new: "bg-blue-900/40 text-blue-400",
    reviewed: "bg-yellow-900/40 text-yellow-400",
    resolved: "bg-green-900/40 text-green-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} total {newCount > 0 && <span className="text-blue-400 font-semibold">· {newCount} new</span>}</p>
        <button onClick={load} className="p-2 rounded-lg bg-muted active:opacity-70"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "new", "reviewed", "resolved"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No feedback yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">{typeEmoji[f.type] || "💬"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${statusColors[f.status] || "bg-muted text-muted-foreground"}`}>{f.status}</span>
                  {f.is_beta && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">Beta</span>}
                  {f.rating > 0 && (
                    <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400" />{f.rating}/5
                    </span>
                  )}
                </div>
                <button onClick={() => handleDelete(f.id)} className="w-7 h-7 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70 flex-shrink-0">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{f.user_email || "anonymous"}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{f.message}</p>
              <div className="flex gap-2 pt-1">
                {["new", "reviewed", "resolved"].filter(s => s !== f.status).map(s => (
                  <button key={s} onClick={() => markStatus(f.id, s)}
                    className="text-xs px-3 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground capitalize transition-colors">
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FILAMENT TYPES ────────────────────────────────────────────────────────────
function FilamentTypesTab() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.FilamentType.list("-created_date", 100);
    setTypes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm({ name: "", description: "", is_active: true }); setShowForm(true); };
  const openEdit = (t) => { setEditId(t.id); setForm({ name: t.name, description: t.description || "", is_active: t.is_active ?? true }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { name: form.name.trim().toUpperCase(), description: form.description, is_active: form.is_active };
    if (editId) {
      await base44.entities.FilamentType.update(editId, payload);
    } else {
      await base44.entities.FilamentType.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this filament type?")) return;
    await base44.entities.FilamentType.delete(id);
    load();
  };

  const handleToggle = async (t) => {
    await base44.entities.FilamentType.update(t.id, { is_active: !t.is_active });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{types.length} custom types</p>
          <p className="text-xs text-muted-foreground/60">Built-in: PLA, PETG, ABS, ASA, TPU</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" /> Add Type</Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="font-semibold text-foreground">{editId ? "Edit Filament Type" : "New Filament Type"}</p>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Name (e.g. NYLON, PC, PA12)</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="NYLON" className="h-10 bg-muted border-border text-foreground font-mono uppercase" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description (optional)</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="High-temp engineering filament" className="h-10 bg-muted border-border text-foreground" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : types.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No custom filament types yet.</p>
      ) : (
        <div className="space-y-2">
          {types.map(t => (
            <div key={t.id} className={`bg-card border rounded-xl p-4 flex items-center gap-3 ${t.is_active ? "border-border" : "border-border/40 opacity-60"}`}>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-foreground">{t.name}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                {!t.is_active && <span className="text-xs text-muted-foreground italic">Disabled</span>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => handleToggle(t)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70" title={t.is_active ? "Disable" : "Enable"}>
                  {t.is_active ? <X className="w-3.5 h-3.5 text-muted-foreground" /> : <Check className="w-3.5 h-3.5 text-green-400" />}
                </button>
                <button onClick={() => openEdit(t)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── USERS (merged with subscriptions) ────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [savingTrialDays, setSavingTrialDays] = useState(false);
  const [trialDaysSettingId, setTrialDaysSettingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const [userData, subData, settingsData] = await Promise.all([
      base44.entities.User.list("-created_date", 200),
      base44.entities.UserSubscription.list("-created_date", 200),
      base44.entities.AppSettings.filter({ key: "trial_days" }),
    ]);
    setUsers(userData);
    // Deduplicate subs: keep only the most recent active one per email, else most recent
    const byEmail = {};
    subData.forEach(s => {
      const existing = byEmail[s.user_email];
      if (!existing) { byEmail[s.user_email] = s; return; }
      // prefer active, then most recent
      if (s.status === "active" && existing.status !== "active") { byEmail[s.user_email] = s; }
      else if (s.status !== "active" && existing.status === "active") { return; }
      else if (new Date(s.created_date) > new Date(existing.created_date)) { byEmail[s.user_email] = s; }
    });
    setSubs(byEmail);
    if (settingsData.length > 0) {
      setTrialDays(parseInt(settingsData[0].value) || 14);
      setTrialDaysSettingId(settingsData[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveTrialDays = async () => {
    setSavingTrialDays(true);
    if (trialDaysSettingId) {
      await base44.entities.AppSettings.update(trialDaysSettingId, { value: String(trialDays) });
    } else {
      const rec = await base44.entities.AppSettings.create({ key: "trial_days", value: String(trialDays), description: "Default trial duration in days for new signups" });
      setTrialDaysSettingId(rec.id);
    }
    setSavingTrialDays(false);
  };

  const startEdit = (u) => {
    const sub = subs[u.email];
    setEditUserId(u.id);
    setEditForm({
      plan: sub?.plan || "free",
      status: sub?.status || "active",
      is_beta: sub?.is_beta ?? false,
      trial_ends_at: sub?.trial_ends_at ? sub.trial_ends_at.split("T")[0] : "",
      subId: sub?.id || null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const user = users.find(u => u.id === editUserId);
    const payload = {
      plan: editForm.plan,
      status: editForm.status,
      is_beta: editForm.is_beta,
    };
    if (editForm.trial_ends_at) payload.trial_ends_at = new Date(editForm.trial_ends_at).toISOString();
    if (editForm.subId) {
      await base44.entities.UserSubscription.update(editForm.subId, payload);
    } else {
      await base44.entities.UserSubscription.create({ ...payload, user_email: user.email, user_id: user.id });
    }
    setSaving(false);
    setEditUserId(null);
    load();
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Remove subscription for ${u.email}? This does NOT delete their spools or account data.`)) return;
    const sub = subs[u.email];
    if (sub) await base44.entities.UserSubscription.delete(sub.id);
    load();
  };

  const planColors = { free: "bg-muted text-muted-foreground", trial: "bg-blue-900/40 text-blue-400", pro: "bg-primary/20 text-primary", lifetime: "bg-yellow-900/40 text-yellow-400" };

  return (
    <div className="space-y-4">
      {/* Trial duration setting */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm font-semibold text-foreground mb-1">Default Trial Duration</p>
        <p className="text-xs text-muted-foreground mb-3">Only affects new signups — existing trial end dates are never changed.</p>
        <div className="flex items-center gap-3">
          <Input
            type="number" min="1" max="365" value={trialDays}
            onChange={e => setTrialDays(parseInt(e.target.value) || 14)}
            className="h-9 w-24 bg-muted border-border text-foreground"
          />
          <span className="text-sm text-muted-foreground">days</span>
          <Button size="sm" onClick={saveTrialDays} disabled={savingTrialDays} className="ml-auto">
            {savingTrialDays ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} users</p>
        <button onClick={load} className="p-2 rounded-lg bg-muted active:opacity-70"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const sub = subs[u.email];
            const isEditing = editUserId === u.id;
            return (
              <div key={u.id} className="bg-card border border-border rounded-xl p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.full_name || "No name"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Plan</Label>
                        <select
                          value={editForm.plan}
                          onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                          className="w-full h-9 rounded-md border border-border bg-muted text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                        >
                          {["free","trial","pro"].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          className="w-full h-9 rounded-md border border-border bg-muted text-foreground text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring capitalize"
                        >
                          {["pending","active","canceled","ended"].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      {editForm.plan === "trial" && (
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground mb-1 block">Trial ends</Label>
                          <Input type="date" value={editForm.trial_ends_at} onChange={e => setEditForm(f => ({ ...f, trial_ends_at: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                        </div>
                      )}
                      <div className="col-span-2 flex items-center gap-2">
                        <button
                          onClick={() => setEditForm(f => ({ ...f, is_beta: !f.is_beta }))}
                          className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${editForm.is_beta ? "bg-primary" : "bg-muted"}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editForm.is_beta ? "left-5" : "left-0.5"}`} />
                        </button>
                        <span className="text-sm text-foreground">Beta (trial never expires)</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditUserId(null)} className="flex-1 border-border text-foreground">Cancel</Button>
                      <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.full_name || "No name"} · <span className="capitalize">{u.role}</span> · Joined {new Date(u.created_date).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {sub ? (
                          <>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${planColors[sub.plan] || "bg-muted text-muted-foreground"}`}>{sub.plan}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${sub.status === "active" ? "bg-green-900/40 text-green-400" : "bg-muted text-muted-foreground"}`}>{sub.status}</span>
                            {sub.is_beta && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">Beta</span>}
                            {sub.trial_ends_at && sub.plan === "trial" && (
                              <span className="text-xs text-muted-foreground">expires {new Date(sub.trial_ends_at).toLocaleDateString()}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">free</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => startEdit(u)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDeleteUser(u)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ROADMAP ───────────────────────────────────────────────────────────────────
function RoadmapTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", status: "planned", category: "" });
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Roadmap.list("sort_order", 200);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  const displayed = items.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    return true;
  });

  const openNew = () => {
    setEditId(null);
    // New item gets sort_order = highest existing + 1 (1-based)
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order ?? 0), 0);
    setForm({ title: "", description: "", status: "planned", category: "", sort_order: maxOrder + 1 });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({ title: item.title, description: item.description || "", status: item.status, category: item.category || "", sort_order: item.sort_order ?? 1 });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 1 };
    if (editId) {
      await base44.entities.Roadmap.update(editId, payload);
    } else {
      await base44.entities.Roadmap.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this roadmap item?")) return;
    await base44.entities.Roadmap.delete(id);
    load();
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    // Reorder the displayed list
    const reordered = [...displayed];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(dst, 0, moved);

    // Assign new sort_order values starting at 1
    const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx + 1 }));

    // Optimistic update: merge back into full items list
    const updatedMap = Object.fromEntries(updated.map(i => [i.id, i]));
    setItems(prev => prev.map(i => updatedMap[i.id] || i));

    // Persist
    setReordering(true);
    await base44.entities.Roadmap.bulkUpdate(updated.map(i => ({ id: i.id, sort_order: i.sort_order })));
    setReordering(false);
  };

  const statusColors = { planned: "bg-muted text-muted-foreground", in_progress: "bg-blue-900/40 text-blue-400", done: "bg-green-900/40 text-green-400" };
  const statusLabels = { planned: "Planned", in_progress: "In Progress", done: "Shipped" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} items {reordering && <span className="text-xs text-primary">Saving order…</span>}</p>
        <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="flex-1 h-9 bg-muted border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Shipped</option>
        </select>
        {categories.length > 1 && (
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 h-9 bg-muted border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none">
            {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
          </select>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="font-semibold text-foreground">{editId ? "Edit Item" : "New Roadmap Item"}</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weight history charts" className="h-10 bg-muted border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="More details about this feature…"
                rows={3}
                className="w-full rounded-md border border-border bg-muted text-foreground text-sm px-3 py-2 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                <NativeSelect value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={["planned", "in_progress", "done"]} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Category (optional)</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Mobile, Analytics" className="h-10 bg-muted border-border text-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Sort order</Label>
                <Input type="number" min="1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="h-10 bg-muted border-border text-foreground" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No roadmap items match your filters.</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="roadmap">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {displayed.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-card border border-border rounded-xl p-4 transition-shadow ${snapshot.isDragging ? "shadow-lg border-primary/50" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          <div {...provided.dragHandleProps} className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing flex-shrink-0">
                            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-mono text-muted-foreground">#{item.sort_order}</span>
                              <p className="font-semibold text-foreground text-sm">{item.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                            </div>
                            {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                            {item.category && <p className="text-xs text-primary/70 mt-1">{item.category}</p>}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70">
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70">
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

// ── ALL SPOOLS ────────────────────────────────────────────────────────────────
function AllSpoolsTab() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    // As admin we need service role — this fetches all spools visible to this admin
    const data = await base44.entities.Spool.list("-updated_date", 500);
    setSpools(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = spools.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.brand?.toLowerCase().includes(q) || s.color_name?.toLowerCase().includes(q) || s.material?.toLowerCase().includes(q);
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this spool?")) return;
    await base44.entities.Spool.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{spools.length} spools total</p>
        <button onClick={load} className="p-2 rounded-lg bg-muted active:opacity-70"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brand, color, material…" className="h-10 bg-muted border-border text-foreground" />

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No spools found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className={`bg-card border border-border rounded-xl p-4 flex items-center gap-3 ${s.is_empty ? "opacity-50" : ""}`}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888", boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.18), inset 0 0 0 1.5px rgba(255,255,255,0.12)" }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{s.brand} — {s.color_name}</p>
                <p className="text-xs text-muted-foreground">{s.material} · {s.current_weight_grams}g remaining {s.is_empty ? "· Empty" : ""}</p>
              </div>
              <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center active:opacity-70 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}