import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";

export default function KnowledgeDetailsPage() {
  const { knowledgeId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!knowledgeId) return;
    (async () => {
      try {
        setLoading(true);
        const result = await careerApi.getKnowledgeById(knowledgeId);
        setItem(result);
      } catch (error) {
        toast.error(error?.message || "Не удалось загрузить технологию");
      } finally {
        setLoading(false);
      }
    })();
  }, [knowledgeId]);

  if (loading) {
    return (
      <PageShell title="Технология">
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
          Загрузка...
        </div>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell title="Технология">
        <div className="rounded-3xl border border-dashed border-slate-200/80 bg-white/80 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
          Запись не найдена
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`${item.technology} (${item.currentVersion || "-"})`}>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          Назад
        </button>
        <div className="rounded-3xl border border-white/10 bg-white/90 p-6 shadow dark:border-white/5 dark:bg-slate-900/70 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Категория</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.category || "Без категории"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Лучшие практики</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.bestPractices || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Полезные ссылки</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {(item.usefulLinks || []).length ? (
                item.usefulLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-300 underline">
                      {link.title}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-slate-500 dark:text-slate-400">Ссылок нет</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Заметки</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.notes || "-"}</p>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Создано: {item.createdAt ? new Date(item.createdAt).toLocaleString("ru-RU") : "-"}
            <br />
            Обновлено: {item.updatedAt ? new Date(item.updatedAt).toLocaleString("ru-RU") : "-"}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
