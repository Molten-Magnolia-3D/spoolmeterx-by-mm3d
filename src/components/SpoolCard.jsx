import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { swatchStyle } from "@/components/SpoolSwatch";
import { CheckSquare, Square } from "lucide-react";

function getStatus(current, starting) {
  if (!current || current <= 0) return { label: "Empty", color: "text-gray-400" };
  const pct = current / (starting || 1000);
  if (pct < 0.1) return { label: "Critical", color: "text-red-400" };
  if (pct < 0.3) return { label: "Low", color: "text-yellow-400" };
  return { label: "Full", color: "text-green-400" };
}

export default function SpoolCard({ spool, selectMode, selected, onToggleSelect, onLongPress }) {
  const navigate = useNavigate();
  const pct = Math.max(0, Math.min(100, (spool.current_weight_grams / (spool.starting_weight_grams || 1)) * 100));
  const status = getStatus(spool.current_weight_grams, spool.starting_weight_grams);

  const longPressTimer = useRef(null);
  const handlePointerDown = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => onLongPress(spool), 500);
  };
  const handlePointerUp = () => clearTimeout(longPressTimer.current);

  const handleClick = () => {
    if (selectMode) {
      onToggleSelect?.(spool.id, !selected);
    } else {
      navigate(`/spool/${spool.id}`);
    }
  };

  return (
    <div
      className={`bg-card border rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer ${selected ? "border-primary bg-primary/5" : "border-border"}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex items-center gap-3">
        {selectMode && (
          <div className="flex-shrink-0">
            {selected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
          </div>
        )}

        {/* Color swatch */}
        <div className="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0" style={swatchStyle(spool)} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground truncate">{spool.color_name}</p>
            <span className={`text-xs font-semibold flex-shrink-0 ${status.color}`}>{status.label}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {spool.brand && <p className="text-sm text-muted-foreground truncate">{spool.brand}</p>}
            <span className="text-xs text-muted-foreground">{spool.material}</span>
          </div>
        </div>

        {/* Weight */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-foreground">{Math.round(spool.current_weight_grams)}g</p>
          <p className="text-xs text-muted-foreground">{Math.round(pct)}%</p>
        </div>
      </div>

      {/* Color progress bar */}
      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, ...swatchStyle(spool) }}
        />
      </div>
    </div>
  );
}