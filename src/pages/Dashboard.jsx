import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, ScanBarcode, Package, Zap, Settings, X } from "lucide-react";
import SpoolGroupCard from "@/components/SpoolGroupCard";
import LowStockWidget from "@/components/LowStockWidget";
import { Input } from "@/components/ui/input";

const MATERIALS = ["All", "PLA", "PETG", "ABS", "ASA", "TPU"];

export default function Dashboard() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showEmpty, setShowEmpty] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [criticalThreshold, setCriticalThreshold] = useState(() => parseInt(localStorage.getItem("ff_critical") || "100"));
  const [lowThreshold, setLowThreshold] = useState(() => parseInt(localStorage.getItem("ff_low") || "300"));

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

  const filtered = spools.filter(s => {
    if (!showEmpty && s.is_empty) return false;
    if (filter !== "All" && s.material !== filter) return false;
    return true;
  });

  // Group by brand + material + color_name + color_hex
  const groupMap = {};
  for (const s of filtered) {
    const key = `${s.brand}||${s.material}||${s.color_name}||${s.color_hex || ""}`;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(s);
  }
  const groups = Object.values(groupMap);

  const active = spools.filter(s => !s.is_empty);

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
            <Link
              to="/quick-jobs"
              className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80"
            >
              <Zap className="w-4 h-4" />
              Jobs
            </Link>
            <Link
              to="/scan"
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80"
            >
              <ScanBarcode className="w-4 h-4" />
              Scan
            </Link>
            <Link
              to="/add"
              className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold active:opacity-80"
            >
              <Plus className="w-4 h-4" />
              Add
            </Link>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border bg-card px-4 py-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">Low Stock Thresholds</span>
            <button onClick={() => setShowSettings(false)} className="p-1 rounded active:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
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
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Low Stock Widget */}
        {!loading && <LowStockWidget spools={spools} criticalThreshold={criticalThreshold} lowThreshold={lowThreshold} />}

        {/* Material Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MATERIALS.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
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
            {groups.map((group, i) => <SpoolGroupCard key={i} spools={group} />)}
          </div>
        )}
      </div>
    </div>
  );
}