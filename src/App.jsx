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
import VPNIndex from "./pages/vpn/Index.jsx";

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

  // Р“Р»РѕР±Р°Р»СЊРЅС‹Р№ РїРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РґР»СЏ PageShell/Header
  React.useEffect(() => {
    window.__toggleSidebar = () => setMobileOpen((v) => !v);
    return () => {
      delete window.__toggleSidebar;
    };
  }, []);

  // Р—Р°РєСЂС‹РІР°РµРј РјРѕР±РёР»СЊРЅРѕРµ РјРµРЅСЋ РїСЂРё РЅР°РІРёРіР°С†РёРё РЅР° РЅРѕРІСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // РЎРІР°Р№РїС‹: РѕС‚РєСЂС‹С‚СЊ РѕС‚ Р»РµРІРѕРіРѕ РєСЂР°СЏ РІРїСЂР°РІРѕ, Р·Р°РєСЂС‹С‚СЊ вЂ” РІР»РµРІРѕ
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
    if (Math.abs(dy) > Math.abs(dx)) return; // РІРµСЂС‚РёРєР°Р»СЊ вЂ” РёРіРЅРѕСЂ
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
        <div className="app-layout flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900 transition-colors duration-500 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 dark:text-gray-100">
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
          {/* Р—РѕРЅР° Р·Р°С…РІР°С‚Р° СЃРІР°Р№РїР° РѕС‚ Р»РµРІРѕРіРѕ РєСЂР°СЏ РґР»СЏ iOS PWA Рё РјРѕР±РёР»СЊРЅС‹С… Р±СЂР°СѓР·РµСЂРѕРІ */}
          {!mobileOpen && (
            <div
              className="fixed inset-y-0 left-0 z-20 w-6 sm:hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              aria-hidden="true"
            />
          )}
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
              <Route
                path="/vpn"
                element={
                  <RouteTransition>
                    <VPNIndex />
                  </RouteTransition>
                }
              />
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

