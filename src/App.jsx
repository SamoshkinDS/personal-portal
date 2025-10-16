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
          <Sidebar />
          <div className="app-layout__content flex min-w-0 flex-1 flex-col transition-colors duration-500">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/analytics" replace />} />
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
