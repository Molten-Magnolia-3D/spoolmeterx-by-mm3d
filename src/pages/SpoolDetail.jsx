import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Minus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SpoolForm from "@/components/SpoolForm";

const MATERIAL_COLORS = {
  PLA: "bg-blue-500/20 text-blue-300",
  PETG: "bg-purple-500/20 text-purple-300",
  ABS: "bg-orange-500/20 text-orange-300",
  ASA: "bg-yellow-500/20 text-yellow-300",
  TPU: "bg-green-500/20 text-green-300",
};

function getStatus(current, starting) {
  if (current <= 0) return { label: "Empty", color: "text-gray-400", bar: "bg-gray-600", ring: "border-gray-600" };
  if (current < 100) return { label: "Critical", color: "text-red-400", bar: "bg-red-500", ring: "border-red-500" };
  if (current < 300) return { label: "Low", color: "text-yellow-400", bar: "bg-yellow-500", ring: "border-yellow-500" };
  return { label: "Full", color: "text-green-400", bar: "bg-green-500", ring: "border-green-500" };
}

export default function SpoolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [spool, setSpool] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("detail"); // detail | edit | log
  const [gramsUsed, setGramsUsed] = useState("");
  const [jobName, setJobName] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    const [s, l] = await Promise.all([
      base44.entities.Spool.get(id),
      base44.entities.UsageLog.filter({ spool_id: id }, "-created_date", 50),
    ]);
    setSpool(s);
    setLogs(l);
    setLoading(false);
  };

  const handleLogUsage = async () => {
    const grams = parseFloat(gramsUsed);
    if (!grams || grams <= 0) return;
    setLogLoading(true);
    const newWeight = Math.max(0, spool.current_weight_grams - grams);
    try {
      await Promise.all([
        base44.entities.UsageLog.create({
          spool_id: id,
          grams_used: grams,
          job_name: jobName || undefined,
          weight_before: spool.current_weight_grams,
          weight_after: newWeight,
        }),
        base44.entities.Spool.update(id, {
          current_weight_grams: newWeight,
          is_empty: newWeight <= 0,
        }),
      ]);
      setGramsUsed("");
      setJobName("");
      setView("detail");
      loadAll();
    } finally {
      setLogLoading(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      await base44.entities.Spool.update(id, data);
      setView("detail");
      loadAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this spool? This cannot be undone.")) return;
    await base44.entities.Spool.delete(id);
    navigate("/");
  };

  const handleMarkEmpty = async () => {
    await base44.entities.Spool.update(id, { is_empty: true, current_weight_grams: 0 });
    loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!spool) return null;

  const pct = Math.max(0, Math.min(100, (spool.current_weight_grams / spool.starting_weight_grams) * 100));
  const status = getStatus(spool.current_weight_grams, spool.starting_weight_grams);
  const matClass = MATERIAL_COLORS[spool.material] || "bg-gray-500/20 text-gray-300";
  const costPerGram = spool.purchase_price_per_kg ? (spool.purchase_price_per_kg / 1000) : null;
  const remainingValue = costPerGram ? (costPerGram * spool.current_weight_grams).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-full active:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground truncate max-w-[180px]">{spool.brand} {spool.color_name}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView(view === "edit" ? "detail" : "edit")}
            className="p-2 rounded-full active:bg-muted"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-full active:bg-muted">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {view === "edit" ? (
        <div className="p-4 pb-8">
          <SpoolForm
            initialData={spool}
            onSubmit={handleEdit}
            onCancel={() => setView("detail")}
            loading={saving}
          />
        </div>
      ) : (
        <div className="p-4 space-y-4 pb-8">
          {/* Hero card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="h-20 w-full" style={{ backgroundColor: spool.color_hex || "#888" }} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-foreground">{spool.brand}</h2>
                <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-muted-foreground mb-2">{spool.color_name}</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${matClass}`}>{spool.material}</span>
                {spool.printer_slot && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Slot: {spool.printer_slot}</span>
                )}
                {spool.is_empty && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">Empty</span>
                )}
              </div>
            </div>
          </div>

          {/* Weight stats */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-3xl font-bold text-foreground">{Math.round(spool.current_weight_grams)}<span className="text-lg text-muted-foreground ml-1">g</span></p>
                <p className="text-xs text-muted-foreground">of {spool.starting_weight_grams}g remaining</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-foreground">{Math.round(pct)}%</p>
                {remainingValue && <p className="text-xs text-muted-foreground">≈ ${remainingValue} value</p>}
              </div>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Actions */}
          {!spool.is_empty && (
            <div className="flex gap-3">
              <Button
                onClick={() => setView(view === "log" ? "detail" : "log")}
                className="flex-1 h-14 text-base font-semibold bg-primary text-primary-foreground"
              >
                <Minus className="w-4 h-4 mr-2" />
                Log Usage
              </Button>
              <Button
                onClick={handleMarkEmpty}
                variant="outline"
                className="h-14 px-4 border-border text-muted-foreground"
              >
                Mark Empty
              </Button>
            </div>
          )}

          {/* Usage Log Form */}
          {view === "log" && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="font-semibold text-foreground">Log Usage</p>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Grams Used</Label>
                <Input
                  type="number"
                  value={gramsUsed}
                  onChange={e => setGramsUsed(e.target.value)}
                  placeholder="e.g. 45"
                  min="0"
                  className="h-12 bg-muted border-border text-foreground text-lg font-semibold"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-1 block">Job Name (optional)</Label>
                <Input
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  placeholder="e.g. Benchy, Client bracket v3"
                  className="h-12 bg-muted border-border text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setView("detail")} className="flex-1 h-12 border-border text-foreground">
                  Cancel
                </Button>
                <Button onClick={handleLogUsage} disabled={logLoading || !gramsUsed} className="flex-1 h-12 bg-primary text-primary-foreground font-semibold">
                  {logLoading ? "Saving…" : "Deduct"}
                </Button>
              </div>
            </div>
          )}

          {/* Spool info */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</p>
            {spool.barcode && <InfoRow label="Barcode" value={spool.barcode} mono />}
            {spool.date_opened && <InfoRow label="Opened" value={spool.date_opened} />}
            {spool.purchase_price_per_kg && <InfoRow label="Price" value={`$${spool.purchase_price_per_kg}/kg`} />}
            {spool.notes && <InfoRow label="Notes" value={spool.notes} />}
          </div>

          {/* Usage History */}
          {logs.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Usage History</p>
              </div>
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{log.job_name || "Print job"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-400">-{log.grams_used}g</p>
                      <p className="text-xs text-muted-foreground">{log.weight_after}g left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}