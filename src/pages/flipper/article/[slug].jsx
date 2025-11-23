// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getArticleBySlug } from "../../../api/flipper.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlipperHeader, StickyAside, InfoCard, FlipperBadge } from "../../../components/flipper/ui.jsx";

export default function FlipperArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleBySlug(slug)
      .then((data) => setArticle(data))
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Статья / ${article?.title || "..."}`} contentClassName="space-y-4">
      <FlipperHeader
        title={article?.title || "Статья"}
        subtitle={article?.summary || "Подробный материал по Flipper Zero"}
        type={article?.type || "basic"}
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Статьи", href: "/flipper/articles" },
          { label: article?.title || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !article ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Статья не найдена</div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center gap-2">
                <FlipperBadge type={article.type} />
                <span className="text-xs text-slate-500">{article.slug}</span>
              </div>
              <div className="text-xs text-slate-500">
                Категория: {article.category_id || "—"} · Прошивка: {article.firmware_id || "—"}
              </div>
              {article.summary ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{article.summary}</p> : null}
              <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_raw || article.content_rendered || ""}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        <StickyAside>
          <InfoCard title="Оглавление">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Секции формируются из заголовков H2/H3.
            </div>
          </InfoCard>
          <InfoCard title="Похожие материалы">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Используйте список статей для поиска похожих тем.
            </div>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
