// encoding: utf-8
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Не удалось зарегистрироваться");
        return;
      }
      toast.success("Регистрация успешна. Войдите в систему.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Ошибка запроса");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 px-4">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-gray-100 shadow-xl backdrop-blur-lg"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="mb-6 text-2xl font-bold text-white">Регистрация</h1>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="mb-3 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-2 w-full rounded bg-gray-800 p-2 text-white outline-none ring-blue-400 transition focus:ring-2"
        />
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          className="w-full rounded-lg bg-green-600 py-2 font-semibold text-white transition-colors hover:bg-green-700"
        >
          Зарегистрироваться
        </motion.button>
        <div className="mt-4 text-sm text-gray-200">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-blue-300 hover:underline">
            Войти
          </Link>
        </div>
      </motion.form>
    </div>
  );
}

