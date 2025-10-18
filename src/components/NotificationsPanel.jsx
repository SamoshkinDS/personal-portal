// encoding: utf-8
import React from "react";

export default function NotificationsPanel({
  visible,
  open,
  onClose,
  items,
  loading,
  error,
  onReload,
  onRead,
  onReadAll,
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`relative h-full w-full max-w-md transform-gpu transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Центр уведомлений"
      >
        <div className="flex h-full flex-col gap-4 rounded-l-3xl bg-white/95 p-5 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:bg-slate-900/95 dark:ring-white/5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Центр уведомлений</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Новые события появляются автоматически. Можно отметить одно или все как прочитанные.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReload}
                className="inline-flex h-9 items-center justify-center rounded-full border border-blue-200 px-3 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/50 dark:hover:bg-blue-500/10"
              >
                Обновить
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                aria-label="Закрыть панель уведомлений"
              >
                ✕
              </button>
            </div>
          </header>

          {error && (
            <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="custom-scrollbar flex-1 overflow-y-auto pr-1">
            {loading && (
              <div className="mb-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                Загружаем уведомления…
              </div>
            )}

            {(!items || items.length === 0) && !loading ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900/60 dark:text-gray-400">
                Пока непрочитанных уведомлений нет. Мы покажем бейдж, когда появятся новые события.
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map((n) => {
                  const created = n.created_at ? new Date(n.created_at).toLocaleString("ru-RU") : "";
                  return (
                    <li
                      key={n.id}
                      className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900"
                    >
                      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 via-indigo-500 to-purple-500" />
                      <div className="ml-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                            <span className="text-[11px] uppercase tracking-wide text-blue-500 dark:text-blue-300">
                              {n.type === "log" ? "Журнал" : n.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{created}</span>
                        </div>
                        {n.body && <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{n.body}</p>}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onRead(n.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition group-hover:border-blue-200 group-hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:group-hover:border-blue-400/40 dark:group-hover:text-blue-200"
                          >
                            Отметить прочитанным
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <button
              type="button"
              onClick={onReadAll}
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            >
              Прочитать всё
            </button>
            <span>Всего: {items?.length || 0}</span>
          </footer>
        </div>
      </aside>
    </div>
  );
}
