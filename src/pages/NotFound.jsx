// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-600">
          404
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Такой страницы нет или доступ ограничён</p>
        <div className="mt-6 space-x-3">
          <Link to="/" className="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">На главную</Link>
          <Link to="/settings" className="rounded-xl border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800">Настройки</Link>
        </div>
      </motion.div>
    </div>
  );
}

