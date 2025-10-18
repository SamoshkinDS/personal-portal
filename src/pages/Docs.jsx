// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import backendTasksDoc from "../../docs/BACKEND_TASKS_POSTS_SYNC.md?raw";
import outlineDoc from "../../docs/OUTLINE_VPN_INTEGRATION.md?raw";
import notificationsDoc from "../../docs/NOTIFICATIONS_AND_DIGESTS.md?raw";
import rbacDoc from "../../docs/RBAC_PERMISSIONS.md?raw";

const docsSections = [
  {
    title: "Исследования и аналитика",
    items: [
      { name: "Product Analytics 101", url: "https://productanalytics.example.com" },
      { name: "JTBD: как понимать пользователей", url: "https://jtbdframework.example.com" },
    ],
  },
  {
    title: "Справочники разработчика",
    items: [
      { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
      { name: "React Docs", url: "https://react.dev" },
    ],
  },
  {
    title: "Командные площадки",
    items: [
      { name: "Рабочее пространство в Notion", url: "https://notion.so/workspace" },
      { name: "База знаний в Confluence", url: "https://confluence.example.com" },
    ],
  },
];

const internalDocs = [
  {
    id: "backend-tasks",
    title: "Синхронизация задач и постов",
    description:
      "REST API, миграции PostgreSQL и интеграция с AuthContext — перенос todo/notes на бэкенд.",
    content: backendTasksDoc,
  },
  {
    id: "outline",
    title: "Интеграция Outline API",
    description:
      "Серверные маршруты, кеширование, UI для ключей, лимиты трафика и права доступа VPN.",
    content: outlineDoc,
  },
  {
    id: "notifications",
    title: "Уведомления и дайджесты",
    description:
      "Центр уведомлений, IndexedDB, push через Service Worker и API журнала событий.",
    content: notificationsDoc,
  },
  {
    id: "rbac",
    title: "RBAC и гранулярные права",
    description:
      "Permissions, middleware requirePermission, UI управления правами и новая маршрутизация.",
    content: rbacDoc,
  },
];

function DocCard({ doc, onRead }) {
  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900/70">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doc.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
      <button
        type="button"
        onClick={() => onRead(doc)}
        className="mt-auto inline-flex w-fit items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
      >
        Читать полностью
      </button>
    </article>
  );
}

export default function Docs() {
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const normalizedQuery = search.trim().toLowerCase();
  const filteredInternalDocs = React.useMemo(() => {
    if (!normalizedQuery) return internalDocs;
    return internalDocs.filter((doc) => {
      const haystack = `${doc.title} ${doc.description} ${doc.content}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  return (
    <>
      <PageShell
        title="Документация"
        contentClassName="docs docs--catalog flex flex-col gap-6 bg-transparent p-0"
      >
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Быстрый доступ к материалам
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Собрали внутренние конспекты и внешние ресурсы, которые помогают сопровождать портал и
            инфраструктуру. Внутренние файлы можно раскрыть прямо отсюда, а внешние ссылки ведут в
            знакомые хабы.
          </p>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Внутренняя документация
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Краткие карты задач и архитектуры. Нажмите «Читать полностью», чтобы раскрыть файл.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по ключевым словам…"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Найдено документов: {filteredInternalDocs.length}
          </div>

          {filteredInternalDocs.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900/60 dark:text-gray-400">
              Ничего не найдено. Попробуйте уточнить запрос или ввести другую формулировку.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredInternalDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onRead={setSelectedDoc} />
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docsSections.map((section) => (
            <section
              key={section.title}
              className="flex flex-col gap-3 rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-slate-900/70"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
              <ul className="space-y-2 text-sm">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      {item.name}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PageShell>

      <Modal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || ""}
        maxWidth="max-w-3xl"
      >
        <article className="space-y-3 whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
          {selectedDoc?.content}
        </article>
      </Modal>
    </>
  );
}
