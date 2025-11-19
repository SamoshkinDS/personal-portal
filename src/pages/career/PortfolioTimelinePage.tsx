import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import TimelineChart from "./components/TimelineChart.tsx";

export default function PortfolioTimelinePage() {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await careerApi.getPortfolioTimeline();
        setProjects(data || []);
      } catch (error) {
        toast.error(error?.message || "Не удалось загрузить таймлайн");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageShell title="Хронология проектов">
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Визуализируйте карьерное развитие с разделением по статусам.
        </p>
        <TimelineChart projects={projects} />
        {projects.length === 0 && !loading && (
          <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            Нет проектов для отображения.
          </div>
        )}
      </div>
    </PageShell>
  );
}
