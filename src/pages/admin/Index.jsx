// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell.jsx";
import ServerStatCard from "../../components/ServerStatCard.jsx";
import SystemCharts from "../../components/SystemCharts.jsx";
import { getServerStats } from "../../utils/systemInfo.js";

const cards = [
  { id: 'users', title: 'Пользователи', desc: 'Управление доступами и блокировками', to: '/admin/users', color: 'from-indigo-500 to-blue-600' },
  { id: 'content', title: 'Контент портала', desc: 'Статьи, ссылки и посты', to: '/admin/content', color: 'from-emerald-500 to-teal-600' },
  { id: 'logs', title: 'Журнал действий', desc: 'История действий и событий', to: '/admin/logs', color: 'from-amber-500 to-orange-600' },
];

export default function AdminHome() {
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    getServerStats().then((data) => { if (mounted) setStats(data); });
    const id = setInterval(() => { getServerStats().then((data) => mounted && setStats(data)); }, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <PageShell title="Админ-панель" contentClassName="p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.id} to={c.to} className="group block">
            <div className={`rounded-3xl p-6 text-white shadow-xl transition-transform duration-200 group-hover:-translate-y-1 bg-gradient-to-br ${c.color}`}>
              <div className="text-2xl font-bold">{c.title}</div>
              <div className="mt-2 text-white/90">{c.desc}</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-sm">
                Перейти
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Показатели сервера */}
      <section className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ServerStatCard title="CPU" value={stats ? stats.cpu : "—"} unit="%" percent={stats ? stats.cpu : 0} color="#f59e0b" subtitle="Загрузка процессора" />
          <ServerStatCard title="Диск" value={stats ? stats.disk : "—"} unit="%" percent={stats ? stats.disk : 0} color="#10b981" subtitle="Использование памяти" />
          <ServerStatCard title="Входящий трафик" value={stats ? stats.bandwidth?.in : "—"} unit="Кбит/с" percent={stats ? Math.min(100, (stats.bandwidth?.in || 0) / 100) : 0} color="#22c55e" subtitle="Последняя минута" />
          <ServerStatCard title="Исходящий трафик" value={stats ? stats.bandwidth?.out : "—"} unit="Кбит/с" percent={stats ? Math.min(100, (stats.bandwidth?.out || 0) / 100) : 0} color="#3b82f6" subtitle={stats ? `Uptime: ${stats.uptime}` : "Последняя минута"} />
        </div>
        <SystemCharts />
      </section>
    </PageShell>
  );
}
