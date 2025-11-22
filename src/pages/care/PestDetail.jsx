import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import PageShell from "../../components/PageShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { pestsApi } from "../../api/care.js";
import PestFormModal from "./components/PestFormModal.jsx";
import PlantArticleEditorLazy, { loadPlantArticleExtensions } from "../../components/plants/PlantArticleEditorLazy.jsx";
import MedicinesSelectModal from "./components/MedicinesSelectModal.jsx";
import CareCoverCard from "./components/CareCoverCard.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";

const EMPTY_DOC = { type: "doc", content: [] };

export default function PestDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage =
    user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [pest, setPest] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [articleOpen, setArticleOpen] = React.useState(false);
  const [articleSaving, setArticleSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [medicineModalOpen, setMedicineModalOpen] = React.useState(false);
  const [medicinesSaving, setMedicinesSaving] = React.useState(false);
  const [removingMedicineId, setRemovingMedicineId] = React.useState(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [articleExtensions, setArticleExtensions] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    loadPlantArticleExtensions()
      .then((ext) => {
        if (!cancelled) setArticleExtensions(ext);
      })
      .catch(() => {});
    const load = async () => {
      setLoading(true);
      try {
        const res = await pestsApi.detail(slug);
        if (!cancelled) {
          setPest(res.item);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить данные");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSave = async (payload) => {
    if (!pest) return;
    setSaving(true);
    try {
      const res = await pestsApi.update(pest.id, payload);
      setPest(res.item);
      toast.success("Данные обновлены");
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleArticleSave = async ({ content_rich, content_text }) => {
    if (!pest) return;
    setArticleSaving(true);
    try {
      const res = await pestsApi.update(pest.id, {
        fight_text: content_rich,
        fight_text_plain: content_text,
      });
      setPest(res.item);
      toast.success("Статья обновлена");
      setArticleOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить статью");
    } finally {
      setArticleSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pest) return;
    if (!window.confirm(`Удалить «${pest.name}»?`)) return;
    setDeleting(true);
    try {
      await pestsApi.remove(pest.id);
      toast.success("Удалено");
      navigate("/pests");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };


  const handlePhotoUpload = async (file) => {
    if (!pest || !file) return;
    setPhotoUploading(true);
    try {
      const res = await pestsApi.uploadPhoto(pest.id, file);
      setPest(res.item);
      toast.success("Фото обновлено");
    } catch (err) {
      toast.error(err.message || "Не удалось обновить фото");
    } finally {
      setPhotoUploading(false);
    }
  };

  const articleHtml = React.useMemo(() => {
    if (!pest?.fight_text || !articleExtensions) return "";
    try {
      return generateHTML(pest.fight_text, articleExtensions);
    } catch {
      return "";
    }
  }, [pest?.fight_text, articleExtensions]);

  const existingMedicineIds = React.useMemo(() => new Set((pest?.medicines || []).map((item) => item.id)), [pest]);

  const handleMedicinesAdd = async (ids) => {
    if (!pest) return;
    setMedicinesSaving(true);
    try {
      const res = await pestsApi.addMedicines(pest.id, ids);
      setPest((prev) => (prev ? { ...prev, medicines: res.medicines || [] } : prev));
      toast.success("Привязки сохранены");
      setMedicineModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось привязать лекарства");
    } finally {
      setMedicinesSaving(false);
    }
  };

  const handleMedicinesRemove = async (medicineId) => {
    if (!pest) return;
    setRemovingMedicineId(medicineId);
    try {
      const res = await pestsApi.removeMedicine(pest.id, medicineId);
      setPest((prev) => (prev ? { ...prev, medicines: res.medicines || [] } : prev));
      toast.success("Связь удалена");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить связь");
    } finally {
      setRemovingMedicineId(null);
    }
  };

  return (
    <PageShell hideBreadcrumbs title={pest ? pest.name : "Карточка вредителя"} contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: "Вредители", to: "/pests" },
          { label: pest ? pest.name : "Карточка" },
        ]}
      />
      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl border border-rose-100 bg-white/80 dark:border-rose-400/20 dark:bg-slate-900/40" />
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-400/50 dark:bg-rose-900/30 dark:text-rose-100">
          {error}
        </div>
      ) : (
        pest && (
          <>
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <CareCoverCard
                photoUrl={pest.photo_url}
                name={pest.name}
                placeholder="??"
                canManage={canManage}
                uploading={photoUploading}
                onUpload={handlePhotoUpload}
                className="border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 dark:border-rose-400/20 dark:from-rose-900/40 dark:to-orange-900/20"
              />
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:bg-rose-400/10 dark:text-rose-100">
                    Вредитель
                  </span>
                  {pest.danger_level && (
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider ${
                      badgeClass(pest.danger_level)
                    }`}
                    >
                      {dangerLabel(pest.danger_level)}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{pest.name}</h1>
                  {pest.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{pest.description}</p>
                  )}
                </div>
                <dl className="grid gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/40 md:grid-cols-2">
                  <InfoRow label="Период активности" value={pest.active_period || "Не указан"} />
                  <InfoRow label="Признаки" value={pest.symptoms || "Нет данных"} />
                </dl>
                {canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-100"
                    >
                      Редактировать карточку
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleOpen(true)}
                      className="rounded-2xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 dark:border-purple-400/40 dark:text-purple-100"
                    >
                      Править блок «Как бороться»
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/40 dark:text-rose-200"
                    >
                      {deleting ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <section className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm dark:border-rose-400/20 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Гайд</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Как бороться</h2>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setArticleOpen(true)}
                    className="rounded-2xl border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-100"
                  >
                    Редактировать
                  </button>
                )}
              </div>
              {articleHtml ? (
                <div
                  className="prose mt-4 max-w-none text-slate-700 dark:prose-invert dark:text-slate-200"
                  dangerouslySetInnerHTML={{ __html: articleHtml }}
                />
              ) : pest.fight_text_plain ? (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{pest.fight_text_plain}</p>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Пока нет инструкции.</p>
              )}
            </section>

            <section className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm dark:border-rose-400/20 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Лекарства</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Рекомендуемые препараты</h2>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setMedicineModalOpen(true)}
                    className="rounded-2xl border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-100"
                  >
                    Добавить
                  </button>
                )}
              </div>
              {pest.medicines?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {pest.medicines.map((medicine) => (
                    <MedicinePill
                      key={medicine.id}
                      medicine={medicine}
                      canManage={canManage}
                      onRemove={handleMedicinesRemove}
                      removingId={removingMedicineId}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Связанные лекарства не указаны.</p>
              )}
            </section>

            <PestFormModal open={formOpen} onClose={() => setFormOpen(false)} initialValue={pest} onSubmit={handleSave} loading={saving} />
            <PlantArticleEditorLazy
              open={articleOpen}
              onClose={() => setArticleOpen(false)}
              initialContent={pest.fight_text || EMPTY_DOC}
              initialMarkdown={pest.fight_text_plain || ""}
              onSave={handleArticleSave}
              loading={articleSaving}
              modalTitle="Как бороться"
            />
            <MedicinesSelectModal
              open={medicineModalOpen}
              onClose={() => setMedicineModalOpen(false)}
              existingIds={existingMedicineIds}
              onSubmit={handleMedicinesAdd}
              submitting={medicinesSaving}
            />
          </>
        )
      )}
    </PageShell>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function badgeClass(level) {
  if (level === "high") return "bg-rose-600 text-white";
  if (level === "medium") return "bg-amber-500 text-white";
  if (level === "low") return "bg-emerald-500 text-white";
  return "bg-slate-600 text-white";
}

function dangerLabel(level) {
  switch (level) {
    case "high":
      return "Высокий риск";
    case "medium":
      return "Средний риск";
    case "low":
      return "Низкий риск";
    default:
      return level;
  }
}

function MedicinePill({ medicine, canManage, onRemove, removingId }) {
  return (
    <div className="relative flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100">
      <Link to={`/medicines/${medicine.slug}`} className="text-base font-semibold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-100 dark:hover:text-white">
        {medicine.name}
      </Link>
      <span className="inline-flex w-fit rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-white/10 dark:text-emerald-100">
        {medicine.medicine_type || "Тип не указан"}
      </span>
      {canManage && (
        <button
          type="button"
          onClick={() => onRemove(medicine.id)}
          className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-white dark:bg-slate-900/80 dark:text-emerald-200"
          disabled={removingId === medicine.id}
        >
          {removingId === medicine.id ? "…" : "Убрать"}
        </button>
      )}
    </div>
  );
}
