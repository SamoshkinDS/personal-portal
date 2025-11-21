// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="relative flex w-full max-w-4xl flex-col items-center gap-8 overflow-hidden rounded-3xl bg-white/80 p-8 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-white dark:ring-slate-800">
        <motion.img
          src="/Goose.gif"
          alt="Гусь ищет страницу"
          className="h-auto w-[360px] rounded-2xl shadow-md"
          initial={{ rotate: -2, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 16 }}
        />

        <div className="space-y-2">
          <motion.h1
            className="text-5xl font-extrabold text-indigo-600 drop-shadow-sm dark:text-indigo-300"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            404 — Гусь потерял страницу
          </motion.h1>
          <motion.p
            className="text-lg text-slate-600 dark:text-slate-300"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Кажется, гусь утащил вашу ссылку. Попробуйте вернуться или заглянуть в настройки.
          </motion.p>
        </div>

        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            to="/"
            className="rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:shadow-xl hover:shadow-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            На главную
          </Link>
          <Link
            to="/settings"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:text-indigo-200"
          >
            Настройки
          </Link>
        </motion.div>

        <motion.div
          className="absolute inset-x-0 -bottom-10 h-32 bg-gradient-to-t from-indigo-100/60 to-transparent blur-3xl dark:from-indigo-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
      </div>
    </div>
  );
}
