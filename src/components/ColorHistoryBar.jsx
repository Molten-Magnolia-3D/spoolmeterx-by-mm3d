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
            className="w-8 h-8 rounded-full border-2 transition-all active:scale-95"
            style={{
              backgroundColor: entry.hex,
              borderColor: currentHex === entry.hex ? "white" : "transparent",
              outline: currentHex === entry.hex ? "2px solid hsl(var(--primary))" : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>
    </div>
  );
}