
import React from "react";
import { useParams } from "react-router-dom";
import { sharedLinksApi } from "../../api/sharedLinks.js";

const priorityMeta = {
  "высокий": { label: "Высокий", color: "bg-rose-500/15 text-rose-700 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-50" },
  "средний": { label: "Средний", color: "bg-amber-500/15 text-amber-800 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-50" },
  "низкий": { label: "Низкий", color: "bg-emerald-500/15 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-50" },
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
export default function WishListSharedPage() {
  const { token } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState({ active: [], archived: [] });
  const [sharedLink, setSharedLink] = React.useState(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sharedLinksApi.fetchPublic(token);
      setItems(data.items || { active: [], archived: [] });
      setSharedLink(data.sharedLink || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Доступ закрыт");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const renderCard = (item) => {
    const meta = priorityMeta[item.priority] || priorityMeta["средний"];
    return (
      <div
        key={item.id}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/90 shadow ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-2xl dark:bg-slate-900/80 dark:ring-slate-800"
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
          <p className="mt-auto text-xs text-slate-500 dark:text-slate-400">Приоритет: {meta.label}</p>
        </div>
      </div>
    );
  };

  const emptyState = !loading && !items.active.length && !items.archived.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white/90 px-4 py-4 shadow ring-1 ring-slate-100 dark:bg-slate-900/80 dark:ring-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Просмотр по ссылке</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wish List</h1>
          </div>
          <a
            href="/login"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Войти
          </a>
        </div>

        {sharedLink && (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-900/50 dark:bg-slate-900/70 dark:text-slate-300">
            От {sharedLink.ownerUsername || "пользователя"}, статус: {sharedLink.revoked ? "отозвана" : sharedLink.expiresAt ? `действует до ${formatDate(sharedLink.expiresAt)}` : "бессрочно"}, просмотров {sharedLink.viewsCount ?? 0}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 px-4 py-10 text-center text-slate-500 shadow dark:border-slate-800 dark:bg-slate-900/80">
            Загружаю список...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-rose-600 shadow dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-100">
            {error}. Обновите ссылку или обратитесь к владельцу.
          </div>
        ) : emptyState ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 px-4 py-10 text-center text-slate-500 shadow dark:border-slate-800 dark:bg-slate-900/80">
            Здесь ещё нет пожеланий.
          </div>
        ) : (
          <div className="space-y-6">
            {items.active.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Желания</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.active.map((item) => renderCard(item))}
                </div>
              </div>
            )}
            {items.archived.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">Архив</div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.archived.map((item) => renderCard(item))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
