// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getCategoryBySlug, listArticles } from "../../../api/flipper.js";
import { FlipperArticleCard } from "../../../components/flipper/Cards.jsx";
import { FlipperHeader, StickyAside, InfoCard, getIconForType } from "../../../components/flipper/ui.jsx";

export default function FlipperBasicDetail() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cat = await getCategoryBySlug(slug);
        setCategory(cat);
        const list = await listArticles({ category_id: cat.id });
        setArticles(list || []);
      } catch {
        setCategory(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  return (
    <PageShell title={`Flipper Zero / Базовые функции / ${category?.title || "..."}`} contentClassName="space-y-4">
      <FlipperHeader
        title={category?.title || "Загрузка..."}
        subtitle={category?.description || "Карточка базовой функции Flipper Zero"}
        type="basic"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Базовые функции", href: "/flipper/basic" },
          { label: category?.title || "..." },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : !category ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Категория не найдена</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => (
                  <FlipperArticleCard key={a.id} article={a} to={`/flipper/article/${a.slug}`} />
                ))}
              </div>
            </>
          )}
        </div>
        <StickyAside>
          <InfoCard title="О категории">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getIconForType("basic")}</span>
              <span>{category?.title || "..."}</span>
            </div>
            {category?.description ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{category.description}</p> : null}
          </InfoCard>
          <InfoCard title="Быстрые ссылки">
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/flipper/basic" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Все базовые функции →
              </Link>
              <Link to="/flipper/guides" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Гайды →
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
