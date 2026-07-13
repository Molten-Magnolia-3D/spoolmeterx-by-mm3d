import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Plus, ScanBarcode, Package, Zap, Settings, X,
  CheckSquare, Square, Copy, Trash2, Search, ArrowUpDown, Download, Bell
} from "lucide-react";
import SpoolGroupCard from "@/components/SpoolGroupCard";
import LowStockWidget from "@/components/LowStockWidget";
import QuickWeightSheet from "@/components/QuickWeightSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportSpoolsCsv } from "@/lib/exportCsv";
import { parseCsv } from "@/lib/importCsv";

const MATERIALS = ["All", "PLA", "PETG", "ABS", "ASA", "TPU"];
const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "weight_asc", label: "Weight: low → high" },
  { value: "weight_desc", label: "Weight: high → low" },
  { value: "brand", label: "Brand A–Z" },
];

export default function Dashboard() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showEmpty, setShowEmpty] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [showSettings, setShowSettings] = useState(false);
  const [criticalThreshold, setCriticalThreshold] = useState(() => parseInt(localStorage.getItem("ff_critical") || "100"));
  const [lowThreshold, setLowThreshold] = useState(() => parseInt(localStorage.getItem("ff_low") || "300"));
  const [groupedAlerts, setGroupedAlerts] = useState(() => localStorage.getItem("ff_grouped_alerts") === "true");
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem("ff_notify_email") || "");
  const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem("ff_notify_enabled") === "true");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [quickLogSpool, setQuickLogSpool] = useState(null);
  const [importStatus, setImportStatus] = useState(null); // null | "importing" | "done" | "error"
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    load();
    const unsub = base44.entities.Spool.subscribe(() => load());
    return unsub;
  }, []);

  const load = async () => {
    const data = await base44.entities.Spool.list("-updated_date", 200);
    setSpools(data);
    setLoading(false);
  };

  const active = spools.filter(s => !s.is_empty);

  // Filter
  let filtered = spools.filter(s => {
    if (!showEmpty && s.is_empty) return false;
    if (filter !== "All" && s.material !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        s.brand?.toLowerCase().includes(q) ||
        s.color_name?.toLowerCase().includes(q) ||
        s.material?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === "weight_asc") return (a.current_weight_grams || 0) - (b.current_weight_grams || 0);
    if (sort === "weight_desc") return (b.current_weight_grams || 0) - (a.current_weight_grams || 0);
    if (sort === "brand") return (a.brand || "").localeCompare(b.brand || "");
    return 0; // updated: API already returns -updated_date
  });

  // Group by brand + material + color_name + color_hex
  const groupMap = {};
  for (const s of filtered) {
    const key = `${s.brand}||${s.material}||${s.color_name}||${s.color_hex || ""}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(s);
  }
  const groups = Object.values(groupMap);

  const allFilteredIds = filtered.map(s => s.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));

  const toggleSelectMode = () => { setSelectMode(v => !v); setSelectedIds(new Set()); };

  const handleToggleSelect = (ids, select) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => select ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(allFilteredIds));
  };

  const handleDuplicate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const toDupe = spools.filter(s => selectedIds.has(s.id));
    const copies = toDupe.map(({ id, created_date, updated_date, created_by_id, ...rest }) => ({
      ...rest,
      current_weight_grams: rest.starting_weight_grams,
      date_opened: new Date().toISOString().split("T")[0],
    }));
    await base44.entities.Spool.bulkCreate(copies);
    setSelectedIds(new Set());
    setSelectMode(false);
    setBulkLoading(false);
    await load();
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} spool${selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkLoading(true);
    await Promise.all([...selectedIds].map(id => base44.entities.Spool.delete(id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    setBulkLoading(false);
    await load();
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportStatus("importing");
    setImportMessage("");
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      await base44.entities.Spool.bulkCreate(rows);
      setImportStatus("done");
      setImportMessage(`Imported ${rows.length} spool${rows.length !== 1 ? "s" : ""} successfully.`);
      await load();
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Import failed.");
    }
  };

  const saveNotifyEmail = (email, enabled) => {
    localStorage.setItem("ff_notify_email", email);
    localStorage.setItem("ff_notify_enabled", enabled);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground font-heading">🧵 Filament</h1>
            <p className="text-xs text-muted-foreground">{active.length} active spools</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(v => !v)} className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-muted-foreground active:opacity-70">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSelectMode}
              className={`flex items-center justify-center w-9 h-9 rounded-lg active:opacity-70 ${selectMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              <CheckSquare className="w-4 h-4" />
            </button>
            {!selectMode && <>
              <Link to="/quick-jobs" className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80">
                <Zap className="w-4 h-4" />Jobs
              </Link>
              <Link to="/scan" className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80">
                <ScanBarcode className="w-4 h-4" />Scan
              </Link>
              <Link to="/add" className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80">
                <Plus className="w-4 h-4" />Add
              </Link>
            </>}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border bg-card px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Settings</span>
            <button onClick={() => setShowSettings(false)} className="p-1 rounded active:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Thresholds */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Low Stock Thresholds</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-red-400 font-medium mb-1 block">Critical below (g)</label>
                <Input
                  type="number" min="0" value={criticalThreshold}
                  onChange={e => { const v = parseInt(e.target.value) || 0; setCriticalThreshold(v); localStorage.setItem("ff_critical", v); }}
                  className="h-10 bg-muted border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-yellow-400 font-medium mb-1 block">Low below (g)</label>
                <Input
                  type="number" min="0" value={lowThreshold}
                  onChange={e => { const v = parseInt(e.target.value) || 0; setLowThreshold(v); localStorage.setItem("ff_low", v); }}
                  className="h-10 bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Grouped alerts toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground font-medium">Alert by total filament</p>
              <p className="text-xs text-muted-foreground">Alert when combined grams of a color is low</p>
            </div>
            <button
              onClick={() => setGroupedAlerts(v => { localStorage.setItem("ff_grouped_alerts", !v); return !v; })}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3 relative ${groupedAlerts ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${groupedAlerts ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Email notifications — fully optional */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-foreground font-medium">Email low-stock alerts</p>
              </div>
              <button
                onClick={() => { setNotifyEnabled(v => { saveNotifyEmail(notifyEmail, !v); return !v; }); }}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-3 relative ${notifyEnabled ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifyEnabled ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            {notifyEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Enter an email to receive alerts when stock is critical. Completely optional — leave blank to skip.</p>
                <Input
                  type="email"
                  placeholder="you@example.com (optional)"
                  value={notifyEmail}
                  onChange={e => { setNotifyEmail(e.target.value); saveNotifyEmail(e.target.value, notifyEnabled); }}
                  className="h-10 bg-muted border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground/60">Alerts are sent when you open the app and critical spools are detected.</p>
              </div>
            )}
          </div>

          {/* Export / Import */}
          <div className="border-t border-border pt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSpoolsCsv(spools)}
              className="w-full gap-2 border-border text-foreground"
            >
              <Download className="w-4 h-4" />
              Export Inventory as CSV
            </Button>
            <label className="w-full">
              <div className={`flex items-center justify-center gap-2 h-9 px-3 rounded-md text-sm font-medium border border-border cursor-pointer transition-colors hover:bg-accent ${importStatus === "importing" ? "opacity-50 pointer-events-none" : "text-foreground bg-transparent"}`}>
                <Download className="w-4 h-4 rotate-180" />
                {importStatus === "importing" ? "Importing…" : "Import from CSV"}
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
            </label>
            {importStatus === "done" && <p className="text-xs text-green-400">{importMessage}</p>}
            {importStatus === "error" && <p className="text-xs text-red-400">{importMessage}</p>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const header = "brand,material,color_name,color_hex,starting_weight_grams,current_weight_grams,purchase_price_per_kg,printer_slot,notes,date_opened";
                const example = "Bambu Lab,PLA,Matte Black,#222222,1000,950,19.99,Slot 1,Example spool,2026-01-01";
                const blob = new Blob([header + "\n" + example], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "filament_template.csv";
                a.click();
              }}
              className="w-full gap-2 border-border text-foreground"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </Button>
            <p className="text-xs text-muted-foreground/60">Required: brand, material, color_name, starting_weight_grams, current_weight_grams. Material must be one of: PLA, PETG, ABS, ASA, TPU.</p>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectMode && (
        <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-muted-foreground active:opacity-70">
            {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            <span>{allSelected ? "Deselect all" : "Select all"}</span>
          </button>
          <span className="text-sm text-muted-foreground ml-1">{selectedIds.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={selectedIds.size === 0 || bulkLoading} className="gap-1.5 border-border text-foreground">
              <Copy className="w-3.5 h-3.5" />Duplicate
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={selectedIds.size === 0 || bulkLoading} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Low Stock Widget */}
        {!loading && <LowStockWidget spools={spools} criticalThreshold={criticalThreshold} lowThreshold={lowThreshold} groupedAlerts={groupedAlerts} />}

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search brand, color, material…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 bg-muted border-border text-foreground"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="h-10 bg-muted border border-border text-foreground text-sm rounded-md px-2 flex-shrink-0"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Material Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MATERIALS.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Show empty toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmpty(v => !v)}
            className={`w-10 h-5 rounded-full transition-colors ${showEmpty ? "bg-primary" : "bg-muted"} relative`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showEmpty ? "left-5" : "left-0.5"}`} />
          </button>
          <span className="text-xs text-muted-foreground">Show empty spools</span>
        </div>

        {/* Spools Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No spools found</p>
            <p className="text-sm text-muted-foreground mt-1">Tap Scan or Add to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, i) => (
              <SpoolGroupCard
                key={i}
                spools={group}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onLongPress={!selectMode ? (spool) => setQuickLogSpool(spool) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick weight log sheet */}
      {quickLogSpool && (
        <QuickWeightSheet
          spool={quickLogSpool}
          onClose={() => setQuickLogSpool(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}