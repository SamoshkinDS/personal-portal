// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import TransactionsTable from "../../components/accounting/TransactionsTable.jsx";
import { accountingApi } from "../../api/accounting.js";

const initialFilters = {
  from: "",
  to: "",
  category_id: "",
  mcc: "",
  q: "",
};

export default function TransactionsPage() {
  const [filters, setFilters] = React.useState(initialFilters);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(25);
  const [data, setData] = React.useState({ items: [], pagination: { page: 1, total: 0 } });
  const [loading, setLoading] = React.useState(true);
  const [categories, setCategories] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountingApi.listTransactions({
        ...filters,
        page,
        limit,
      });
      setData(response);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    accountingApi
      .listCategories()
      .then((res) => setCategories(res.items || []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    accountingApi
      .listAccounts()
      .then((res) => setAccounts(res.items || []))
      .catch(() => {});
  }, []);

  const updateFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleEdit = async (id, patch) => {
    try {
      await accountingApi.updateTransaction(id, patch);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить транзакцию?")) return;
    try {
      await accountingApi.deleteTransaction(id);
      toast.success("Удалено");
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleImport = async () => {
    try {
      const res = await accountingApi.importTransactions();
      toast.success(res.message || "Импорт пока не реализован");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const pagination = data.pagination || { page: 1, total: 0 };
  const totalPages = Math.ceil((pagination.total || 0) / limit) || 1;

  return (
    <PageShell title="Транзакции">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/90 p-4 shadow dark:border-white/5 dark:bg-slate-900/70 md:grid-cols-4">
          <FilterField label="С">
            <input type="date" value={filters.from} onChange={(e) => updateFilter({ from: e.target.value })} />
          </FilterField>
          <FilterField label="По">
            <input type="date" value={filters.to} onChange={(e) => updateFilter({ to: e.target.value })} />
          </FilterField>
          <FilterField label="Категория">
            <select
              value={filters.category_id}
              onChange={(e) => updateFilter({ category_id: e.target.value })}
            >
              <option value="">Все категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="MCC">
            <input
              type="text"
              value={filters.mcc}
              onChange={(e) => updateFilter({ mcc: e.target.value })}
            />
          </FilterField>
          <FilterField label="Поиск по описанию" className="md:col-span-2">
            <input
              type="search"
              value={filters.q}
              onChange={(e) => updateFilter({ q: e.target.value })}
              placeholder="Описание, код авторизации…"
            />
          </FilterField>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={load}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold uppercase text-slate-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:text-slate-200"
            >
              Импорт
            </button>
          </div>
        </div>

        <TransactionsTable
          items={data.items || []}
          loading={loading}
          categories={categories}
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
          <span>
            Страница {pagination.page || 1} из {totalPages} · всего {pagination.total || 0} записей
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide disabled:opacity-40 dark:border-white/10"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide disabled:opacity-40 dark:border-white/10"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function FilterField({ label, children, className }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 ${className || ""}`}>
      {label}
      {React.cloneElement(children, {
        className:
          "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/40 dark:text-white",
      })}
    </label>
  );
}
