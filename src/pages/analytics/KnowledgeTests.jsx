import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { analyticsApi } from "../../api/analytics.js";
import { interviewApi } from "../../api/interview.js";
import { testsApi } from "../../api/tests.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

const DEFAULT_FORM = {
  title: "",
  topicId: "",
  description: "",
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

export default function KnowledgeTestsPage() {
  const [tests, setTests] = React.useState([]);
  const [topics, setTopics] = React.useState([]);
  const [articles, setArticles] = React.useState([]);
  const [topicFilter, setTopicFilter] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formData, setFormData] = React.useState(DEFAULT_FORM);
  const [formLoading, setFormLoading] = React.useState(false);
  const [instructionOpen, setInstructionOpen] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const topicOptions = React.useMemo(() => flattenTopics(topics), [topics]);

  const loadTests = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await testsApi.list({
        topicId: topicFilter || undefined,
        status: undefined,
      });
      const filtered = response.items?.filter((item) => {
        if (!debouncedSearch) return true;
        const candidate = `${item.title} ${item.description || ""}`.toLowerCase();
        return candidate.includes(debouncedSearch.toLowerCase());
      });
      setTests(filtered || []);
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить тесты");
    } finally {
      setLoading(false);
    }
  }, [topicFilter, debouncedSearch]);

  React.useEffect(() => {
    loadTests();
  }, [loadTests]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await analyticsApi.getTopics({ includeCounts: 0 });
        if (!cancelled) setTopics(response.topics || []);
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
        const response = await interviewApi.listArticles({ limit: 200 });
        if (!cancelled) setArticles(response.items || []);
      } catch (err) {
        toast.error(err.message || "Не удалось загрузить статьи");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openForm = () => {
    setFormData(DEFAULT_FORM);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Название теста обязательно");
      return;
    }
    if (!formData.topicId) {
      toast.error("Выберите тему");
      return;
    }
    setFormLoading(true);
    try {
      await testsApi.create({
        title: formData.title.trim(),
        topicId: Number(formData.topicId),
        description: formData.description.trim() || null,
        relatedArticleId: formData.relatedArticleId ? Number(formData.relatedArticleId) : null,
      });
      toast.success("Тест создан, статус pending_generation");
      setFormOpen(false);
      loadTests();
    } catch (err) {
      toast.error(err.message || "Не удалось создать тест");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <PageShell title="Тестирование знаний">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Тестирование знаний</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Создавайте тесты, назначайте тематику и запускайте генерацию вопросов через n8n.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Создать тест
            </button>
            <button
              type="button"
              onClick={() => setInstructionOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              Инструкция по n8n
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Тема
            </label>
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="mt-1 h-11 min-w-[200px] rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
            >
              <option value="">Все темы</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>
          <input
            type="search"
            placeholder="Поиск по названию или описанию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full max-w-md rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
              />
            ))
          ) : tests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-gray-400">
              Тестов пока нет — создайте вручную и передайте задачи в n8n.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tests.map((test) => (
                <article
                  key={test.id}
                  className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <span>{test.topicTitle || "—"}</span>
                      <span className="text-slate-300">·</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-800">
                        {test.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{test.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{test.description || "—"}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Обновлён {new Date(test.updatedAt).toLocaleDateString()}</span>
                    <a
                      href={`/analytics/tests/${test.id}`}
                      className="text-blue-600 underline underline-offset-2 dark:text-blue-300"
                    >
                      Открыть тест →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Создать тест">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Название теста
            <input
              type="text"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Тема
            <select
              value={formData.topicId}
              onChange={(event) => setFormData((prev) => ({ ...prev, topicId: event.target.value }))}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            >
              <option value="">Выберите тему</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Описание
            <textarea
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className="min-h-[96px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Привязка к статье
            <select
              value={formData.relatedArticleId}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, relatedArticleId: event.target.value }))
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
            >
              <option value="">Без статьи</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={formLoading}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={instructionOpen} onClose={() => setInstructionOpen(false)} title="Инструкция n8n">
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <p>n8n получает задания и отправляет ответы через API.</p>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold">GET /api/tests?status=pending_generation</p>
            <pre className="mt-2 overflow-auto rounded-xl bg-white/80 p-3 text-[12px] text-slate-800 dark:bg-slate-900 dark:text-slate-100">
{`[
  {
    "id": 10,
    "title": "Тест BPMN",
    "topicTitle": "BPMN"
  }
]`}
            </pre>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <p className="font-semibold">POST /api/tests/response</p>
            <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-[12px] text-slate-700 dark:bg-slate-900 dark:text-slate-100">
{`{
  "test_id": 10,
  "questions": [
    {
      "question": "Вопрос?",
      "answer": "Ответ",
      "explanation": "Объяснение"
    }
  ]
}`}
            </pre>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs dark:border-slate-700 dark:bg-slate-900/60">
            <p className="font-semibold">Ошибки и валидация</p>
            <ul className="mt-2 list-disc pl-4">
              <li>GET может вернуть пустой список, если нет задач.</li>
              <li>POST ожидает `test_id` и непустой массив вопросов.</li>
              <li>Каждый вопрос требует `question`, остальные поля опциональны.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
