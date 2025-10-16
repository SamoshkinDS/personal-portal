// encoding: utf-8
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell.jsx";
import PinModal from "../components/PinModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../hooks/useTheme.js";

const CONTENT_TABS = [
  { key: "articles", label: "Статьи" },
  { key: "posts", label: "Посты" },
  { key: "links", label: "Ссылки" },
];

const CONTENT_CONFIG = {
  articles: {
    label: "Статьи",
    descriptionPlaceholder: "Опишите, почему материал важен и что нужно запомнить.",
    urlPlaceholder: "Ссылка на публикацию (по желанию)",
  },
  posts: {
    label: "Посты",
    descriptionPlaceholder: "Добавьте контекст, основные выводы или план действий.",
    urlPlaceholder: "Сопроводительная ссылка (если есть)",
  },
  links: {
    label: "Ссылки",
    descriptionPlaceholder: "Напоминание, как использовать ресурс.",
    urlPlaceholder: "URL-адрес",
  },
};

const EMPTY_DRAFT = { id: null, title: "", description: "", url: "" };

const createInitialContent = () => ({
  articles: [
    {
      id: "art-1",
      title: "Обзор спроса Q3",
      description:
        "Сравнение YoY, ключевые сегменты и рекомендации по развитию продукта.",
      url: "https://example.com/q3-report",
    },
  ],
  posts: [
    {
      id: "post-1",
      title: "Синк с разработкой",
      description:
        "Собрать вопросы по API и закрыть блокеры до пятничной встречи.",
      url: "",
    },
  ],
  links: [
    {
      id: "link-1",
      title: "Notion: база знаний",
      description: "Шаблоны исследований, процессы и дорожная карта.",
      url: "https://notion.so/workspace",
    },
  ],
});

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [authorized, setAuthorized] = useState(false);
  const [isPinValid, setIsPinValid] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("admin-pin-ok") === "true";
  });
  const [activeTab, setActiveTab] = useState(CONTENT_TABS[0].key);
  const [content, setContent] = useState(createInitialContent);
  const [drafts, setDrafts] = useState(() => ({
    articles: { ...EMPTY_DRAFT },
    posts: { ...EMPTY_DRAFT },
    links: { ...EMPTY_DRAFT },
  }));
  const [errors, setErrors] = useState({
    articles: "",
    posts: "",
    links: "",
  });
  const [logs, setLogs] = useState(() => [
    {
      id: "log-1",
      timestamp: "16.10.2025 18:00",
      message: "Последний деплой: prod-cluster-1",
    },
    {
      id: "log-2",
      timestamp: "16.10.2025 17:45",
      message: "Успешная авторизация: admin",
    },
  ]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  // Фиксируем действия администратора с отметкой времени.
  const pushLog = useCallback((message) => {
    const timestamp =
      typeof window !== "undefined"
        ? new Date().toLocaleString("ru-RU")
        : "--";
    setLogs((prev) => [
      { id: `${Date.now()}`, timestamp, message },
      ...prev,
    ]);
  }, []);

  const handlePinSuccess = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("admin-pin-ok", "true");
    }
    setIsPinValid(true);
    pushLog("Вход по PIN подтверждён.");
  };

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    pushLog(isDark ? "Включена светлая тема." : "Включена тёмная тема.");
  }, [isDark, toggleTheme, pushLog]);

  const resetDraft = useCallback((type) => {
    setDrafts((prev) => ({
      ...prev,
      [type]: { ...EMPTY_DRAFT },
    }));
  }, []);

  const handleDraftChange = (type, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
    setErrors((prev) => ({
      ...prev,
      [type]: "",
    }));
  };

  const makeId = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `item-${Date.now()}`);

  // Сохранение или обновление записи в активной вкладке.
  const handleSubmit = (type) => (event) => {
    event.preventDefault();
    const draft = drafts[type];
    if (!draft.title.trim()) {
      setErrors((prev) => ({
        ...prev,
        [type]: "Добавьте заголовок, чтобы сохранить запись.",
      }));
      return;
    }

    setContent((prev) => {
      const items = prev[type] ?? [];
      const updatedItem = {
        ...draft,
        id: draft.id ?? makeId(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        url: draft.url.trim(),
      };

      const nextItems = draft.id
        ? items.map((item) => (item.id === draft.id ? updatedItem : item))
        : [updatedItem, ...items];

      return {
        ...prev,
        [type]: nextItems,
      };
    });

    resetDraft(type);
    pushLog(
      draft.id
        ? `Обновлена запись в разделе «${CONTENT_CONFIG[type].label}».`
        : `Добавлена запись в раздел «${CONTENT_CONFIG[type].label}».`,
    );
  };

  const handleEdit = (type, item) => {
    setActiveTab(type);
    setDrafts((prev) => ({
      ...prev,
      [type]: { ...item },
    }));
  };

  const handleLogoutClick = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin-pin-ok");
    }
    pushLog("Ручной выход из портала.");
    logout();
  }, [logout, pushLog]);

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        onClick={handleThemeToggle}
        className="admin__theme-action inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Переключить тему
      </button>
    ),
    [handleThemeToggle],
  );

  const activeDraft = drafts[activeTab];
  const activeItems = content[activeTab] ?? [];
  const activeConfig = CONTENT_CONFIG[activeTab];

  const emptyStateCopy = useMemo(
    () => ({
      articles: "Пока нет статей — добавьте материал, чтобы закрепить инсайт.",
      posts: "Запланируйте пост, чтобы мысль не потерялась.",
      links: "Сохраните полезную ссылку для быстрого доступа.",
    }),
    [],
  );

  if (!authorized) {
    return null;
  }

  if (!isPinValid) {
    return <PinModal onSuccess={handlePinSuccess} />;
  }

  return (
    <PageShell
      title="Админ-панель"
      actions={headerActions}
      onLogout={handleLogoutClick}
      contentClassName="admin admin--dashboard flex flex-col gap-6 bg-transparent p-0"
    >
      <div className="admin__grid grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.section
          className="admin__system rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/70 backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:shadow-black/30"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="admin__section-title text-lg font-semibold">
            Системные настройки
          </h2>
          <p className="admin__section-description mt-2 text-sm text-gray-500 dark:text-gray-400">
            Управляйте визуальной темой портала и синхронизацией настроек между страницами.
          </p>
          <div className="admin__theme-summary mt-6 space-y-3 rounded-3xl border border-dashed border-gray-200 p-4 dark:border-gray-700">
            <div className="admin__theme-row flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Текущий режим
              </span>
              <span className="admin__theme-badge rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                {isDark ? "Тёмный" : "Светлый"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleThemeToggle}
              className="admin__theme-toggle w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Переключить тему
            </button>
            <p className="admin__theme-note text-xs text-gray-400 dark:text-gray-500">
              Предпочтение синхронизировано с разделом «Настройки» и хранится в браузере.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="admin__content xl:col-span-2 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/70 backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:shadow-black/30"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <h2 className="admin__section-title text-lg font-semibold">
            Контент портала
          </h2>
          <p className="admin__section-description mt-2 text-sm text-gray-500 dark:text-gray-400">
            Добавляйте материалы, редактируйте записи и держите информационную базу в актуальном состоянии.
          </p>

          <div className="admin__tabs mt-6 flex flex-wrap gap-2">
            {CONTENT_TABS.map((tab) => (
              <motion.button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`admin__tab rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
                }`}
                whileTap={{ scale: 0.96 }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit(activeTab)} className="admin__form mt-6 space-y-4">
            <div className="admin__form-row grid gap-4 md:grid-cols-2">
              <label className="admin__field flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Заголовок
                <input
                  type="text"
                  value={activeDraft.title}
                  onChange={(event) =>
                    handleDraftChange(activeTab, "title", event.target.value)
                  }
                  className="admin__input rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
                  placeholder="Например: Сводка по рынку"
                />
              </label>
              <label className="admin__field flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Ссылка
                <input
                  type="url"
                  value={activeDraft.url}
                  onChange={(event) =>
                    handleDraftChange(activeTab, "url", event.target.value)
                  }
                  className="admin__input rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
                  placeholder={activeConfig.urlPlaceholder}
                />
              </label>
            </div>
            <label className="admin__field flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Описание
              <textarea
                value={activeDraft.description}
                onChange={(event) =>
                  handleDraftChange(activeTab, "description", event.target.value)
                }
                rows={3}
                className="admin__textarea rounded-2xl border border-gray-200 bg-white p-3 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
                placeholder={activeConfig.descriptionPlaceholder}
              />
            </label>

            {errors[activeTab] && (
              <p className="admin__error text-sm text-red-500">{errors[activeTab]}</p>
            )}

            <div className="admin__form-actions flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="admin__hint text-xs text-gray-400 dark:text-gray-500">
                Черновики хранятся локально, чтобы правки можно было делать мгновенно.
              </span>
              <div className="admin__buttons flex gap-3">
                <button
                  type="button"
                  onClick={() => resetDraft(activeTab)}
                  className="admin__button admin__button--ghost rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500"
                >
                  Очистить
                </button>
                <motion.button
                  type="submit"
                  className="admin__button admin__button--primary rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  whileTap={{ scale: 0.95 }}
                >
                  {activeDraft.id ? "Сохранить изменения" : "Добавить запись"}
                </motion.button>
              </div>
            </div>
          </form>

          <div className="admin__items mt-8 space-y-4">
            {activeItems.length === 0 ? (
              <p className="admin__empty rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-800/60 dark:text-gray-400">
                {emptyStateCopy[activeTab]}
              </p>
            ) : (
              activeItems.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  className="admin__item rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-slate-800 dark:hover:border-blue-400/40"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="admin__item-body flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="admin__item-title text-base font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="admin__item-description mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="admin__item-link mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                        >
                          Открыть ссылку
                          <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </div>
                    <div className="admin__item-actions flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(activeTab, item)}
                        className="admin__item-edit rounded-full border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:bg-blue-500/10"
                      >
                        Редактировать
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </motion.section>

        <motion.section
          className="admin__log xl:col-span-3 rounded-3xl bg-white/90 p-6 shadow-lg shadow-slate-200/70 backdrop-blur transition-colors duration-500 dark:bg-slate-900/80 dark:shadow-black/30"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="admin__log-header flex items-center justify-between">
            <h2 className="admin__section-title text-lg font-semibold">Журнал действий</h2>
            <span className="admin__log-meta text-xs text-gray-400 dark:text-gray-500">
              Храним последние 20 записей
            </span>
          </div>
          <p className="admin__log-description mt-2 text-sm text-gray-500 dark:text-gray-400">
            Здесь фиксируются деплои, авторизации и изменения контента. Используйте журнал,
            чтобы быстро восстанавливать контекст и объяснять решения команде.
          </p>
          <div className="admin__log-list mt-6 space-y-3">
            {logs.slice(0, 20).map((log) => (
              <motion.article
                key={log.id}
                layout
                className="admin__log-item flex flex-col gap-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="admin__log-time text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-300">
                  {log.timestamp}
                </span>
                <span className="admin__log-text text-sm text-gray-700 dark:text-gray-200">
                  {log.message}
                </span>
              </motion.article>
            ))}
          </div>
        </motion.section>
      </div>
    </PageShell>
  );
}
