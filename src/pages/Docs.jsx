// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";

const docsSections = [
  {
    title: "Продуктовые гайды",
    items: [
      { name: "Product Analytics 101", url: "https://productanalytics.example.com" },
      { name: "JTBD: сценарии интервью", url: "https://jtbdframework.example.com" },
    ],
  },
  {
    title: "Технические справочники",
    items: [
      { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
      { name: "React Docs", url: "https://react.dev" },
    ],
  },
  {
    title: "Командные процессы",
    items: [
      { name: "База знаний в Notion", url: "https://notion.so/workspace" },
      { name: "Ритуалы в Confluence", url: "https://confluence.example.com" },
    ],
  },
];

export default function Docs() {
  return (
    <PageShell
      title="Документация"
      contentClassName="docs docs--catalog flex flex-col gap-6 bg-transparent p-0"
    >
      <section className="docs__summary rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h2 className="docs__subtitle text-xl font-semibold">Всегда под рукой</h2>
        <p className="docs__description mt-2 text-sm text-gray-600 dark:text-gray-400">
          Закрепляйте важные справочники и фреймворки, чтобы команда не тратила время на поиск.
          Все ссылки открываются в новой вкладке.
        </p>
      </section>

      <div className="docs__sections grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docsSections.map((section) => (
          <section
            key={section.title}
            className="docs__group flex flex-col gap-3 rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-slate-900/70"
          >
            <h3 className="docs__group-title text-lg font-semibold">{section.title}</h3>
            <ul className="docs__group-list space-y-2 text-sm">
              {section.items.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="docs__link inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    {item.name}
                    <span aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
