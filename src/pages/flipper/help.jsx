// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import PageShell from "../../components/PageShell.jsx";

const steps = [
  {
    title: "Категории",
    body: "Создайте базовые разделы: Название, Slug, Тип (basic/firmware/module/guide/vuln), описание. Они появляются в списках и деталях (например, /flipper/basic).",
    link: "/admin/flipper",
    linkLabel: "Открыть Категории",
  },
  {
    title: "Прошивки",
    body: "Добавьте кастомные прошивки (unleashed, marauder, momentum, bunnyloader): название, slug, описания, ссылки. Появится страница /flipper/firmware/<slug>.",
    link: "/admin/flipper",
    linkLabel: "Открыть Прошивки",
  },
  {
    title: "Модули",
    body: "Модули/плагины: slug, прошивка, supported_firmwares, категория, описание, source_url. Карточки в /flipper/modules и детали /flipper/module/<slug>.",
    link: "/admin/flipper",
    linkLabel: "Открыть Модули",
  },
  {
    title: "Статьи",
    body: "Основной контент: заголовок, slug, категория, тип (feature_basic, feature_custom_fw, module_custom, guide_scenario, vuln_check), прошивка (опц.), summary, Markdown контент, теги.",
    link: "/admin/flipper",
    linkLabel: "Открыть Статьи",
  },
  {
    title: "Гайды и уязвимости",
    body: "Гайды — type=guide_scenario → /flipper/guides и /flipper/guide/<slug>. Уязвимости — type=vuln_check → /flipper/vulns и /flipper/vuln/<slug>.",
  },
  {
    title: "Очередь n8n",
    body: "Создайте задачу generate/update/regenerate с payload (JSON). n8n берёт pending → ставит processing → генерирует Markdown → сохраняет статью → done. В случае ошибки status=error + error_message.",
    link: "/admin/flipper",
    linkLabel: "Открыть Очередь",
  },
];

const payloadExample = `{
  "title": "Основы RFID",
  "category_id": 1,
  "type": "feature_basic",
  "points": ["Что такое RFID", "Как работает эмуляция"]
}`;

export default function FlipperHelp() {
  return (
    <PageShell title="Flipper Zero — справка" contentClassName="space-y-4">
      <Link to="/flipper" className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">
        ← Назад в раздел Flipper Zero
      </Link>

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Как пользоваться</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Раздел полностью управляем через админку Flipper Zero. Создавайте категории, прошивки, модули и статьи, а генерацию текста можно
          поручить n8n через очередь задач.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:ring-slate-800"
          >
            <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{step.title}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.body}</p>
            {step.link ? (
              <Link to={step.link} className="mt-3 inline-flex text-sm text-indigo-600 hover:underline dark:text-indigo-300">
                {step.linkLabel || "Перейти"}
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Пример payload для очереди</div>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-xs text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-700">
          {payloadExample}
        </pre>
      </div>
    </PageShell>
  );
}
