import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, ScanBarcode, Package, Zap } from "lucide-react";
import SpoolCard from "@/components/SpoolCard";
import LowStockWidget from "@/components/LowStockWidget";

const MATERIALS = ["All", "PLA", "PETG", "ABS", "ASA", "TPU"];

export default function Dashboard() {
  const [spools, setSpools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showEmpty, setShowEmpty] = useState(false);

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

  const visible = spools.filter(s => {
    if (!showEmpty && s.is_empty) return false;
    if (filter !== "All" && s.material !== filter) return false;
    return true;
  });

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

      <div className="px-4 py-4 space-y-4">
        {/* Low Stock Widget */}
        {!loading && <LowStockWidget spools={spools} />}

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
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No spools found</p>
            <p className="text-sm text-muted-foreground mt-1">Tap Scan or Add to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(s => <SpoolCard key={s.id} spool={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}