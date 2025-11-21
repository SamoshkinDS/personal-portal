// encoding: utf-8
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../utils/api.js";
import Logo from "../components/Logo.jsx";

const MODES = {
  login: {
    title: "Вход",
    subtitle: "Рады видеть вас снова",
    cta: "Войти",
    helper: "Нет аккаунта?",
    helperAction: "Зарегистрироваться",
  },
  register: {
    title: "Регистрация",
    subtitle: "Создайте доступ к порталу",
    cta: "Создать аккаунт",
    helper: "Уже есть аккаунт?",
    helperAction: "Войти",
  },
};

const cardTransition = { duration: 0.25, ease: "easeOut" };

export default function Login({ initialMode }) {
  const { login } = useAuth();
  const [search] = useSearchParams();
  const modeFromQuery = search.get("mode");
  const allowedModes = ["login", "register"];
  const initialModeSafe = allowedModes.includes(initialMode) ? initialMode : null;
  const queryModeSafe = allowedModes.includes(modeFromQuery) ? modeFromQuery : null;
  const [mode, setMode] = useState(initialModeSafe || queryModeSafe || "login");

  useEffect(() => {
    if (queryModeSafe && queryModeSafe !== mode) {
      setMode(queryModeSafe);
    }
  }, [queryModeSafe, mode]);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // login form
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await login(loginForm.username.trim(), loginForm.password);
    if (!res?.ok) setError(res?.message || "Неверные логин или пароль.");
  };

  // register form
  const [regForm, setRegForm] = useState({ username: "", password: "" });
  const submitRegister = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.message || "Не удалось зарегистрировать пользователя.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setNotice(data?.message || "Заявка отправлена. После подтверждения вы сможете войти.");
    setMode("login");
  };

  const current = MODES[mode] || MODES.login;

  const renderLogin = () => (
    <motion.form
      key="login"
      onSubmit={submitLogin}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={cardTransition}
      className="space-y-3"
    >
      <Input
        label="Имя пользователя"
        placeholder="username"
        value={loginForm.username}
        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
      />
      <Input
        label="Пароль"
        type="password"
        placeholder="••••••••"
        value={loginForm.password}
        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
      />
      <PrimaryButton text={current.cta} />
    </motion.form>
  );

  const renderRegister = () => (
    <motion.form
      key="register"
      onSubmit={submitRegister}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={cardTransition}
      className="space-y-3"
    >
      <Input
        label="Имя пользователя"
        placeholder="username"
        value={regForm.username}
        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
      />
      <Input
        label="Пароль"
        type="password"
        placeholder="Надёжный пароль"
        value={regForm.password}
        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
      />
      <PrimaryButton text={current.cta} />
    </motion.form>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8 text-slate-900">
      <motion.div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/70"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="grid gap-0 md:grid-cols-[1fr,1.1fr]">
          <div className="relative hidden md:block bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-10 text-white">
            <div className="flex items-center gap-3">
              <Logo showName size="md" className="text-white" />
            </div>
            <div className="mt-8 space-y-3">
              <p className="text-lg font-semibold">Личный портал SAMOSHECHKIN</p>
              <p className="text-sm text-white/80">
                Управляйте задачами, аналитикой, VPN, растениями и AI‑инструментами из единой точки входа.
              </p>
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M4 6h16" />
                  <path d="M4 12h10" />
                  <path d="M4 18h7" />
                </svg>
                <span>Быстрый доступ к вашим сервисам</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 20v-6" />
                  <path d="m6 12 6-8 6 8" />
                  <path d="M4 20h16" />
                </svg>
                <span>Чистый интерфейс и быстрый вход</span>
              </div>
            </div>
          </div>

          <div className="relative bg-white px-6 py-8 md:px-10 md:py-12">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <Logo showName size="md" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold">{current.title}</h1>
                <p className="text-sm text-slate-500">{current.subtitle}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-500">
              {["login", "register"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`rounded-full px-3 py-1.5 transition ${
                    mode === key ? "bg-white text-indigo-600 shadow ring-1 ring-indigo-100" : "hover:text-indigo-500"
                  }`}
                >
                  {MODES[key].title}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </div>
            )}
            {notice && !error && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            <div className="mt-6 min-h-[250px]">
              <AnimatePresence mode="wait">
                {mode === "login" && renderLogin()}
                {mode === "register" && renderRegister()}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{current.helper}</span>
              {mode !== "login" && (
                <button className="font-semibold text-indigo-600 hover:text-indigo-500" onClick={() => setMode("login")}>
                  Войти
                </button>
              )}
              {mode !== "register" && (
                <button className="font-semibold text-indigo-600 hover:text-indigo-500" onClick={() => setMode("register")}>
                  Зарегистрироваться
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Сменить пароль можно после входа в разделе «Настройки».
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, helper, ...props }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {helper ? <div className="text-xs text-slate-400">{helper}</div> : null}
    </label>
  );
}

function PrimaryButton({ text }) {
  return (
    <motion.button
      type="submit"
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      {text}
    </motion.button>
  );
}
