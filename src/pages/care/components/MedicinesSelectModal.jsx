import React from "react";
import Modal from "../../../components/Modal.jsx";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { medicinesApi } from "../../../api/care.js";

const PAGE_LIMIT = 50;

export default function MedicinesSelectModal({ open, onClose, existingIds = new Set(), onSubmit, submitting }) {
  const [query, setQuery] = React.useState("");
  const debounced = useDebouncedValue(query, 300);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQuery("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await medicinesApi.list({ query: debounced, limit: PAGE_LIMIT, offset: 0 });
        if (!cancelled) {
          setItems(res.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Не удалось загрузить лекарства");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, debounced]);

  const toggle = (id) => {
    if (existingIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!selected.size) return;
    onSubmit(Array.from(selected));
  };

  return (
    <Modal open={open} onClose={submitting ? undefined : onClose} title="Выбрать лекарства" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию препарата"
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
        />
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-200">
            {error}
          </div>
        ) : (
          <div className="space-y-2">
            {(items || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Ничего не найдено
              </div>
            ) : (
              items.map((item) => {
                const disabled = existingIds.has(item.id);
                const checked = selected.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-2 text-sm transition ${
                      disabled
                        ? "border-slate-100 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-slate-800/40"
                        : checked
                        ? "border-blue-400 bg-blue-50 dark:border-blue-400/40 dark:bg-blue-500/10"
                        : "border-slate-200 hover:border-blue-200 dark:border-white/10"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{item.medicine_type || "Тип не указан"}</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      disabled={disabled}
                      checked={checked || disabled}
                      onChange={() => toggle(item.id)}
                    />
                  </label>
                );
              })
            )}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selected.size === 0}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? "Сохранение..." : "Добавить выбранные"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

