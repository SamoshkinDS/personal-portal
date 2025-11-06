// encoding: utf-8
import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell.jsx";
import { apiAuthFetch } from "../utils/api.js";

const N8N_APP_URL = "https://n8n.samoshechkin.ru";

const helpfulLinks = [
  { label: "Официальный сайт", href: "https://n8n.io" },
  { label: "Документация", href: "https://docs.n8n.io" },
  { label: "Примеры автоматизаций", href: "https://n8n.io/workflows" },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

function formatDuration(ms) {
  if (typeof ms !== "number" || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} мс`;
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds >= 10 ? seconds.toFixed(1) : seconds.toFixed(2)} сек`;
  }
  const minutes = Math.floor(seconds / 60);
  const leftover = Math.round(seconds % 60);
  if (minutes < 60) {
    return leftover ? `${minutes} мин ${leftover} сек` : `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} ч ${mins} мин`;
}

function statusBadge(status) {
  if (!status) return { icon: "⏱", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  const normalized = status.toLowerCase();
  if (normalized === "success" || normalized === "completed") {
    return { icon: "✅", className: "bg-green-100 text-green-700 ring-green-500/30" };
  }
  if (normalized === "error" || normalized === "failed") {
    return { icon: "❌", className: "bg-red-100 text-red-700 ring-red-500/30" };
  }
  if (normalized === "waiting") {
    return { icon: "⏳", className: "bg-amber-100 text-amber-700 ring-amber-500/30" };
  }
  return { icon: "⏱", className: "bg-slate-100 text-slate-600 ring-slate-200" };
}

function modeBadge(mode) {
  if (!mode) return "⏱";
  const normalized = mode.toLowerCase();
  if (normalized === "manual") return "🖐";
  if (normalized === "trigger" || normalized === "webhook" || normalized === "scheduled") return "⚡";
  return "⏱";
}

function WorkflowNodeList({ nodes }) {
  if (!nodes?.length) {
    return <p className="text-sm text-slate-500">Нет данных об узлах.</p>;
  }
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id || node.name} className="flex items-center justify-between rounded-xl bg-slate-100/70 px-3 py-2 text-sm dark:bg-slate-800/40">
          <span className="font-medium text-slate-800 dark:text-slate-100">{node.name}</span>
          <code className="rounded-lg bg-white/60 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:ring-slate-700">
            {node.type}
          </code>
        </li>
      ))}
    </ul>
  );
}

function WorkflowParametersPreview({ nodes }) {
  const preview = useMemo(() => {
    if (!nodes?.length) return "{}";
    const collapsed = nodes.reduce((acc, node) => {
      const parameters = node?.parameters || {};
      if (Object.keys(parameters).length === 0) return acc;
      acc[node.name || node.id || `node_${acc.length + 1}`] = parameters;
      return acc;
    }, {});
    if (Object.keys(collapsed).length === 0) return "{}";
    return JSON.stringify(collapsed, null, 2);
  }, [nodes]);

  return (
    <pre className="max-h-56 overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs text-emerald-100 shadow-inner dark:bg-slate-900">
      {preview}
    </pre>
  );
}

export default function N8NIntegration() {
  const [workflows, setWorkflows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState({ workflows: false, executions: false });
  const [errors, setErrors] = useState({ workflows: null, executions: null });
  const [refreshIndex, setRefreshIndex] = useState(0);

  const loadWorkflows = async (signal, ignoreRef) => {
    setLoading((state) => ({ ...state, workflows: true }));
    setErrors((state) => ({ ...state, workflows: null }));
    try {
      const response = await apiAuthFetch("/api/n8n/workflows", { signal });
      if (signal?.aborted || ignoreRef.current) return;
      if (!response.ok) {
        let detail = null;
        try {
          detail = await response.json();
        } catch {
          try {
            detail = JSON.parse(await response.text());
          } catch {
            detail = null;
          }
        }
        const attempts = Array.isArray(detail?.attempts)
          ? detail.attempts
              .map((attempt) => {
                const status = attempt?.status ?? "—";
                const path = attempt?.path || "";
                return `${status}${path ? ` ${path}` : ""}`;
              })
              .join("; ")
          : null;
        const message = detail?.message || "Ошибка загрузки workflows";
        const suffix = attempts ? ` — попытки: ${attempts}` : "";
        throw new Error(`${message} (${response.status})${suffix}`);
      }
      const data = await response.json();
      if (signal?.aborted || ignoreRef.current) return;
      setWorkflows(Array.isArray(data?.workflows) ? data.workflows : []);
    } catch (error) {
      if (error?.name === "AbortError" || ignoreRef.current) return;
      setErrors((state) => ({ ...state, workflows: error?.message || "Не удалось загрузить автоматизации" }));
    } finally {
      if (!ignoreRef.current) {
        setLoading((state) => ({ ...state, workflows: false }));
      }
    }
  };

  const loadExecutions = async (signal, ignoreRef) => {
    setLoading((state) => ({ ...state, executions: true }));
    setErrors((state) => ({ ...state, executions: null }));
    try {
      const response = await apiAuthFetch("/api/n8n/executions?limit=20", { signal });
      if (signal?.aborted || ignoreRef.current) return;
      if (!response.ok) {
        let detail = null;
        try {
          detail = await response.json();
        } catch {
          try {
            detail = JSON.parse(await response.text());
          } catch {
            detail = null;
          }
        }
        const attempts = Array.isArray(detail?.attempts)
          ? detail.attempts
              .map((attempt) => {
                const status = attempt?.status ?? "—";
                const path = attempt?.path || "";
                return `${status}${path ? ` ${path}` : ""}`;
              })
              .join("; ")
          : null;
        const message = detail?.message || "Ошибка загрузки executions";
        const suffix = attempts ? ` — попытки: ${attempts}` : "";
        throw new Error(`${message} (${response.status})${suffix}`);
      }
      const data = await response.json();
      if (signal?.aborted || ignoreRef.current) return;
      setExecutions(Array.isArray(data?.executions) ? data.executions : []);
    } catch (error) {
      if (error?.name === "AbortError" || ignoreRef.current) return;
      setErrors((state) => ({ ...state, executions: error?.message || "Не удалось загрузить запуски" }));
    } finally {
      if (!ignoreRef.current) {
        setLoading((state) => ({ ...state, executions: false }));
      }
    }
  };

  useEffect(() => {
    const ignoreRef = { current: false };
    const workflowsController = new AbortController();
    const executionsController = new AbortController();
    loadWorkflows(workflowsController.signal, ignoreRef);
    loadExecutions(executionsController.signal, ignoreRef);
    return () => {
      ignoreRef.current = true;
      workflowsController.abort();
      executionsController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshIndex]);

  const handleRefresh = () => setRefreshIndex((index) => index + 1);

  return (
    <PageShell
      title="N8N: Автоматизация без кода"
      actions={
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          🔄 Обновить данные
        </button>
      }
      contentClassName="flex flex-col gap-10"
    >
      <section className="rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-900/80 dark:ring-slate-700">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Общее описание</h2>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              N8N — визуальный редактор автоматизаций. Позволяет интегрировать Telegram, Google Sheets, PostgreSQL,
              Discord, APIs и многое другое. Поддерживает сценарии с условиями, задержками, циклами и переменными.
              Работает локально и безопасно.
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              {helpfulLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    <span>🔗</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-4">
            <a
              href={N8N_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              <span aria-hidden="true">⚙️</span>
              Перейти в N8N
            </a>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Доступ открыт только авторизованным пользователям портала.
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-900/80 dark:ring-slate-700">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Мои автоматизации</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Список workflows из n8n с быстрым доступом к структуре узлов и параметрам.
            </p>
          </div>
          {loading.workflows && <span className="text-sm text-slate-500 dark:text-slate-400">Загрузка…</span>}
        </div>

        {errors.workflows && (
          <div className="rounded-2xl bg-red-100/70 p-4 text-sm text-red-700 ring-1 ring-red-400/40 dark:bg-red-900/50 dark:text-red-200">
            {errors.workflows}
          </div>
        )}

        {!loading.workflows && !errors.workflows && workflows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Автоматизации не найдены.
          </div>
        )}

        <div className="space-y-3">
          {workflows.map((workflow) => (
            <details
              key={workflow.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-900"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{workflow.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        workflow.active
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-slate-200 text-slate-600 ring-1 ring-slate-300/60 dark:bg-slate-800/60 dark:text-slate-300"
                      }`}
                    >
                      {workflow.active ? "Активен" : "Выключен"}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Создан</dt>
                      <dd>{formatDate(workflow.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Обновлён</dt>
                      <dd>{formatDate(workflow.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Шагов</dt>
                      <dd>{workflow.nodeCount ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-slate-400">Версия</dt>
                      <dd>{workflow.versionId ?? "—"}</dd>
                    </div>
                  </dl>
                </div>
                <span className="text-sm text-indigo-500 transition group-open:rotate-90 dark:text-indigo-300">➜</span>
              </summary>

              <div className="mt-4 space-y-4 border-t border-dashed border-slate-200 pt-4 text-sm dark:border-slate-700">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100">Структура узлов</h4>
                  <WorkflowNodeList nodes={workflow.nodes} />
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">JSON-фрагмент параметров</h4>
                    <WorkflowParametersPreview nodes={workflow.nodes} />
                  </div>
                  {workflow.appUrl && (
                    <a
                      href={workflow.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                    >
                      Открыть в n8n
                    </a>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur-sm dark:bg-slate-900/80 dark:ring-slate-700">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Последние запуски</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Последние executions с типом запуска, статусом и длительностью.
            </p>
          </div>
          {loading.executions && <span className="text-sm text-slate-500 dark:text-slate-400">Загрузка…</span>}
        </div>

        {errors.executions && (
          <div className="rounded-2xl bg-red-100/70 p-4 text-sm text-red-700 ring-1 ring-red-400/40 dark:bg-red-900/50 dark:text-red-200">
            {errors.executions}
          </div>
        )}

        {!loading.executions && !errors.executions && executions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Запуски не найдены.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Статус
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Workflow
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Дата
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Время
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-200">
                  Тип запуска
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {executions.map((execution) => {
                const badge = statusBadge(execution.status);
                const rowClass =
                  execution.status?.toLowerCase() === "success" || execution.status?.toLowerCase() === "completed"
                    ? "bg-green-100/40 dark:bg-green-900/20"
                    : execution.status?.toLowerCase() === "error" || execution.status?.toLowerCase() === "failed"
                    ? "bg-red-100/40 dark:bg-red-900/20"
                    : "";
                return (
                  <tr key={execution.id} className={rowClass}>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.className}`}
                      >
                        <span aria-hidden="true">{badge.icon}</span>
                        {execution.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {execution.workflowName || `Workflow #${execution.workflowId || execution.id}`}
                        </span>
                        {execution.errorMessage && (
                          <span className="text-xs text-red-600 dark:text-red-300">{execution.errorMessage}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(execution.finishedAt || execution.startedAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white ring-1 ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-300">
                        {formatDuration(execution.durationMs)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-lg">
                      <span title={execution.mode || "—"}>{modeBadge(execution.mode)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
