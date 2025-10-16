import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(form.login, form.password);
    if (!success) setError("Неверный логин или пароль");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-700">
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-80 text-center text-gray-100 border border-white/20"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold mb-6 text-white">Вход в портал</h1>
        <input
          type="text"
          placeholder="Логин"
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full mb-4 p-2 rounded bg-gray-800 border border-gray-700 text-white"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-white font-semibold"
        >
          Войти
        </motion.button>
      </motion.form>
    </div>
  );
}
