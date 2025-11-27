import React from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import PageShell from "../../components/PageShell.jsx";
import TaskBoard from "../../components/TaskBoard.jsx";
import UpcomingPaymentsList from "../../components/accounting/UpcomingPaymentsList.jsx";
import { workspaceApi } from "../../api/workspace.js";
import { homeApi } from "../../api/home.js";
import { accountingApi } from "../../api/accounting.js";
import { getMeterDeadlineInfo } from "../../utils/meterDeadline.js";

const AVAILABLE_WIDGETS = [
  {
    id: "meter_deadline",
    title: "До передачи показаний",
    description: "Напоминание о следующем дедлайне по счётчикам",
  },
  {
    id: "upcoming_payments",
    title: "Ближайшие оплаты",
    description: "Список регулярных платежей из раздела учёта",
  },
];

function formatDate(date) {
  if (!date) return "-";
  try {
    return format(new Date(date), "d MMMM", { locale: ru });
  } catch {
    return date;
  }
}

function MeterDeadlineWidget({ info }) {
  if (!info?.dueDay) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/40 p-4 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
        Укажите день месяца в разделе квартиры, чтобы отслеживать дедлайн по показаниям.
      </div>
    );
  }

  const dateLabel = info.deadlineDate ? formatDate(info.deadlineDate) : `до ${info.dueDay} числа`;
  const accent =
    info.daysLeft === 0 ? "text-amber-600 dark:text-amber-300" : info.isOverdue ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300";

  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm ring-1 ring-slate-100/60 dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Передача показаний</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{info.daysLeft ?? "—"} дн.</div>
      <div className={`text-sm font-medium ${accent}`}>
        {info.daysLeft === 0 ? "Сегодня дедлайн" : info.isOverdue ? `Просрочено, следующий срок ${dateLabel}` : `До ${dateLabel}`}
      </div>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Не забудьте отправить показания до выбранной даты — карточка обновляется автоматически после изменения настроек ЖКХ.
      </p>
    </div>
  );
}

function UpcomingPaymentsWidget({ items }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm ring-1 ring-slate-100/60 dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Платежи</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">Ближайшие оплаты</div>
        </div>
      </div>
      <UpcomingPaymentsList items={(items || []).slice(0, 4)} />
    </div>
  );
}

function AutoTasksColumn({ tasks, leadDays, leadDraft, onLeadDraftChange, onSaveLeadDays, saving }) {
  return (
    <div className="space-y-4">
      <form
        onSubmit={onSaveLeadDays}
        className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-blue-500/5 dark:border-slate-700/60 dark:bg-slate-900/70"
      >
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Настройка авто-задач</div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Сколько дней до события нужно создавать напоминание.</p>
        <div className="mt-3 flex items-end gap-3">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Дни
            <input
              type="number"
              min="1"
              max="14"
              value={leadDraft}
              onChange={(e) => onLeadDraftChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              className="mt-1 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Текущее значение: {leadDays} дн.</p>
      </form>

      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-blue-500/5 dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Авто-задачи</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">События от системы</div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">за {leadDays} дн.</div>
        </div>
        <div className="mt-4 space-y-3">
          {tasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400">
              Событий в горизонте уведомления нет.
            </div>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-2xl border px-4 py-3 text-sm shadow ${
                task.overdue ? "border-rose-200/70 bg-rose-50/60 dark:border-rose-600/50 dark:bg-rose-900/30" : "border-slate-100 bg-white/80 dark:border-slate-700/60 dark:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{task.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{task.subtitle}</div>
                </div>
                <div className={`text-right text-xs font-semibold ${task.overdue ? "text-rose-600 dark:text-rose-300" : "text-indigo-600 dark:text-indigo-300"}`}>
                  {task.daysLeftLabel}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Workspace() {
  const [loading, setLoading] = React.useState(true);
  const [enabledWidgets, setEnabledWidgets] = React.useState(() => AVAILABLE_WIDGETS.map((w) => w.id));
  const [widgetsSaving, setWidgetsSaving] = React.useState(false);
  const [widgetPanelOpen, setWidgetPanelOpen] = React.useState(false);
  const [meterSettings, setMeterSettings] = React.useState(null);
  const [upcomingPayments, setUpcomingPayments] = React.useState([]);
  const [autoTaskLeadDays, setAutoTaskLeadDays] = React.useState(3);
  const [autoLeadDraft, setAutoLeadDraft] = React.useState("3");
  const [autoLeadSaving, setAutoLeadSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [workspaceData, meterData] = await Promise.all([workspaceApi.getSettings(), homeApi.getMeterSettings()]);
        if (cancelled) return;
        const wsSettings = workspaceData?.settings || {};
        const widgets = wsSettings.enabled_widgets?.length
          ? wsSettings.enabled_widgets
          : AVAILABLE_WIDGETS.map((w) => w.id);
        setEnabledWidgets(widgets);
        const leadDays = wsSettings.auto_task_lead_days ?? 3;
        setAutoTaskLeadDays(leadDays);
        setAutoLeadDraft(String(leadDays));
        setMeterSettings(meterData?.settings || {});
        try {
          const accountingData = await accountingApi.getDashboard();
          if (!cancelled) {
            setUpcomingPayments(accountingData?.upcoming_payments || []);
          }
        } catch (accountingErr) {
          console.warn("[workspace] accounting dashboard unavailable", accountingErr);
          if (!cancelled) {
            toast.error("Не удалось загрузить ближайшие оплаты");
            setUpcomingPayments([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error(err.message || "Не удалось загрузить Workspace");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const meterDeadlineInfo = React.useMemo(
    () => getMeterDeadlineInfo(meterSettings?.due_day),
    [meterSettings]
  );

  const autoTasks = React.useMemo(() => {
    const tasks = [];
    if (
      meterDeadlineInfo?.dueDay &&
      meterDeadlineInfo.daysLeft !== null &&
      !meterDeadlineInfo.isOverdue &&
      meterDeadlineInfo.daysLeft <= autoTaskLeadDays
    ) {
      tasks.push({
        id: "auto-meter",
        title: "Передать показания счётчиков",
        subtitle: meterDeadlineInfo.deadlineDate ? `Дедлайн ${formatDate(meterDeadlineInfo.deadlineDate)}` : `До ${meterDeadlineInfo.dueDay} числа`,
        daysLeftLabel:
          meterDeadlineInfo.daysLeft === 0
            ? "Сегодня"
            : `Через ${meterDeadlineInfo.daysLeft} дн.`,
        overdue: false,
        sortValue: meterDeadlineInfo.daysLeft ?? 99,
      });
    }
    (upcomingPayments || []).forEach((payment) => {
      if (payment.days_left === null || payment.days_left === undefined) return;
      if (payment.days_left > autoTaskLeadDays) return;
      tasks.push({
        id: `auto-payment-${payment.id}`,
        title: payment.title,
        subtitle: payment.next_due_date ? `Оплата до ${formatDate(payment.next_due_date)}` : "Регулярный платёж",
        daysLeftLabel:
          payment.days_left < 0
            ? `Просрочено на ${Math.abs(payment.days_left)} дн.`
            : payment.days_left === 0
            ? "Сегодня"
            : `Через ${payment.days_left} дн.`,
        overdue: payment.days_left < 0,
        sortValue: payment.days_left,
      });
    });
    return tasks.sort((a, b) => (a.sortValue ?? 999) - (b.sortValue ?? 999));
  }, [meterDeadlineInfo, upcomingPayments, autoTaskLeadDays]);

  const handleWidgetToggle = async (widgetId, enabled) => {
    const prev = [...enabledWidgets];
    const next = enabled
      ? Array.from(new Set([...enabledWidgets, widgetId]))
      : enabledWidgets.filter((id) => id !== widgetId);
    setEnabledWidgets(next);
    setWidgetsSaving(true);
    try {
      const data = await workspaceApi.saveSettings({ enabled_widgets: next });
      setEnabledWidgets(data?.settings?.enabled_widgets || next);
      toast.success("Виджеты обновлены");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось обновить виджеты");
      setEnabledWidgets(prev);
    } finally {
      setWidgetsSaving(false);
    }
  };

  const handleSaveLeadDays = async (event) => {
    event.preventDefault();
    const parsed = Number(autoLeadDraft);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 14) {
      toast.error("Введите число от 1 до 14");
      return;
    }
    setAutoLeadSaving(true);
    try {
      const data = await workspaceApi.saveSettings({ auto_task_lead_days: parsed });
      const lead = data?.settings?.auto_task_lead_days ?? parsed;
      setAutoTaskLeadDays(lead);
      setAutoLeadDraft(String(lead));
      toast.success("Срок уведомлений обновлён");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось обновить срок уведомлений");
    } finally {
      setAutoLeadSaving(false);
    }
  };

  const widgetComponents = {
    meter_deadline: <MeterDeadlineWidget info={meterDeadlineInfo} />,
    upcoming_payments: <UpcomingPaymentsWidget items={upcomingPayments} />,
  };

  const visibleWidgets = AVAILABLE_WIDGETS.filter((widget) => enabledWidgets.includes(widget.id));

  return (
    <PageShell
      title="Workspace"
      description="Рабочее пространство с виджетами и задачами"
      contentClassName="bg-transparent"
    >
      {loading ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
          Загружаем Workspace...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Виджеты
                </p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Рабочий стол</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Включите только те блоки, которые нужны именно сейчас.</p>
              </div>
              <button
                type="button"
                onClick={() => setWidgetPanelOpen((v) => !v)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-100"
              >
                {widgetPanelOpen ? "Скрыть настройки" : "Настроить"}
              </button>
            </div>
            {widgetPanelOpen && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                <div className="grid gap-3 md:grid-cols-2">
                  {AVAILABLE_WIDGETS.map((widget) => (
                    <label
                      key={widget.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm shadow-sm transition hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900/70"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={enabledWidgets.includes(widget.id)}
                        onChange={(e) => handleWidgetToggle(widget.id, e.target.checked)}
                        disabled={widgetsSaving}
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{widget.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{widget.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {widgetsSaving && <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Сохраняем...</div>}
              </div>
            )}
            {visibleWidgets.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleWidgets.map((widget) => (
                  <React.Fragment key={widget.id}>{widgetComponents[widget.id]}</React.Fragment>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400">
                Все виджеты выключены. Включите нужные в настройках выше.
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <AutoTasksColumn
              tasks={autoTasks}
              leadDays={autoTaskLeadDays}
              leadDraft={autoLeadDraft}
              onLeadDraftChange={setAutoLeadDraft}
              onSaveLeadDays={handleSaveLeadDays}
              saving={autoLeadSaving}
            />
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <TaskBoard />
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
