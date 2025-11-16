import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
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

  if (!data && loading) {
    return (
      <PageShell title="Тема">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/80" />
      </PageShell>
    );
  }

  if (!data) return null;

  const { topic, breadcrumbs, subtopics, articles } = data;

  return (
    <PageShell title={topic.title}>
      <div className="flex flex-col gap-6 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 transition-colors duration-500 dark:bg-slate-900/60 dark:ring-slate-800">
        <Breadcrumbs items={breadcrumbs || []} />
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{topic.title}</h1>
          <p className="max-w-3xl text-sm text-gray-600 dark:text-gray-400">{topic.description}</p>
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

        {subtopics?.length ? (
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
              {articles?.length || 0} материалов
            </span>
          </div>
          {articles?.length ? (
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
      </div>
    </PageShell>
  );
}
