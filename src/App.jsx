import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Dashboard from '@/pages/Dashboard';
import ScanPage from '@/pages/ScanPage';
import AddSpoolPage from '@/pages/AddSpoolPage';
import SpoolDetail from '@/pages/SpoolDetail';
import QuickJobsPage from '@/pages/QuickJobsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PricingPage from '@/pages/PricingPage';
import UpgradeSuccess from '@/pages/UpgradeSuccess';
import AdminPage from '@/pages/AdminPage';
import RedeemCodePage from '@/pages/RedeemCodePage';
import { Navigate, useLocation } from 'react-router-dom';
import BottomTabBar from '@/components/BottomTabBar';
import PageTransition from '@/components/PageTransition';
import { useState } from 'react';

const TAB_BAR_ROUTES = ["/", "/scan", "/quick-jobs"];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [settingsTrigger, setSettingsTrigger] = useState(0);
  const showTabBar = TAB_BAR_ROUTES.includes(location.pathname);

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

  return (
    <>
      <PageTransition>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route path="/" element={<Dashboard openSettings={settingsTrigger} />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/add" element={<AddSpoolPage />} />
            <Route path="/spool/:id" element={<SpoolDetail />} />
            <Route path="/quick-jobs" element={<QuickJobsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/upgrade-success" element={<UpgradeSuccess />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/redeem" element={<RedeemCodePage />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </PageTransition>
      {showTabBar && (
        <BottomTabBar onSettingsPress={() => setSettingsTrigger(v => v + 1)} />
      )}
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