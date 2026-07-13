import { Link, useLocation } from "react-router-dom";
import { Package, ScanBarcode, Zap, Settings } from "lucide-react";

const TABS = [
  { label: "Inventory", icon: Package, path: "/" },
  { label: "Scan", icon: ScanBarcode, path: "/scan" },
  { label: "Quick Jobs", icon: Zap, path: "/quick-jobs" },
  { label: "Settings", icon: Settings, path: "/settings-tab" }, // handled via prop
];

export default function BottomTabBar({ onSettingsPress }) {
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    if (path === "/settings-tab") return false;
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="bg-card/80 backdrop-blur-xl border-t border-border/60 flex items-stretch">
        {TABS.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          const isSettings = path === "/settings-tab";

          const content = (
            <span className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-colors active:opacity-60 ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : "scale-100"}`} />
              <span className={`text-[10px] font-medium leading-none ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />}
            </span>
          );

          if (isSettings) {
            return (
              <button key={label} onClick={onSettingsPress} className="flex-1 relative flex items-stretch">
                {content}
              </button>
            );
          }

          return (
            <Link key={label} to={path} className="flex-1 relative flex items-stretch">
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}