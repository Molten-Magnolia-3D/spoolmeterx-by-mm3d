import { AlertTriangle, Package } from "lucide-react";
import { Link } from "react-router-dom";

const MATERIAL_COLORS = {
  PLA: "bg-blue-500/20 text-blue-300",
  PETG: "bg-purple-500/20 text-purple-300",
  ABS: "bg-orange-500/20 text-orange-300",
  ASA: "bg-yellow-500/20 text-yellow-300",
  TPU: "bg-green-500/20 text-green-300",
};

function getStatus(current, starting) {
  if (current <= 0) return { label: "Empty", color: "text-gray-400", bar: "bg-gray-600" };
  if (current < 100) return { label: "Critical", color: "text-red-400", bar: "bg-red-500" };
  if (current < 300) return { label: "Low", color: "text-yellow-400", bar: "bg-yellow-500" };
  return { label: "Full", color: "text-green-400", bar: "bg-green-500" };
}

export default function SpoolCard({ spool }) {
  const pct = Math.max(0, Math.min(100, (spool.current_weight_grams / spool.starting_weight_grams) * 100));
  const status = getStatus(spool.current_weight_grams, spool.starting_weight_grams);
  const matClass = MATERIAL_COLORS[spool.material] || "bg-gray-500/20 text-gray-300";

  return (
    <Link to={`/spool/${spool.id}`} className="block">
      <div className="bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform">
        <div className="flex items-start gap-3">
          {/* Color Swatch */}
          <div
            className="w-12 h-12 rounded-lg flex-shrink-0 border border-white/10 shadow-inner"
            style={{ backgroundColor: spool.color_hex || "#888" }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground text-base leading-tight truncate">{spool.brand}</p>
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{spool.color_name}</p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matClass}`}>{spool.material}</span>
              {spool.printer_slot && (
                <span className="text-xs text-muted-foreground">Slot: {spool.printer_slot}</span>
              )}
            </div>
          </div>
        </div>

        {/* Weight bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{Math.round(spool.current_weight_grams)}g remaining</span>
            <span>{Math.round(spool.starting_weight_grams)}g start</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${status.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}