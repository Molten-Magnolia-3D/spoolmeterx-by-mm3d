import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  done: { label: "Shipped", color: "bg-green-500", textColor: "text-green-400", badgeBg: "bg-green-900/40 border-green-800/40" },
  in_progress: { label: "In Progress", color: "bg-blue-500", textColor: "text-blue-400", badgeBg: "bg-blue-900/40 border-blue-800/40" },
  planned: { label: "Planned", color: "bg-muted-foreground", textColor: "text-muted-foreground", badgeBg: "bg-muted border-border" },
};

const STATUS_ORDER = ["in_progress", "planned", "done"];

export default function RoadmapPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("order"); // "order" | "status"

  useEffect(() => {
    base44.entities.Roadmap.list("sort_order", 200)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  const filtered = items.filter(i => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterCategory !== "all" && i.category !== filterCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "order") return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (sortBy === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    return 0;
  });

  // Group by status when sort is "status", else flat list
  const renderGrouped = sortBy === "status" && filterStatus === "all";
  const grouped = renderGrouped
    ? STATUS_ORDER.reduce((acc, status) => {
        acc[status] = sorted.filter(i => i.status === status);
        return acc;
      }, {})
    : null;

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: "12px" }}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-foreground font-heading">Roadmap</h1>
            <p className="text-xs text-muted-foreground">What we're building next</p>
          </div>
          <Link to="/" className="text-sm text-primary font-medium">← Home</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 space-y-2">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "in_progress", "planned", "done"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {/* Category filter */}
          {categories.length > 1 && (
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="flex-1 h-9 bg-muted border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none">
              {categories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
          )}
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="flex-1 h-9 bg-muted border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none">
            <option value="order">Sort: Order #</option>
            <option value="status">Sort: Status</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground">No roadmap items match your filters.</p>
        </div>
      ) : renderGrouped ? (
        <div className="px-4 pt-4 space-y-6 pb-4">
          {STATUS_ORDER.map(status => {
            const group = grouped[status];
            if (!group.length) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} flex-shrink-0`} />
                  <h2 className={`text-sm font-bold uppercase tracking-wider ${cfg.textColor}`}>{cfg.label}</h2>
                  <span className="text-xs text-muted-foreground">({group.length})</span>
                </div>
                <div className="space-y-2">
                  {group.map(item => <RoadmapCard key={item.id} item={item} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-2 pb-4">
          {sorted.map(item => <RoadmapCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ item }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <div className={`bg-card border rounded-xl p-4 ${cfg.badgeBg}`}>
      <div className="flex items-start gap-3">
        <span className={`text-xs font-mono text-muted-foreground flex-shrink-0 mt-0.5 w-5 text-right`}>
          {item.sort_order ?? ""}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-foreground text-sm">{item.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.textColor} bg-black/10`}>{cfg.label}</span>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          )}
          {item.category && (
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {item.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}