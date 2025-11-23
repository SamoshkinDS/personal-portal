// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperModuleCard, FlipperArticleCard } from "../../../components/flipper/Cards.jsx";
import { getFirmwareBySlug, listModules, listArticles } from "../../../api/flipper.js";
import { FlipperHeader, StickyAside, InfoCard, FlipperBadge } from "../../../components/flipper/ui.jsx";

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
      <FlipperHeader
        title={firmware?.name || "Загрузка..."}
        subtitle={firmware?.short_description || "Описание прошивки, ссылки и связанные материалы"}
        type="firmware"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Кастомные прошивки", href: "/flipper/firmware" },
          { label: firmware?.name || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !firmware ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Прошивка не найдена</div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center gap-2">
                  <FlipperBadge type="firmware" label="Firmware" />
                  <span className="text-xs text-slate-500">{firmware.slug}</span>
                </div>
                {firmware.short_description ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{firmware.short_description}</p>
                ) : null}
                <div className="mt-2 grid gap-1 text-xs text-slate-500">
                  <span>repo: {firmware.repo_url || "—"}</span>
                  <span>homepage: {firmware.homepage_url || "—"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Поддерживаемые модули</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map((m) => (
                    <FlipperModuleCard key={m.id} module={m} to={`/flipper/module/${m.slug}`} />
                  ))}
                </div>
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
          <InfoCard title="Информация">
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div>Статус: {firmware?.is_active ? "активна" : "выключена"}</div>
              <div>Кастомная: {firmware?.is_custom ? "да" : "нет"}</div>
            </div>
          </InfoCard>
          <InfoCard title="Быстрые ссылки">
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/flipper/firmware" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Все прошивки →
              </Link>
              <Link to="/flipper/modules" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Модули →
              </Link>
              <Link to="/flipper/articles" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Статьи →
              </Link>
            </div>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
