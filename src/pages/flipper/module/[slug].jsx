// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getModuleBySlug, listArticles } from "../../../api/flipper.js";
import { FlipperArticleCard } from "../../../components/flipper/Cards.jsx";

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
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
        <Link to="/flipper/modules" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← К списку модулей
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : !module ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Модуль не найден</div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{module.name}</h2>
            <p className="text-xs text-slate-500">{module.slug}</p>
            {module.short_description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{module.short_description}</p>
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
    </PageShell>
  );
}
