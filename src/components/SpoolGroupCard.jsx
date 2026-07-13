import { Link } from "react-router-dom";
import { SpoolSwatch, swatchStyle } from "@/components/SpoolSwatch";

const MATERIAL_COLORS = {
  PLA: "bg-blue-500/20 text-blue-300",
  PETG: "bg-purple-500/20 text-purple-300",
  ABS: "bg-orange-500/20 text-orange-300",
  ASA: "bg-yellow-500/20 text-yellow-300",
  TPU: "bg-green-500/20 text-green-300",
};

function getStatus(current, starting) {
  if (current <= 0) return { label: "Empty", color: "text-gray-400" };
  if (current < 100) return { label: "Critical", color: "text-red-400" };
  if (current < 300) return { label: "Low", color: "text-yellow-400" };
  return { label: "Full", color: "text-green-400" };
}

export default function SpoolGroupCard({ spools }) {
  const rep = spools[0];
  const count = spools.length;
  const totalCurrent = spools.reduce((sum, s) => sum + s.current_weight_grams, 0);
  const totalStarting = spools.reduce((sum, s) => sum + s.starting_weight_grams, 0);
  const pct = Math.max(0, Math.min(100, (totalCurrent / totalStarting) * 100));
  const status = getStatus(totalCurrent, totalStarting);
  const matClass = MATERIAL_COLORS[rep.material] || "bg-gray-500/20 text-gray-300";
  const perSpoolGrams = Math.round(rep.starting_weight_grams);

  // If only one spool, link directly to it; otherwise link to first spool (they can browse from there)
  const linkTo = count === 1 ? `/spool/${rep.id}` : `/spool/${rep.id}`;

  return (
    <Link to={linkTo} className="block">
      <div className="bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform">
        <div className="flex items-start gap-3">
          {/* Color Swatch */}
          <div className="relative flex-shrink-0">
            <SpoolSwatch spool={rep} className="w-12 h-12 rounded-lg border border-white/10 shadow-inner" />
            {count > 1 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center leading-none">
                {count}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground text-base leading-tight truncate">{rep.color_name}</p>
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{rep.brand}</p>

            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matClass}`}>{rep.material}</span>
              {count > 1 && (
                <span className="text-xs text-muted-foreground">{count} spools · {perSpoolGrams}g ea</span>
              )}
              {count === 1 && rep.printer_slot && (
                <span className="text-xs text-muted-foreground">Slot: {rep.printer_slot}</span>
              )}
            </div>
          </div>
        </div>

        {/* Weight bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            {count > 1 ? (
              <>
                <span>{Math.round(totalCurrent)}g remaining across {count} spools</span>
                <span>{Math.round(totalStarting)}g total</span>
              </>
            ) : (
              <>
                <span>{Math.round(totalCurrent)}g remaining</span>
                <span>{Math.round(totalStarting)}g start</span>
              </>
            )}
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, ...swatchStyle(rep) }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}