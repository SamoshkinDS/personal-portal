// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getArticleBySlug } from "../../../api/flipper.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function FlipperGuideDetail() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleBySlug(slug)
      .then((data) => setGuide(data))
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Гайд / ${guide?.title || "..."}`} contentClassName="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
        <Link to="/flipper/guides" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← К списку гайдов
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : !guide ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Гайд не найден</div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{guide.title}</h1>
            <span className="text-xs text-slate-500">{guide.slug}</span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/40">
              {guide.type}
            </span>
          </div>
          {guide.summary ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{guide.summary}</p> : null}
          <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.content_raw || guide.content_rendered || ""}</ReactMarkdown>
          </div>
        </div>
      )}
    </PageShell>
  );
}
