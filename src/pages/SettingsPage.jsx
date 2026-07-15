import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FeedbackForm from "@/components/FeedbackForm";
import { exportSpoolsCsv } from "@/lib/exportCsv";
import { parseCsv } from "@/lib/importCsv";
import {
  Bell, Download, Type, Sun, Moon, ChevronRight, User
} from "lucide-react";

const FONT_SIZES = [
  { label: "Small", value: "sm", cls: "text-sm" },
  { label: "Normal", value: "md", cls: "text-base" },
  { label: "Large", value: "lg", cls: "text-lg" },
  { label: "XL", value: "xl", cls: "text-xl" },
];

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${enabled ? "bg-primary" : "bg-muted"}`}
      role="switch"
      aria-checked={enabled}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${enabled ? "left-7" : "left-1"}`} />
    </button>
  );
}

function SectionHeader({ children }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-5 pb-1">
      {children}
    </p>
  );
}

function SettingRow({ label, sublabel, right, onClick }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3.5 bg-card border-b border-border/50 ${onClick ? "active:bg-muted cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="min-w-0">
        <p className="text-sm text-foreground font-medium">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [spools, setSpools] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importMessage, setImportMessage] = useState("");

  // Threshold settings
  const [criticalThreshold, setCriticalThreshold] = useState(() => parseInt(localStorage.getItem("ff_critical") || "100"));
  const [lowThreshold, setLowThreshold] = useState(() => parseInt(localStorage.getItem("ff_low") || "300"));
  const [groupedAlerts, setGroupedAlerts] = useState(() => localStorage.getItem("ff_grouped_alerts") === "true");

  // Notifications
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem("ff_notify_email") || "");
  const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem("ff_notify_enabled") === "true");

  // Accessibility
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("a11y_font_size") || "md");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("a11y_high_contrast") === "true");
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("a11y_reduce_motion") === "true");
  const [theme, setTheme] = useState(() => localStorage.getItem("a11y_theme") || "system"); // "light" | "dark" | "system"

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    base44.entities.Spool.list("-updated_date", 200).then(setSpools).catch(() => {});
  }, []);

  // Apply accessibility settings globally
  useEffect(() => {
    const sizes = { sm: "14px", md: "16px", lg: "18px", xl: "21px" };
    document.documentElement.style.fontSize = sizes[fontSize] || "16px";
    localStorage.setItem("a11y_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y_high_contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    localStorage.setItem("a11y_reduce_motion", reduceMotion);
  }, [reduceMotion]);

  const applyTheme = (value) => {
    setTheme(value);
    if (value === "dark") {
      localStorage.setItem("a11y_theme", "dark");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("theme-light");
    } else if (value === "light") {
      localStorage.setItem("a11y_theme", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("theme-light");
    } else {
      localStorage.removeItem("a11y_theme");
      document.documentElement.classList.remove("theme-light");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  const { isBeta } = useSubscription(currentUser);

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImportStatus("importing");
    setImportMessage("");
    try {
      const text = await file.text();
      const { spools, barcodeMappings } = parseCsv(text);
      await base44.entities.Spool.bulkCreate(spools);

      // Sync barcode library for rows that had a barcode
      let barcodeNote = "";
      if (barcodeMappings.length > 0) {
        await Promise.all(barcodeMappings.map(async (mapping) => {
          // Upsert: check if barcode already exists, update it, otherwise create
          const existing = await base44.entities.BarcodeMapping.filter({ barcode_value: mapping.barcode_value });
          if (existing.length > 0) {
            await base44.entities.BarcodeMapping.update(existing[0].id, mapping);
          } else {
            await base44.entities.BarcodeMapping.create(mapping);
          }
        }));
        barcodeNote = ` · ${barcodeMappings.length} barcode${barcodeMappings.length !== 1 ? "s" : ""} saved to library`;
      }

      setImportStatus("done");
      setImportMessage(`Imported ${spools.length} spool${spools.length !== 1 ? "s" : ""} successfully${barcodeNote}.`);
      base44.entities.Spool.list("-updated_date", 200).then(setSpools).catch(() => {});
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Import failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground font-heading">Settings</h1>
      </div>

      {/* Account Settings — top of menu */}
      <div className="px-4 pt-4 pb-2">
        <Link
          to="/account"
          className="flex items-center gap-4 bg-card border border-border/60 rounded-xl px-4 py-3.5 active:bg-muted"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{currentUser?.full_name || "Account"}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email || "Subscription · Billing · Sign out"}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </Link>
      </div>

      {/* Quick links */}
      <SectionHeader>App</SectionHeader>
      <div className="divide-y divide-border/50">
        <Link to="/my-barcodes" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
          <p className="text-sm text-foreground font-medium">🏷️ My Barcode Library</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Link to="/roadmap" className="flex items-center justify-between px-4 py-3.5 bg-card active:bg-muted">
          <p className="text-sm text-foreground font-medium">🗺️ View Roadmap</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Low stock thresholds */}
      <SectionHeader>Low Stock Thresholds</SectionHeader>
      <div className="bg-card px-4 py-4 space-y-3 border-b border-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-red-400 font-semibold mb-1.5">Critical below (g)</p>
            <Input
              type="number" min="0" value={criticalThreshold}
              onChange={e => { const v = parseInt(e.target.value) || 0; setCriticalThreshold(v); localStorage.setItem("ff_critical", v); }}
              className="h-11 bg-muted border-border text-foreground"
            />
          </div>
          <div>
            <p className="text-xs text-yellow-400 font-semibold mb-1.5">Low below (g)</p>
            <Input
              type="number" min="0" value={lowThreshold}
              onChange={e => { const v = parseInt(e.target.value) || 0; setLowThreshold(v); localStorage.setItem("ff_low", v); }}
              className="h-11 bg-muted border-border text-foreground"
            />
          </div>
        </div>
        <SettingRow
          label="Alert by total filament"
          sublabel="Alert when combined grams of a color is low"
          right={<Toggle enabled={groupedAlerts} onToggle={() => setGroupedAlerts(v => { localStorage.setItem("ff_grouped_alerts", !v); return !v; })} />}
        />
      </div>

      {/* Email notifications */}
      <SectionHeader>Notifications</SectionHeader>
      <div className="bg-card border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">Email low-stock alerts</p>
              <p className="text-xs text-muted-foreground">Completely optional</p>
            </div>
          </div>
          <Toggle enabled={notifyEnabled} onToggle={() => setNotifyEnabled(v => { localStorage.setItem("ff_notify_enabled", !v); return !v; })} />
        </div>
        {notifyEnabled && (
          <div className="px-4 pb-4 space-y-2">
            <Input
              type="email"
              placeholder="you@example.com (optional)"
              value={notifyEmail}
              onChange={e => { setNotifyEmail(e.target.value); localStorage.setItem("ff_notify_email", e.target.value); }}
              className="h-11 bg-muted border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">Alerts fire when you open the app and critical spools are found.</p>
          </div>
        )}
      </div>

      {/* Accessibility */}
      <SectionHeader>Accessibility</SectionHeader>
      <div className="bg-card border-b border-border/50 divide-y divide-border/50">
        {/* Font size */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">Text Size</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FONT_SIZES.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFontSize(f.value)}
                className={`py-2 rounded-lg text-center border transition-colors ${fontSize === f.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
              >
                <span className={f.cls}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Theme */}
        <div className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium">Theme</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
              { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
              { value: "system", label: "System", icon: <span className="text-base">⚙️</span> },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => applyTheme(opt.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors ${theme === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        {/* High contrast */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">High Contrast</p>
              <p className="text-xs text-muted-foreground">Increases border and text contrast</p>
            </div>
          </div>
          <Toggle enabled={highContrast} onToggle={() => setHighContrast(v => !v)} />
        </div>
        {/* Reduce motion */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground font-medium">Reduce Motion</p>
              <p className="text-xs text-muted-foreground">Disables animations and transitions</p>
            </div>
          </div>
          <Toggle enabled={reduceMotion} onToggle={() => setReduceMotion(v => !v)} />
        </div>
      </div>

      {/* Data */}
      <SectionHeader>Data</SectionHeader>
      <div className="bg-card border-b border-border/50 px-4 py-4 space-y-3">
        <Button variant="outline" size="sm" onClick={() => exportSpoolsCsv(spools)} className="w-full h-11 gap-2 border-border text-foreground">
          <Download className="w-4 h-4" /> Export Inventory as CSV
        </Button>
        <label className="w-full block">
          <div className={`flex items-center justify-center gap-2 h-11 px-3 rounded-md text-sm font-medium border border-border cursor-pointer transition-colors active:bg-muted ${importStatus === "importing" ? "opacity-50 pointer-events-none" : "text-foreground bg-transparent"}`}>
            <Download className="w-4 h-4 rotate-180" />
            {importStatus === "importing" ? "Importing…" : "Import from CSV"}
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
        </label>
        {importStatus === "done" && <p className="text-xs text-green-400">{importMessage}</p>}
        {importStatus === "error" && <p className="text-xs text-red-400">{importMessage}</p>}
        <Button
          variant="outline" size="sm"
          onClick={() => {
            const header = "brand,material,color_name,color_hex,starting_weight_grams,current_weight_grams,purchase_price_per_kg,printer_slot,notes,date_opened,barcode";
            const example = "Bambu Lab,PLA,Matte Black,#222222,1000,950,19.99,Slot 1,Example spool,2026-01-01,1234567890123";
            const blob = new Blob([header + "\n" + example], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "filament_template.csv";
            a.click();
          }}
          className="w-full h-11 gap-2 border-border text-foreground"
        >
          <Download className="w-4 h-4" /> Download CSV Template
        </Button>
        <p className="text-xs text-muted-foreground">Required fields: brand, material, color_name, starting_weight_grams, current_weight_grams.</p>
      </div>

      {/* Legal */}
      <SectionHeader>Legal</SectionHeader>
      <div className="bg-card border-b border-border/50 divide-y divide-border/50">
        <Link to="/privacy" className="flex items-center justify-between px-4 py-3.5 active:bg-muted">
          <p className="text-sm text-foreground font-medium">Privacy Policy</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Link to="/terms" className="flex items-center justify-between px-4 py-3.5 active:bg-muted">
          <p className="text-sm text-foreground font-medium">Terms of Service</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Feedback */}
      <SectionHeader>Feedback</SectionHeader>
      <div className="bg-card border-b border-border/50 px-4 py-4">
        {!showFeedback ? (
          <Button variant="outline" className="w-full h-11 border-border text-foreground" onClick={() => setShowFeedback(true)}>
            Send Feedback
          </Button>
        ) : (
          <FeedbackForm user={currentUser} isBeta={isBeta} onDone={() => setShowFeedback(false)} />
        )}
      </div>

    </div>
  );
}