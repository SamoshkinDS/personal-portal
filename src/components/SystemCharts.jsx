// encoding: utf-8
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";

function useMockSeries() {
  const [series, setSeries] = React.useState({ bandwidth: [], cpuDisk: [], monthly: [] });
  React.useEffect(() => {
    const now = new Date();
    // Bandwidth: 24h hourly
    const bandwidth = Array.from({ length: 24 }).map((_, i) => {
      const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: `${t.getHours()}:00`,
        in: Math.round(500 + Math.random() * 4500),
        out: Math.round(200 + Math.random() * 2800),
      };
    });
    // CPU/Disk: 24 points
    const cpuDisk = Array.from({ length: 24 }).map((_, i) => {
      const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      return {
        time: `${t.getHours()}:00`,
        cpu: Math.round(20 + Math.random() * 60),
        disk: Math.round(10 + Math.random() * 70),
      };
    });
    // Monthly traffic
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    const monthly = months.map((m) => ({ month: m, total: Math.round(10 + Math.random() * 90) }));
    setSeries({ bandwidth, cpuDisk, monthly });
  }, []);
  return series;
}

export default function SystemCharts({ collapsibleOnMobile = true }) {
  const { bandwidth, cpuDisk, monthly } = useMockSeries();
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    // скрыто по умолчанию на мобильных
    if (window.matchMedia && window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  }, []);

  return (
    <section className="charts space-y-6">
      {collapsibleOnMobile && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800 md:hidden"
        >
          {open ? "📉 Скрыть статистику" : "📉 Показать статистику"}
        </button>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Bandwidth Stacked Area */}
            <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Трафик (вход/выход, 24ч)</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bandwidth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="inColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="outColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="in" stroke="#16a34a" fillOpacity={1} fill="url(#inColor)" />
                    <Area type="monotone" dataKey="out" stroke="#2563eb" fillOpacity={1} fill="url(#outColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CPU / Disk Line */}
            <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">CPU / Disk (24ч)</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cpuDisk} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive />
                    <Line type="monotone" dataKey="disk" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Bar */}
            <div className="md:col-span-2 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Трафик по месяцам</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

