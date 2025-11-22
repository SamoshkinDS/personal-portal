import React from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";
import { plantToolsApi } from "../../api/plantTools.js";

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      to={`/plants/tools/${category.slug}`}
      className="group flex h-full flex-col gap-3 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-white/10 dark:bg-slate-900/60"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-2xl shadow-sm ring-1 ring-blue-100 transition group-hover:scale-105 dark:from-blue-500/15 dark:to-indigo-500/20 dark:ring-white/10">
            {category.icon || "🛒"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-blue-600 dark:text-white">
              {category.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {category.items_count || 0} товаров
            </p>
          </div>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-400 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-500 dark:group-hover:border-blue-500/50 dark:group-hover:text-blue-200">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function ToolsOverview() {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await plantToolsApi.listCategories();
        if (!mounted) return;
        setCategories(res.categories || []);
      } catch (error) {
        if (!mounted) return;
        toast.error(error.message || "Не удалось загрузить раздел");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell hideBreadcrumbs title="Материалы и оборудование" contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", href: "/plants" },
          { label: "Материалы и оборудование" },
        ]}
      />

      <div className="flex flex-col gap-3">
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Категории инвентаря и расходников для ухода за растениями. Выбирайте раздел, чтобы посмотреть список товаров и заметок.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)
            : categories.map((category) => <CategoryCard key={category.id} category={category} />)}
        </div>
        {!loading && categories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500 dark:border-white/20 dark:bg-slate-900/40 dark:text-slate-300">
            Категории пока не настроены. Добавьте их в настройках или включите существующие.
          </div>
        )}
      </div>
    </PageShell>
  );
}
