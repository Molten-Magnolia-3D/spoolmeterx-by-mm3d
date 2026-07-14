import { useState, useEffect, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh.jsx";
import { base44 } from "@/api/base44Client";
import { syncColorHistory } from "@/hooks/useColorHistory";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Plus, ScanBarcode, Package, Zap, X,
  CheckSquare, Square, Copy, Trash2, Search, Layers, List
} from "lucide-react";
import SpoolGroupCard from "@/components/SpoolGroupCard";
import SpoolCard from "@/components/SpoolCard";
import LowStockWidget from "@/components/LowStockWidget";
import QuickWeightSheet from "@/components/QuickWeightSheet";
import AdBanner from "@/components/AdBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MATERIALS = ["All", "PLA", "PETG", "ABS", "ASA", "TPU"];
const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "weight_asc", label: "Weight: low → high" },
  { value: "weight_desc", label: "Weight: high → low" },
  { value: "brand", label: "Brand A–Z" },
  { value: "color_az", label: "Color A–Z" },
  { value: "color_za", label: "Color Z–A" },
];

export default function Dashboard() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showEmpty, setShowEmpty] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [groupByColor, setGroupByColor] = useState(() => localStorage.getItem("ff_group_by_color") !== "false");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [quickLogSpool, setQuickLogSpool] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const criticalThreshold = parseInt(localStorage.getItem("ff_critical") || "100");
  const lowThreshold = parseInt(localStorage.getItem("ff_low") || "300");
  const groupedAlerts = localStorage.getItem("ff_grouped_alerts") === "true";

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const { plan, spoolLimit, isTrialActive, trialDaysLeft } = useSubscription(currentUser);

  const load = useCallback(async () => {
    const data = await base44.entities.Spool.list("-updated_date", 200);
    setSpools(data);
    setLoading(false);
    syncColorHistory(data);
  }, []);

  const { containerProps, PullIndicator } = usePullToRefresh(load);

  useEffect(() => {
    load();
    const unsub = base44.entities.Spool.subscribe(() => load());
    const onSpoolsUpdated = () => load();
    window.addEventListener("spools-updated", onSpoolsUpdated);
    return () => {
      unsub();
      window.removeEventListener("spools-updated", onSpoolsUpdated);
    };
  }, []);

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
        s.material?.toLowerCase().includes(q) ||
        s.barcode?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === "weight_asc") return (a.current_weight_grams || 0) - (b.current_weight_grams || 0);
    if (sort === "weight_desc") return (b.current_weight_grams || 0) - (a.current_weight_grams || 0);
    if (sort === "brand") return (a.brand || "").localeCompare(b.brand || "");
    if (sort === "color_az") return (a.color_name || "").localeCompare(b.color_name || "");
    if (sort === "color_za") return (b.color_name || "").localeCompare(a.color_name || "");
    return 0;
  });

  // Group by brand + material + color_name + color_hex
  const groups = (() => {
    if (!groupByColor) return filtered.map(s => [s]);
    const groupMap = {};
    for (const s of filtered) {
      const key = `${s.brand}||${s.material}||${s.color_name}||${s.color_hex || ""}`;
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(s);
    }
    return Object.values(groupMap);
  })();

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

  const toggleGroupByColor = () => {
    setGroupByColor(v => {
      localStorage.setItem("ff_group_by_color", !v);
      return !v;
    });
  };

  return (
    <div
      className="min-h-screen bg-background max-w-2xl mx-auto"
      {...containerProps}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 pb-2" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h1 className="text-base font-bold text-foreground font-heading truncate min-w-0">
            SpoolmeterX <span className="text-muted-foreground font-normal text-xs">by MM3D</span>
          </h1>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleSelectMode}
              className={`flex items-center justify-center w-9 h-9 rounded-lg active:opacity-70 ${selectMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {selectMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            </button>
            {!selectMode && <>
              <Link to="/scan" className="flex items-center justify-center w-9 h-9 bg-primary text-primary-foreground rounded-lg active:opacity-80" title="Scan">
                <ScanBarcode className="w-4 h-4" />
              </Link>
              <Link to="/add" className="flex items-center justify-center w-9 h-9 bg-secondary text-secondary-foreground rounded-lg active:opacity-80" title="Add">
                <Plus className="w-4 h-4" />
              </Link>
            </>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{active.length} active spool{active.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Pull-to-refresh indicator */}
      {PullIndicator}

      {/* Trial Banner */}
      {isTrialActive && (
        <div className="px-4 py-2 text-sm flex items-center justify-between gap-2 bg-blue-950/60 border-b border-blue-800/50 text-blue-300">
          <span>🎉 Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left. Full access!</span>
          <Link to="/pricing" className="font-semibold underline underline-offset-2 flex-shrink-0">Upgrade</Link>
        </div>
      )}

      {/* Ad banner for free users */}
      {plan === "free" && !isTrialActive && (
        <div className="px-4 pt-2">
          <AdBanner />
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectMode && (
        <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-2">
          <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-sm text-muted-foreground active:opacity-70">
            {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            <span>All</span>
          </button>
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={selectedIds.size === 0 || bulkLoading} className="gap-1.5 border-border text-foreground">
              <Copy className="w-3.5 h-3.5" />Duplicate
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={selectedIds.size === 0 || bulkLoading} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </Button>
            <Button size="sm" variant="outline" onClick={toggleSelectMode} className="gap-1.5 border-border text-foreground">
              <X className="w-3.5 h-3.5" />Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4 pb-28">
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
        <div className="flex gap-2 overflow-x-auto pb-1">
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

        {/* Toggles row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmpty(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${showEmpty ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showEmpty ? "left-5" : "left-0.5"}`} />
            </button>
            <span className="text-xs text-muted-foreground">Show empty</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleGroupByColor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${groupByColor ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}
            >
              {groupByColor ? <Layers className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              {groupByColor ? "Grouped" : "Individual"}
            </button>
          </div>
        </div>

        {/* Spools List */}
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
            {groups.map((group, i) =>
              groupByColor ? (
                <SpoolGroupCard
                  key={i}
                  spools={group}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onLongPress={!selectMode ? (spool) => setQuickLogSpool(spool) : undefined}
                />
              ) : (
                <SpoolCard
                  key={group[0].id}
                  spool={group[0]}
                  selectMode={selectMode}
                  selected={selectedIds.has(group[0].id)}
                  onToggleSelect={(id, sel) => handleToggleSelect([id], sel)}
                  onLongPress={!selectMode ? (spool) => setQuickLogSpool(spool) : undefined}
                />
              )
            )}
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