import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { analyticsApi } from "../../api/analytics.js";
import { API_BASE_URL } from "../../utils/api.js";

const STATUS_META = {
  draft: { label: "Черновик", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  processing: { label: "Обработка", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200" },
  finished: { label: "Завершено", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200" },
  published: { label: "Опубликовано", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>;
}

function TopicTreeModal({ open, onClose, topics, onSelect, current }) {
  const [expanded, setExpanded] = React.useState(new Set());
  const [selected, setSelected] = React.useState(current || null);

  React.useEffect(() => {
    setSelected(current || null);
  }, [current]);

  function toggle(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Выбор темы для публикации" maxWidth="max-w-3xl">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Выберите тему или подтему, куда будет опубликована статья. Дерево раскрывается на один уровень.
        </p>
        <div className="rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {topics.map((topic) => (
              <li key={topic.id} className="p-3">
                <div className="flex items-center gap-2">
                  {topic.children?.length ? (
                    <button
                      type="button"
                      onClick={() => toggle(topic.id)}
                      className="h-7 w-7 rounded-full bg-slate-100 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {expanded.has(topic.id) ? "−" : "+"}
                    </button>
                  ) : (
                    <span className="h-7 w-7" />
                  )}
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="topic"
                      className="h-4 w-4"
                      checked={selected === topic.id}
                      onChange={() => setSelected(topic.id)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{topic.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{topic.description}</p>
                    </div>
                  </label>
                </div>
                {expanded.has(topic.id) && topic.children?.length ? (
                  <ul className="mt-2 space-y-2 pl-11">
                    {topic.children.map((child) => (
                      <li key={child.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800">
                          <input
                            type="radio"
                            name="topic"
                            className="mt-1 h-4 w-4"
                            checked={selected === child.id}
                            onChange={() => setSelected(child.id)}
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{child.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">{child.description}</p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSelect?.(selected)}
            disabled={!selected}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Опубликовать
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InstructionModal({ open, onClose }) {
  const base = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return (
    <Modal open={open} onClose={onClose} title="Инструкция для API / n8n" maxWidth="max-w-3xl">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">1. Как получать статьи для обработки</p>
          <code className="mt-1 block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            GET {base}/api/articles-queue?status=processing
          </code>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">2. Формат ответа</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
{`[
  {
    "id": 12,
    "title": "Диаграммы BPMN",
    "description": "основы, задачи, элементы",
    "status": "processing",
    "createdAt": "...",
    "updatedAt": "..."
  }
]`}
          </pre>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">3. Как отправить готовую статью</p>
          <code className="mt-1 block rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            POST {base}/api/articles
          </code>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Headers: Content-Type: application/json</p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">4. Формат payload</p>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
{`{
  "queue_id": 12,
  "title": "...",
  "content": "<p>контент html/md</p>",
  "tags": ["bpmn", "process"],
  "status": "finished"
}`}
          </pre>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ open, onClose, onConfirm, description }) {
  return (
    <Modal open={open} onClose={onClose} title="Подтвердите действие" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ArticlesQueuePage() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({ status: "all", hidePublished: true });
  const [newItem, setNewItem] = React.useState({ title: "", description: "" });
  const [preview, setPreview] = React.useState(null);
  const [editDraft, setEditDraft] = React.useState({ title: "", description: "", content: "", status: "draft" });
  const [topicsTree, setTopicsTree] = React.useState([]);
  const [topicModalOpen, setTopicModalOpen] = React.useState(false);
  const [instructionOpen, setInstructionOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  React.useEffect(() => {
    loadQueue(filters);
  }, [filters]);

  async function loadQueue(params) {
    setLoading(true);
    try {
      const res = await analyticsApi.listQueue(params);
      setItems(res.items || []);
      if (preview) {
        const updated = res.items?.find((i) => i.id === preview.id);
        if (updated) {
          setPreview(updated);
          setEditDraft({
            title: updated.title,
            description: updated.description || "",
            content: updated.content || "",
            status: updated.status,
          });
        }
      }
    } catch (e) {
      toast.error(e.message || "Не удалось загрузить очередь");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newItem.title.trim()) return toast.error("Добавьте название");
    try {
      const res = await analyticsApi.createQueue({ ...newItem, status: "draft" });
      setItems((prev) => [res.item, ...prev]);
      setNewItem({ title: "", description: "" });
      toast.success("Черновик добавлен");
    } catch (e) {
      toast.error(e.message || "Не удалось создать запись");
    }
  }

  function selectItem(item) {
    setPreview(item);
    setEditDraft({
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      status: item.status,
    });
  }

  async function handleUpdate(fields) {
    if (!preview) return;
    try {
      const res = await analyticsApi.updateQueue(preview.id, fields);
      setItems((prev) => prev.map((i) => (i.id === preview.id ? res.item : i)));
      setPreview(res.item);
      setEditDraft((draft) => ({ ...draft, ...fields }));
      toast.success("Сохранено");
    } catch (e) {
      toast.error(e.message || "Не удалось обновить запись");
    }
  }

  async function ensureTopics() {
    if (topicsTree.length) return;
    try {
      const res = await analyticsApi.getTopics({ includeCounts: 0 });
      setTopicsTree(res.topics || []);
    } catch (e) {
      toast.error(e.message || "Не удалось загрузить темы");
    }
  }

  async function handlePublish(topicId) {
    if (!preview) return;
    if (!topicId) return toast.error("Выберите тему");
    setPublishing(true);
    try {
      const res = await analyticsApi.publishFromQueue(preview.id, topicId);
      await loadQueue(filters);
      toast.success("Статья опубликована");
      setTopicModalOpen(false);
      selectItem(res.article ? { ...preview, status: "published", publishedArticleId: res.article.id } : preview);
    } catch (e) {
      toast.error(e.message || "Не удалось опубликовать");
    } finally {
      setPublishing(false);
    }
  }

  const filteredItems = items;

  return (
    <PageShell title="Очередь статей">
      <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 transition-colors duration-500 dark:bg-slate-900/60 dark:ring-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Очередь статей</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Черновики, обработка n8n и публикация в темы. Фильтруйте по статусу и скрывайте опубликованные записи.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              Статус
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="h-10 rounded-full border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
              >
                <option value="all">Все</option>
                <option value="draft">Черновик</option>
                <option value="processing">Обработка</option>
                <option value="finished">Завершено</option>
                <option value="published">Опубликовано</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={filters.hidePublished}
                onChange={(e) => setFilters((f) => ({ ...f, hidePublished: e.target.checked }))}
              />
              Скрывать опубликованные
            </label>
            <button
              type="button"
              onClick={() => setInstructionOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-blue-400 dark:hover:text-blue-200"
            >
              Инструкция для API / n8n
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50/70 p-4 dark:bg-slate-800/60">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Новый черновик</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem((v) => ({ ...v, title: e.target.value }))}
              placeholder="Название"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem((v) => ({ ...v, description: e.target.value }))}
              placeholder="Краткое описание / промт для генерации"
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Создать
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm text-gray-800 dark:divide-slate-800 dark:text-gray-100">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Название</th>
                  <th className="px-4 py-3 text-left font-semibold">Описание</th>
                  <th className="px-4 py-3 text-left font-semibold">Статус</th>
                  <th className="px-4 py-3 text-left font-semibold">Обновлено</th>
                  <th className="px-4 py-3 text-left font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Загрузка...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Нет записей для выбранного фильтра
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const updated = item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString("ru-RU")
                      : "";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => selectItem(item)}
                            className="text-left font-semibold text-blue-700 transition hover:underline dark:text-blue-300"
                          >
                            {item.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{updated}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              selectItem(item);
                              ensureTopics();
                              setTopicModalOpen(true);
                            }}
                            className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-200 dark:hover:bg-blue-500/10"
                            disabled={item.status === "published"}
                          >
                            Опубликовать
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="ml-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {preview ? (
          <div className="flex flex-col gap-4 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900/70 dark:ring-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={preview.status} />
                {preview.publishedArticleId ? (
                  <a
                    href={`/analytics/articles/${preview.publishedArticleId}`}
                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100 transition hover:bg-green-100 dark:bg-green-500/10 dark:text-green-200 dark:ring-green-500/30"
                  >
                    Опубликовано
                  </a>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    ensureTopics();
                    setTopicModalOpen(true);
                  }}
                  disabled={preview.status === "published" || !preview.content}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Опубликовать
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(preview)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                >
                  Удалить
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Название
                <input
                  type="text"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((v) => ({ ...v, title: e.target.value }))}
                  onBlur={() => handleUpdate({ title: editDraft.title })}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Статус
                <select
                  value={editDraft.status}
                  onChange={(e) => {
                    const next = e.target.value;
                    setEditDraft((v) => ({ ...v, status: next }));
                    handleUpdate({ status: next });
                  }}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
                >
                  <option value="draft">Черновик</option>
                  <option value="processing">Обработка</option>
                  <option value="finished">Завершено</option>
                  <option value="published">Опубликовано</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 md:col-span-2">
                Краткое описание
                <textarea
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((v) => ({ ...v, description: e.target.value }))}
                  onBlur={() => handleUpdate({ description: editDraft.description })}
                  rows={2}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </label>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 md:col-span-2">
                Контент статьи (черновик)
                <textarea
                  value={editDraft.content}
                  onChange={(e) => setEditDraft((v) => ({ ...v, content: e.target.value }))}
                  rows={8}
                  onBlur={() => handleUpdate({ content: editDraft.content })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

      <TopicTreeModal
        open={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        topics={topicsTree}
        onSelect={(id) => handlePublish(id)}
        current={null}
      />
      <InstructionModal open={instructionOpen} onClose={() => setInstructionOpen(false)} />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        description="Запись будет удалена из очереди без возможности восстановления."
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await analyticsApi.deleteQueue(deleteTarget.id);
            setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
            if (preview?.id === deleteTarget.id) {
              setPreview(null);
            }
            toast.success("Удалено из очереди");
          } catch (e) {
            toast.error(e.message || "Не удалось удалить");
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
      {publishing ? <div className="sr-only">Публикуем...</div> : null}
    </PageShell>
  );
}
