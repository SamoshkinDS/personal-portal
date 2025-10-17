// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import { useTheme } from "../hooks/useTheme.js";

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = React.useState({ name: "", email: "", phone: "" });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProfile({ name: data.profile?.name || "", email: data.profile?.email || "", phone: data.profile?.phone || "" });
      } catch {}
    };
    if (token) load();
  }, [token]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      toast.success("Профиль сохранён");
    } catch {
      toast.error("Не удалось сохранить профиль");
    }
  };

  return (
    <PageShell
      title="Настройки"
      contentClassName="settings settings--preferences flex flex-col gap-6 bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70"
    >
      {/* Профиль пользователя */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-500 dark:border-gray-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold">Профиль</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Данные аккаунта хранятся локально и будут синхронизированы позже.</p>
        <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            Имя
            <input
              className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Иван Иванов"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="user@example.com"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Телефон
            <input
              className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+7 (999) 000-00-00"
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Сохранить профиль
            </button>
            <button
              type="button"
              className="rounded-2xl border border-gray-300 px-5 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800"
              onClick={() => toast("Смена пароля пока недоступна (заготовка)")}
            >
              Сменить пароль
            </button>
          </div>
        </form>
      </section>
      <section className="settings__appearance flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-500 dark:border-gray-700 dark:bg-slate-900">
        <header>
          <h2 className="settings__subtitle text-xl font-semibold">Тема интерфейса</h2>
          <p className="settings__description mt-1 text-sm text-gray-500 dark:text-gray-400">
            Переключайте светлый и тёмный режим одним кликом. Предпочтение синхронизировано
            во всех разделах портала.
          </p>
        </header>
        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          className="settings__toggle group flex items-center gap-4 rounded-2xl border border-transparent bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
        >
          <span
            className={`settings__toggle-track relative h-10 w-20 rounded-full transition-colors duration-500 ${
              isDark ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`settings__toggle-thumb absolute top-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-blue-500 shadow-lg transition-all duration-500 ${
                isDark ? "translate-x-10" : ""
              }`}
            >
              {isDark ? "Тьма" : "Свет"}
            </span>
          </span>
          <span className="settings__toggle-label text-sm font-medium text-gray-700 dark:text-gray-100">
            {isDark ? "Тёмная тема активна" : "Светлая тема активна"}
          </span>
        </button>
      </section>

      <section className="settings__notes rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-4 text-xs text-gray-500 shadow-sm transition-colors duration-500 dark:border-gray-600 dark:bg-slate-900/50 dark:text-gray-400">
        Изменение сохраняется в localStorage и применяется моментально без перезагрузки.
      </section>
    </PageShell>
  );
}
