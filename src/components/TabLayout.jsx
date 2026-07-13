import { useLocation } from "react-router-dom";
import { useState } from "react";
import Dashboard from "@/pages/Dashboard";
import ScanPage from "@/pages/ScanPage";
import QuickJobsPage from "@/pages/QuickJobsPage";
import BottomTabBar from "@/components/BottomTabBar";

/**
 * Persistent tab layout — all three tab pages are always mounted so their
 * state and scroll positions survive tab switches. Visibility is toggled via CSS.
 */
export default function TabLayout() {
  const { pathname } = useLocation();
  const [settingsTrigger, setSettingsTrigger] = useState(0);

  return (
    <>
      <div style={{ display: pathname === "/" ? "block" : "none" }}>
        <Dashboard openSettings={settingsTrigger} />
      </div>
      <div style={{ display: pathname === "/scan" ? "block" : "none" }}>
        <ScanPage />
      </div>
      <div style={{ display: pathname === "/quick-jobs" ? "block" : "none" }}>
        <QuickJobsPage />
      </div>
      <BottomTabBar onSettingsPress={() => setSettingsTrigger(v => v + 1)} />
    </>
  );
}