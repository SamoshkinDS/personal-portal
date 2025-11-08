// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import CategoryForm from "../../components/accounting/CategoryForm.jsx";
import { accountingApi } from "../../api/accounting.js";

export default function CategoriesPage() {
  const [categories, setCategories] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingApi.listCategories();
      setCategories(response.items || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (payload) => {
    try {
      if (selected) {
        await accountingApi.updateCategory(selected.id, payload);
        toast.success("Категория обновлена");
      } else {
        await accountingApi.createCategory(payload);
        toast.success("Категория создана");
      }
      setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (category) => {
    if (category.is_system) {
      toast.error("Нельзя удалить системную категорию");
      return;
    }
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) return;
    try {
      await accountingApi.deleteCategory(category.id);
      toast.success("Удалено");
      if (selected?.id === category.id) setSelected(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");

  return (
    <PageShell title="Категории">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <CategorySection
            title="Расходы"
            items={expenseCategories}
            loading={loading}
            onEdit={setSelected}
            onDelete={handleDelete}
          />
          <CategorySection
            title="Доходы"
            items={incomeCategories}
            loading={loading}
            onEdit={setSelected}
            onDelete={handleDelete}
          />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
          <div className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-200">
            {selected ? `Редактирование — ${selected.name}` : "Новая категория"}
          </div>
          <CategoryForm initial={selected} onSubmit={handleSubmit} onCancel={() => setSelected(null)} />
        </div>
      </div>
    </PageShell>
  );
}

function CategorySection({ title, items, loading, onEdit, onDelete }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70">
      <div className="mb-4 text-sm font-semibold text-slate-600 dark:text-slate-200">
        {title} · {items.length}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((category) => (
          <div
            key={category.id}
            className="rounded-2xl border border-white/10 bg-white/80 p-3 text-sm shadow dark:border-white/5 dark:bg-slate-900/60"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900 dark:text-white">{category.name}</div>
              <span
                className="inline-flex h-4 w-4 rounded-full"
                style={{ backgroundColor: category.color_hex || "#fff" }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {category.is_system ? "Системная" : "Пользовательская"}
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
              >
                Редактировать
              </button>
              {!category.is_system && (
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  className="rounded-xl border border-transparent px-3 py-1 font-semibold text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
            Нет категорий
          </div>
        )}
      </div>
    </div>
  );
}
