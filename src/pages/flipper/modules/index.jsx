// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperModuleCard } from "../../../components/flipper/Cards.jsx";
import { listModules, listFirmwares, listCategories } from "../../../api/flipper.js";

export default function FlipperModulesList() {
  const [items, setItems] = useState([]);
  const [firmwares, setFirmwares] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ firmware_id: "", category_id: "", search: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFirmwares().then((d) => setFirmwares(d || []));
    listCategories({ type: "module" }).then((d) => setCategories(d || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    listModules(filters)
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <PageShell title="Flipper Zero / Модули" contentClassName="space-y-4">
      <Link to="/flipper" className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">
        ← Назад в раздел Flipper Zero
      </Link>

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.firmware_id}
          onChange={(e) => setFilters({ ...filters, firmware_id: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Все прошивки</option>
          {firmwares.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          value={filters.category_id}
          onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          placeholder="Поиск"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <FlipperModuleCard key={m.id} module={m} to={`/flipper/module/${m.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
