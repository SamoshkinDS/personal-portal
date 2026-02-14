import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { analyticsApi } from "../../api/analytics.js";

function Breadcrumbs({ items }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Link to="/analytics" className="transition hover:text-blue-600 dark:hover:text-blue-400">
        Аналитика
      </Link>
      {items.map((item) => (
        <React.Fragment key={item.id}>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link
            to={`/analytics/topics/${encodeURIComponent(item.slug || item.id)}`}
            className="transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            {item.title}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

function SubtopicCard({ topic }) {
  return (
    <Link
      to={`/analytics/topics/${encodeURIComponent(topic.slug || topic.id)}`}
      className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{topic.title}</h4>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {topic.articleCount || 0} ст.
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 dark:text-gray-400">{topic.description}</p>
      {topic.tags?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {topic.tags.slice(0, 5).map((tag) => (
            <span key={`${topic.id}-${tag}`} className="rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function ArticleCard({ article }) {
  const updated =
    article.updatedAt || article.createdAt
      ? new Date(article.updatedAt || article.createdAt).toLocaleDateString("ru-RU")
      : "";
  return (
    <Link
      to={`/analytics/articles/${article.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/60 p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{article.title}</h4>
        <span className="text-xs text-gray-500 dark:text-gray-500">{updated}</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-3 dark:text-gray-400">
        {article.summary || "Небольшое описание пока не добавлено."}
      </p>
      {article.tags?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {article.tags.slice(0, 6).map((tag) => (
            <span
              key={`${article.id}-${tag}`}
              className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800/70"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition group-hover:gap-2 dark:text-blue-300">
        Читать
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export default function TopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteInfo, setDeleteInfo] = React.useState(null);
  const [form, setForm] = React.useState({ title: "", description: "", tags: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await analyticsApi.getTopic(topicId);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || "Не удалось загрузить тему");
          navigate("/analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [topicId, navigate]);

  const showSkeleton = loading && !data;
  const topic = data?.topic;
  const breadcrumbs = data?.breadcrumbs || [];
  const subtopics = data?.subtopics || [];
  const articles = data?.articles || [];

  const handleReload = async () => {
    try {
      const res = await analyticsApi.getTopic(topicId);
      setData(res);
      return res;
    } catch (e) {
      toast.error(e.message || "Не удалось обновить данные");
      return null;
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error("Добавьте название");
    setSaving(true);
    try {
      await analyticsApi.createTopic({
        title: form.title,
        description: form.description,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        parentTopicId: topic?.id,
      });
      toast.success("Подтема создана");
      setCreateOpen(false);
      setForm({ title: "", description: "", tags: "" });
      await handleReload();
    } catch (e) {
      toast.error(e.message || "Не удалось создать подтему");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.title.trim()) return toast.error("Добавьте название");
    setSaving(true);
    try {
      await analyticsApi.updateTopic(topic.id, {
        title: form.title,
        description: form.description,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Тема обновлена");
      setEditOpen(false);
      await handleReload();
    } catch (e) {
      toast.error(e.message || "Не удалось обновить тему");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!topic) return;
    try {
      await analyticsApi.deleteTopic(topic.id, { force });
      toast.success("Тема удалена");
      setDeleteInfo(null);
      navigate("/analytics");
    } catch (e) {
      if (e.status === 400 && e.message && e.message.includes("Связанные") && e.counts) {
        setDeleteInfo({ counts: e.counts, needForce: true });
      } else if (e.status === 400 && e.counts) {
        setDeleteInfo({ counts: e.counts, needForce: true });
      } else {
        toast.error(e.message || "Не удалось удалить тему");
      }
    }
  };

  const showOverlay = loading && !!data;

  return (
    <PageShell title={topic?.title || "Тема"}>
      <div className="relative flex flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 transition-colors duration-500 dark:bg-slate-900/60 dark:ring-slate-800 min-h-[70vh]">
        {showSkeleton ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-64 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            <Breadcrumbs items={breadcrumbs} />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{topic.title}</h1>
                  <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ title: topic.title, description: topic.description || "", tags: (topic.tags || []).join(", ") });
                      setEditOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-blue-400 dark:hover:text-blue-200"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteInfo({ counts: null, needForce: false })}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                  >
                    Удалить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ title: "", description: "", tags: "" });
                      setCreateOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Добавить подтему
                  </button>
                </div>
              </div>
              {topic.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {topic.tags.map((tag) => (
                    <span
                      key={`${topic.id}-${tag}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {subtopics.length ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Подтемы</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-500">1 уровень вложенности</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {subtopics.map((child) => (
                    <SubtopicCard key={child.id} topic={child} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Статьи</h3>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {articles.length || 0} материалов
                </span>
              </div>
              {articles.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-gray-500 dark:bg-slate-800/70 dark:text-gray-400">
                  Пока нет статей в этой теме.
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-10 text-center text-gray-500 dark:bg-slate-800/70 dark:text-gray-400">
            Тема не найдена
          </div>
        )}

        {showOverlay ? (
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/70 backdrop-blur-sm transition-opacity duration-300 dark:bg-slate-900/60" />
        ) : null}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Новая подтема" maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Название
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              placeholder="Название подтемы"
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
              onClick={handleCreate}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Создать"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Редактировать тему" maxWidth="max-w-2xl">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Название
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
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
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteInfo} onClose={() => setDeleteInfo(null)} title="Удалить тему?" maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          {deleteInfo?.counts ? (
            <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
              В теме есть{" "}
              <span className="font-semibold">{deleteInfo.counts.subtopics}</span> подтем и{" "}
              <span className="font-semibold">{deleteInfo.counts.articles}</span> статей. Удалить вместе с ними?
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Тема будет удалена. Если в ней есть материалы, они также будут удалены.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteInfo(null)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => handleDelete(true)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
