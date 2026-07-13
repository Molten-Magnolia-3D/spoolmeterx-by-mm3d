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
import TabLayout from '@/components/TabLayout';
import PageTransition from '@/components/PageTransition';
import { Navigate, useLocation } from 'react-router-dom';

const TAB_ROUTES = ["/", "/scan", "/quick-jobs"];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
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
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          {/* Tab routes render nothing here — TabLayout is rendered persistently below */}
          <Route path="/" element={null} />
          <Route path="/scan" element={null} />
          <Route path="/quick-jobs" element={null} />
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
          <Route path="/my-barcodes" element={
            <PageTransition><MyBarcodesPage /></PageTransition>
          } />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      {/* Always-mounted tab shell — display:none hides it without unmounting */}
      <div style={{ display: isTabRoute ? "block" : "none" }}>
        <TabLayout />
      </div>
    </>
  );
};

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