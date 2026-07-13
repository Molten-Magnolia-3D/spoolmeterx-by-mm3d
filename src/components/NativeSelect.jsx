import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * NativeSelect — replaces <select> with a custom bottom-drawer sheet.
 * Props:
 *   value, onChange(newValue), options: [{value, label}] | string[]
 *   placeholder, label (optional), className
 */
export default function NativeSelect({ value, onChange, options = [], placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);

  const normalized = options.map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  const selected = normalized.find(o => o.value === value);

  const handlePick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full h-10 bg-muted border border-border text-foreground text-sm rounded-md px-3 active:opacity-70 ${className}`}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setOpen(false)}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            className="relative bg-card border-t border-border rounded-t-2xl pb-safe overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="max-h-72 overflow-y-auto py-2">
              {normalized.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handlePick(o.value)}
                  className="flex items-center justify-between w-full px-5 py-3.5 text-left text-sm text-foreground active:bg-muted"
                >
                  <span className={o.value === value ? "font-semibold text-primary" : ""}>{o.label}</span>
                  {o.value === value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div className="px-4 pb-4 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full h-11 rounded-xl bg-muted text-foreground text-sm font-medium active:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}