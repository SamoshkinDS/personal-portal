// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperFirmwareCard } from "../../../components/flipper/Cards.jsx";
import { listFirmwares } from "../../../api/flipper.js";
import { FlipperHeader } from "../../../components/flipper/ui.jsx";

export default function FlipperFirmwareList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFirmwares()
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Flipper Zero / Кастомные прошивки" contentClassName="space-y-4">
      <FlipperHeader
        title="Кастомные прошивки"
        subtitle="Unleashed, Marauder, Momentum, BunnyLoader — все доступные сборки."
        type="firmware"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Кастомные прошивки" },
        ]}
      />
      {loading ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <FlipperFirmwareCard key={f.id} firmware={f} to={`/flipper/firmware/${f.slug}`} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
