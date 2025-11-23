// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperVulnCard } from "../../../components/flipper/Cards.jsx";
import { listArticles } from "../../../api/flipper.js";
import { FlipperHeader } from "../../../components/flipper/ui.jsx";

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
      <FlipperHeader
        title="Уязвимости"
        subtitle="Записи с типом vuln_check: сценарии проверки и защитные меры."
        type="vuln"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Уязвимости" },
        ]}
      />
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
