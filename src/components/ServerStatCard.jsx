// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";

export default function ServerStatCard({
  title,
  value,
  unit = "",
  percent = null,
  subtitle,
  color = "#3b82f6",
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(Number(percent ?? 0), 0), 100);
  const dash = (pct * circumference) / 100;

  return (
    <motion.div
      className="server-card group rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 transition duration-200 hover:shadow-lg dark:bg-slate-900/80"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-4">
        {percent != null && (
          <motion.svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            className="shrink-0"
            initial={{ rotate: -90 }}
            animate={{ rotate: -90 }}
            transition={{ duration: 0 }}
          >
            <circle cx="36" cy="36" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <motion.circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </motion.svg>
        )}
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {value}
            {unit && <span className="ml-1 text-sm text-gray-400 dark:text-gray-500">{unit}</span>}
          </div>
          {subtitle && (
            <div className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

