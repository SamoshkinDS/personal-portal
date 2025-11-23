// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getArticleBySlug } from "../../../api/flipper.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FlipperVulnDetail() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleBySlug(slug)
      .then((data) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Уязвимость / ${item?.title || "..."}`} contentClassName="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
        <Link to="/flipper/vulns" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← К списку уязвимостей
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : !item ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Запись не найдена</div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{item.title}</h1>
            <span className="text-xs text-slate-500">{item.slug}</span>
          </div>
          {item.summary ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.summary}</p> : null}
          <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content_raw || item.content_rendered || ""}</ReactMarkdown>
          </div>
        </div>
      )}
    </PageShell>
  );
}
