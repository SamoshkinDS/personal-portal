// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperModuleCard, FlipperArticleCard } from "../../../components/flipper/Cards.jsx";
import { getFirmwareBySlug, listModules, listArticles } from "../../../api/flipper.js";

export default function FlipperFirmwareDetail() {
  const { slug } = useParams();
  const [firmware, setFirmware] = useState(null);
  const [modules, setModules] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const fw = await getFirmwareBySlug(slug);
        setFirmware(fw);
        const mods = await listModules({ firmware_id: fw.id });
        setModules(mods || []);
        const arts = await listArticles({ firmware_id: fw.id });
        setArticles(arts || []);
      } catch {
        setFirmware(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Прошивка / ${firmware?.name || "..."}`} contentClassName="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
        <Link to="/flipper/firmware" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← К списку прошивок
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : !firmware ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Прошивка не найдена</div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{firmware.name}</h2>
            <p className="text-xs text-slate-500">{firmware.slug}</p>
            {firmware.short_description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{firmware.short_description}</p>
            ) : null}
            <div className="mt-2 text-xs text-slate-500">
              repo: {firmware.repo_url || "—"} · homepage: {firmware.homepage_url || "—"}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Связанные модули</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <FlipperModuleCard key={m.id} module={m} to={`/flipper/module/${m.slug}`} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Статьи по прошивке</h3>
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
