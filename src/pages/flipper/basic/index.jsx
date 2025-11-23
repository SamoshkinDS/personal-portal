// encoding: utf-8
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../../../components/PageShell.jsx";
import { FlipperCategoryCard } from "../../../components/flipper/Cards.jsx";
import { listCategories } from "../../../api/flipper.js";
import { FlipperHeader, StickyAside, InfoCard } from "../../../components/flipper/ui.jsx";

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
      <FlipperHeader
        title="Базовые функции"
        subtitle="RFID/NFC, Sub-GHz, IR, iButton, BLE, BadUSB, GPIO и файловая система."
        type="basic"
        breadcrumbs={[
          { label: "Flipper Zero", href: "/flipper" },
          { label: "Базовые функции" },
        ]}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <FlipperCategoryCard key={c.id} category={c} to={`/flipper/basic/${c.slug}`} />
              ))}
            </div>
          )}
        </div>
        <StickyAside>
          <InfoCard title="Быстрый доступ">
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/flipper/firmware" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Кастомные прошивки →
              </Link>
              <Link to="/flipper/modules" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Модули →
              </Link>
              <Link to="/flipper/guides" className="text-indigo-600 hover:underline dark:text-indigo-300">
                Гайды →
              </Link>
            </div>
          </InfoCard>
          <InfoCard title="FAQ">
            <ul className="list-disc pl-4 text-xs text-slate-600 dark:text-slate-300">
              <li>Выберите категорию для перехода к статьям.</li>
              <li>Карточка содержит slug и краткое описание.</li>
            </ul>
          </InfoCard>
        </StickyAside>
      </div>
    </PageShell>
  );
}
