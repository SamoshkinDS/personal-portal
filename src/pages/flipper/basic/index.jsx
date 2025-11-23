// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperCategoryCard } from "../../../components/flipper/Cards.jsx";
import { listCategories } from "../../../api/flipper.js";

export default function FlipperBasicList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories({ type: "basic" })
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Flipper Zero / Базовые функции" contentClassName="space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-300">
        <Link to="/flipper" className="text-indigo-600 hover:underline dark:text-indigo-300">
          ← Назад в раздел Flipper Zero
        </Link>
      </div>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <FlipperCategoryCard key={c.id} category={c} to={`/flipper/basic/${c.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
