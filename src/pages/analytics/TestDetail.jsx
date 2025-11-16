import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { testsApi } from "../../api/tests.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

export default function TestDetailPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [expanded, setExpanded] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);

  const loadTest = React.useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const response = await testsApi.get(testId);
      setTest(response.item || null);
      setQuestions(response.questions || []);
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить тест");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  React.useEffect(() => {
    loadTest();
  }, [loadTest]);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!testId) {
    return (
      <PageShell title="Тест">
        <p>Выберите тест из списка</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={test?.title || "Тест"}>
      <button
        type="button"
        onClick={() => navigate("/analytics/tests")}
        className="mb-4 text-sm text-blue-600 underline hover:text-blue-800"
      >
        ← К списку тестов
      </button>
      {loading ? (
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
      ) : (
        <article className="space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {test?.topicTitle || "—"} · {test?.status}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {test?.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{test?.description || "—"}</p>
          </header>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Вопросы
            </h2>
            <div className="space-y-3">
              {questions.map((question) => {
                const isOpen = expanded.has(question.id);
                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(question.id)}
                      className="flex w-full items-center justify-between text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      <span>{question.question}</span>
                      <span className="text-xs text-blue-600">{isOpen ? "Скрыть" : "Показать"}</span>
                    </button>
                    {isOpen && (
                      <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-200">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Ответ
                          </p>
                          <p>{question.answer || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Объяснение
                          </p>
                          <p>{question.explanation || "—"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!questions.length && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Вопросы ещё не добавлены.
                </p>
              )}
            </div>
          </section>
        </article>
      )}
    </PageShell>
  );
}
