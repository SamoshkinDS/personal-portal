// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperGuideCard } from "../../../components/flipper/Cards.jsx";
import { listArticles } from "../../../api/flipper.js";
import { FlipperHeader } from "../../../components/flipper/ui.jsx";

export default function FlipperGuidesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listArticles({ type: "guide_scenario" })
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Flipper Zero / Гайды" contentClassName="space-y-4">
      <FlipperHeader
        title="Гайды"
        subtitle="Сценарии проверки: BLE, Sub-GHz, RFID/iButton, IR. Все статьи типа guide_scenario."
        type="guide"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Гайды" },
        ]}
      />
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <FlipperGuideCard key={a.id} guide={a} to={`/flipper/guide/${a.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
