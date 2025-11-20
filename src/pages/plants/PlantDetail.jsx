import React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { plantsApi } from "../../api/plants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import PlantArticleEditorLazy, { loadPlantArticleExtensions } from "../../components/plants/PlantArticleEditorLazy.jsx";
import PlantProblemsSection from "../../components/plants/PlantProblemsSection.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";

const EMPTY_DOC = { type: "doc", content: [] };
const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const TOX_LEVELS = ["нет", "низкая", "средняя", "высокая"];

export default function PlantDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const canManage = user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [plant, setPlant] = React.useState(null);
  const [gallery, setGallery] = React.useState([]);
  const [article, setArticle] = React.useState(null);
  const [similar, setSimilar] = React.useState([]);
  const [idealNeighbors, setIdealNeighbors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const [meta, setMeta] = React.useState(null);
  const [metaLoading, setMetaLoading] = React.useState(true);
  const [articleExtensions, setArticleExtensions] = React.useState(null);

  const [uploadingMain, setUploadingMain] = React.useState(false);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [articleEditorOpen, setArticleEditorOpen] = React.useState(false);
  const [articleSaving, setArticleSaving] = React.useState(false);
  const [generatingArticle, setGeneratingArticle] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [imageVersion, setImageVersion] = React.useState(0);

  const applyPlantPayload = React.useCallback((data) => {
    if (!data) return;
    setPlant(data.plant);
    setGallery(data.gallery || []);
    setArticle(data.article || null);
    setSimilar(data.similar || []);
    setIdealNeighbors(data.ideal_neighbors || []);
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
    loadPlantArticleExtensions()
      .then((ext) => {
        if (mounted) setArticleExtensions(ext);
      })
      .catch(() => {});
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

  React.useEffect(() => {
    if (searchParams.get("edit") === "1" && plant) {
      setEditOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, plant]);

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

  const handleGalleryReorder = async (orderedIds) => {
    if (!plant || !orderedIds?.length) return;
    const currentMap = new Map(gallery.map((item) => [item.id, item]));
    const reordered = orderedIds.map((id) => currentMap.get(id)).filter(Boolean);
    setGallery(reordered);
    try {
      await plantsApi.reorderGallery(plant.id, orderedIds);
      toast.success("Порядок сохранён");
    } catch (err) {
      toast.error(err.message || "Не удалось изменить порядок");
      await refreshPlant();
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

  const handleArticleGenerate = async () => {
    if (!plant) return;
    try {
      setGeneratingArticle(true);
      await plantsApi.triggerArticleGeneration(plant.id);
      toast.success("Запрос отправлен");
    } catch (err) {
      toast.error(err.message || "Не удалось отправить запрос");
    } finally {
      setGeneratingArticle(false);
    }
  };

  const handleDeletePlant = async () => {
    if (!plant) return;
    try {
      setDeleting(true);
      await plantsApi.remove(plant.id);
      toast.success("Растение удалено");
      navigate("/plants");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить растение");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
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

  const handleCloneSimilar = async () => {
    if (!plant) return;
    try {
      const res = await plantsApi.clone(plant.id);
      toast.success("Создана копия растения");
      navigate(`/plants/${res.plant.slug}?edit=1`);
    } catch (err) {
      toast.error(err.message || "Не удалось создать копию");
    }
  };

  const articleHtml = React.useMemo(() => {
    if (!article?.content_rich || !articleExtensions) return "";
    try {
      const html = generateHTML(article.content_rich, articleExtensions);
      return transformContent(html);
    } catch {
      return article.content_text || "";
    }
  }, [article?.content_rich, article?.content_text, articleExtensions]);
  const articleMarkdown = React.useMemo(() => (article?.content_text || "").trim(), [article]);

  return (
    <PageShell title={plant ? plant.common_name : "Карточка растения"} contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: plant ? plant.common_name : "Карточка" },
        ]}
      />
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
              <div className="space-y-6">
                <ImageBlock
                  plant={plant}
                  onUploadMain={handleMainUpload}
                  uploading={uploadingMain}
                  canManage={canManage}
                  cacheBuster={imageVersion}
                />
                <GallerySection
                  images={gallery}
                  onUpload={handleGalleryUpload}
                  onDelete={handleGalleryDelete}
                  onReorder={handleGalleryReorder}
                  uploading={uploadingGallery}
                  canManage={canManage}
                />
              </div>
              <PassportBlock
                plant={plant}
                canManage={canManage}
                onEdit={() => setEditOpen(true)}
                onClone={handleCloneSimilar}
                onDeleteRequest={() => setDeleteDialogOpen(true)}
                neighbors={idealNeighbors}
              />
            </div>

            <TagsBlock tags={plant.tags || []} />

            <ArticleSection
              html={articleHtml}
              markdown={articleMarkdown}
              updatedAt={article?.updated_at}
              canManage={canManage}
              onEdit={() => setArticleEditorOpen(true)}
              canGenerate={canManage && meta?.settings?.n8n_generate_description_enabled}
              onGenerate={handleArticleGenerate}
              generating={generatingArticle}
            />

            {canManage && <PlantProblemsSection plantId={plant.id} canManage={canManage} />}

            {similar.length > 0 && <SimilarPlants items={similar} />}

            <EditPlantDialog
              open={editOpen}
              onClose={() => setEditOpen(false)}
              plant={plant}
              dicts={meta?.dicts}
              tags={meta?.tags}
              loading={metaLoading}
              onSave={handlePlantUpdate}
            />

            <PlantArticleEditorLazy
              open={articleEditorOpen}
              initialContent={article?.content_rich || EMPTY_DOC}
              initialMarkdown={article?.content_text || ""}
              onClose={() => setArticleEditorOpen(false)}
              onSave={handleArticleSave}
              loading={articleSaving}
            />

            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              loading={deleting}
              onCancel={() => setDeleteDialogOpen(false)}
              onConfirm={handleDeletePlant}
              plantName={plant.common_name}
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

function PassportBlock({ plant, canManage, onEdit, onClone, onDeleteRequest, neighbors = [] }) {
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
  const careBadges = buildCareBadges(plant);
  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{plant.common_name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Номер #{plant.id}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {plant.category?.name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                🌿 {plant.category.name}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
                plant.is_published
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
              }`}
            >
              {plant.is_published ? "Опубликовано" : "Черновик"}
            </span>
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {onClone && (
              <button
                type="button"
                onClick={onClone}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-600 dark:border-white/10 dark:text-slate-200"
              >
                Добавить похожее
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
            >
              Редактировать
            </button>
            {onDeleteRequest && (
              <button
                type="button"
                onClick={onDeleteRequest}
                className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 dark:border-rose-400/40 dark:text-rose-200"
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>
      {careBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {careBadges.map((badge) => (
            <CareBadge key={badge.label} icon={badge.icon} label={badge.label} value={badge.value} tone={badge.tone} />
          ))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
      {neighbors.length > 0 && <IdealNeighborsBadge neighbors={neighbors} />}
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

function CareBadge({ icon, label, value, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {icon} {label}: <span className="text-slate-900 dark:text-white">{value}</span>
    </span>
  );
}

function IdealNeighborsBadge({ neighbors }) {
  const preview = neighbors.slice(0, 3);
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
      <p className="font-semibold">Совместимо с:</p>
      <p>{preview.map((item) => item.common_name).join(", ")}</p>
    </div>
  );
}

function SimilarPlants({ items }) {
  if (!items?.length) return null;
  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Похожие растения</h3>
        <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {items.length} шт.
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const image = item.main_preview_url || item.main_image_url;
          return (
            <Link
              key={item.id}
              to={`/plants/${item.slug}`}
              className="group flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-blue-200 hover:bg-white dark:border-white/10 dark:bg-slate-800/40"
            >
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900/60">
                {image ? (
                  <img src={image} alt={item.common_name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">🌱</div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <p className="font-semibold text-slate-800 transition group-hover:text-blue-600 dark:text-white">
                  {item.common_name}
                </p>
                {item.category && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.category}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ConfirmDeleteDialog({ open, plantName, loading, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={loading ? undefined : onCancel} title="Удалить растение?" maxWidth="max-w-md">
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <p>
          Вы уверены, что хотите удалить «{plantName}»? Действие необратимо и удалит все связанные фото и статьи.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GallerySection({ images, onUpload, onDelete, onReorder, uploading, canManage }) {
  const inputRef = React.useRef(null);
  const [localImages, setLocalImages] = React.useState(images);
  const [draggingId, setDraggingId] = React.useState(null);
  const [previewIndex, setPreviewIndex] = React.useState(null);

  React.useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) return;
    const next = reorderImages(localImages, draggingId, targetId);
    setLocalImages(next);
    setDraggingId(null);
    onReorder?.(next.map((img) => img.id));
  };

  const openPreviewById = (imageId) => {
    const index = localImages.findIndex((img) => img.id === imageId);
    if (index >= 0) setPreviewIndex(index);
  };

  const closePreview = () => setPreviewIndex(null);
  const showPrev = () => {
    if (!localImages.length) return;
    setPreviewIndex((prev) => (prev === null ? 0 : (prev - 1 + localImages.length) % localImages.length));
  };
  const showNext = () => {
    if (!localImages.length) return;
    setPreviewIndex((prev) => (prev === null ? 0 : (prev + 1) % localImages.length));
  };

  const visibleImages = localImages.slice(0, 8);
  const hiddenCount = Math.max(0, localImages.length - visibleImages.length);
  const previewImage = previewIndex === null ? null : localImages[previewIndex];

  React.useEffect(() => {
    if (previewIndex === null) return () => {};
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePreview();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewIndex, localImages.length]);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Галерея</h3>
        {canManage && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
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
      {localImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/20 dark:text-slate-400">
          Галерея пока пуста.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {visibleImages.map((image, idx) => {
            const showHiddenBadge = hiddenCount > 0 && idx === visibleImages.length - 1;
            return (
              <div
                key={image.id}
                draggable={canManage}
                onDragStart={() => setDraggingId(image.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(image.id);
                }}
                onDragEnd={() => setDraggingId(null)}
                className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-left transition dark:border-white/10 dark:bg-slate-800/40 ${draggingId === image.id ? "ring-2 ring-blue-400" : ""}`}
              >
                <button type="button" className="block w-full" onClick={() => openPreviewById(image.id)}>
                  <img
                    src={image.preview_url || image.image_url}
                    alt="Фото растения"
                    className="h-20 w-full object-cover sm:h-24"
                    loading="lazy"
                  />
                  {showHiddenBadge && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-sm font-semibold text-white">
                      +{hiddenCount}
                    </span>
                  )}
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(image.id);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 shadow hover:bg-white"
                  >
                    Удалить
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={closePreview}>
          <div className="flex items-center justify-between px-6 py-4 text-white">
            <span className="text-sm font-semibold">
              {previewIndex + 1} / {localImages.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closePreview();
              }}
              className="rounded-full bg-white/20 px-3 py-1 text-sm text-white transition hover:bg-white/40"
            >
              Закрыть
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {localImages.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/40"
              >
                ‹
              </button>
            )}
            <img src={previewImage.image_url} alt="Фото растения" className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            {localImages.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/40"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
function reorderImages(list, sourceId, targetId) {
  const next = [...list];
  const from = next.findIndex((item) => item.id === sourceId);
  const to = next.findIndex((item) => item.id === targetId);
  if (from === -1 || to === -1) return list;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function ArticleSection({ html, markdown, updatedAt, canManage, onEdit, canGenerate, onGenerate, generating }) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Статья</h3>
        {canManage && (
          <div className="flex gap-2">
            {canGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={generating}
                className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 dark:border-emerald-400/40 dark:text-emerald-200"
              >
                {generating ? "Отправка..." : "Сгенерировать"}
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
            >
              Редактировать
            </button>
          </div>
        )}
      </div>
      {markdown ? (
        <div className="prose max-w-none text-slate-700 dark:prose-invert dark:text-slate-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      ) : html ? (
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

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Опубликовать на сайте</span>
          </label>

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
    { field: "category_id", label: "Категория", options: dicts.categories || [] },
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
      category_id: "",
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
      is_published: false,
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
    category_id: plant.category?.id || "",
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
    is_published: Boolean(plant.is_published),
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
  payload.category_id = numberOrNull(payload.category_id);
  payload.max_height_cm = numberOrNull(payload.max_height_cm);
  payload.blooming_month = numberOrNull(payload.blooming_month);
  payload.toxicity_for_cats_level = numberOrNull(payload.toxicity_for_cats_level);
  payload.toxicity_for_dogs_level = numberOrNull(payload.toxicity_for_dogs_level);
  payload.toxicity_for_humans_level = numberOrNull(payload.toxicity_for_humans_level);
  payload.tags = form.tags;
  payload.acquisition_date = payload.acquisition_date || null;
  payload.is_published = Boolean(form.is_published);
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

function buildCareBadges(plant) {
  const badges = [];
  if (plant.light?.name) badges.push({ icon: "☀️", label: "Свет", value: plant.light.name, tone: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100" });
  if (plant.watering?.name) badges.push({ icon: "💧", label: "Полив", value: plant.watering.name, tone: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100" });
  if (plant.humidity?.name) badges.push({ icon: "💨", label: "Влажность", value: plant.humidity.name, tone: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-500/10 dark:text-cyan-100" });
  if (plant.blooming_month) badges.push({ icon: "🌸", label: "Цветение", value: MONTHS[plant.blooming_month - 1], tone: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100" });
  return badges;
}


