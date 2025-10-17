// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell.jsx";

const quickLinks = [
  { to: "/analytics", label: "Аналитика", color: "from-sky-400 to-blue-600" },
  { to: "/ai", label: "Нейронки", color: "from-violet-400 to-indigo-600" },
  { to: "/docs", label: "Документация", color: "from-emerald-400 to-teal-600" },
  { to: "/vpn", label: "VPN", color: "from-amber-400 to-orange-600" },
];

const LS_TODO_KEY = "portal_todos";

export default function Home() {
  const [todos, setTodos] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LS_TODO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    localStorage.setItem(LS_TODO_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTodos((prev) => [
      { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), text: value, done: false },
      ...prev,
    ]);
    setText("");
  };

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // Заготовки для будущих доработок
  const fetchGitHubCommits = async () => {
    // TODO: интеграция с GitHub API для вывода последних коммитов
    return [];
  };

  const requestNotificationsPermission = async () => {
    // TODO: заготовка для Notification API
    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  

  return (
    <PageShell title="Главная" contentClassName="home p-0 bg-transparent">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Добро пожаловать в Personal Portal</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ваш центр управления проектами, AI и аналитикой
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => (
          <motion.div
            key={item.to}
            whileHover={{ y: -4 }}
            className="rounded-3xl p-[1px]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(0,0,0,0.08))" }}
          >
            <Link
              to={item.to}
              className={`block rounded-3xl bg-gradient-to-br ${item.color} p-[2px]`}
            >
              <div className="rounded-3xl bg-white/90 p-5 text-gray-900 transition-colors duration-500 dark:bg-slate-900/80 dark:text-gray-100">
                <div className="text-lg font-semibold">{item.label}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-white/80">Быстрый переход</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold">Задачи (To‑Do)</h2>
          <form onSubmit={addTodo} className="mt-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Добавить задачу…"
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            />
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Добавить
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {todos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Пока задач нет</p>
            ) : (
              todos.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-slate-800"
                >
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                    <span className={t.done ? "line-through text-gray-400" : ""}>{t.text}</span>
                  </label>
                  <button
                    onClick={() => removeTodo(t.id)}
                    className="rounded-full border border-red-300 px-3 py-1 text-red-500 transition hover:bg-red-50 dark:border-red-400/40 dark:hover:bg-red-500/10"
                  >
                    Удалить
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold">Новости проекта</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Заглушка. Скоро здесь появятся обновления и анонсы.</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={fetchGitHubCommits}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Загрузить коммиты (заготовка)
            </button>
            <button
              onClick={requestNotificationsPermission}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Разрешить уведомления
            </button>
          </div>
        </div>
      </section>
      
    </PageShell>
  );
}
