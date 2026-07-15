/**
 * Displays "Colors Used" — previously used spool colors from history.
 * Clicking a color fills in color_hex (and optionally color_name) in the form.
 */
import { getColorHistory } from "@/hooks/useColorHistory";
import { useState } from "react";

export default function ColorHistoryBar({ currentHex, onSelect }) {
  const [history] = useState(() => getColorHistory());

  if (!history || history.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Colors Used</p>
      <div className="flex flex-wrap gap-2">
        {history.map(entry => (
          <button
            key={entry.hex}
            type="button"
            title={entry.name || entry.hex}
            onClick={() => onSelect(entry)}
            className="w-8 h-8 rounded-full transition-all active:scale-95"
            style={{
              backgroundColor: entry.hex,
              boxShadow: currentHex === entry.hex
                ? "inset 0 0 0 1.5px rgba(0,0,0,0.18), inset 0 0 0 1.5px rgba(255,255,255,0.12), 0 0 0 2px hsl(var(--primary))"
                : "inset 0 0 0 1.5px rgba(0,0,0,0.18), inset 0 0 0 1.5px rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
}