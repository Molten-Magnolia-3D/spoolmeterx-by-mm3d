import { useLocation } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import MyBarcodesPage from "@/pages/MyBarcodesPage";
import QuickJobsPage from "@/pages/QuickJobsPage";
import SettingsPage from "@/pages/SettingsPage";
import BottomTabBar from "@/components/BottomTabBar";

/**
 * Persistent tab layout — all four tab pages are always mounted so their
 * state and scroll positions survive tab switches. Visibility is toggled via CSS.
 */
export default function TabLayout() {
  const { pathname } = useLocation();

  return (
    <>
      <div style={{ display: pathname === "/" ? "block" : "none" }}>
        <Dashboard />
      </div>
      <div style={{ display: pathname === "/my-barcodes" ? "block" : "none" }}>
        <MyBarcodesPage />
      </div>
      <div style={{ display: pathname === "/quick-jobs" ? "block" : "none" }}>
        <QuickJobsPage />
      </div>
      <div style={{ display: pathname === "/settings" ? "block" : "none" }}>
        <SettingsPage />
      </div>
      <BottomTabBar />
    </>
  );
}