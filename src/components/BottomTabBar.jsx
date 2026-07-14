import { useLocation, useNavigate } from "react-router-dom";
import { Package, Barcode, Zap, Settings } from "lucide-react";

const TABS = [
  { label: "Inventory", icon: Package, path: "/home" },
  { label: "Barcodes", icon: Barcode, path: "/my-barcodes" },
  { label: "Quick Jobs", icon: Zap, path: "/quick-jobs" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "/home") return pathname === "/home";
    return pathname.startsWith(path);
  };

  const handleTabPress = (path) => {
    if (isActive(path)) {
      // Already on this tab — fire reset event so TabLayout remounts the page
      window.dispatchEvent(new CustomEvent("tab-reset", { detail: { path } }));
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="bg-card/80 backdrop-blur-xl border-t border-border/60 flex items-stretch">
        {TABS.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => handleTabPress(path)}
              className="flex-1 relative flex items-stretch"
            >
              <span className={`flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 transition-colors active:opacity-60 ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : "scale-100"}`} />
                <span className={`text-[10px] font-medium leading-none mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}