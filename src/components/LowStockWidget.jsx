import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function LowStockWidget({ spools, criticalThreshold = 100, lowThreshold = 300 }) {
  const critical = spools.filter(s => !s.is_empty && s.current_weight_grams < criticalThreshold);
  const low = spools.filter(s => !s.is_empty && s.current_weight_grams >= criticalThreshold && s.current_weight_grams < lowThreshold);

  if (critical.length === 0 && low.length === 0) return null;

  return (
    <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-red-300">Low Stock Alert</span>
      </div>
      <div className="space-y-2">
        {critical.map(s => (
          <Link key={s.id} to={`/spool/${s.id}`} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
              <span className="text-sm text-foreground truncate">{s.brand} {s.color_name}</span>
            </div>
            <span className="text-xs font-bold text-red-400 flex-shrink-0">{Math.round(s.current_weight_grams)}g CRITICAL</span>
          </Link>
        ))}
        {low.map(s => (
          <Link key={s.id} to={`/spool/${s.id}`} className="flex items-center justify-between gap-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color_hex || "#888" }} />
              <span className="text-sm text-foreground truncate">{s.brand} {s.color_name}</span>
            </div>
            <span className="text-xs font-bold text-yellow-400 flex-shrink-0">{Math.round(s.current_weight_grams)}g Low</span>
          </Link>
        ))}
      </div>
    </div>
  );
}