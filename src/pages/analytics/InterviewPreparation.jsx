import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { analyticsApi } from "../../api/analytics.js";
import { interviewApi } from "../../api/interview.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

const DEFAULT_FORM = {
  topicId: "",
  question: "",
  answer: "",
  explanation: "",
  relatedArticleId: "",
};

function flattenTopics(tree = []) {
  const result = [];
  function walk(nodes) {
    nodes.forEach((topic) => {
      result.push(topic);
      if (topic.children?.length) {
        walk(topic.children);
      }
    });
  }
  walk(tree);
  return result;
}

export default function InterviewPreparation() {
  const [questions, setQuestions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [topicFilter, setTopicFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [topics, setTopics] = React.useState([]);
  const [articles, setArticles] = React.useState([]);
  const [viewingQuestion, setViewingQuestion] = React.useState(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create");
  const [formData, setFormData] = React.useState(DEFAULT_FORM);
  const [formLoading, setFormLoading] = React.useState(false);
  const [editingQuestion, setEditingQuestion] = React.useState(null);
  const [instructionOpen, setInstructionOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importPayload, setImportPayload] = React.useState(null);
  const [importError, setImportError] = React.useState("");
  const [importFileName, setImportFileName] = React.useState("");
  const [importLoading, setImportLoading] = React.useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);
  const topicOptions = React.useMemo(() => flattenTopics(topics), [topics]);

  const loadQuestions = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await interviewApi.listQuestions({
        topicId: topicFilter || undefined,
        search: debouncedSearch || undefined,
        limit: 500,
      });
      setQuestions(response.items || []);
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить вопросы");
    } finally {
      setLoading(false);
    }
  }, [topicFilter, debouncedSearch]);

  React.useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await analyticsApi.getTopics({ includeCounts: 0 });
        if (!cancelled) {
          setTopics(response.topics || []);
        }
      } catch (err) {
        toast.error(err.message || "Не удалось загрузить темы");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await interviewApi.listArticles({ limit: 250 });
        if (!cancelled) {
          setArticles(response.items || []);
        }
      } catch (err) {
        toast.error(err.message || "Не удалось загрузить статьи");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateModal = () => {
    setFormMode("create");
    setFormData(DEFAULT_FORM);
    setEditingQuestion(null);
    setFormOpen(true);
  };

  const openEditModal = (question) => {
    setFormMode("edit");
    setEditingQuestion(question);
    setFormData({
      topicId: question.topicId || "",
      question: question.question || "",
      answer: question.answer || "",
      explanation: question.explanation || "",
      relatedArticleId: question.relatedArticleId || "",
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.topicId) {
      toast.error("Выберите тему");
      return;
    }
    if (!formData.question.trim()) {
      toast.error("Вопрос не может быть пустым");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        topicId: Number(formData.topicId),
        question: formData.question.trim(),
        answer: formData.answer ? formData.answer.trim() : null,
        explanation: formData.explanation ? formData.explanation.trim() : null,
        relatedArticleId: formData.relatedArticleId ? Number(formData.relatedArticleId) : null,
      };
      if (formMode === "edit" && editingQuestion) {
        await interviewApi.updateQuestion(editingQuestion.id, payload);
        toast.success("Вопрос обновлён");
      } else {
        await interviewApi.createQuestion(payload);
        toast.success("Вопрос добавлен");
      }
      setFormOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить вопрос");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (question) => {
    const confirmed = window.confirm("Удалить вопрос?");
    if (!confirmed) return;
    try {
      await interviewApi.deleteQuestion(question.id);
      toast.success("Вопрос удалён");
      setViewingQuestion(null);
      loadQuestions();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить вопрос");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImportPayload(null);
      setImportFileName("");
      return;
    }
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON должен содержать массив");
        }
        setImportPayload(parsed);
        setImportError("");
      } catch (error) {
        setImportPayload(null);
        setImportError("Файл содержит некорректный JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importPayload?.length) {
      setImportError("Добавьте хотя бы один вопрос");
      return;
    }
    setImportLoading(true);
    try {
      await interviewApi.importQuestions(importPayload);
      toast.success("Вопросы импортированы");
      setImportOpen(false);
      setImportPayload(null);
      setImportFileName("");
      setImportError("");
      loadQuestions();
    } catch (err) {
      toast.error(err.message || "Не удалось импортировать вопросы");
    } finally {
      setImportLoading(false);
    }
  };

  const filteredTopics = topicFilter ? topicOptions.filter((topic) => String(topic.id) === topicFilter) : [];

  return (
    <PageShell title="Подготовка к собеседованию">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Каталог вопросов
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Храните и просматривайте материалы по темам аналитики. Фильтруйте по теме, ищите текст
              и быстро открывайте ответы.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Добавить вопрос
            </button>
            <button
              type="button"
              onClick={() => setInstructionOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              Инструкция по импорту
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Тема
              </label>
              <select
                value={topicFilter}
                onChange={(event) => setTopicFilter(event.target.value)}
                className="mt-1 h-11 min-w-[180px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              >
                <option value="">Все темы</option>
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Поиск
              </label>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по тексту вопроса"
                className="mt-1 h-11 w-[260px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Подборка: {filteredTopics.length ? filteredTopics[0].title : "все темы"} ·{" "}
            {questions.length} вопрос{questions.length === 1 ? "" : "ов"}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Вопрос</th>
                <th className="px-4 py-3">Тема</th>
                <th className="px-4 py-3">Статья</th>
                <th className="px-4 py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`placeholder-${idx}`} className="animate-pulse">
                      <td className="h-16 px-4 py-3">
                        <div className="h-4 w-48 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="mx-auto h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </td>
                    </tr>
                  ))
                : questions.length === 0
                ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Вопросов пока нет — добавьте вручную или импортируйте JSON.
                    </td>
                  </tr>
                )
                : questions.map((question) => (
                    <tr
                      key={question.id}
                      className="group cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800"
                      onClick={() => setViewingQuestion(question)}
                    >
                      <td className="max-w-[320px] px-4 py-4 align-top">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {question.question}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {question.topicTitle || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-sm text-blue-600 dark:text-blue-300">
                          {question.relatedArticleTitle || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setViewingQuestion(question);
                          }}
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(viewingQuestion)}
        onClose={() => setViewingQuestion(null)}
        title="Просмотр вопроса"
        maxWidth="max-w-2xl"
      >
        {viewingQuestion && (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Вопрос
              </h3>
              <p className="whitespace-pre-line text-base text-gray-900 dark:text-gray-100">
                {viewingQuestion.question}
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Ответ
              </h3>
              <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
                {viewingQuestion.answer || "—"}
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Объяснение
              </h3>
              <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
                {viewingQuestion.explanation || "—"}
              </p>
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Связанная статья
              </h3>
              {viewingQuestion.relatedArticleId ? (
                <button
                  type="button"
                  onClick={() =>
                    window.open(`/analytics/articles/${viewingQuestion.relatedArticleId}`, "_blank")
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Открыть статью
                </button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Не указано</p>
              )}
            </section>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  openEditModal(viewingQuestion);
                  setViewingQuestion(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => handleDelete(viewingQuestion)}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingQuestion(null);
        }}
        title={formMode === "edit" ? "Редактировать вопрос" : "Добавить вопрос"}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Тема
              <select
                value={formData.topicId}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, topicId: event.target.value }))
                }
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
              >
                <option value="">Выберите тему</option>
                {topicOptions.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Связанная статья
              <select
                value={formData.relatedArticleId}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, relatedArticleId: event.target.value }))
                }
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
              >
                <option value="">Без статьи</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title} {article.topicTitle ? `(${article.topicTitle})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Вопрос
            <textarea
              rows={3}
              value={formData.question}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, question: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Ответ
            <textarea
              rows={3}
              value={formData.answer}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, answer: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </label>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Объяснение
            <textarea
              rows={3}
              value={formData.explanation}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, explanation: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={formLoading}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditingQuestion(null);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={instructionOpen}
        onClose={() => setInstructionOpen(false)}
        title="Инструкция по импорту"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Импорт поддерживает три способа добавления:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
            <li>1. Ручное добавление через кнопку «Добавить вопрос».</li>
            <li>2. Загрузка JSON-файла с массивом вопросов (см. пример ниже).</li>
            <li>3. Автоматизация через n8n: POST на `/api/interview/import`.</li>
          </ul>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Пример структуры JSON
            </p>
            <pre className="mt-2 overflow-auto rounded-xl bg-white/80 p-3 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-100">
{`[
  {
    "topic": "API",
    "question": "Что такое REST?",
    "answer": "Архитектурный стиль (...)",
    "explanation": "REST описывает ...",
    "relatedArticleId": 12
  }
]`}
            </pre>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              API n8n
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              POST `/api/interview/import`
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Тело — массив объектов, как в примере выше. Загружайте из n8n, используя auth-токен.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ошибки и валидация
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Каждый объект должен содержать `topic` и `question`.</li>
              <li>Тема должна существовать в каталоге аналитики.</li>
              <li>Если указан `relatedArticleId`, он должен быть валидным.</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setInstructionOpen(false);
                setImportOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Открыть импорт JSON
            </button>
            <button
              type="button"
              onClick={() => setInstructionOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Закрыть
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportError("");
          setImportPayload(null);
          setImportFileName("");
        }}
        title="Импорт JSON"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Выберите файл .json
            <input type="file" accept=".json,application/json" onChange={handleFileChange} />
          </label>
          {importFileName && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Выбран: {importFileName} · {importPayload?.length ?? 0} объектов
            </div>
          )}
          {importError && <p className="text-sm text-red-600">{importError}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Импортировать
            </button>
            <button
              type="button"
              onClick={() => {
                setImportPayload(null);
                setImportFileName("");
                setImportError("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Сбросить
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
