import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SubPageHeader from "@/components/SubPageHeader";

const STATUS_CONFIG = {
  done: { label: "Shipped", color: "bg-green-500", textColor: "text-green-400", badgeBg: "bg-green-900/40 border-green-800/40" },
  in_progress: { label: "In Progress", color: "bg-blue-500", textColor: "text-blue-400", badgeBg: "bg-blue-900/40 border-blue-800/40" },
  planned: { label: "Planned", color: "bg-muted-foreground", textColor: "text-muted-foreground", badgeBg: "bg-muted border-border" },
};

const STATUS_ORDER = ["in_progress", "planned", "done"];

export default function RoadmapPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Roadmap.list("sort_order", 200)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = items.filter(i => i.status === status);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <SubPageHeader title="Roadmap" fallback="/settings" />

      <div className="px-4 pt-2 pb-4">
        <p className="text-sm text-muted-foreground">What we're building and what's coming next for SpoolmeterX.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground">No roadmap items yet. Check back soon!</p>
        </div>
      ) : (
        <div className="px-4 space-y-6">
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
                  {group.map(item => (
                    <div key={item.id} className={`bg-card border rounded-xl p-4 ${cfg.badgeBg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{item.title}</p>
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}