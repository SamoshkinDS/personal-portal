// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../../components/PageShell.jsx";

const cards = [
  {
    to: "/vpn/outline",
    title: "Outline",
    desc: "Готовая интеграция с Outline: управление ключами, лимитами и статистикой.",
  },
  {
    to: "/vpn/vless",
    title: "VLESS",
    desc: "Управление собственными VLESS-ключами и их параметрами.",
  },
];

export default function VPNIndex() {
  return (
    <PageShell title="VPN" contentClassName="p-0 bg-transparent">
      <section className="rounded-2xl bg-white/70 p-6 shadow-md transition-all hover:shadow-xl dark:bg-gray-800/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Центр VPN</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Соберите все инструменты VPN в одном месте: внешний Outline, собственный VLESS и полезные гайды.
        </p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <motion.div key={card.to} whileHover={{ y: -2 }}>
            <Link
              to={card.to}
              className="block rounded-2xl bg-white/70 p-6 shadow-md ring-1 ring-black/5 transition-all hover:shadow-xl dark:bg-gray-800/60"
            >
              <div className="text-base font-semibold text-slate-900 dark:text-gray-100">{card.title}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-gray-400">{card.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-indigo-100 bg-white/70 p-5 shadow-sm transition hover:shadow-md dark:border-indigo-500/20 dark:bg-gray-800/60">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
          Быстрые ссылки
        </h3>
        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-700 dark:text-gray-200">
          <Link
            to="/vpn/vless/guide"
            className="text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Инструкция по установке
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
