import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { plantsApi } from "../../api/plants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import PlantArticleEditor, { getPlantArticleExtensions } from "../../components/plants/PlantArticleEditor.jsx";

const EMPTY_DOC = { type: "doc", content: [] };
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const TOX_LEVELS = ["нет", "низкая", "средняя", "высокая"];

export default function PlantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [plant, setPlant] = React.useState(null);
  const [gallery, setGallery] = React.useState([]);
  const [article, setArticle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [meta, setMeta] = React.useState(null);
  const [metaLoading, setMetaLoading] = React.useState(true);

  const [uploadingMain, setUploadingMain] = React.useState(false);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [articleEditorOpen, setArticleEditorOpen] = React.useState(false);
  const [articleSaving, setArticleSaving] = React.useState(false);
  const [imageVersion, setImageVersion] = React.useState(0);

  const applyPlantPayload = React.useCallback((data) => {
    if (!data) return;
    setPlant(data.plant);
    setGallery(data.gallery || []);
    setArticle(data.article || null);
  }, []);

  const refreshPlant = React.useCallback(async () => {
    const data = await plantsApi.detail(slug);
    if (data.redirect_slug && data.redirect_slug !== slug) {
      navigate(`/plants/${data.redirect_slug}`, { replace: true });
      return null;
    }
    applyPlantPayload(data);
    return data;
  }, [slug, navigate, applyPlantPayload]);

  React.useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      try {
        const data = await plantsApi.meta();
        if (!mounted) return;
        setMeta(data);
      } catch (err) {
        toast.error(err.message || "Не удалось загрузить справочники");
      } finally {
        if (mounted) setMetaLoading(false);
      }
    };
    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loadPlant = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await plantsApi.detail(slug);
        if (cancelled) return;
        if (data.redirect_slug && data.redirect_slug !== slug) {
          navigate(`/plants/${data.redirect_slug}`, { replace: true });
          return;
        }
        applyPlantPayload(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить растение");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPlant();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate, applyPlantPayload]);

  const handleMainUpload = async (file) => {
    if (!plant || !file) return;
    try {
      setUploadingMain(true);
      await plantsApi.uploadMainImage(plant.id, file);
      setImageVersion(Date.now());
      await refreshPlant();
      toast.success("Фото обновлено");
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить изображение");
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (files) => {
    if (!plant || !files?.length) return;
    try {
      setUploadingGallery(true);
      const res = await plantsApi.uploadGallery(plant.id, files);
      setGallery(res.gallery || []);
      toast.success("Галерея обновлена");
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить фото");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryDelete = async (imageId) => {
    if (!plant) return;
    try {
      await plantsApi.deleteGalleryImage(plant.id, imageId);
      setGallery((prev) => prev.filter((item) => item.id !== imageId));
      toast.success("Фото удалено");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить фото");
    }
  };

  const handleArticleSave = async (payload) => {
    if (!plant) return;
    try {
      setArticleSaving(true);
      await plantsApi.saveArticle(plant.id, payload);
      setArticle((prev) => ({ ...prev, ...payload, updated_at: new Date().toISOString() }));
      toast.success("Статья сохранена");
      setArticleEditorOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить статью");
    } finally {
      setArticleSaving(false);
    }
  };

  const handlePlantUpdate = async (payload) => {
    if (!plant) return;
    try {
      const res = await plantsApi.update(plant.id, payload);
      setPlant(res.plant);
      setEditOpen(false);
      toast.success("Данные обновлены");
    } catch (err) {
      toast.error(err.message || "Не удалось обновить данные");
    }
  };

  const articleHtml = React.useMemo(() => {
    if (!article?.content_rich) return "";
    try {
      const html = generateHTML(article.content_rich, getPlantArticleExtensions());
      return transformContent(html);
    } catch {
      return article.content_text || "";
    }
  }, [article]);

  return (
    <PageShell title={plant ? plant.common_name : "Карточка растения"} contentClassName="flex flex-col gap-6">
      {loading ? (
        <div className="h-64 animate-pulse rounded-3xl border border-slate-100 bg-white/80 dark:border-white/10 dark:bg-slate-900/40" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : (
        plant && (
          <>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
              <ImageBlock
                plant={plant}
                onUploadMain={handleMainUpload}
                uploading={uploadingMain}
                canManage={canManage}
                cacheBuster={imageVersion}
              />
              <PassportBlock plant={plant} canManage={canManage} onEdit={() => setEditOpen(true)} />
            </div>

            <TagsBlock tags={plant.tags || []} />

            <GallerySection
              images={gallery}
              onUpload={handleGalleryUpload}
              onDelete={handleGalleryDelete}
              uploading={uploadingGallery}
              canManage={canManage}
            />

            <ArticleSection
              html={articleHtml}
              updatedAt={article?.updated_at}
              canManage={canManage}
              onEdit={() => setArticleEditorOpen(true)}
            />

            <EditPlantDialog
              open={editOpen}
              onClose={() => setEditOpen(false)}
              plant={plant}
              dicts={meta?.dicts}
              tags={meta?.tags}
              loading={metaLoading}
              onSave={handlePlantUpdate}
            />

            <PlantArticleEditor
              open={articleEditorOpen}
              initialContent={article?.content_rich || EMPTY_DOC}
              onClose={() => setArticleEditorOpen(false)}
              onSave={handleArticleSave}
              loading={articleSaving}
            />
          </>
        )
      )}
    </PageShell>
  );
}
function ImageBlock({ plant, onUploadMain, uploading, canManage, cacheBuster }) {
  const inputRef = React.useRef(null);
  const baseImage = plant.main_preview_url || plant.main_image_url;
  const image = cacheBuster && baseImage ? appendCacheBuster(baseImage, cacheBuster) : baseImage;
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        {image ? (
          <img src={image} alt={plant.common_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
            <span>Нет фото</span>
          </div>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow dark:bg-slate-800/80 dark:text-slate-200"
          >
            {uploading ? "Загрузка..." : "Загрузить"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadMain(file);
            e.target.value = "";
          }}
        />
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">
        главное фото • {plant.main_image_url ? "обновлено" : "не загружено"}
      </div>
    </section>
  );
}

function PassportBlock({ plant, canManage, onEdit }) {
  const rows = [
    { label: "Латинское", value: plant.latin_name },
    { label: "English", value: plant.english_name },
    { label: "Семейство", value: plant.family },
    { label: "Происхождение", value: plant.origin },
    { label: "Свет", value: plant.light?.name },
    { label: "Полив", value: plant.watering?.name },
    { label: "Почва", value: plant.soil?.name },
    { label: "Влажность", value: plant.humidity?.name },
    { label: "Температура", value: plant.temperature?.name },
    { label: "Локация", value: plant.location?.name },
    { label: "Высота", value: plant.max_height_cm ? `${plant.max_height_cm} см` : null },
    { label: "Цветение", value: plant.blooming_month ? MONTHS[plant.blooming_month - 1] : null },
    { label: "Дата приобретения", value: formatDate(plant.acquisition_date) },
  ];
  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{plant.common_name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Номер #{plant.id}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
          >
            Редактировать
          </button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
      <ToxicityTable plant={plant} />
      {plant.description && (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-200">
          {plant.description}
        </div>
      )}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value || "—"}</p>
    </div>
  );
}

function ToxicityTable({ plant }) {
  const rows = [
    { label: "Кошки", value: plant.toxicity_for_cats_level },
    { label: "Собаки", value: plant.toxicity_for_dogs_level },
    { label: "Люди", value: plant.toxicity_for_humans_level },
  ];
  const hasValues = rows.some((r) => Number.isFinite(r.value));
  if (!hasValues) return null;
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100">
      <p className="mb-2 font-semibold">Токсичность</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label}>
            {row.label}: <span className="font-semibold">{TOX_LEVELS[row.value] || "нет"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TagsBlock({ tags }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100"
        >
          #{tag.name}
        </span>
      ))}
    </div>
  );
}

function GallerySection({ images, onUpload, onDelete, uploading, canManage }) {
  const inputRef = React.useRef(null);
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Галерея</h3>
        {canManage && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
          >
            {uploading ? "Загрузка..." : "Добавить"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) onUpload(files);
            e.target.value = "";
          }}
        />
      </div>
      {images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
          Пока нет дополнительных фото.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-slate-800/40">
              <img src={image.preview_url || image.image_url} alt="Фото растения" className="h-48 w-full object-cover" loading="lazy" />
              {canManage && (
                <button
                  type="button"
                  onClick={() => onDelete(image.id)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow hover:bg-white"
                >
                  Удалить
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ArticleSection({ html, updatedAt, canManage, onEdit }) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Статья</h3>
        {canManage && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
          >
            Редактировать
          </button>
        )}
      </div>
      {html ? (
        <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
          Статья ещё не написана.
        </div>
      )}
      {updatedAt && (
        <p className="text-xs text-slate-400 dark:text-slate-500">Обновлено: {formatDate(updatedAt)}</p>
      )}
    </section>
  );
}
function EditPlantDialog({ open, onClose, plant, dicts, tags, loading, onSave }) {
  const [form, setForm] = React.useState(() => buildFormState(plant));

  React.useEffect(() => {
    if (open) {
      setForm(buildFormState(plant));
    }
  }, [open, plant]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelectArray = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(id) ? prev.tags.filter((tagId) => tagId !== id) : [...prev.tags, id],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = formToPayload(form);
    onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title="Редактировать данные" maxWidth="max-w-4xl">
      {loading ? (
        <div className="p-6 text-sm text-slate-500">Загрузка справочников...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-slate-800 dark:text-slate-100">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Название</span>
              <input
                required
                value={form.common_name}
                onChange={handleChange("common_name")}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Латинское</span>
              <input value={form.latin_name} onChange={handleChange("latin_name")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">English</span>
              <input value={form.english_name} onChange={handleChange("english_name")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Семейство</span>
              <input value={form.family} onChange={handleChange("family")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Происхождение</span>
              <input value={form.origin} onChange={handleChange("origin")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Дата приобретения</span>
              <input type="date" value={form.acquisition_date} onChange={handleChange("acquisition_date")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
          </div>

          <DictSelectRow dicts={dicts} form={form} onChange={handleSelectArray} />

          <label className="block">
            <span className="text-xs font-semibold uppercase text-slate-400">Описание</span>
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Макс. высота (см)</span>
              <input type="number" value={form.max_height_cm} onChange={handleChange("max_height_cm")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Цвет листьев</span>
              <input value={form.leaf_color} onChange={handleChange("leaf_color")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Цвет цветков</span>
              <input value={form.flower_color} onChange={handleChange("flower_color")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-slate-400">Месяц цветения</span>
              <select value={form.blooming_month || ""} onChange={handleChange("blooming_month")} className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10">
                <option value="">Не указано</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ToxicityInputs form={form} onChange={handleChange} />

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Теги</p>
            <div className="flex flex-wrap gap-2">
              {(tags || []).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    form.tags.includes(tag.id)
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600 dark:border-white/10 dark:text-slate-300"
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Сохранить
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function DictSelectRow({ dicts = {}, form, onChange }) {
  const controls = [
    { field: "light_id", label: "Свет", options: dicts.light || [] },
    { field: "watering_id", label: "Полив", options: dicts.watering || [] },
    { field: "soil_id", label: "Почва", options: dicts.soil || [] },
    { field: "humidity_id", label: "Влажность", options: dicts.humidity || [] },
    { field: "temperature_id", label: "Температура", options: dicts.temperature || [] },
    { field: "location_id", label: "Локация", options: dicts.locations || [] },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {controls.map((control) => (
        <label key={control.field} className="block">
          <span className="text-xs font-semibold uppercase text-slate-400">{control.label}</span>
          <select
            value={form[control.field] || ""}
            onChange={(e) => onChange(control.field, e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-blue-400 dark:border-white/10"
          >
            <option value="">Не указано</option>
            {control.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

function ToxicityInputs({ form, onChange }) {
  const targets = [
    { field: "toxicity_for_cats_level", label: "Кошки" },
    { field: "toxicity_for_dogs_level", label: "Собаки" },
    { field: "toxicity_for_humans_level", label: "Люди" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {targets.map((target) => (
        <label key={target.field} className="block">
          <span className="text-xs font-semibold uppercase text-slate-400">{target.label}</span>
          <select
            value={form[target.field] ?? ""}
            onChange={onChange(target.field)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 outline-none focus:border-rose-400 dark:border-white/10"
          >
            <option value="">Нет</option>
            <option value="1">Низкая</option>
            <option value="2">Средняя</option>
            <option value="3">Высокая</option>
          </select>
        </label>
      ))}
    </div>
  );
}

function buildFormState(plant) {
  if (!plant) {
    return {
      common_name: "",
      latin_name: "",
      english_name: "",
      family: "",
      origin: "",
      light_id: "",
      watering_id: "",
      soil_id: "",
      humidity_id: "",
      temperature_id: "",
      location_id: "",
      description: "",
      max_height_cm: "",
      leaf_color: "",
      flower_color: "",
      blooming_month: "",
      acquisition_date: "",
      toxicity_for_cats_level: "",
      toxicity_for_dogs_level: "",
      toxicity_for_humans_level: "",
      tags: [],
    };
  }
  return {
    common_name: plant.common_name || "",
    latin_name: plant.latin_name || "",
    english_name: plant.english_name || "",
    family: plant.family || "",
    origin: plant.origin || "",
    light_id: plant.light?.id || "",
    watering_id: plant.watering?.id || "",
    soil_id: plant.soil?.id || "",
    humidity_id: plant.humidity?.id || "",
    temperature_id: plant.temperature?.id || "",
    location_id: plant.location?.id || "",
    description: plant.description || "",
    max_height_cm: plant.max_height_cm || "",
    leaf_color: plant.leaf_color || "",
    flower_color: plant.flower_color || "",
    blooming_month: plant.blooming_month || "",
    acquisition_date: formatDateInput(plant.acquisition_date),
    toxicity_for_cats_level: plant.toxicity_for_cats_level ?? "",
    toxicity_for_dogs_level: plant.toxicity_for_dogs_level ?? "",
    toxicity_for_humans_level: plant.toxicity_for_humans_level ?? "",
    tags: (plant.tags || []).map((tag) => tag.id),
  };
}

function formToPayload(form) {
  const payload = { ...form };
  payload.light_id = numberOrNull(payload.light_id);
  payload.watering_id = numberOrNull(payload.watering_id);
  payload.soil_id = numberOrNull(payload.soil_id);
  payload.humidity_id = numberOrNull(payload.humidity_id);
  payload.temperature_id = numberOrNull(payload.temperature_id);
  payload.location_id = numberOrNull(payload.location_id);
  payload.max_height_cm = numberOrNull(payload.max_height_cm);
  payload.blooming_month = numberOrNull(payload.blooming_month);
  payload.toxicity_for_cats_level = numberOrNull(payload.toxicity_for_cats_level);
  payload.toxicity_for_dogs_level = numberOrNull(payload.toxicity_for_dogs_level);
  payload.toxicity_for_humans_level = numberOrNull(payload.toxicity_for_humans_level);
  payload.tags = form.tags;
  payload.acquisition_date = payload.acquisition_date || null;
  return payload;
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatDateInput(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function appendCacheBuster(url, version) {
  if (!url || !version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function formatDate(value) {
  const dateOnly = formatDateInput(value);
  if (!dateOnly) return "—";
  const [year, month, day] = dateOnly.split("-");
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(
      new Date(Number(year), Number(month) - 1, Number(day))
    );
  } catch {
    return dateOnly;
  }
}

function transformContent(html) {
  if (typeof window === "undefined" || !html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    const clean = href.split("?")[0].toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`))) {
      const img = doc.createElement("img");
      img.setAttribute("src", href);
      img.setAttribute("alt", anchor.textContent || "Изображение");
      img.className = "article-inline-image";
      anchor.replaceWith(img);
    }
  });
  return doc.body.innerHTML;
}
