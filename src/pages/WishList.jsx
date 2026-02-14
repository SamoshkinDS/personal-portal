import React from "react";
import { toast } from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import { wishApi } from "../api/wish.js";
import { sharedLinksApi } from "../api/sharedLinks.js";

const priorityMeta = {
  "высокий": { label: "Высокий", color: "bg-rose-500/15 text-rose-700 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-50" },
  "средний": { label: "Средний", color: "bg-amber-500/15 text-amber-800 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-50" },
  "низкий": { label: "Низкий", color: "bg-emerald-500/15 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-50" },
};

const sharePresets = [
  { value: "1h", label: "1 час" },
  { value: "1d", label: "1 день" },
  { value: "1w", label: "1 неделя" },
  { value: "1m", label: "1 месяц" },
  { value: "forever", label: "Пока не отключу" },
];

const emptyForm = {
  id: null,
  title: "",
  price: "",
  priority: "средний",
  link: "",
  description: "",
  targetDate: "",
  image: null,
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ru-RU");
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number.toLocaleString("ru-RU")} ₽`;
}
export default function WishListPage() {
  const [items, setItems] = React.useState({ active: [], archived: [] });
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState("cards");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("active");
  const [sortBy, setSortBy] = React.useState("createdAt_desc");
  const [form, setForm] = React.useState(emptyForm);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [archiveModal, setArchiveModal] = React.useState({ open: false, item: null, reason: "Куплено" });
  const [submitting, setSubmitting] = React.useState(false);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [shareDuration, setShareDuration] = React.useState("1d");
  const [shareResult, setShareResult] = React.useState(null);
  const [shareLoading, setShareLoading] = React.useState(false);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await wishApi.list();
      setItems({ active: data.active || [], archived: data.archived || [] });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = React.useMemo(() => {
    const pool = statusFilter === "archived" ? items.archived : items.active;
    const filtered = priorityFilter === "all" ? pool : pool.filter((item) => item.priority === priorityFilter);
    const weights = { высокий: 3, средний: 2, низкий: 1 };
    return [...filtered].sort((a, b) => {
      if (sortBy === "priority_desc") return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      if (sortBy === "priority_asc") return (weights[a.priority] || 0) - (weights[b.priority] || 0);
      if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();
      return sortBy === "createdAt_asc" ? createdA - createdB : createdB - createdA;
    });
  }, [items, priorityFilter, sortBy, statusFilter]);

  const openCreateModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setForm({ ...emptyForm, ...item, id: item.id });
    setModalOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      setForm((prev) => ({ ...prev, image: files?.[0] ?? null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.image) delete payload.image;
      if (payload.id) {
        await wishApi.update(payload.id, payload);
        toast.success("Запись обновлена");
      } else {
        await wishApi.create(payload);
        toast.success("Добавлено в список желаний");
      }
      setModalOpen(false);
      setForm(emptyForm);
      await loadItems();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Удалить запись?")) return;
    try {
      await wishApi.remove(itemId);
      toast.success("Удалено");
      await loadItems();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось удалить");
    }
  };

  const handleArchive = async () => {
    if (!archiveModal.item) return;
    try {
      await wishApi.archive(archiveModal.item.id, archiveModal.reason || "");
      toast.success("Перемещено в архив");
      setArchiveModal({ open: false, item: null, reason: "Куплено" });
      await loadItems();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось архивировать");
    }
  };

  const handleUnarchive = async (item) => {
    try {
      await wishApi.unarchive(item.id);
      toast.success("Вернул из архива");
      await loadItems();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось вернуть");
    }
  };

  const handleShareCreate = async () => {
    setShareLoading(true);
    setShareResult(null);
    try {
      const data = await sharedLinksApi.create({ pageType: "wish-list", duration: shareDuration });
      const linkData = data.link || data;
      if (!linkData?.token) throw new Error("Сервер не вернул токен");
      const link = `${window.location.origin}/shared/${linkData.token}`;
      setShareResult({ ...linkData, link });
      toast.success("Публичная ссылка создана");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Не удалось создать ссылку");
    } finally {
      setShareLoading(false);
    }
  };
  const renderCard = (item) => {
    const meta = priorityMeta[item.priority] || priorityMeta["средний"];
    return (
      <div
        key={item.id}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/80 shadow ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-2xl dark:bg-slate-900/70 dark:ring-slate-800"
      >
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-amber-50 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-900/40">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600">
              <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                <path d="m12 12-3 4h10l-3-4-2 2Z" />
              </svg>
            </div>
          )}
          <span className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.color}`}>
            {meta.label}
          </span>
          {item.archiveReason && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold text-white shadow-lg">
              {item.archiveReason}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Создано: {formatDate(item.createdAt)}</p>
            </div>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200"
                title="Открыть ссылку"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M9 15 4 20a3 3 0 1 1-4.24-4.24L8 7a3 3 0 0 1 4.24 4.24l-1.5 1.5" />
                  <path d="M15 9 20 4a3 3 0 0 1 4.24 4.24L16 17a3 3 0 0 1-4.24-4.24l1.5-1.5" />
                </svg>
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/70 dark:ring-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-400">Цена</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{formatPrice(item.price)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/70 dark:ring-slate-800">
              <p className="text-xs uppercase tracking-wide text-slate-400">К дате</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{formatDate(item.targetDate)}</p>
            </div>
          </div>
          {item.description && (
            <p className="rounded-2xl bg-indigo-50/60 px-3 py-2 text-sm text-slate-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-slate-200">
              {item.description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap gap-2 text-sm">
            {statusFilter === "archived" ? (
              <button
                type="button"
                onClick={() => handleUnarchive(item)}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
              >
                Вернуть
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveModal({ open: true, item, reason: "Куплено" })}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700 transition hover:border-amber-300 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
                >
                  В архив
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderTable = () => (
    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            <th className="px-4 py-3">Название</th>
            <th className="px-4 py-3">Приоритет</th>
            <th className="px-4 py-3">Цена</th>
            <th className="px-4 py-3">К дате</th>
            <th className="px-4 py-3">Ссылка</th>
            <th className="px-4 py-3">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map((item) => {
            const meta = priorityMeta[item.priority] || priorityMeta["средний"];
            return (
              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{item.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.color}`}>
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatPrice(item.price)}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatDate(item.targetDate)}</td>
                <td className="px-4 py-3">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                    >
                      Открыть
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {statusFilter === "archived" ? (
                    <button
                      type="button"
                      onClick={() => handleUnarchive(item)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
                    >
                      Вернуть
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveModal({ open: true, item, reason: "Куплено" })}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
                      >
                        В архив
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const emptyState = !loading && filteredItems.length === 0;

  return (
    <PageShell title="Wish List" contentClassName="bg-transparent">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white/80 px-4 py-3 shadow ring-1 ring-slate-100 dark:bg-slate-900/70 dark:ring-slate-800">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Список желаний</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Храните идеи покупок и отслеживайте приоритеты</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
            >
              Фильтры
            </button>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-100"
            >
              Поделиться
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              + Добавить
            </button>
            <button
              type="button"
              onClick={() => setViewMode((mode) => (mode === "cards" ? "table" : "cards"))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
            >
              {viewMode === "cards" ? "Таблица" : "Карточки"}
            </button>
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-200"
            >
              Обновить
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Статус</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="active">Активные</option>
                  <option value="archived">Архив</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Приоритет</label>
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="all">Все</option>
                  <option value="высокий">Высокий</option>
                  <option value="средний">Средний</option>
                  <option value="низкий">Низкий</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Сортировка</label>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="createdAt_desc">Сначала новые</option>
                  <option value="createdAt_asc">Сначала старые</option>
                  <option value="priority_desc">Приоритет ↓</option>
                  <option value="priority_asc">Приоритет ↑</option>
                  <option value="price_desc">Цена ↓</option>
                  <option value="price_asc">Цена ↑</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 px-4 py-10 text-center text-slate-500 shadow dark:border-slate-800 dark:bg-slate-900/80">
            Загружаю Wish List...
          </div>
        ) : emptyState ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 px-4 py-10 text-center text-slate-500 shadow dark:border-slate-800 dark:bg-slate-900/80">
            Пусто. Добавьте первое желание!
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredItems.map((item) => renderCard(item))}</div>
        ) : (
          renderTable()
        )}
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Редактирование" : "Новое желание"}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-between gap-3">
            {form.id && (
              <button
                type="button"
                onClick={() => handleDelete(form.id)}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 dark:border-rose-500/40 dark:text-rose-100"
                disabled={submitting}
              >
                Удалить
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                form="wish-form"
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </div>
        }
      >
        <form id="wish-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Название *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleInputChange}
                required
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="MacBook Air"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Цена</label>
              <input
                name="price"
                value={form.price}
                onChange={handleInputChange}
                type="number"
                min="0"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="120000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Приоритет</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="высокий">Высокий</option>
                <option value="средний">Средний</option>
                <option value="низкий">Низкий</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ссылка</label>
              <input
                name="link"
                value={form.link}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="https://shop.com/item"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Дата цели</label>
              <input
                name="targetDate"
                value={form.targetDate || ""}
                onChange={handleInputChange}
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Картинка</label>
              <input
                name="image"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">JPG/PNG до 5 МБ</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Описание</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              placeholder="Для учёбы и работы"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Публичная ссылка"
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={handleShareCreate}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
              disabled={shareLoading}
            >
              {shareLoading ? "Создаю..." : "Создать ссылку"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Срок действия</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sharePresets.map((preset) => (
                <label
                  key={preset.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                    shareDuration === preset.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-800 dark:border-indigo-500/60 dark:bg-indigo-500/10 dark:text-indigo-100"
                      : "border-slate-200 bg-white/60 text-slate-700 hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shareDuration"
                    value={preset.value}
                    checked={shareDuration === preset.value}
                    onChange={(event) => setShareDuration(event.target.value)}
                  />
                  {preset.label}
                </label>
              ))}
            </div>
          </div>
          <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
            Ссылка открывает только просмотр текущего Wish List, без доступа к навигации и редактированию.
          </p>
          {shareResult && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Скопируйте ссылку</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareResult.link}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareResult.link);
                    toast.success("Ссылка скопирована");
                  }}
                  className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                >
                  Копировать
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={archiveModal.open}
        onClose={() => setArchiveModal({ open: false, item: null, reason: "Куплено" })}
        title="Переместить в архив"
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setArchiveModal({ open: false, item: null, reason: "Куплено" })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700"
            >
              В архив
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-slate-700 dark:text-slate-200">Впишите причину для отображения в карточке:</p>
          <select
            value={archiveModal.reason}
            onChange={(event) => setArchiveModal((prev) => ({ ...prev, reason: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="Куплено">Куплено</option>
            <option value="Не актуально">Не актуально</option>
            <option value="Отложено">Отложено</option>
          </select>
        </div>
      </Modal>
    </PageShell>
  );
}
