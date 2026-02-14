import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";
import { plantToolsApi } from "../../api/plantTools.js";
import { plantsApi } from "../../api/plants.js";
import { useAuth } from "../../context/AuthContext.jsx";

const CATEGORY_FIELDS = {
  soils: [
    { key: "composition", label: "Состав", type: "textarea" },
    { key: "volume", label: "Объём", type: "text" },
    { key: "plants", label: "Подходит для растений", type: "plants" },
  ],
  pots: [
    { key: "diameter", label: "Диаметр", type: "text" },
    { key: "material", label: "Материал", type: "text" },
    { key: "pot_type", label: "Тип", type: "text" },
  ],
  fertilizers: [
    { key: "fertilizer_type", label: "Тип (рост/корни/микро)", type: "text" },
    { key: "dosage", label: "Дозировка", type: "text" },
    { key: "frequency", label: "Частота применения", type: "text" },
  ],
  lighting: [
    { key: "power", label: "Мощность (Вт)", type: "text" },
    { key: "color_temp", label: "Цветовая температура", type: "text" },
    { key: "ppfd", label: "PPFD", type: "text" },
    { key: "distance", label: "Рекомендованное расстояние", type: "text" },
    { key: "mount_type", label: "Тип крепления", type: "text" },
  ],
  tools: [{ key: "tool_category", label: "Категория инструмента", type: "text" }],
  "care-chemistry": [
    { key: "chem_type", label: "Тип (фунгицид/инсектицид/антистресс)", type: "text" },
    { key: "dosage", label: "Дозировка", type: "text" },
    { key: "instruction", label: "Инструкция", type: "textarea" },
  ],
  "containers-accessories": [
    { key: "dimensions", label: "Размеры", type: "text" },
    { key: "material", label: "Материал", type: "text" },
    { key: "notes", label: "Описание", type: "textarea" },
  ],
  "extra-materials": [
    { key: "material_type", label: "Тип", type: "text" },
    { key: "fraction", label: "Фракция", type: "text" },
  ],
  "watering-humidity": [
    { key: "device_type", label: "Тип (увлажнитель/датчик/система полива)", type: "text" },
    { key: "instruction", label: "Инструкция", type: "textarea" },
  ],
};

function getFieldsForCategory(slug) {
  return CATEGORY_FIELDS[slug] || [];
}

export default function ToolsCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [category, setCategory] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [plantsOptions, setPlantsOptions] = React.useState([]);
  const [plantsLoading, setPlantsLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [categoryRes, categoriesRes] = await Promise.all([
        plantToolsApi.getCategory(slug),
        plantToolsApi.listCategories({ includeInactive: true }),
      ]);
      setCategory(categoryRes.category);
      setItems(categoryRes.items || []);
      setCategories(categoriesRes.categories || []);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить раздел");
      if (error.status === 404) {
        navigate("/plants/tools", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const ensurePlantsOptions = React.useCallback(async () => {
    if (plantsOptions.length || plantsLoading) return;
    try {
      setPlantsLoading(true);
      const data = await plantsApi.list({ limit: 200, sort: "alpha_ru" });
      setPlantsOptions(
        (data.items || []).map((plant) => ({
          value: plant.id,
          label: plant.common_name,
        }))
      );
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить список растений");
    } finally {
      setPlantsLoading(false);
    }
  }, [plantsLoading, plantsOptions.length]);

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (activeItem) {
        await plantToolsApi.updateItem(activeItem.id, payload);
      } else {
        await plantToolsApi.createItem({ ...payload, category_slug: payload.category_slug || category?.slug });
      }
      toast.success("Сохранено");
      setModalOpen(false);
      setActiveItem(null);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Не удалось сохранить элемент");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Удалить «${item.name}»?`)) return;
    try {
      await plantToolsApi.deleteItem(item.id);
      toast.success("Удалено");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Не удалось удалить элемент");
    }
  };

  return (
    <PageShell hideBreadcrumbs
      title={category?.name || "Материалы и оборудование"}
      contentClassName="flex flex-col gap-6"
    >
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", href: "/plants" },
          { label: "Материалы и оборудование", href: "/plants/tools" },
          category?.name ? { label: category.name } : undefined,
        ].filter(Boolean)}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
            >
              <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-xl ring-1 ring-blue-100 dark:from-blue-500/15 dark:to-indigo-500/20 dark:ring-white/10">
                {category?.icon || "📦"}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{category?.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {items.length} элементов • slug: {category?.slug}
                </p>
              </div>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setActiveItem(null);
                  setModalOpen(true);
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                Добавить
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500 dark:border-white/20 dark:bg-slate-900/40 dark:text-slate-300">
              Здесь пока пусто. Добавьте первый элемент или включите категорию в настройках.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => {
                const itemFields = getFieldsForCategory(item.category?.slug || category?.slug);
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    fields={itemFields}
                    plantsOptions={plantsOptions}
                    canManage={canManage}
                    onEdit={() => {
                      setActiveItem(item);
                      setModalOpen(true);
                    }}
                    onDelete={() => handleDelete(item)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      <ToolsItemModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveItem(null);
        }}
        categories={categories}
        categorySlug={category?.slug}
        item={activeItem}
        onSave={handleSave}
        saving={saving}
        plantsOptions={plantsOptions}
        onEnsurePlants={ensurePlantsOptions}
        plantsLoading={plantsLoading}
      />
    </PageShell>
  );
}

function ItemCard({ item, fields, plantsOptions, canManage, onEdit, onDelete }) {
  const preview = item.photo_url;
  const extraFields = fields.filter((field) => item.extra_fields?.[field.key]);

  const resolveExtraValue = (field) => {
    const value = item.extra_fields?.[field.key];
    if (field.type === "plants") {
      if (!Array.isArray(value)) return null;
      const map = new Map(plantsOptions.map((p) => [p.value, p.label]));
      const labels = value.map((id) => map.get(id) || `#${id}`).join(", ");
      return labels || null;
    }
    return value;
  };

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-white/10 dark:bg-slate-900/60">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"
        onClick={canManage ? onEdit : undefined}
        role={canManage ? "button" : undefined}
        tabIndex={canManage ? 0 : -1}
      >
        {preview ? (
          <img src={preview} alt={item.name} className="h-full w-full object-cover transition" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-slate-400 dark:text-slate-600">
            📦
          </div>
        )}
        {canManage && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition group-hover:opacity-100" />
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{item.name}</h3>
          {canManage && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
            >
              Редактировать
            </button>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-slate-600 line-clamp-3 dark:text-slate-300">{item.description}</p>
        )}
        {extraFields.length > 0 && (
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-300">
            {extraFields.map((field) => {
              const value = resolveExtraValue(field);
              if (!value) return null;
              return (
                <div key={field.key} className="flex items-start gap-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-200">{field.label}:</span>
                  <span className="text-slate-600 dark:text-slate-300">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {item.buy_link ? (
          <a
            href={item.buy_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-400/40 dark:text-blue-100 dark:hover:border-blue-400/60 dark:hover:bg-blue-500/10"
          >
            Открыть
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M13 11h5v-5" />
              <path d="M6 18l12-12" />
            </svg>
          </a>
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500">Ссылка не указана</div>
        )}
        {canManage && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-300"
          >
            Удалить
          </button>
        )}
      </div>
    </article>
  );
}

function ToolsItemModal({
  open,
  onClose,
  item,
  categorySlug,
  categories,
  onSave,
  saving,
  plantsOptions,
  onEnsurePlants,
  plantsLoading,
}) {
  const [form, setForm] = React.useState(getInitialForm(item, categorySlug));
  const [file, setFile] = React.useState(null);
  const derivedFields = React.useMemo(
    () => getFieldsForCategory(form.category_slug || categorySlug),
    [categorySlug, form.category_slug]
  );

  React.useEffect(() => {
    setForm(getInitialForm(item, categorySlug));
    setFile(null);
  }, [item, categorySlug, open]);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      photo: file || undefined,
    });
  };

  const handleExtraChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      extra_fields: { ...(prev.extra_fields || {}), [key]: value },
    }));
  };

  const categoryOptions = categories.filter((c) => c.is_active || c.slug === categorySlug);

  React.useEffect(() => {
    if (!open) return;
    if (derivedFields.some((f) => f.type === "plants")) {
      onEnsurePlants();
    }
  }, [derivedFields, onEnsurePlants, open]);

  return (
    <Modal open={open} onClose={onClose} title={item ? "Редактирование" : "Добавление"} maxWidth="max-w-3xl">
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Название
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Категория
            <select
              value={form.category_slug}
              onChange={(e) => setForm((prev) => ({ ...prev, category_slug: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                  {!cat.is_active ? " (выключена)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Краткое описание
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Ссылка на покупку
            <input
              type="url"
              value={form.buy_link}
              onChange={(e) => setForm((prev) => ({ ...prev, buy_link: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            Порядок сортировки
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
              className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
            />
          </label>
        </div>

        {derivedFields.length > 0 && (
          <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Дополнительные параметры</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {derivedFields.map((field) => {
                const value = form.extra_fields[field.key] ?? (field.type === "plants" ? [] : "");
                if (field.type === "textarea") {
                  return (
                    <label key={field.key} className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {field.label}
                      <textarea
                        value={value}
                        onChange={(e) => handleExtraChange(field.key, e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
                      />
                    </label>
                  );
                }
                if (field.type === "plants") {
                  return (
                    <div key={field.key} className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {field.label}
                      <div className="rounded-2xl border border-slate-200 bg-white/70 p-2 text-xs dark:border-white/10 dark:bg-slate-900/60">
                        {plantsLoading && <div className="text-slate-500">Загрузка списка...</div>}
                        {!plantsLoading && plantsOptions.length === 0 && (
                          <button
                            type="button"
                            onClick={onEnsurePlants}
                            className="text-blue-600 hover:underline"
                          >
                            Загрузить список растений
                          </button>
                        )}
                        {!plantsLoading && plantsOptions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {plantsOptions.map((option) => {
                              const active = Array.isArray(value) && value.includes(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    const current = Array.isArray(value) ? value : [];
                                    const next = active
                                      ? current.filter((id) => id !== option.value)
                                      : [...current, option.value];
                                    handleExtraChange(field.key, next);
                                  }}
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                    active
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                                      : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <label key={field.key} className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {field.label}
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleExtraChange(field.key, e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-white/10 dark:text-white"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Фото</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            <span>{file ? file.name : "Загрузить изображение"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          {item?.photo_preview_url && !file && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/10">
              <img src={item.photo_preview_url || item.photo_url} alt={item.name} className="h-40 w-full object-cover" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-200"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function getInitialForm(item, categorySlug) {
  if (item) {
    return {
      name: item.name || "",
      description: item.description || "",
      buy_link: item.buy_link || "",
      sort_order: item.sort_order ?? 0,
      category_slug: item.category_slug || categorySlug || "",
      extra_fields: { ...(item.extra_fields || {}) },
    };
  }
  return {
    name: "",
    description: "",
    buy_link: "",
    sort_order: 0,
    category_slug: categorySlug || "",
    extra_fields: {},
  };
}
