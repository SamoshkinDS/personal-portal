import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { integrationSettingsApi } from "../../api/integrationSettings.js";

const FIELDS = [
  { key: "webhook_interview", label: "Webhook интервью", placeholder: "https://example.com/interview" },
  { key: "webhook_tests", label: "Webhook тестов", placeholder: "https://example.com/tests" },
  { key: "webhook_promptmaster", label: "Webhook Промтмастера", placeholder: "https://example.com/promptmaster" },
  { key: "webhook_articles_queue", label: "Webhook очереди статей", placeholder: "https://example.com/articles-queue" },
  { key: "api_key_n8n", label: "API-ключ для n8n", placeholder: "Rn8n-JWT-Token..." },
];

const INSTRUCTION_TEMPLATES = [
  {
    id: "import_questions",
    title: "Импорт вопросов",
    description: "Загружайте JSON с вопросами интервью и отправляйте на `POST /api/interview/import`.",
    method: "POST /api/interview/import",
    payload: `[
  {
    "topic": "API",
    "question": "Что такое REST?",
    "answer": "...",
    "explanation": "..."
  }
]`,
    errors: ["Каждый объект требует `topic` и `question`.", "Тема должна существовать в каталоге."],
    tips: ["Собирайте данные из CRM перед отправкой.", "Используйте retry в n8n при таймаутах."],
  },
  {
    id: "import_cheats",
    title: "Импорт шпаргалок",
    description: "Загрузите массив статей для `POST /api/cheats/import`.",
    method: "POST /api/cheats/import",
    payload: `[
  {
    "title": "User Story",
    "description": "Структура user story",
    "content": "# User Story..."
  }
]`,
    errors: ["Каждый объект требует `title`.", "Контент можно опустить."],
    tips: ["Проверяйте markdown-синтаксис перед отправкой.", "Разделяйте импорт пакетами по темам."],
  },
  {
    id: "generate_tests",
    title: "Генерация тестов",
    description: "n8n получает задания `GET /api/tests?status=pending_generation` и отправляет `POST /api/tests/response`.",
    method: "GET /api/tests?status=pending_generation",
    payload: `[
  {
    "id": 10,
    "title": "Тест BPMN",
    "topic": "BPMN"
  }
]`,
    errors: ["POST требует `test_id` и хотя бы один вопрос.", "Ответы вмето `question` не оставляйте пустыми."],
    tips: ["Используйте фильтры по теме в n8n.", "Логируйте ошибки для диагностики."],
  },
  {
    id: "promptmaster",
    title: "Интеграция Промтмастера",
    description: "Публикуйте webhook через `/api/promptmaster` или уведомляйте о новых запросах.",
    method: "POST /api/promptmaster",
    payload: `{
  "query": "Создай промпт",
  "status": "draft"
}`,
    errors: ["Проверяйте `query` на пустоту.", "Следите за статусами `processing` и `done`."],
    tips: ["Сохраняйте результат в логах.", "Уведомляйте команду о новых генерациях."],
  },
];

const DEFAULT_STATE = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {});

export default function IntegrationSettingsPage() {
  const [values, setValues] = React.useState(DEFAULT_STATE);
  const [logRequests, setLogRequests] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [activeInstruction, setActiveInstruction] = React.useState(null);

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await integrationSettingsApi.get();
      const payload = response.settings || {};
      const normalized = FIELDS.reduce(
        (acc, field) => ({ ...acc, [field.key]: payload[field.key] || "" }),
        {}
      );
      setValues(normalized);
      setLogRequests(payload.api_log_requests === "true");
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        api_log_requests: logRequests ? "true" : "false",
      };
      await integrationSettingsApi.update(payload);
      toast.success("Настройки сохранены");
      loadSettings();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || loading;

  return (
    <PageShell title="Настройки интеграций">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Настройки вебхуков</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Укажите URL, на которые система будет отправлять события, и настройте интеграцию с n8n.
            </p>
          </header>
          <div className="mt-6 space-y-4">
            {FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {field.label}
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  disabled={isDisabled}
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={logRequests}
                disabled={isDisabled}
                onChange={(event) => setLogRequests(event.target.checked)}
                className="h-4 w-4 rounded border border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              />
              Логировать запросы
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={loadSettings}
                disabled={isDisabled}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:border-slate-200 dark:border-slate-700 dark:text-gray-100"
              >
                Обновить
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Инструкции</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {INSTRUCTION_TEMPLATES.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setActiveInstruction(card)}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-5 text-left shadow-sm transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{card.description}</p>
                </div>
                <span className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-300">
                  Открыть инструкцию →
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={Boolean(activeInstruction)}
        onClose={() => setActiveInstruction(null)}
        title={activeInstruction?.title || "Инструкция"}
        maxWidth="max-w-4xl"
      >
        {activeInstruction && (
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">{activeInstruction.description}</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-900/60">
              <p className="font-semibold text-gray-800 dark:text-gray-200">{activeInstruction.method}</p>
              <pre className="mt-2 overflow-auto rounded-xl bg-white/80 p-3 text-[13px] text-slate-800 dark:bg-slate-900 dark:text-gray-100">
                {activeInstruction.payload}
              </pre>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Типичные ошибки</p>
              <ul className="mt-2 list-disc pl-4 text-xs text-gray-600 dark:text-gray-300">
                {activeInstruction.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Советы по n8n
              </p>
              <ul className="mt-2 list-disc pl-4 text-xs text-gray-600 dark:text-gray-300">
                {activeInstruction.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
