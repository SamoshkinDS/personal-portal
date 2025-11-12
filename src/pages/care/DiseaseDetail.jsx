import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import PageShell from "../../components/PageShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { diseasesApi } from "../../api/care.js";
import DiseaseFormModal from "./components/DiseaseFormModal.jsx";
import PlantArticleEditor, { getPlantArticleExtensions } from "../../components/plants/PlantArticleEditor.jsx";
import MedicinesSelectModal from "./components/MedicinesSelectModal.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";

const EMPTY_DOC = { type: "doc", content: [] };

export default function DiseaseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage =
    user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [disease, setDisease] = React.useState(null);
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

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await diseasesApi.detail(slug);
        if (!cancelled) {
          setDisease(res.item);
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
    if (!disease) return;
    setSaving(true);
    try {
      const res = await diseasesApi.update(disease.id, payload);
      setDisease(res.item);
      toast.success("Данные обновлены");
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleArticleSave = async ({ content_rich, content_text }) => {
    if (!disease) return;
    setArticleSaving(true);
    try {
      const res = await diseasesApi.update(disease.id, {
        treatment_text: content_rich,
        treatment_text_plain: content_text,
      });
      setDisease(res.item);
      toast.success("Блок «Как лечить» обновлён");
      setArticleOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setArticleSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!disease) return;
    if (!window.confirm(`Удалить «${disease.name}»?`)) return;
    setDeleting(true);
    try {
      await diseasesApi.remove(disease.id);
      toast.success("Удалено");
      navigate("/diseases");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };

  const articleHtml = React.useMemo(() => {
    if (!disease?.treatment_text) return "";
    try {
      return generateHTML(disease.treatment_text, getPlantArticleExtensions());
    } catch {
      return "";
    }
  }, [disease]);

  const existingMedicineIds = React.useMemo(() => new Set((disease?.medicines || []).map((item) => item.id)), [disease]);

  const handleMedicinesAdd = async (ids) => {
    if (!disease) return;
    setMedicinesSaving(true);
    try {
      const res = await diseasesApi.addMedicines(disease.id, ids);
      setDisease((prev) => (prev ? { ...prev, medicines: res.medicines || [] } : prev));
      toast.success("Привязки сохранены");
      setMedicineModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось привязать лекарства");
    } finally {
      setMedicinesSaving(false);
    }
  };

  const handleMedicinesRemove = async (medicineId) => {
    if (!disease) return;
    setRemovingMedicineId(medicineId);
    try {
      const res = await diseasesApi.removeMedicine(disease.id, medicineId);
      setDisease((prev) => (prev ? { ...prev, medicines: res.medicines || [] } : prev));
      toast.success("Связь удалена");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить связь");
    } finally {
      setRemovingMedicineId(null);
    }
  };

  return (
    <PageShell title={disease ? disease.name : "Карточка заболевания"} contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: "Заболевания", to: "/diseases" },
          { label: disease ? disease.name : "Карточка" },
        ]}
      />
      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl border border-purple-100 bg-white/80 dark:border-purple-400/20 dark:bg-slate-900/40" />
      ) : error ? (
        <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-purple-700 dark:border-purple-400/50 dark:bg-purple-900/30 dark:text-purple-100">
          {error}
        </div>
      ) : (
        disease && (
          <>
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <div className="overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm dark:border-purple-400/20 dark:from-purple-900/40 dark:to-indigo-900/20">
                {disease.photo_url ? (
                  <img src={disease.photo_url} alt={disease.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-6xl">🦠</div>
                )}
              </div>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {disease.disease_type && (
                    <span className="rounded-full bg-purple-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-purple-600 dark:bg-purple-400/10 dark:text-purple-100">
                      {disease.disease_type}
                    </span>
                  )}
                  {disease.reason && (
                    <span className="rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-100">
                      {disease.reason}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{disease.name}</h1>
                  {disease.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{disease.description}</p>
                  )}
                </div>
                <dl className="grid gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/40 md:grid-cols-2">
                  <InfoRow label="Причина" value={disease.reason || "Не указана"} />
                  <InfoRow label="Симптомы" value={disease.symptoms || "Нет данных"} />
                  <InfoRow label="Профилактика" value={disease.prevention || "Нет рекомендаций"} />
                </dl>
                {canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="rounded-2xl border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 dark:border-purple-400/40 dark:text-purple-100"
                    >
                      Редактировать карточку
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleOpen(true)}
                    className="rounded-2xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400/40 dark:text-indigo-100"
                    >
                      Править блок «Как лечить»
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

            <section className="rounded-3xl border border-purple-100 bg-white/90 p-6 shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">Терапия</p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Как лечить</h2>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setArticleOpen(true)}
                    className="rounded-2xl border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 dark:border-purple-400/40 dark:text-purple-100"
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
              ) : disease.treatment_text_plain ? (
                <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                  {disease.treatment_text_plain}
                </p>
              ) : (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Пока нет инструкции по лечению.</p>
              )}
            </section>

            <section className="rounded-3xl border border-purple-100 bg-white/90 p-6 shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-500">Лекарства</p>
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
              {disease.medicines?.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {disease.medicines.map((medicine) => (
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

            <DiseaseFormModal open={formOpen} onClose={() => setFormOpen(false)} initialValue={disease} onSubmit={handleSave} loading={saving} />
            <PlantArticleEditor
              open={articleOpen}
              onClose={() => setArticleOpen(false)}
              initialContent={disease.treatment_text || EMPTY_DOC}
              initialMarkdown={disease.treatment_text_plain || ""}
              onSave={handleArticleSave}
              loading={articleSaving}
              modalTitle="Как лечить"
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
