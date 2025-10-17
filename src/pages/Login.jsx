// encoding: utf-8
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../utils/api.js";

export default function Login({ initialMode }) {
  const { login } = useAuth();
  const [search] = useSearchParams();
  const modeFromQuery = search.get("mode");
  const [mode, setMode] = useState(initialMode || modeFromQuery || "login");
  useEffect(() => {
    if (modeFromQuery && modeFromQuery !== mode) setMode(modeFromQuery);
  }, [modeFromQuery]);

  // common
  const [error, setError] = useState("");

  // login form
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const submitLogin = async (e) => {
    e.preventDefault();
    const ok = await login(loginForm.username, loginForm.password);
    if (!ok) setError("Неверное имя пользователя или пароль.");
  };

  // register form
  const [regForm, setRegForm] = useState({ username: "", password: "" });
  const submitRegister = async (e) => {
    e.preventDefault();
    setError("");
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message || "Не удалось зарегистрироваться");
      return;
    }
    setMode("login");
  };

  // reset form (2-step)
  const [resetStep, setResetStep] = useState(1);
  const [resetUsername, setResetUsername] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  useEffect(() => {
    if (mode !== "reset") return;
    setResetStep(1);
    setResetPassword("");
  }, [mode]);
  const checkUsername = async (e) => {
    e.preventDefault();
    setError("");
    if (!resetUsername) return setError("Введите имя пользователя");
    const r = await apiFetch(
      `/api/auth/exists?username=${encodeURIComponent(resetUsername)}`
    );
    const data = await r.json().catch(() => ({}));
    if (r.ok && data?.exists) {
      setResetStep(2);
    } else {
      setError("Пользователь не найден");
    }
  };
  const submitReset = async (e) => {
    e.preventDefault();
    setError("");
    const r = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: resetUsername, newPassword: resetPassword }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data?.message || "Не удалось сбросить пароль");
      return;
    }
    setMode("login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <motion.div
        className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-8 text-gray-100 shadow-xl backdrop-blur-lg"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {error && <p className="mb-3 text-center text-sm text-red-400">{error}</p>}

        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.form
              key="login"
              onSubmit={submitLogin}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="mb-4 text-center text-2xl font-bold text-white">Войти</h1>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Войти
              </motion.button>
            </motion.form>
          )}

          {mode === "register" && (
            <motion.form
              key="register"
              onSubmit={submitRegister}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="mb-4 text-center text-2xl font-bold text-white">Регистрация</h1>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={regForm.username}
                onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Зарегистрироваться
              </motion.button>
            </motion.form>
          )}

          {mode === "reset" && (
            <motion.form
              key="reset"
              onSubmit={resetStep === 1 ? checkUsername : submitReset}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="mb-4 text-center text-2xl font-bold text-white">Сброс пароля</h1>
              <input
                type="text"
                placeholder="Имя пользователя"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
              />
              {resetStep === 2 && (
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
                />
              )}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {resetStep === 1 ? "Проверить пользователя" : "Сбросить пароль"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-4 space-y-1 text-center text-sm text-gray-200">
          {mode !== "login" && (
            <button className="text-blue-300 hover:underline" onClick={() => setMode("login")}>
              Уже есть аккаунт? Войти
            </button>
          )}
          {mode !== "register" && (
            <button className="block w-full text-blue-300 hover:underline" onClick={() => setMode("register")}>
              Нет аккаунта? Зарегистрироваться
            </button>
          )}
          {mode !== "reset" && (
            <button className="block w-full text-blue-300 hover:underline" onClick={() => setMode("reset")}>
              Забыли пароль?
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
