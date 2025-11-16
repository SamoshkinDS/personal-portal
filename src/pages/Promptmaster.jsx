// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import { promptmasterApi } from "../api/promptmaster.js";

const STATUS_META = {
  draft: { label: "Черновик", tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100" },
  sent: { label: "Отправлено", tone: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" },
  processing: { label: "В работе", tone: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" },
  done: { label: "Завершено", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" },
  error: { label: "Ошибка", tone: "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return value;
  }
}

export default function PromptmasterPage() {
  const [query, setQuery] = React.useState("");
  const [requests, setRequests] = React.useState([]);
  const [expanded, setExpanded] = React.useState(new Set());
  const [loadingQueue, setLoadingQueue] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  const [library, setLibrary] = React.useState({ categories: [], articles: [] });
  const [breadcrumbs, setBreadcrumbs] = React.useState([{ id: null, title: "Библиотека промтов" }]);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const [selectedArticle, setSelectedArticle] = React.useState(null);

  React.useEffect(() => {
    loadQueue();
    loadListing();
  }, []);

  async function loadQueue() {
    setLoadingQueue(true);
    try {
      const data = await promptmasterApi.listRequests();
      setRequests(data?.requests || []);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить очередь");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function loadListing(categoryId, trailOverride) {
    setLibraryLoading(true);
    try {
      const data = categoryId ? await promptmasterApi.getCategory(categoryId) : await promptmasterApi.listCategories();
      const categories = data?.children || data?.categories || [];
      const articles = data?.articles || [];
      setLibrary({ categories, articles });
      if (trailOverride) {
        setBreadcrumbs(trailOverride);
      } else if (!categoryId) {
        setBreadcrumbs([{ id: null, title: "Библиотека промтов" }]);
      }
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить библиотеку");
    } finally {
      setSelectedArticle(null);
      setLibraryLoading(false);
    }
  }

  async function submitQuery(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error("Введите запрос для генерации");
      return;
    }
    setSending(true);
    try {
      const data = await promptmasterApi.createRequest(trimmed);
      if (data?.request) {
        setRequests((prev) => [data.request, ...prev]);
      }
      toast.success(data?.webhook?.ok === false ? "Запрос сохранён, но webhook не ответил" : "Запрос отправлен");
      setQuery("");
    } catch (error) {
      toast.error(error.message || "Не удалось отправить запрос");
    } finally {
      setSending(false);
    }
  }

  function toggleRow(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyText(value, message = "Скопировано") {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch (error) {
      toast.error("Не удалось скопировать");
    }
  }

  async function resend(id) {
    try {
      const data = await promptmasterApi.triggerWebhook(id);
      if (data?.request) {
        setRequests((prev) => prev.map((row) => (row.id === id ? data.request : row)));
      }
      if (data?.webhook?.ok) toast.success("Запрос повторно отправлен");
      else toast.error(data?.webhook?.message || "Webhook не ответил");
    } catch (error) {
      toast.error(error.message || "Не удалось отправить снова");
    }
  }

  async function openCategory(category) {
    const trailIndex = breadcrumbs.findIndex((c) => c.id === category.id);
    const nextTrail =
      trailIndex >= 0
        ? breadcrumbs.slice(0, trailIndex + 1)
        : [...breadcrumbs, { id: category.id, title: category.title }];
    await loadListing(category.id, nextTrail);
  }

  async function onBreadcrumbClick(target, index) {
    const targetId = target.id;
    const sliced = breadcrumbs.slice(0, index + 1);
    if (!targetId) {
      await loadListing(undefined, [{ id: null, title: "Библиотека промтов" }]);
      return;
    }
    await loadListing(targetId, sliced);
  }

  async function openArticle(id) {
    try {
      const data = await promptmasterApi.getArticle(id);
      setSelectedArticle(data?.article || null);
    } catch (error) {
      toast.error(error.message || "Не удалось открыть статью");
    }
  }

  return (
    <PageShell title="Промтмастер" contentClassName="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Генерация промтов</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Поле запроса</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Добавьте задачу, она уйдет в n8n через webhook. После обработки появится итоговый промт.
            </p>
          </div>
        </div>
        <form onSubmit={submitQuery} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Мне нужна идея для развития своего сайта"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-50 dark:focus:ring-indigo-700"
          />
          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400 md:w-auto"
          >
            {sending ? "Отправляем..." : "Отправить"}
          </button>
        </form>
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-800 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Очередь запроса</p>
          <p>
            Черновик → Отправлено → В работе → Завершено. При ошибке статус будет отмечен красным, запрос можно
            отправить повторно.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Очередь запросов</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Последние запросы</h3>
          </div>
          <button
            type="button"
            onClick={loadQueue}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            Обновить
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Запрос</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm dark:divide-slate-800 dark:bg-slate-900">
              {loadingQueue ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Загружаем очередь...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Запросов пока нет
                  </td>
                </tr>
              ) : (
                requests.map((item) => {
                  const isOpen = expanded.has(item.id);
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 font-medium text-gray-900 dark:text-gray-50">{item.query}</p>
                          {item.result ? (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                              Итоговый промт готов
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {item.status === "error" ? (
                              <button
                                type="button"
                                onClick={() => resend(item.id)}
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-900/40"
                              >
                                Повторить
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => toggleRow(item.id)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                            >
                              {isOpen ? "Скрыть" : "Раскрыть"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="bg-slate-50/60 dark:bg-slate-800/70">
                          <td colSpan={4} className="px-4 py-4">
                            {item.result ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Итоговый промт</p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => copyText(item.result, "Промт скопирован")}
                                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                                    >
                                      Копировать
                                    </button>
                                  </div>
                                </div>
                                <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm text-gray-900 shadow-inner dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100">
                                  {item.result}
                                </pre>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600 dark:text-gray-300">Итоговый промт пока не готов</p>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Библиотека промтов</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Каталог готовых материалов</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Папки и статьи по темам. Выберите папку или промт, чтобы открыть детально и скопировать.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id ?? "root"}>
                <button
                  type="button"
                  onClick={() => onBreadcrumbClick(crumb, idx)}
                  className="rounded-lg border border-slate-200 px-3 py-1 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {crumb.title}
                </button>
                {idx < breadcrumbs.length - 1 ? <span className="text-slate-400">/</span> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {libraryLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-800 dark:text-gray-300">
                Загружаем библиотеку...
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {library.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => openCategory(cat)}
                      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-100">
                          📁
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{cat.title}</p>
                          <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {library.categories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-gray-500 dark:border-slate-700 dark:text-gray-300">
                      Папок на этом уровне пока нет
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {library.articles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => openArticle(article.id)}
                      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/80"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{article.title}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          Статья
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{article.description}</p>
                    </button>
                  ))}
                  {library.articles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-gray-500 dark:border-slate-700 dark:text-gray-300">
                      Статей на этом уровне пока нет
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <div className="h-full rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Детали</p>
            {selectedArticle ? (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{selectedArticle.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedArticle.description}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase text-indigo-600">Промт</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {selectedArticle.content || "Контент пока не заполнен"}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(selectedArticle.content || "", "Промт скопирован")}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Копировать
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                Выберите статью, чтобы увидеть полный текст промта и скопировать его.
              </p>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
