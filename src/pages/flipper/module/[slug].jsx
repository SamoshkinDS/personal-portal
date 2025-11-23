// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getModuleBySlug, listArticles } from "../../../api/flipper.js";
import { FlipperArticleCard } from "../../../components/flipper/Cards.jsx";
import { FlipperHeader, StickyAside, InfoCard, FlipperBadge, getIconForType } from "../../../components/flipper/ui.jsx";

export default function FlipperModuleDetail() {
  const { slug } = useParams();
  const [module, setModule] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const mod = await getModuleBySlug(slug);
        setModule(mod);
        const arts = await listArticles({ category_id: mod.category_id, firmware_id: mod.firmware_id });
        setArticles(arts || []);
      } catch {
        setModule(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Модуль / ${module?.name || "..."}`} contentClassName="space-y-4">
      <FlipperHeader
        title={module?.name || "Загрузка..."}
        subtitle={module?.short_description || "Описание модуля, поддерживаемые прошивки и связанные статьи"}
        type="module"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Модули", href: "/flipper/modules" },
          { label: module?.name || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !module ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Модуль не найден</div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center gap-2">
                  <FlipperBadge type="module" label="Module" />
                  <span className="text-xs text-slate-500">{module.slug}</span>
                </div>
                {module.short_description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{module.short_description}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Прошивка: {module.firmware_id || "—"} · Категория: {module.category_id || "—"}
                </p>
                <p className="text-xs text-slate-500">Supported: {(module.supported_firmwares || []).join(", ") || "—"}</p>
                <p className="text-xs text-slate-500">Source: {module.source_url || "—"}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Связанные статьи</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((a) => (
                    <FlipperArticleCard key={a.id} article={a} to={`/flipper/article/${a.slug}`} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <StickyAside>
          <InfoCard title="Мини-обзор">
            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300">
              <li>Быстрый запуск: минимум настроек.</li>
              <li>Проверяйте совместимость с прошивкой.</li>
              <li>Источник кода — по ссылке, если указана.</li>
            </ul>
          </InfoCard>
          <InfoCard title="Бейджи">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getIconForType("module")}</span>
              <FlipperBadge type="module" />
            </div>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
