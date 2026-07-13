import { Link } from "react-router-dom";
import { CheckSquare, Square, ChevronRight, Zap } from "lucide-react";
import { swatchStyle } from "@/components/SpoolSwatch";

const MATERIAL_STYLES = {
  PLA:  { bg: "bg-blue-500/10",   text: "text-blue-400"   },
  PETG: { bg: "bg-green-500/10",  text: "text-green-400"  },
  ABS:  { bg: "bg-orange-500/10", text: "text-orange-400" },
  ASA:  { bg: "bg-purple-500/10", text: "text-purple-400" },
  TPU:  { bg: "bg-pink-500/10",   text: "text-pink-400"   },
};

function getStatus(grams, starting) {
  if (!grams || grams <= 0) return { label: "Empty",    color: "text-muted-foreground" };
  const pct = grams / (starting || 1000);
  if (pct < 0.1)  return { label: "Critical", color: "text-red-400"    };
  if (pct < 0.3)  return { label: "Low",      color: "text-yellow-400" };
  return               { label: "Good",     color: "text-green-400"  };
}

export default function SpoolGroupCard({ spools, selectMode, selectedIds, onToggleSelect, onLongPress }) {
  const sample = spools[0];
  const totalGrams = spools.reduce((s, sp) => s + (sp.current_weight_grams || 0), 0);
  const totalStarting = spools.reduce((s, sp) => s + (sp.starting_weight_grams || 1000), 0);
  const pct = Math.min(100, Math.round((totalGrams / totalStarting) * 100));
  const status = getStatus(totalGrams, totalStarting);
  const mat = MATERIAL_STYLES[sample.material] || { bg: "bg-muted", text: "text-muted-foreground" };

  const allGroupIds = spools.map(s => s.id);
  const groupSelected = selectMode && allGroupIds.every(id => selectedIds?.has(id));

  const handleSelect = () => {
    if (!selectMode) return;
    onToggleSelect(allGroupIds, !groupSelected);
  };

  // Long-press detection
  let pressTimer = null;
  const onPointerDown = () => {
    if (selectMode) return;
    pressTimer = setTimeout(() => {
      if (onLongPress) onLongPress(sample);
    }, 500);
  };
  const onPointerUp = () => clearTimeout(pressTimer);

  const cardContent = (
    <div className={`bg-card border rounded-xl p-4 transition-colors ${groupSelected ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className="flex items-center gap-3">
        {selectMode && (
          <div className="flex-shrink-0">
            {groupSelected
              ? <CheckSquare className="w-5 h-5 text-primary" />
              : <Square className="w-5 h-5 text-muted-foreground" />}
          </div>
        )}

        {/* Color swatch */}
        <div
          className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
          style={swatchStyle(sample)}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{sample.brand} {sample.color_name}</p>
            {spools.length > 1 && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex-shrink-0">×{spools.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${mat.bg} ${mat.text}`}>{sample.material}</span>
            <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Weight + arrow */}
        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            <p className="text-sm font-bold text-foreground">{Math.round(totalGrams)}g</p>
            <p className="text-xs text-muted-foreground">{pct}%</p>
          </div>
          {!selectMode && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${status.label === "Critical" ? "bg-red-500" : status.label === "Low" ? "bg-yellow-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!selectMode && onLongPress && (
        <p className="text-xs text-muted-foreground mt-2 text-center opacity-50">Hold to quick-log</p>
      )}
    </div>
  );

  if (selectMode) {
    return <div onClick={handleSelect} className="cursor-pointer">{cardContent}</div>;
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Link to={`/spool/${sample.id}`}>{cardContent}</Link>
    </div>
  );
}