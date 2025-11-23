// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { getCategoryBySlug, listArticles } from "../../../api/flipper.js";
import { FlipperArticleCard } from "../../../components/flipper/Cards.jsx";

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
      <div className="flex flex-wrap gap-2 text-sm">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
        <Link to="/flipper/basic" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← К списку базовых функций
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : !category ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Категория не найдена</div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{category.title}</h2>
            {category.description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{category.description}</p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <FlipperArticleCard key={a.id} article={a} to={`/flipper/article/${a.slug}`} />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
