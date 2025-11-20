import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import PageShell from "../../components/PageShell.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { medicinesApi } from "../../api/care.js";
import MedicineFormModal from "./components/MedicineFormModal.jsx";
import PlantArticleEditorLazy, { loadPlantArticleExtensions } from "../../components/plants/PlantArticleEditorLazy.jsx";
import PlantsBreadcrumbs from "../../components/plants/PlantsBreadcrumbs.jsx";
import CareCoverCard from "./components/CareCoverCard.jsx";

const EMPTY_DOC = { type: "doc", content: [] };

export default function MedicineDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage =
    user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [medicine, setMedicine] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [articleOpen, setArticleOpen] = React.useState(false);
  const [articleSaving, setArticleSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [articleExtensions, setArticleExtensions] = React.useState(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);

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
        const res = await medicinesApi.detail(slug);
        if (!cancelled) {
          setMedicine(res.item);
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
    if (!medicine) return;
    setSaving(true);
    try {
      const res = await medicinesApi.update(medicine.id, payload);
      setMedicine(res.item);
      toast.success("Данные обновлены");
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleArticleSave = async ({ content_rich, content_text }) => {
    if (!medicine) return;
    setArticleSaving(true);
    try {
      const res = await medicinesApi.update(medicine.id, {
        instruction: content_rich,
        instruction_text: content_text,
      });
      setMedicine(res.item);
      toast.success("Инструкция обновлена");
      setArticleOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setArticleSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!medicine) return;
    if (!window.confirm(`Удалить «${medicine.name}»?`)) return;
    setDeleting(true);
    try {
      await medicinesApi.remove(medicine.id);
      toast.success("Удалено");
      navigate("/medicines");
    } catch (err) {
      toast.error(err.message || "Не удалось удалить");
    } finally {
      setDeleting(false);
    }
  };


  const handlePhotoUpload = async (file) => {
    if (!medicine || !file) return;
    setPhotoUploading(true);
    try {
      const res = await medicinesApi.uploadPhoto(medicine.id, file);
      setMedicine(res.item);
      toast.success('???? ?????????');
    } catch (err) {
      toast.error(err.message || '?? ??????? ???????? ????');
    } finally {
      setPhotoUploading(false);
    }
  };

  const articleHtml = React.useMemo(() => {
    if (!medicine?.instruction || !articleExtensions) return "";
    try {
      return generateHTML(medicine.instruction, articleExtensions);
    } catch {
      return "";
    }
  }, [medicine?.instruction, articleExtensions]);

  const shopLinks = React.useMemo(() => {
    if (!medicine?.shop_links) return [];
    return medicine.shop_links
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [medicine]);

  return (
    <PageShell title={medicine ? medicine.name : "Карточка лекарства"} contentClassName="flex flex-col gap-6">
      <PlantsBreadcrumbs
        items={[
          { label: "Растения", to: "/plants" },
          { label: "Лекарства", to: "/medicines" },
          { label: medicine ? medicine.name : "Карточка" },
        ]}
      />
      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl border border-emerald-100 bg-white/80 dark:border-emerald-400/20 dark:bg-slate-900/40" />
      ) : error ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-900/30 dark:text-emerald-100">
          {error}
        </div>
      ) : (
        medicine && (
          <>
            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
              <CareCoverCard
                photoUrl={medicine.photo_url}
                name={medicine.name}
                placeholder="??"
                canManage={canManage}
                uploading={photoUploading}
                onUpload={handlePhotoUpload}
                className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-400/20 dark:from-emerald-900/30 dark:to-teal-900/30"
              />
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {medicine.medicine_type && (
                    <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100">
                      {medicine.medicine_type}
                    </span>
                  )}
                  {medicine.form && (
                    <span className="rounded-full bg-teal-100 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:bg-teal-400/10 dark:text-teal-100">
                      {medicine.form}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{medicine.name}</h1>
                  {medicine.description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{medicine.description}</p>
                  )}
                </div>
                <dl className="grid gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/40 md:grid-cols-2">
                  <InfoRow label="Концентрация" value={medicine.concentration || "Не указана"} />
                  <InfoRow label="Срок годности" value={formatDate(medicine.expiration_date) || "Без срока"} />
                </dl>
                {canManage && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-100"
                    >
                      Редактировать карточку
                    </button>
                    <button
                      type="button"
                      onClick={() => setArticleOpen(true)}
                    className="rounded-2xl border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 dark:border-teal-400/40 dark:text-teal-100"
                    >
                      Править инструкцию
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

            <section className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900/40">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500">Как применять</p>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Инструкция</h2>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setArticleOpen(true)}
                        className="rounded-2xl border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/40 dark:text-emerald-100"
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
                  ) : medicine.instruction_text ? (
                    <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">
                      {medicine.instruction_text}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Инструкция ещё не заполнена.</p>
                  )}
                </div>
                <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/40">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ссылки на магазины</p>
                  {shopLinks.length ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {shopLinks.map((link) => (
                        <li key={link}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-300"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Ссылок нет.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6 rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-slate-900/40">
              <ProblemList title="Против вредителей" items={medicine.pests} type="pest" />
              <ProblemList title="Против заболеваний" items={medicine.diseases} type="disease" />
            </section>

            <MedicineFormModal open={formOpen} onClose={() => setFormOpen(false)} initialValue={medicine} onSubmit={handleSave} loading={saving} />
            <PlantArticleEditorLazy
              open={articleOpen}
              onClose={() => setArticleOpen(false)}
              initialContent={medicine.instruction || EMPTY_DOC}
              initialMarkdown={medicine.instruction_text || ""}
              onSave={handleArticleSave}
              loading={articleSaving}
              modalTitle="Инструкция"
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

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
}

function ProblemList({ title, items = [], type }) {
  const emptyText = type === "pest" ? "Пока нет связей с вредителями." : "Пока нет связей с заболеваниями.";
  const icon = type === "pest" ? "🐛" : "🧫";
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={type === "pest" ? `/pests/${item.slug}` : `/diseases/${item.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 transition hover:border-emerald-200 hover:bg-white hover:text-emerald-700 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-emerald-400/40 dark:hover:text-emerald-100"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {type === "pest" ? dangerLabel(item.danger_level) : item.disease_type || "Тип не указан"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
      )}
    </div>
  );
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
      return "Опасность не указана";
  }
}
