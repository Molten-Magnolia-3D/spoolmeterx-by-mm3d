import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import AddSpoolPage from '@/pages/AddSpoolPage';
import SpoolDetail from '@/pages/SpoolDetail';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PricingPage from '@/pages/PricingPage';
import UpgradeSuccess from '@/pages/UpgradeSuccess';
import AdminPage from '@/pages/AdminPage';
import RedeemCodePage from '@/pages/RedeemCodePage';
import MyBarcodesPage from '@/pages/MyBarcodesPage';
import ScanPage from '@/pages/ScanPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import LandingPage from '@/pages/LandingPage';
import SettingsPage from '@/pages/SettingsPage';
import TabLayout from '@/components/TabLayout';
import PageTransition from '@/components/PageTransition';
import { Navigate, useLocation } from 'react-router-dom';

const TAB_ROUTES = ["/home", "/my-barcodes", "/quick-jobs", "/settings"];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  const isTabRoute = TAB_ROUTES.includes(location.pathname);

  return (
    <>
      {/*
        Tab pages are always rendered (never unmounted) so scroll position and
        component state survive tab switches. Only visibility is toggled.
        Routes still handles auth via ProtectedRoute + Outlet for the tab wildcard.
      */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<LandingPage />} />}>
          {/* Tab routes render nothing here — TabLayout is rendered persistently below */}
          <Route path="/home" element={null} />
          <Route path="/my-barcodes" element={null} />
          <Route path="/quick-jobs" element={null} />
          <Route path="/settings" element={null} />
          <Route path="/scan" element={<PageTransition><ScanPage /></PageTransition>} />
          <Route path="/add" element={
            <PageTransition><AddSpoolPage /></PageTransition>
          } />
          <Route path="/spool/:id" element={
            <PageTransition><SpoolDetail /></PageTransition>
          } />
          <Route path="/pricing" element={
            <PageTransition><PricingPage /></PageTransition>
          } />
          <Route path="/upgrade-success" element={
            <PageTransition><UpgradeSuccess /></PageTransition>
          } />
          <Route path="/admin" element={
            <PageTransition><AdminPage /></PageTransition>
          } />
          <Route path="/redeem" element={
            <PageTransition><RedeemCodePage /></PageTransition>
          } />

        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      {/* Always-mounted tab shell — display:none hides it without unmounting. Only show when authenticated. */}
      <div style={{ display: isTabRoute && isAuthenticated ? "block" : "none" }}>
        <TabLayout />
      </div>
    </>
  );
};

// Apply saved accessibility settings before first render

// Theme: check explicit override first, then fall back to system preference
const savedTheme = localStorage.getItem("a11y_theme"); // "dark" | "light" | null
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("theme-dark");
} else if (savedTheme === "light") {
  // Force light by blocking the media-query selector
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("theme-light");
} else {
  // Follow system — mark with theme-dark so CSS :not() selector works correctly
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  // Live-update if system preference changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("a11y_theme")) {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  });
}

const savedFontSize = localStorage.getItem("a11y_font_size");
if (savedFontSize) {
  const sizes = { sm: "14px", md: "16px", lg: "18px", xl: "21px" };
  document.documentElement.style.fontSize = sizes[savedFontSize] || "16px";
}
if (localStorage.getItem("a11y_high_contrast") === "true") {
  document.documentElement.classList.add("high-contrast");
}
if (localStorage.getItem("a11y_reduce_motion") === "true") {
  document.documentElement.classList.add("reduce-motion");
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App