// encoding: utf-8
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const success = login(form.login, form.password);
    if (!success) setError("Неверная пара логин/пароль.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-gray-100 shadow-xl backdrop-blur-lg"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="mb-6 text-2xl font-bold text-white">Вход в личный портал</h1>
        <input
          type="text"
          placeholder="Логин"
          value={form.login}
          onChange={(event) => setForm({ ...form, login: event.target.value })}
          className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="mb-4 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
        />
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Войти
        </motion.button>
      </motion.form>
    </div>
  );
}
