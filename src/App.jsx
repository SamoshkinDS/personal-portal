import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
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
          <Route path="/login" element={<Page><Login /></Page>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/analytics" replace />} />
              <Route path="/analytics" element={<Page><Analytics /></Page>} />
              <Route path="/ai" element={<Page><AI /></Page>} />
              <Route path="/docs" element={<Page><Docs /></Page>} />
              <Route path="/posts" element={<Page><Posts /></Page>} />
              <Route path="/settings" element={<Page><Settings /></Page>} />
              <Route path="/admin" element={<Page><Admin /></Page>} />
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
