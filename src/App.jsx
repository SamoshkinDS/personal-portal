import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Sidebar from "./components/Sidebar.jsx";
import Analytics from "./pages/Analytics.jsx";
import AI from "./pages/AI.jsx";
import Docs from "./pages/Docs.jsx";
import Posts from "./pages/Posts.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import Home from "./pages/Home.jsx";
import Outline from "./pages/vpn/Outline.jsx";
import VLESS from "./pages/vpn/VLESS.jsx";

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

function AppRoutes() {
  const location = useLocation();
  const { isAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Глобальный переключатель для PageShell/Header
  React.useEffect(() => {
    window.__toggleSidebar = () => setMobileOpen((v) => !v);
    return () => {
      delete window.__toggleSidebar;
    };
  }, []);

  // Свайпы: открыть от левого края вправо, закрыть — влево
  const touchRef = React.useRef({ startX: 0, startY: 0, tracking: false });
  const onTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchRef.current = { startX: t.clientX, startY: t.clientY, tracking: true };
  };
  const onTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!t || !touchRef.current.tracking) return;
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;
    if (Math.abs(dy) > Math.abs(dx)) return; // вертикаль — игнор
    if (!mobileOpen && touchRef.current.startX < 24 && dx > 60) {
      setMobileOpen(true);
      touchRef.current.tracking = false;
    }
    if (mobileOpen && dx < -60) {
      setMobileOpen(false);
      touchRef.current.tracking = false;
    }
  };
  const onTouchEnd = () => {
    touchRef.current.tracking = false;
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuth ? (
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              <RouteTransition>
                <Login />
              </RouteTransition>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-layout flex min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 text-gray-900 transition-colors duration-500 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-gray-100">
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
          <div
            className="app-layout__content flex min-w-0 flex-1 flex-col transition-colors duration-500"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <RouteTransition>
                    <Home />
                  </RouteTransition>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RouteTransition>
                    <Analytics />
                  </RouteTransition>
                }
              />
              <Route
                path="/ai"
                element={
                  <RouteTransition>
                    <AI />
                  </RouteTransition>
                }
              />
              <Route
                path="/docs"
                element={
                  <RouteTransition>
                    <Docs />
                  </RouteTransition>
                }
              />
              <Route
                path="/posts"
                element={
                  <RouteTransition>
                    <Posts />
                  </RouteTransition>
                }
              />
              <Route
                path="/settings"
                element={
                  <RouteTransition>
                    <Settings />
                  </RouteTransition>
                }
              />
              <Route path="/vpn" element={<Navigate to="/vpn/outline" replace />} />
              <Route
                path="/vpn/outline"
                element={
                  <RouteTransition>
                    <Outline />
                  </RouteTransition>
                }
              />
              <Route
                path="/vpn/vless"
                element={
                  <RouteTransition>
                    <VLESS />
                  </RouteTransition>
                }
              />
              <Route
                path="/admin"
                element={
                  <RouteTransition>
                    <Admin />
                  </RouteTransition>
                }
              />
              <Route path="*" element={<Navigate to="/analytics" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
