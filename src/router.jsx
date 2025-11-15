import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

import Sidebar from "./components/Sidebar.jsx";
import Analytics from "./pages/Analytics.jsx";
import AI from "./pages/AI.jsx";
import N8NIntegration from "./pages/N8NIntegration.jsx";
import Docs from "./pages/Docs.jsx";
import Posts from "./pages/Posts.jsx";
import Settings from "./pages/Settings.jsx";
import AccountingDashboard from "./pages/accounting/Dashboard.jsx";
import AccountingAccounts from "./pages/accounting/Accounts.jsx";
import AccountingPayments from "./pages/accounting/Payments.jsx";
import AccountingTransactions from "./pages/accounting/Transactions.jsx";
import AccountingIncomes from "./pages/accounting/Incomes.jsx";
import AccountingCategories from "./pages/accounting/Categories.jsx";
import AccountingSettings from "./pages/accounting/Settings.jsx";
import Login from "./pages/Login.jsx";
import AdminHome from "./pages/admin/Index.jsx";
import AdminContent from "./pages/admin/Content.jsx";
import AdminLogs from "./pages/admin/Logs.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import NotFound from "./pages/NotFound.jsx";
import Home from "./pages/Home.jsx";
import Outline from "./pages/vpn/Outline.jsx";
import Vless from "./pages/vpn/Vless.jsx";
import VlessGuide from "./pages/vpn/VlessGuide.jsx";
import RoutesGuide from "./pages/vpn/RoutesGuide.jsx";
import VPNIndex from "./pages/vpn/Index.jsx";
import OutlineGuide from "./pages/vpn/OutlineGuide.jsx";
import DebugDnd from "./pages/DebugDnd.jsx";
import PlantsList from "./pages/plants/PlantsList.jsx";
import PlantDetail from "./pages/plants/PlantDetail.jsx";
import PlantSettings from "./pages/plants/PlantSettings.jsx";
import PestsList from "./pages/care/PestsList.jsx";
import PestDetail from "./pages/care/PestDetail.jsx";
import DiseasesList from "./pages/care/DiseasesList.jsx";
import DiseaseDetail from "./pages/care/DiseaseDetail.jsx";
import MedicinesList from "./pages/care/MedicinesList.jsx";
import MedicineDetail from "./pages/care/MedicineDetail.jsx";
import ProblemsOverview from "./pages/care/ProblemsOverview.jsx";
import { registerPush } from "./push/registerPush.js";

function RouteTransition({ children }) {
  return (
    <motion.div
      className="app-route flex-1 overflow-y-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AppShell() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}

function PublicLayout() {
  const { isAuth } = useAuth();
  const location = useLocation();

  if (isAuth) {
    return <Navigate to="/" replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <Outlet key={location.pathname} />
    </AnimatePresence>
  );
}

function PrivateLayout() {
  const { isAuth } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isAuth) return;
    // Re-run push registration whenever the user gains auth so subscriptions get recreated after login
    registerPush();
  }, [isAuth]);

  React.useEffect(() => {
    if (!isAuth) return undefined;
    // Keep the legacy global toggle available for the sidebar even after moving to RouterProvider
    window.__toggleSidebar = () => setMobileOpen((v) => !v);
    return () => {
      delete window.__toggleSidebar;
    };
  }, [isAuth]);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900 transition-colors duration-500 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 dark:text-gray-100">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="app-layout__content flex min-w-0 flex-1 flex-col transition-colors duration-500">
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function PermissionGate({ check, children }) {
  const { user } = useAuth();
  const permissionState = React.useMemo(() => buildPermissionState(user), [user]);
  const allowed = check ? check(permissionState) : true;

  return allowed ? children : <NotFound />;
}

function buildPermissionState(user) {
  const role = user?.role || "NON_ADMIN";
  const permsArray = Array.isArray(user?.permissions) ? user.permissions : [];
  const perms = new Set(permsArray);
  const can = (perm) => role === "ALL" || perms.has("admin_access") || perms.has(perm);

  return { user, role, perms, can };
}

const canViewAnalytics = ({ can }) => can("view_analytics");
const canUseAI = ({ can }) => can("view_ai");
const canUseVPN = ({ can, user }) => can("view_vpn") || user?.vpnCanCreate;
const canManagePlants = ({ can }) => can("plants_admin");
const canAccessAdmin = ({ can }) => can("admin_access");
const canAccountingAdmin = ({ can }) => can("accounting:admin");
const canAccountingEdit = ({ can }) => canAccountingAdmin({ can }) || can("accounting:edit");
const canViewAccounting = ({ can, perms }) => canAccountingEdit({ can }) || can("accounting:view") || perms.size === 0;

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppShell />}>
      <Route element={<PublicLayout />}>
        <Route
          path="login"
          element={
            <RouteTransition>
              <Login />
            </RouteTransition>
          }
        />
        <Route
          path="register"
          element={
            <RouteTransition>
              <Login initialMode="register" />
            </RouteTransition>
          }
        />
        <Route
          path="reset-password"
          element={
            <RouteTransition>
              <Login initialMode="reset" />
            </RouteTransition>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
      <Route element={<PrivateLayout />}>
        <Route
          index
          element={
            <RouteTransition>
              <Home />
            </RouteTransition>
          }
        />
        <Route
          path="analytics"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <Analytics />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="ai"
          element={
            <PermissionGate check={canUseAI}>
              <RouteTransition>
                <AI />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="ai/n8n"
          element={
            <PermissionGate check={canUseAI}>
              <RouteTransition>
                <N8NIntegration />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="plants"
          element={
            <RouteTransition>
              <PlantsList />
            </RouteTransition>
          }
        />
        <Route
          path="plants/settings"
          element={
            <PermissionGate check={canManagePlants}>
              <RouteTransition>
                <PlantSettings />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="plants/:slug"
          element={
            <RouteTransition>
              <PlantDetail />
            </RouteTransition>
          }
        />
        <Route
          path="problems"
          element={
            <RouteTransition>
              <ProblemsOverview />
            </RouteTransition>
          }
        />
        <Route
          path="pests"
          element={
            <RouteTransition>
              <PestsList />
            </RouteTransition>
          }
        />
        <Route
          path="pests/:slug"
          element={
            <RouteTransition>
              <PestDetail />
            </RouteTransition>
          }
        />
        <Route
          path="diseases"
          element={
            <RouteTransition>
              <DiseasesList />
            </RouteTransition>
          }
        />
        <Route
          path="diseases/:slug"
          element={
            <RouteTransition>
              <DiseaseDetail />
            </RouteTransition>
          }
        />
        <Route
          path="medicines"
          element={
            <RouteTransition>
              <MedicinesList />
            </RouteTransition>
          }
        />
        <Route
          path="medicines/:slug"
          element={
            <RouteTransition>
              <MedicineDetail />
            </RouteTransition>
          }
        />
        <Route
          path="docs"
          element={
            <RouteTransition>
              <Docs />
            </RouteTransition>
          }
        />
        <Route
          path="posts"
          element={
            <RouteTransition>
              <Posts />
            </RouteTransition>
          }
        />
        <Route
          path="accounting"
          element={
            <PermissionGate check={canViewAccounting}>
              <RouteTransition>
                <AccountingDashboard />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/accounts"
          element={
            <PermissionGate check={canAccountingEdit}>
              <RouteTransition>
                <AccountingAccounts />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/payments"
          element={
            <PermissionGate check={canAccountingEdit}>
              <RouteTransition>
                <AccountingPayments />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/transactions"
          element={
            <PermissionGate check={canAccountingEdit}>
              <RouteTransition>
                <AccountingTransactions />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/incomes"
          element={
            <PermissionGate check={canAccountingEdit}>
              <RouteTransition>
                <AccountingIncomes />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/categories"
          element={
            <PermissionGate check={canAccountingEdit}>
              <RouteTransition>
                <AccountingCategories />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="accounting/settings"
          element={
            <PermissionGate check={canAccountingAdmin}>
              <RouteTransition>
                <AccountingSettings />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="settings"
          element={
            <RouteTransition>
              <Settings />
            </RouteTransition>
          }
        />
        <Route
          path="vpn"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <VPNIndex />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="vpn/outline"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <Outline />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="vpn/outline/guide"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <OutlineGuide />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="vpn/vless"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <Vless />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="vpn/vless/guide"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <VlessGuide />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="vpn/vless/routes-guide"
          element={
            <PermissionGate check={canUseVPN}>
              <RouteTransition>
                <RoutesGuide />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="debug-dnd"
          element={
            <RouteTransition>
              <DebugDnd />
            </RouteTransition>
          }
        />
        <Route
          path="admin"
          element={
            <PermissionGate check={canAccessAdmin}>
              <RouteTransition>
                <AdminHome />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="admin/users"
          element={
            <PermissionGate check={canAccessAdmin}>
              <RouteTransition>
                <AdminUsers />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="admin/content"
          element={
            <PermissionGate check={canAccessAdmin}>
              <RouteTransition>
                <AdminContent />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="admin/logs"
          element={
            <PermissionGate check={canAccessAdmin}>
              <RouteTransition>
                <AdminLogs />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
  )
);
