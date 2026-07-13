import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function LowStockWidget({ spools, criticalThreshold = 100, lowThreshold = 300, groupedAlerts = false }) {
  const active = spools.filter(s => !s.is_empty);

  let criticalItems = [];
  let lowItems = [];

  if (groupedAlerts) {
    // Group by brand + material + color_name, sum total grams
    const groupMap = {};
    for (const s of active) {
      const key = `${s.brand}||${s.material}||${s.color_name}`;
      if (!groupMap[key]) groupMap[key] = { spools: [], total: 0, sample: s };
      groupMap[key].spools.push(s);
      groupMap[key].total += s.current_weight_grams || 0;
    }
    for (const group of Object.values(groupMap)) {
      const entry = {
        id: group.sample.id,
        brand: group.sample.brand,
        color_name: group.sample.color_name,
        color_hex: group.sample.color_hex,
        material: group.sample.material,
        current_weight_grams: group.total,
        spoolCount: group.spools.length,
        // link to the first spool; user can navigate from there
        linkId: group.sample.id,
      };
      if (group.total < criticalThreshold) criticalItems.push(entry);
      else if (group.total < lowThreshold) lowItems.push(entry);
    }
  } else {
    criticalItems = active
      .filter(s => s.current_weight_grams < criticalThreshold)
      .map(s => ({ ...s, linkId: s.id }));
    lowItems = active
      .filter(s => s.current_weight_grams >= criticalThreshold && s.current_weight_grams < lowThreshold)
      .map(s => ({ ...s, linkId: s.id }));
  }

  if (criticalItems.length === 0 && lowItems.length === 0) return null;

  return (
    <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-red-300">Low Stock Alert</span>
        {groupedAlerts && <span className="text-xs text-muted-foreground ml-1">(by total)</span>}
      </div>
      <div className="space-y-2">
        {criticalItems.map(s => (
          <Link key={s.linkId} to={`/spool/${s.linkId}`} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
              <span className="text-sm text-foreground truncate">
                {s.brand} {s.color_name}
                {groupedAlerts && s.spoolCount > 1 && <span className="text-muted-foreground"> ({s.spoolCount} spools)</span>}
              </span>
            </div>
            <span className="text-xs font-bold text-red-400 flex-shrink-0">{Math.round(s.current_weight_grams)}g CRITICAL</span>
          </Link>
        ))}
        {lowItems.map(s => (
          <Link key={s.linkId} to={`/spool/${s.linkId}`} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
              <span className="text-sm text-foreground truncate">
                {s.brand} {s.color_name}
                {groupedAlerts && s.spoolCount > 1 && <span className="text-muted-foreground"> ({s.spoolCount} spools)</span>}
              </span>
            </div>
            <span className="text-xs font-bold text-yellow-400 flex-shrink-0">{Math.round(s.current_weight_grams)}g Low</span>
          </Link>
        ))}
      </div>
    </div>
  );
}