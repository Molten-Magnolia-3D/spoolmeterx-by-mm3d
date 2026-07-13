import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, RefreshCw, Tag, Users, Database, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TABS = ["Promo Codes", "Subscriptions", "Barcode Library", "All Spools"];

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
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-foreground text-lg">Admin Panel</span>
      </div>

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
        {tab === "Subscriptions" && <SubscriptionsTab />}
        {tab === "Barcode Library" && <BarcodeLibraryTab />}
        {tab === "All Spools" && <AllSpoolsTab />}
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
  const [form, setForm] = useState({ code: "", plan: "pro", duration_days: 30, spool_limit: 999999, max_uses: 1, notes: "", is_active: true });
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
      spool_limit: parseInt(form.spool_limit) || 999999,
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
    setForm({ code: "", plan: "pro", duration_days: 30, spool_limit: 999999, max_uses: 1, notes: "", is_active: true });
    load();
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({ code: c.code, plan: c.plan, duration_days: c.duration_days, spool_limit: c.spool_limit, max_uses: c.max_uses, notes: c.notes || "", is_active: c.is_active });
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
        <Button size="sm" onClick={() => { setEditId(null); setForm({ code: "", plan: "pro", duration_days: 30, spool_limit: 999999, max_uses: 1, notes: "", is_active: true }); setShowForm(true); }} className="gap-1.5">
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
              <select value={form.plan} onChange={e => set("plan", e.target.value)} className="h-10 w-full bg-muted border border-border text-foreground text-sm rounded-md px-2">
                {["trial","hobby","pro","lifetime"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Duration (days)</Label>
              <Input type="number" min="1" value={form.duration_days} onChange={e => set("duration_days", e.target.value)} className="h-10 bg-muted border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Spool limit</Label>
              <Input type="number" min="1" value={form.spool_limit} onChange={e => set("spool_limit", e.target.value)} className="h-10 bg-muted border-border text-foreground" />
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
                  <p className="text-xs text-muted-foreground mt-1">{c.duration_days} days · {c.spool_limit >= 999999 ? "Unlimited" : c.spool_limit} spools · {c.uses || 0}/{c.max_uses} uses</p>
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

// ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.UserSubscription.list("-created_date", 200);
    setSubs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (s) => {
    setEditId(s.id);
    setEditForm({
      plan: s.plan,
      status: s.status,
      spool_limit: s.spool_limit ?? 999999,
      is_beta: s.is_beta ?? false,
      trial_ends_at: s.trial_ends_at ? s.trial_ends_at.split("T")[0] : "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      plan: editForm.plan,
      status: editForm.status,
      spool_limit: parseInt(editForm.spool_limit) || 999999,
      is_beta: editForm.is_beta,
    };
    if (editForm.trial_ends_at) payload.trial_ends_at = new Date(editForm.trial_ends_at).toISOString();
    await base44.entities.UserSubscription.update(editId, payload);
    setSaving(false);
    setEditId(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{subs.length} users</p>
        <button onClick={load} className="p-2 rounded-lg bg-muted active:opacity-70"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : subs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No subscriptions yet.</p>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4">
              {editId === s.id ? (
                <div className="space-y-3">
                  <p className="text-xs font-mono text-muted-foreground truncate">{s.user_email}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Plan</Label>
                      <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))} className="h-9 w-full bg-muted border border-border text-foreground text-sm rounded-md px-2">
                        {["free","trial","hobby","pro","lifetime"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                      <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="h-9 w-full bg-muted border border-border text-foreground text-sm rounded-md px-2">
                        {["pending","active","canceled","ended"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Spool limit</Label>
                      <Input type="number" value={editForm.spool_limit} onChange={e => setEditForm(f => ({ ...f, spool_limit: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Trial ends</Label>
                      <Input type="date" value={editForm.trial_ends_at} onChange={e => setEditForm(f => ({ ...f, trial_ends_at: e.target.value }))} className="h-9 bg-muted border-border text-foreground" />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => setEditForm(f => ({ ...f, is_beta: !f.is_beta }))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${editForm.is_beta ? "bg-primary" : "bg-muted"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${editForm.is_beta ? "left-5" : "left-0.5"}`} />
                      </button>
                      <span className="text-sm text-foreground">Beta user (trial never expires)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="flex-1 border-border text-foreground">Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Saving…" : "Save"}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.user_email}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">{s.plan}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${s.status === "active" ? "bg-green-900/40 text-green-400" : "bg-muted text-muted-foreground"}`}>{s.status}</span>
                      {s.is_beta && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400">Beta</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.spool_limit >= 999999 ? "Unlimited" : s.spool_limit} spools</p>
                  </div>
                  <button onClick={() => startEdit(s)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:opacity-70 flex-shrink-0">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
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
                      <select value={editForm.material} onChange={e => setEditForm(f => ({ ...f, material: e.target.value }))} className="h-9 w-full bg-muted border border-border text-foreground text-sm rounded-md px-2">
                        {["PLA","PETG","ABS","ASA","TPU"].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
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
                  <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: m.color_hex || "#888" }} />
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
              <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
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