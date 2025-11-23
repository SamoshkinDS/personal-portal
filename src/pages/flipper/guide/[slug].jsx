// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getArticleBySlug } from "../../../api/flipper.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlipperHeader, StickyAside, InfoCard, FlipperBadge } from "../../../components/flipper/ui.jsx";

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
      <FlipperHeader
        title={guide?.title || "Гайд"}
        subtitle={guide?.summary || "Пошаговая инструкция"}
        type="guide"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Гайды", href: "/flipper/guides" },
          { label: guide?.title || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !guide ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Гайд не найден</div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center gap-2">
                <FlipperBadge type="guide" />
                <span className="text-xs text-slate-500">{guide.slug}</span>
              </div>
              <div className="prose prose-sm mt-2 max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.content_raw || guide.content_rendered || ""}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        <StickyAside>
          <InfoCard title="Требования">
            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300">
              <li>Проверьте совместимость прошивки.</li>
              <li>Следуйте шагам по порядку.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Опасности">
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
              Выполняйте проверки только на собственном оборудовании и с разрешения.
            </div>
          </InfoCard>
          <InfoCard title="Быстрые ссылки">
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/flipper/guides" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Все гайды →
              </Link>
              <Link to="/flipper/vulns" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Уязвимости →
              </Link>
            </div>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
