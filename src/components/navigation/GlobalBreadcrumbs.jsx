import React from "react";
import { Link, useLocation } from "react-router-dom";

const LABELS = {
  "": "Главная",
  analytics: "Аналитика",
  topics: "Темы",
  articles: "Статьи",
  queue: "Очередь",
  interview: "Интервью",
  tests: "Тесты",
  integration: "Интеграции",
  ai: "AI & ML",
  n8n: "n8n",
  promptmaster: "Promptmaster",
  docs: "Документация",
  plants: "Растения",
  pests: "Вредители",
  diseases: "Болезни",
  medicines: "Лекарства",
  problems: "Проблемы",
  vpn: "VPN",
  outline: "Outline",
  vless: "VLESS",
  accounting: "Финансы",
  accounts: "Счета",
  payments: "Платежи",
  transactions: "Транзакции",
  incomes: "Доходы",
  categories: "Категории",
  settings: "Настройки",
  career: "Карьера",
  skills: "Навыки",
  courses: "Курсы",
  portfolio: "Портфолио",
  interviews: "Интервью",
  knowledge: "Знания",
  export: "Экспорт",
  timeline: "Таймлайн",
  posts: "Посты",
  admin: "Админ",
  users: "Пользователи",
  content: "Контент",
  logs: "Логи",
  s3: "S3 Storage",
};

function titleForSegment(seg) {
  const key = decodeURIComponent(seg || "");
  if (LABELS[key]) return LABELS[key];
  if (/^\d+$/.test(key)) return key;
  return key.replace(/[-_]/g, " ");
}

export default function GlobalBreadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname || "/";
  const parts = pathname.split("/").filter(Boolean);

  const items = [{ label: "Главная", to: "/" }];
  let acc = "";
  parts.forEach((part, idx) => {
    acc += `/${part}`;
    items.push({
      label: titleForSegment(part),
      to: idx === parts.length - 1 ? null : acc,
    });
  });

  if (items.length <= 1) return null;

  return (
    <nav className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="text-slate-500 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-white"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-600 dark:text-slate-200">{item.label}</span>
              )}
              {!isLast && <span className="text-slate-300 dark:text-slate-600">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
