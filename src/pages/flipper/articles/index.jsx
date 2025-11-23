// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperArticleCard } from "../../../components/flipper/Cards.jsx";
import { listArticles, listCategories, listFirmwares } from "../../../api/flipper.js";
import { FlipperHeader } from "../../../components/flipper/ui.jsx";

export default function FlipperArticlesList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [firmwares, setFirmwares] = useState([]);
  const [filters, setFilters] = useState({ category_id: "", firmware_id: "", type: "", status: "", search: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then((d) => setCategories(d || []));
    listFirmwares().then((d) => setFirmwares(d || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    listArticles(filters)
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <PageShell title="Flipper Zero / Все статьи" contentClassName="space-y-4">
      <FlipperHeader
        title="Все статьи"
        subtitle="Функции, прошивки, модули, гайды и уязвимости — единый список."
        type="basic"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Статьи" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
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
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Все типы</option>
          <option value="feature_basic">feature_basic</option>
          <option value="feature_custom_fw">feature_custom_fw</option>
          <option value="module_custom">module_custom</option>
          <option value="guide_scenario">guide_scenario</option>
          <option value="vuln_check">vuln_check</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Все статусы</option>
          <option value="draft">draft</option>
          <option value="review">review</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
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
          {items.map((a) => (
            <FlipperArticleCard key={a.id} article={a} to={`/flipper/article/${a.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
