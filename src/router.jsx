import React, { Suspense } from "react";
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
import PageLoader from "./components/PageLoader.jsx";
import { registerPush } from "./push/registerPush.js";

const Analytics = React.lazy(() => import("./pages/Analytics.jsx"));
const TopicPage = React.lazy(() => import("./pages/analytics/Topic.jsx"));
const ArticlePage = React.lazy(() => import("./pages/analytics/Article.jsx"));
const ArticlesQueuePage = React.lazy(() => import("./pages/analytics/Queue.jsx"));
const InterviewPreparation = React.lazy(() => import("./pages/analytics/InterviewPreparation.jsx"));
const KnowledgeTestsPage = React.lazy(() => import("./pages/analytics/KnowledgeTests.jsx"));
const TestDetail = React.lazy(() => import("./pages/analytics/TestDetail.jsx"));
const IntegrationSettings = React.lazy(() => import("./pages/analytics/IntegrationSettings.jsx"));
const CheatSheets = React.lazy(() => import("./pages/analytics/CheatSheets.jsx"));
const AI = React.lazy(() => import("./pages/AI.jsx"));
const N8NIntegration = React.lazy(() => import("./pages/N8NIntegration.jsx"));
const Promptmaster = React.lazy(() => import("./pages/Promptmaster.jsx"));
const Docs = React.lazy(() => import("./pages/Docs.jsx"));
const Posts = React.lazy(() => import("./pages/Posts.jsx"));
const Settings = React.lazy(() => import("./pages/Settings.jsx"));
const AccountingDashboard = React.lazy(() => import("./pages/accounting/Dashboard.jsx"));
const AccountingAccounts = React.lazy(() => import("./pages/accounting/Accounts.jsx"));
const AccountingPayments = React.lazy(() => import("./pages/accounting/Payments.jsx"));
const AccountingTransactions = React.lazy(() => import("./pages/accounting/Transactions.jsx"));
const AccountingIncomes = React.lazy(() => import("./pages/accounting/Incomes.jsx"));
const AccountingCategories = React.lazy(() => import("./pages/accounting/Categories.jsx"));
const AccountingSettings = React.lazy(() => import("./pages/accounting/Settings.jsx"));
const Login = React.lazy(() => import("./pages/Login.jsx"));
const AdminHome = React.lazy(() => import("./pages/admin/Index.jsx"));
const AdminContent = React.lazy(() => import("./pages/admin/Content.jsx"));
const AdminLogs = React.lazy(() => import("./pages/admin/Logs.jsx"));
const AdminUsers = React.lazy(() => import("./pages/admin/Users.jsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.jsx"));
const Home = React.lazy(() => import("./pages/Home.jsx"));
const Outline = React.lazy(() => import("./pages/vpn/Outline.jsx"));
const Vless = React.lazy(() => import("./pages/vpn/Vless.jsx"));
const VlessGuide = React.lazy(() => import("./pages/vpn/VlessGuide.jsx"));
const RoutesGuide = React.lazy(() => import("./pages/vpn/RoutesGuide.jsx"));
const VPNIndex = React.lazy(() => import("./pages/vpn/Index.jsx"));
const OutlineGuide = React.lazy(() => import("./pages/vpn/OutlineGuide.jsx"));
const DebugDnd = React.lazy(() => import("./pages/DebugDnd.jsx"));
const PlantsList = React.lazy(() => import("./pages/plants/PlantsList.jsx"));
const PlantDetail = React.lazy(() => import("./pages/plants/PlantDetail.jsx"));
const PlantSettings = React.lazy(() => import("./pages/plants/PlantSettings.jsx"));
const PestsList = React.lazy(() => import("./pages/care/PestsList.jsx"));
const PestDetail = React.lazy(() => import("./pages/care/PestDetail.jsx"));
const DiseasesList = React.lazy(() => import("./pages/care/DiseasesList.jsx"));
const DiseaseDetail = React.lazy(() => import("./pages/care/DiseaseDetail.jsx"));
const MedicinesList = React.lazy(() => import("./pages/care/MedicinesList.jsx"));
const MedicineDetail = React.lazy(() => import("./pages/care/MedicineDetail.jsx"));
const ProblemsOverview = React.lazy(() => import("./pages/care/ProblemsOverview.jsx"));
const CareerDashboard = React.lazy(() => import("./pages/career/Dashboard.tsx"));
const SkillsPage = React.lazy(() => import("./pages/career/SkillsPage.tsx"));
const CoursesPage = React.lazy(() => import("./pages/career/CoursesPage.tsx"));
const PortfolioPage = React.lazy(() => import("./pages/career/PortfolioPage.tsx"));
const ProjectDetails = React.lazy(() => import("./pages/career/ProjectDetails.tsx"));
const InterviewsPage = React.lazy(() => import("./pages/career/InterviewsPage.tsx"));
const KnowledgePage = React.lazy(() => import("./pages/career/KnowledgePage.tsx"));
const KnowledgeDetailsPage = React.lazy(() => import("./pages/career/KnowledgeDetailsPage.tsx"));
const PortfolioExportPage = React.lazy(() => import("./pages/career/PortfolioExportPage.tsx"));
const PortfolioTimelinePage = React.lazy(() => import("./pages/career/PortfolioTimelinePage.tsx"));
const AnalyticsPage = React.lazy(() => import("./pages/career/AnalyticsPage.tsx"));

function RouteTransition({ children }) {
  const location = useLocation();
  const disableRouteTransition = location.state?.disableRouteTransition;
  const motionProps = disableRouteTransition
    ? {
        initial: false,
        animate: { opacity: 1, y: 0 },
        exit: false,
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      };
  return (
    <motion.div
      className="app-route flex-1 overflow-y-auto"
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...motionProps}
    >
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
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
          path="analytics/topics/:topicId"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <TopicPage />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/articles/:articleId"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <ArticlePage />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/queue"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <ArticlesQueuePage />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/interview"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <InterviewPreparation />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/tests"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <KnowledgeTestsPage />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/tests/:testId"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <TestDetail />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/settings"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <IntegrationSettings />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="analytics/cheats"
          element={
            <PermissionGate check={canViewAnalytics}>
              <RouteTransition>
                <CheatSheets />
              </RouteTransition>
            </PermissionGate>
          }
        />
        <Route
          path="career"
          element={
            <RouteTransition>
              <CareerDashboard />
            </RouteTransition>
          }
        />
        <Route
          path="career/skills"
          element={
            <RouteTransition>
              <SkillsPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/courses"
          element={
            <RouteTransition>
              <CoursesPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/portfolio"
          element={
            <RouteTransition>
              <PortfolioPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/portfolio/:projectId"
          element={
            <RouteTransition>
              <ProjectDetails />
            </RouteTransition>
          }
        />
        <Route
          path="career/interviews"
          element={
            <RouteTransition>
              <InterviewsPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/knowledge"
          element={
            <RouteTransition>
              <KnowledgePage />
            </RouteTransition>
          }
        />
        <Route
          path="career/knowledge/:knowledgeId"
          element={
            <RouteTransition>
              <KnowledgeDetailsPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/portfolio/export"
          element={
            <RouteTransition>
              <PortfolioExportPage />
            </RouteTransition>
          }
        />
        <Route
          path="career/portfolio/timeline"
          element={
            <RouteTransition>
              <PortfolioTimelinePage />
            </RouteTransition>
          }
        />
        <Route
          path="career/analytics"
          element={
            <RouteTransition>
              <AnalyticsPage />
            </RouteTransition>
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
          path="ai/promptmaster"
          element={
            <PermissionGate check={canUseAI}>
              <RouteTransition>
                <Promptmaster />
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
