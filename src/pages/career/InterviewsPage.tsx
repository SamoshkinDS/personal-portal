import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import InterviewsFilters from "./components/InterviewsFiltersRu.tsx";
import InterviewsTable from "./components/InterviewsTable.tsx";
import InterviewModal from "./components/InterviewModal.tsx";
import InterviewDetails from "./components/InterviewDetails.tsx";

const DEFAULT_FILTERS = {
  statuses: [],
  dateFrom: "",
  dateTo: "",
  company: "",
  types: [],
  mode: "all",
  sortField: "interview_date",
  sortOrder: "desc",
  limit: 200,
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = React.useState([]);
  const [filters, setFilters] = React.useState({ ...DEFAULT_FILTERS });
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [editingInterview, setEditingInterview] = React.useState(null);
  const [selectedInterview, setSelectedInterview] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const totalInterviews = React.useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats.statuses || {}).reduce((sum, value) => sum + value, 0);
  }, [stats]);
  const passedInterviews = stats?.statuses?.passed || 0;
  const offersReceived = stats?.statuses?.offer_received || 0;
  const avgSalaryLabel = stats?.avgSalary ? `${stats.avgSalary.toLocaleString("ru-RU")} ₽` : "-";

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [items, statsData] = await Promise.all([
        careerApi.listInterviews(filters),
        careerApi.getInterviewStats(),
      ]);
      setInterviews(items);
      setStats(statsData);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить собеседования");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingInterview) {
        await careerApi.updateInterview(editingInterview.id, payload);
        toast.success("Собеседование обновлено");
      } else {
        await careerApi.createInterview(payload);
        toast.success("Собеседование добавлено");
      }
      setModalOpen(false);
      setEditingInterview(null);
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (interview) => {
    if (!window.confirm(`Удалить собеседование в ${interview.company || "компании"}?`)) return;
    try {
      setSaving(true);
      await careerApi.deleteInterview(interview.id);
      toast.success("Собеседование удалено");
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Ошибка при удалении");
    } finally {
      setSaving(false);
    }
  };

  const handleView = (interview) => {
    setSelectedInterview(interview);
    setDetailsOpen(true);
  };

  const handleSort = (field, order) => {
    setFilters((prev) => ({ ...prev, sortField: field, sortOrder: order }));
  };

  const handleExport = async () => {
    try {
      const csv = await careerApi.exportInterviews(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "interviews.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.message || "Не удалось экспортировать CSV");
    }
  };

  const statCards = React.useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Всего собеседований", value: totalInterviews, description: "Все статусы" },
      { label: "Успешные этапы", value: passedInterviews, description: "Прошли" },
      { label: "Получено офферов", value: offersReceived, description: "Включая текущие" },
      { label: "Средняя зарплата", value: avgSalaryLabel, description: "По заполненным" },
    ];
  }, [stats, totalInterviews, passedInterviews, offersReceived, avgSalaryLabel]);

  return (
    <PageShell title="Собеседования">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.length
            ? statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-white/10 bg-white/90 p-4 text-center shadow dark:border-white/5 dark:bg-slate-900/70"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {card.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{card.value}</div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{card.description}</p>
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-3xl border border-dashed border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-slate-900/60"
                />
              ))}
        </div>

        <InterviewsFilters filters={filters} onChange={setFilters} loading={loading} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingInterview(null);
              setModalOpen(true);
            }}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            + Создать собеседование
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/30"
          >
            Экспорт
          </button>
        </div>
        <InterviewsTable
          interviews={interviews}
          loading={loading}
          onView={handleView}
          onEdit={(interview) => {
            setEditingInterview(interview);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          onSort={handleSort}
          sortField={filters.sortField}
          sortOrder={filters.sortOrder}
        />
      </div>

      <InterviewModal open={modalOpen} interview={editingInterview} onClose={() => setModalOpen(false)} onSave={handleSave} saving={saving} />
      <InterviewDetails open={detailsOpen} interview={selectedInterview} onClose={() => setDetailsOpen(false)} />
    </PageShell>
  );
}
