import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when the browser download API is unavailable (e.g. Android WebView).
 * Displays raw CSV text with a Copy button and optionally the Web Share API.
 */
export default function CsvExportModal({ csvText, filename, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea
      const el = document.getElementById("csv-export-textarea");
      if (el) { el.select(); document.execCommand("copy"); }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const file = new File([csvText], filename, { type: "text/csv" });
    await navigator.share({ files: [file], title: filename });
  };

  const canShare = typeof navigator.share === "function" && navigator.canShare?.({ files: [new File([""], "t.csv", { type: "text/csv" })] });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold text-foreground">Export CSV</h2>
          <button onClick={onClose} className="p-1 rounded-full active:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <p className="px-5 text-xs text-muted-foreground mb-3 flex-shrink-0">
          Copy the CSV text below or share it directly.
        </p>

        {/* CSV text area */}
        <div className="px-5 flex-1 overflow-hidden mb-4">
          <textarea
            id="csv-export-textarea"
            readOnly
            value={csvText}
            className="w-full h-full min-h-[160px] max-h-[240px] text-xs font-mono bg-muted border border-border rounded-xl p-3 text-foreground resize-none focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3 flex-shrink-0">
          {canShare && (
            <Button variant="outline" className="flex-1 border-border text-foreground" onClick={handleShare}>
              Share
            </Button>
          )}
          <Button className="flex-1 gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
}