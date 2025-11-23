// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperVulnCard } from "../../../components/flipper/Cards.jsx";
import { listArticles } from "../../../api/flipper.js";

export default function FlipperVulnsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listArticles({ type: "vuln_check" })
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Flipper Zero / Уязвимости" contentClassName="space-y-4">
      <Link to="/flipper" className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">
        ← Назад в раздел Flipper Zero
      </Link>
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <FlipperVulnCard key={a.id} vuln={a} to={`/flipper/vuln/${a.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
