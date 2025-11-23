// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getArticleBySlug } from "../../../api/flipper.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FlipperHeader, StickyAside, InfoCard, FlipperBadge } from "../../../components/flipper/ui.jsx";

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
      <FlipperHeader
        title={item?.title || "Уязвимость"}
        subtitle={item?.summary || "Описание, тестирование и защита"}
        type="vuln"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Уязвимости", href: "/flipper/vulns" },
          { label: item?.title || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !item ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Запись не найдена</div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center gap-2">
                <FlipperBadge type="vuln" />
                <span className="text-xs text-slate-500">{item.slug}</span>
              </div>
              <div className="prose prose-sm mt-2 max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content_raw || item.content_rendered || ""}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        <StickyAside>
          <InfoCard title="Опасность">
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100">
              Используйте только для проверок и повышения безопасности.
            </div>
          </InfoCard>
          <InfoCard title="Как защититься">
            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300">
              <li>Обновите прошивки устройств.</li>
              <li>Включите аутентификацию на приёмниках.</li>
              <li>Мониторьте подозрительные сигналы.</li>
            </ul>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
