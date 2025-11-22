import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import { analyticsApi } from "../api/analytics.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

function TopicCard({ topic }) {
  return (
    <article className="group flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 transition group-hover:text-blue-600 dark:text-gray-100">
            {topic.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
          {topic.articleCount || 0} статей
        </span>
      </div>
      {topic.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {topic.tags.map((tag) => (
            <span
              key={`${topic.id}-${tag}`}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      {topic.children?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          {topic.children.slice(0, 6).map((child) => (
            <span key={child.id} className="rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
              {child.title}
            </span>
          ))}
          {topic.children.length > 6 ? <span>…</span> : null}
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-between pt-2">
        <Link
          to={`/analytics/topics/${encodeURIComponent(topic.slug || topic.id)}`}
          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
        >
          Открыть тему
          <span aria-hidden className="text-base">→</span>
        </Link>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Подтем: {topic.children?.length || 0}
        </span>
      </div>
    </article>
  );
}

export default function AnalyticsHome() {
  const [topics, setTopics] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 250);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", tags: "", parentTopicId: "" });

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await analyticsApi.getTopics({ search: debounced, includeCounts: 1 });
        if (!cancelled) {
          setTopics(res.topics || []);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || "Не удалось загрузить темы");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <PageShell title="Аналитика">
      <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 transition-colors duration-500 dark:bg-slate-900/60 dark:ring-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">База знаний</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Темы, подтемы и статьи для команды. Используйте поиск или откройте нужную рубрику.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по темам и статьям"
                className="h-11 w-64 rounded-full border border-slate-200 bg-white px-4 pr-10 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            </div>
            <Link
              to="/analytics/queue"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Очередь статей
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-400 dark:hover:text-blue-200"
            >
              Добавить тему
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Всего тем: {topics.length}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Мягкие карточки · 1 уровень вложенности
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/80"
              />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-10 text-center text-gray-500 dark:bg-slate-800/70 dark:text-gray-400">
            Темы не найдены. Попробуйте изменить запрос.
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </section>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Новая тема" maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Название
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              placeholder="Например, «Дизайн данных»"
            />
          </label>
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Описание
            <textarea
              value={form.description}
              onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
            />
          </label>
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Теги (через запятую)
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((v) => ({ ...v, tags: e.target.value }))}
              placeholder="bpmn, uml"
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
            />
          </label>
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Родитель (необязательно)
            <select
              value={form.parentTopicId}
              onChange={(e) => setForm((v) => ({ ...v, parentTopicId: e.target.value }))}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
            >
              <option value="">Без родителя (главная тема)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
              {topics.flatMap((t) => t.children || []).map((child) => (
                <option key={`c-${child.id}`} value={child.id}>
                  {topics.find((p) => p.id === child.parentTopicId)?.title || "Тема"} → {child.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={async () => {
                if (!form.title.trim()) return toast.error("Добавьте название");
                setCreating(true);
                try {
                  const payload = {
                    title: form.title,
                    description: form.description,
                    tags: form.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                    parentTopicId: form.parentTopicId ? Number(form.parentTopicId) : undefined,
                  };
                  await analyticsApi.createTopic(payload);
                  toast.success("Тема создана");
                  setCreateOpen(false);
                  setForm({ title: "", description: "", tags: "", parentTopicId: "" });
                  const res = await analyticsApi.getTopics({ search: debounced, includeCounts: 1 });
                  setTopics(res.topics || []);
                } catch (e) {
                  toast.error(e.message || "Не удалось создать тему");
                } finally {
                  setCreating(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
