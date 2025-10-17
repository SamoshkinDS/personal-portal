// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../../components/PageShell.jsx";

export default function VPNIndex() {
  const links = [
    { to: "/vpn/outline", title: "Outline", desc: "Ключи доступа, квоты и аудит подключений." },
    { to: "/vpn/vless", title: "VLESS", desc: "Управление прокси VLESS и параметрами клиентов." },
  ];

  return (
    <PageShell title="VPN" contentClassName="p-0 bg-transparent">
      <section className="rounded-2xl p-6 shadow-md hover:shadow-xl transition-all bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg">
        <h2 className="text-lg font-semibold">Сервисы VPN</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Выберите подсистему для управления ключами и настройками.</p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {links.map((l) => (
          <motion.div key={l.to} whileHover={{ y: -2 }}>
            <Link
              to={l.to}
              className="block rounded-2xl p-6 shadow-md hover:shadow-xl transition-all bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg ring-1 ring-black/5"
            >
              <div className="text-base font-semibold text-slate-900 dark:text-gray-100">{l.title}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-gray-400">{l.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}

