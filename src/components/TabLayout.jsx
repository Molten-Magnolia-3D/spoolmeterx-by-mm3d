import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/Dashboard";
import MyBarcodesPage from "@/pages/MyBarcodesPage";
import QuickJobsPage from "@/pages/QuickJobsPage";
import SettingsPage from "@/pages/SettingsPage";
import BottomTabBar from "@/components/BottomTabBar";

const TAB_PATHS = ["/home", "/my-barcodes", "/quick-jobs", "/settings"];

/**
 * Persistent tab layout — all four tab pages are always mounted so their
 * state and scroll positions survive tab switches. Visibility is toggled via CSS.
 *
 * When the user taps the already-active tab, BottomTabBar fires a
 * "tab-reset" CustomEvent with { detail: path }. TabLayout increments a
 * resetKey for that tab, which pages can watch to reset to their root state.
 */
export default function TabLayout() {
  const { pathname } = useLocation();
  const [resetKeys, setResetKeys] = useState({ "/home": 0, "/my-barcodes": 0, "/quick-jobs": 0, "/settings": 0 });

  useEffect(() => {
    const onReset = (e) => {
      const path = e.detail?.path;
      if (path && TAB_PATHS.includes(path)) {
        setResetKeys(prev => ({ ...prev, [path]: prev[path] + 1 }));
      }
    };
    window.addEventListener("tab-reset", onReset);
    return () => window.removeEventListener("tab-reset", onReset);
  }, []);

  return (
    <>
      <div style={{ display: pathname === "/home" ? "block" : "none" }}>
        <Dashboard key={resetKeys["/home"]} />
      </div>
      <div style={{ display: pathname === "/my-barcodes" ? "block" : "none" }}>
        <MyBarcodesPage key={resetKeys["/my-barcodes"]} />
      </div>
      <div style={{ display: pathname === "/quick-jobs" ? "block" : "none" }}>
        <QuickJobsPage key={resetKeys["/quick-jobs"]} />
      </div>
      <div style={{ display: pathname === "/settings" ? "block" : "none" }}>
        <SettingsPage key={resetKeys["/settings"]} />
      </div>
      <BottomTabBar />
    </>
  );
}