import { ArrowLeft } from "lucide-react";
import useSafeBack from "@/hooks/useSafeBack";

/**
 * SubPageHeader — consistent sticky native-style nav header for sub-pages.
 * Props:
 *   title: string
 *   fallback: string (default "/") — passed to useSafeBack
 *   right: ReactNode — optional right-side content
 */
export default function SubPageHeader({ title, fallback = "/", right }) {
  const goBack = useSafeBack(fallback);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border flex items-center gap-1 px-2"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: "12px" }}
    >
      <button
        onClick={goBack}
        className="flex items-center justify-center w-11 h-11 rounded-full active:bg-muted flex-shrink-0"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <span className="font-bold text-foreground text-lg flex-1 truncate px-1">{title}</span>
      {right && <div className="flex-shrink-0 pr-1">{right}</div>}
    </div>
  );
}