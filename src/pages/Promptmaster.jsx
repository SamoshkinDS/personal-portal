// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
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
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [newCategory, setNewCategory] = React.useState({ title: "", description: "", parentId: "" });
  const [newArticle, setNewArticle] = React.useState({ title: "", description: "", content: "", categoryId: "" });
  const [savingCategory, setSavingCategory] = React.useState(false);
  const [savingArticle, setSavingArticle] = React.useState(false);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [addMode, setAddMode] = React.useState("prompt");
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsLoading, setSettingsLoading] = React.useState(false);
  const [settings, setSettings] = React.useState({ webhookUrl: "", webhookToken: "", responseToken: "" });
  const [savingSettings, setSavingSettings] = React.useState(false);

  React.useEffect(() => {
    loadQueue();
    loadListing();
    loadCategoriesOptions();
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

  async function loadCategoriesOptions() {
    try {
      const data = await promptmasterApi.listAllCategories();
      setCategoryOptions(data?.categories || []);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить папки");
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

  function openAddModal(mode = "prompt") {
    setAddMode(mode);
    setAddModalOpen(true);
  }

  function closeAddModal() {
    setAddModalOpen(false);
  }

  async function openSettingsModal() {
    setSettingsModalOpen(true);
    setSettingsLoading(true);
    try {
      const data = await promptmasterApi.getSettings();
      if (data?.settings) {
        setSettings({
          webhookUrl: data.settings.webhookUrl || "",
          webhookToken: data.settings.webhookToken || "",
          responseToken: data.settings.responseToken || "",
        });
      }
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить настройки");
    } finally {
      setSettingsLoading(false);
    }
  }

  function closeSettingsModal() {
    setSettingsModalOpen(false);
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        webhookUrl: settings.webhookUrl?.trim(),
        webhookToken: settings.webhookToken?.trim(),
        responseToken: settings.responseToken?.trim(),
      };
      await promptmasterApi.saveSettings(payload);
      toast.success("Настройки сохранены");
      setSettingsModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Не удалось сохранить настройки");
    } finally {
      setSavingSettings(false);
    }
  }

  async function submitCategory(e) {
    e.preventDefault();
    const trimmed = newCategory.title.trim();
    if (!trimmed) {
      toast.error("Введите название папки");
      return;
    }
    setSavingCategory(true);
    try {
      await promptmasterApi.createCategory({
        title: trimmed,
        description: newCategory.description || undefined,
        parentId: newCategory.parentId || undefined,
      });
      toast.success("Папка создана");
      setNewCategory({ title: "", description: "", parentId: "" });
      await loadCategoriesOptions();
      await loadListing(breadcrumbs.at(-1)?.id || undefined, breadcrumbs);
    } catch (error) {
      toast.error(error.message || "Не удалось создать папку");
    } finally {
      setSavingCategory(false);
    }
  }

  async function submitArticle(e) {
    e.preventDefault();
    const { title, description, content, categoryId } = newArticle;
    if (!title.trim() || !categoryId) {
      toast.error("Укажите категорию и название");
      return;
    }
    setSavingArticle(true);
    try {
      await promptmasterApi.createArticle({
        title: title.trim(),
        description: description || "",
        content: content || "",
        categoryId: Number(categoryId),
      });
      toast.success("Промт добавлен");
      setNewArticle({ title: "", description: "", content: "", categoryId: "" });
      await loadListing(breadcrumbs.at(-1)?.id || undefined, breadcrumbs);
    } catch (error) {
      toast.error(error.message || "Не удалось создать промт");
    } finally {
      setSavingArticle(false);
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
            <button
              type="button"
              onClick={() => openAddModal("prompt")}
              className="ml-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Добавить +
            </button>
            <button
              type="button"
              onClick={openSettingsModal}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
            >
              Настройки
            </button>
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

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
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

      <Modal open={addModalOpen} onClose={closeAddModal} title="Добавить в библиотеку" maxWidth="max-w-3xl">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddMode("prompt")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                addMode === "prompt"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-gray-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              }`}
            >
              Промт
            </button>
            <button
              type="button"
              onClick={() => setAddMode("category")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                addMode === "category"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-gray-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              }`}
            >
              Папка
            </button>
          </div>

          {addMode === "prompt" ? (
            <form className="space-y-3" onSubmit={submitArticle}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Категория
                <select
                  value={newArticle.categoryId}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Название
                <input
                  value={newArticle.title}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  placeholder="Название промта"
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Короткое описание
                <input
                  value={newArticle.description}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  placeholder="О чем этот промт"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Текст промта
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle((prev) => ({ ...prev, content: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  rows={5}
                  placeholder="Полный текст промта"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingArticle}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-400"
                >
                  {savingArticle ? "Сохраняем..." : "Создать промт"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={submitCategory}>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Название
                <input
                  value={newCategory.title}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  placeholder="Новая категория"
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Описание
                <input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                  placeholder="Короткое описание"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                Родительская папка (опционально)
                <select
                  value={newCategory.parentId}
                  onChange={(e) => setNewCategory((prev) => ({ ...prev, parentId: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                >
                  <option value="">Корень</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-400"
                >
                  {savingCategory ? "Сохраняем..." : "Создать папку"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <Modal open={settingsModalOpen} onClose={closeSettingsModal} title="Настройки Промтмастера" maxWidth="max-w-xl">
        {settingsLoading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Загружаем настройки...</p>
        ) : (
          <form className="space-y-3" onSubmit={saveSettings}>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
              PROMPTMASTER_WEBHOOK_URL
              <input
                value={settings.webhookUrl}
                onChange={(e) => setSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                placeholder="https://n8n.example.com/webhook/..."
              />
            </label>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
              PROMPTMASTER_WEBHOOK_TOKEN
              <input
                value={settings.webhookToken}
                onChange={(e) => setSettings((prev) => ({ ...prev, webhookToken: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                placeholder="Bearer token"
              />
            </label>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
              PROMPTMASTER_RESPONSE_TOKEN
              <input
                value={settings.responseToken}
                onChange={(e) => setSettings((prev) => ({ ...prev, responseToken: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus:ring-indigo-700"
                placeholder="Token для ответа n8n"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeSettingsModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {savingSettings ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </PageShell>
  );
}
