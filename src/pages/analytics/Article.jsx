import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { analyticsApi } from "../../api/analytics.js";

function Breadcrumbs({ items, topic }) {
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
      {topic ? (
        <>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link
            to={`/analytics/topics/${encodeURIComponent(topic.slug || topic.id)}`}
            className="transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            {topic.title}
          </Link>
        </>
      ) : null}
    </nav>
  );
}

export default function ArticlePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [editMode, setEditMode] = React.useState(false);
  const [draftContent, setDraftContent] = React.useState("");
  const [draftSummary, setDraftSummary] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await analyticsApi.getArticle(articleId);
        if (cancelled) return;
        setData(res);
        setDraftContent(res.article?.content || "");
        setDraftSummary(res.article?.summary || "");
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message || "Не удалось загрузить статью");
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
  }, [articleId, navigate]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await analyticsApi.updateArticle(articleId, {
        summary: draftSummary,
        content: draftContent,
      });
      setData((prev) => ({ ...(prev || {}), article: res.article, editedAt: Date.now() }));
      toast.success("Статья обновлена");
      setEditMode(false);
    } catch (e) {
      toast.error(e.message || "Не удалось обновить статью");
    } finally {
      setSaving(false);
    }
  }

  if (!data && loading) {
    return (
      <PageShell title="Статья">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/80" />
      </PageShell>
    );
  }

  if (!data) return null;

  const { article, topic, breadcrumbs } = data;
  const updatedText =
    article.updatedAt || article.createdAt
      ? new Date(article.updatedAt || article.createdAt).toLocaleString("ru-RU")
      : "";

  return (
    <PageShell title={article.title}>
      <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 transition-colors duration-500 dark:bg-slate-900/60 dark:ring-slate-800">
        <Breadcrumbs items={breadcrumbs || []} topic={topic} />
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{article.title}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-500">Обновлено: {updatedText}</p>
              </div>
              <div className="flex items-center gap-3">
              {article.queueId ? (
                <Link
                  to="/analytics/queue"
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30"
                >
                  Из очереди #{article.queueId}
                </Link>
              ) : null}
                {!editMode ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-blue-400 dark:hover:text-blue-200"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                    >
                      {deleting ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Сохранение..." : "Сохранить"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
          {article.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={`${article.id}-${tag}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {!editMode ? (
          <article className="prose prose-slate max-w-none dark:prose-invert">
            {article.content ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Контент пока не добавлен.</p>
            )}
          </article>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Короткое описание
              <textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Контент (HTML/Markdown)
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={12}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-gray-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </label>
          </div>
        )}
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Удалить статью?"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Статья будет удалена без возможности восстановления.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await analyticsApi.deleteArticle(article.id);
                    toast.success("Статья удалена");
                    navigate("/analytics");
                  } catch (e) {
                    toast.error(e.message || "Не удалось удалить статью");
                  } finally {
                    setDeleting(false);
                    setDeleteOpen(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Удалить
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageShell>
  );
}
